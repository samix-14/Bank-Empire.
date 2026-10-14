-- Bank Empire 0.8: configurable exchange rates and atomic currency conversion.
-- Initial 1:1 rates are DEMONSTRATION PLACEHOLDERS. Change them before relying on the economy.

create table if not exists public.exchange_rates (
  from_currency text not null references public.currencies(code),
  to_currency text not null references public.currencies(code),
  rate numeric(18,8) not null check (rate > 0),
  enabled boolean not null default true,
  updated_at timestamptz not null default now(),
  constraint exchange_rates_pair_pk primary key (from_currency, to_currency),
  constraint exchange_rates_distinct_currencies check (from_currency <> to_currency)
);

insert into public.exchange_rates(from_currency, to_currency, rate, enabled)
select src.code, dst.code, 1.00000000, true
from public.currencies src
cross join public.currencies dst
where src.enabled and dst.enabled and src.code <> dst.code
on conflict (from_currency, to_currency) do nothing;

create table if not exists public.account_exchange_transactions (
  id bigint generated always as identity primary key,
  account_id uuid not null references public.bank_accounts(id),
  from_currency text not null references public.currencies(code),
  from_amount numeric(18,2) not null check (from_amount > 0),
  to_currency text not null references public.currencies(code),
  to_amount numeric(18,2) not null check (to_amount > 0),
  exchange_rate numeric(18,8) not null check (exchange_rate > 0),
  description text not null default 'Cambio valuta' check (char_length(trim(description)) between 1 and 120),
  created_at timestamptz not null default now(),
  constraint account_exchange_different_currencies check (from_currency <> to_currency)
);

alter table public.exchange_rates enable row level security;
alter table public.account_exchange_transactions enable row level security;
revoke all on public.exchange_rates from anon, authenticated;
revoke all on public.account_exchange_transactions from anon, authenticated;
grant usage on schema public to authenticated;

create or replace function public.get_exchange_rates()
returns table (
  from_currency text,
  from_currency_name text,
  to_currency text,
  to_currency_name text,
  rate numeric,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if (select auth.uid()) is null then raise exception 'Devi accedere per consultare i tassi.'; end if;
  return query
    select r.from_currency, src.name, r.to_currency, dst.name, r.rate, r.updated_at
    from public.exchange_rates r
    join public.currencies src on src.code = r.from_currency and src.enabled
    join public.currencies dst on dst.code = r.to_currency and dst.enabled
    where r.enabled
    order by r.from_currency, r.to_currency;
end;
$$;

create or replace function public.get_account_exchange_transactions(p_access_token text)
returns table (
  id bigint,
  from_currency text,
  from_amount numeric,
  to_currency text,
  to_amount numeric,
  exchange_rate numeric,
  description text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_account_id uuid;
begin
  select t.account_id into v_account_id
  from public.account_access_tokens t
  where t.token_hash = encode(extensions.digest(coalesce(p_access_token, ''), 'sha256'), 'hex')
    and t.user_id = (select auth.uid()) and t.expires_at > now();
  if v_account_id is null then raise exception 'Accesso al conto scaduto. Inserisci di nuovo la password.'; end if;
  return query
    select x.id, x.from_currency, x.from_amount, x.to_currency, x.to_amount, x.exchange_rate, x.description, x.created_at
    from public.account_exchange_transactions x
    where x.account_id = v_account_id
    order by x.created_at desc limit 100;
end;
$$;

create or replace function public.exchange_account_currency(
  p_access_token text,
  p_from_currency text,
  p_to_currency text,
  p_amount numeric,
  p_description text default 'Cambio valuta'
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_account_id uuid;
  v_from text := upper(trim(coalesce(p_from_currency, '')));
  v_to text := upper(trim(coalesce(p_to_currency, '')));
  v_balance numeric(18,2);
  v_rate numeric(18,8);
  v_to_amount numeric(18,2);
  v_id bigint;
  v_description text := trim(coalesce(p_description, 'Cambio valuta'));
begin
  select t.account_id into v_account_id
  from public.account_access_tokens t
  where t.token_hash = encode(extensions.digest(coalesce(p_access_token, ''), 'sha256'), 'hex')
    and t.user_id = v_user_id and t.expires_at > now();
  if v_user_id is null or v_account_id is null then raise exception 'Accesso al conto scaduto. Inserisci di nuovo la password.'; end if;
  if v_from = v_to or v_from = '' or v_to = '' then raise exception 'Scegli due valute diverse.'; end if;
  if p_amount is null or p_amount <= 0 or p_amount <> round(p_amount, 2) then raise exception 'Importo non valido: massimo due decimali.'; end if;
  if char_length(v_description) < 1 or char_length(v_description) > 120 then raise exception 'La causale deve contenere da 1 a 120 caratteri.'; end if;
  select r.rate into v_rate
  from public.exchange_rates r
  join public.currencies src on src.code = r.from_currency and src.enabled
  join public.currencies dst on dst.code = r.to_currency and dst.enabled
  where r.from_currency = v_from and r.to_currency = v_to and r.enabled;
  if v_rate is null then raise exception 'Tasso di cambio non disponibile per questa coppia.'; end if;
  v_to_amount := round(p_amount * v_rate, 2);
  if v_to_amount <= 0 then raise exception 'Importo convertito troppo piccolo.'; end if;

  insert into public.account_balances(account_id, currency, balance)
  values (v_account_id, v_from, 0), (v_account_id, v_to, 0)
  on conflict (account_id, currency) do nothing;

  perform 1 from public.account_balances b
  where b.account_id = v_account_id and b.currency in (v_from, v_to)
  order by b.currency for update;

  select b.balance into v_balance
  from public.account_balances b
  where b.account_id = v_account_id and b.currency = v_from;
  if v_balance is null or v_balance < p_amount then raise exception 'Saldo insufficiente nella valuta di partenza.'; end if;

  update public.account_balances set balance = balance - p_amount, updated_at = now()
  where account_id = v_account_id and currency = v_from;
  update public.account_balances set balance = balance + v_to_amount, updated_at = now()
  where account_id = v_account_id and currency = v_to;

  insert into public.account_exchange_transactions(account_id, from_currency, from_amount, to_currency, to_amount, exchange_rate, description)
  values (v_account_id, v_from, p_amount, v_to, v_to_amount, v_rate, v_description)
  returning id into v_id;
  return v_id;
end;
$$;

revoke all on function public.get_exchange_rates() from public, anon;
revoke all on function public.get_account_exchange_transactions(text) from public, anon;
revoke all on function public.exchange_account_currency(text, text, text, numeric, text) from public, anon;
grant execute on function public.get_exchange_rates() to authenticated;
grant execute on function public.get_account_exchange_transactions(text) to authenticated;
grant execute on function public.exchange_account_currency(text, text, text, numeric, text) to authenticated;
