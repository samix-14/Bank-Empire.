-- Bank Empire 0.9: server-side roles, empires, bans, messages and privileged operations.
-- Apply after the v0.8 schema. Never assign privileged roles from client-controlled metadata.

alter table public.profiles
  add column if not exists role text not null default 'citizen',
  add column if not exists banned_until timestamptz,
  add column if not exists ban_reason text;

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('citizen','imperatore','banchiere_supremo','admin_supremo','comandante_militare','ministro_economia','assicuratore'));


-- Prevent normal authenticated clients from changing their own role through the REST API.
create or replace function public.be_protect_profile_role()
returns trigger language plpgsql set search_path=public
as $
begin
  if new.role is distinct from old.role
     and current_user not in ('postgres','service_role','supabase_admin') then
    raise exception 'Il ruolo può essere modificato solo dall’amministrazione.';
  end if;
  return new;
end;
$;
drop trigger if exists be_profiles_protect_role on public.profiles;
create trigger be_profiles_protect_role
before update of role on public.profiles
for each row execute function public.be_protect_profile_role();

create table if not exists public.admin_audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  target_user_id uuid references auth.users(id) on delete set null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create table if not exists public.user_messages (
  id bigint generated always as identity primary key,
  sender_id uuid references auth.users(id) on delete set null,
  recipient_id uuid references auth.users(id) on delete cascade,
  empire_id text references public.empires(id) on delete cascade,
  subject text not null check (char_length(trim(subject)) between 1 and 100),
  body text not null check (char_length(trim(body)) between 1 and 2000),
  created_at timestamptz not null default now(),
  check (recipient_id is not null or empire_id is not null)
);

-- Sync bans to Supabase Auth so suspended users cannot sign in or refresh normally.
create or replace function public.be_sync_auth_ban()
returns trigger language plpgsql security definer set search_path=public,auth
as $
begin
  update auth.users
  set banned_until = new.banned_until
  where id = new.id;
  return new;
end;
$;
drop trigger if exists be_profiles_sync_auth_ban on public.profiles;
create trigger be_profiles_sync_auth_ban
after update of banned_until on public.profiles
for each row execute function public.be_sync_auth_ban();

create table if not exists public.empire_tax_rules (
  id bigint generated always as identity primary key,
  empire_id text not null references public.empires(id) on delete cascade,
  activity_code text not null check (activity_code ~ '^[a-z0-9_]{2,40}$'),
  label text not null check (char_length(trim(label)) between 2 and 80),
  rate_percent numeric(5,2) not null check (rate_percent between 0 and 100),
  enabled boolean not null default true,
  updated_at timestamptz not null default now(),
  unique (empire_id, activity_code)
);

alter table public.admin_audit_log enable row level security;
alter table public.user_messages enable row level security;
alter table public.empire_tax_rules enable row level security;
revoke all on public.admin_audit_log, public.user_messages, public.empire_tax_rules from anon, authenticated;
grant usage on schema public to authenticated;

create or replace function public.be_has_role(p_roles text[])
returns boolean language sql stable security definer set search_path=public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and p.role = any(p_roles)
      and (p.banned_until is null or p.banned_until <= now())
  );
$$;
revoke all on function public.be_has_role(text[]) from public, anon;
grant execute on function public.be_has_role(text[]) to authenticated;

create or replace function public.be_get_my_role()
returns table(role text, empire_id text, banned_until timestamptz, ban_reason text)
language plpgsql stable security definer set search_path=public
as $$
begin
  if (select auth.uid()) is null then raise exception 'Accedi per continuare.'; end if;
  return query select p.role, p.empire_id, p.banned_until, p.ban_reason
  from public.profiles p where p.id = (select auth.uid());
end;
$$;
revoke all on function public.be_get_my_role() from public, anon;
grant execute on function public.be_get_my_role() to authenticated;

create or replace function public.be_admin_list_users()
returns table(user_id uuid, username text, role text, empire_id text, created_at timestamptz, banned_until timestamptz, ban_reason text)
language plpgsql stable security definer set search_path=public
as $$
begin
  if not public.be_has_role(array['admin_supremo']) then raise exception 'Permesso negato.'; end if;
  return query select p.id,p.username,p.role,p.empire_id,p.created_at,p.banned_until,p.ban_reason
  from public.profiles p order by p.created_at desc limit 500;
end;
$$;


create or replace function public.be_admin_list_audit()
returns table(id bigint, created_at timestamptz, actor_username text, action text, target_username text, details jsonb)
language plpgsql stable security definer set search_path=public
as $
begin
  if not public.be_has_role(array['admin_supremo']) then raise exception 'Permesso negato.'; end if;
  return query
    select l.id,l.created_at,coalesce(a.username,'Sistema'),l.action,t.username,l.details
    from public.admin_audit_log l
    left join public.profiles a on a.id=l.actor_id
    left join public.profiles t on t.id=l.target_user_id
    order by l.created_at desc limit 500;
end;
$;

create or replace function public.be_admin_list_transactions()
returns table(transaction_id bigint, created_at timestamptz, from_account text, from_username text, to_account text, to_username text, currency text, amount numeric, description text)
language plpgsql stable security definer set search_path=public
as $$
begin
  if not public.be_has_role(array['admin_supremo']) then raise exception 'Permesso negato.'; end if;
  return query
    select t.id,t.created_at,fa.name,fp.username,ta.name,tp.username,t.currency,t.amount,t.description
    from public.account_transactions t
    join public.bank_accounts fa on fa.id=t.from_account_id
    join public.profiles fp on fp.id=fa.owner_id
    join public.bank_accounts ta on ta.id=t.to_account_id
    join public.profiles tp on tp.id=ta.owner_id
    order by t.created_at desc limit 500;
end;
$$;

create or replace function public.be_admin_set_role(p_user_id uuid, p_role text)
returns void language plpgsql security definer set search_path=public
as $$
begin
  if not public.be_has_role(array['admin_supremo']) then raise exception 'Permesso negato.'; end if;
  if p_role not in ('citizen','imperatore','banchiere_supremo','admin_supremo','comandante_militare','ministro_economia','assicuratore') then
    raise exception 'Ruolo non valido.';
  end if;
  update public.profiles set role=p_role where id=p_user_id;
  if not found then raise exception 'Account non trovato.'; end if;
  insert into public.admin_audit_log(actor_id,action,target_user_id,details)
  values(auth.uid(),'role_changed',p_user_id,jsonb_build_object('role',p_role));
end;
$$;

create or replace function public.be_admin_set_ban(p_user_id uuid, p_duration_hours integer, p_reason text)
returns void language plpgsql security definer set search_path=public
as $$
declare v_until timestamptz;
begin
  if not public.be_has_role(array['admin_supremo']) then raise exception 'Permesso negato.'; end if;
  if p_duration_hours is null or p_duration_hours < 0 or p_duration_hours > 87600 then raise exception 'Durata non valida. Usa 0 per rimuovere il ban, fino a 10 anni per un ban temporaneo.'; end if;
  if p_user_id = auth.uid() then raise exception 'Non puoi modificare il tuo ban.'; end if;
  v_until := case when p_duration_hours=0 then null else now()+make_interval(hours=>p_duration_hours) end;
  update public.profiles set banned_until=v_until, ban_reason=case when v_until is null then null else left(trim(coalesce(p_reason,'Violazione delle regole')),300) end where id=p_user_id;
  if not found then raise exception 'Account non trovato.'; end if;
  insert into public.admin_audit_log(actor_id,action,target_user_id,details)
  values(auth.uid(),case when v_until is null then 'ban_removed' else 'user_banned' end,p_user_id,jsonb_build_object('duration_hours',p_duration_hours,'reason',p_reason,'banned_until',v_until));
end;
$$;

create or replace function public.be_admin_send_message(p_user_id uuid, p_subject text, p_body text)
returns bigint language plpgsql security definer set search_path=public
as $$
declare v_id bigint;
begin
  if not public.be_has_role(array['admin_supremo']) then raise exception 'Permesso negato.'; end if;
  insert into public.user_messages(sender_id,recipient_id,subject,body)
  values(auth.uid(),p_user_id,trim(p_subject),trim(p_body)) returning id into v_id;
  insert into public.admin_audit_log(actor_id,action,target_user_id,details)
  values(auth.uid(),'message_sent',p_user_id,jsonb_build_object('message_id',v_id,'subject',left(p_subject,100)));
  return v_id;
end;
$$;

create or replace function public.be_admin_send_broadcast(p_subject text, p_body text)
returns bigint language plpgsql security definer set search_path=public
as $$
declare v_id bigint;
begin
  if not public.be_has_role(array['admin_supremo']) then raise exception 'Permesso negato.'; end if;
  insert into public.user_messages(sender_id,subject,body)
  values(auth.uid(),trim(p_subject),trim(p_body)) returning id into v_id;
  insert into public.admin_audit_log(actor_id,action,details)
  values(auth.uid(),'global_message_sent',jsonb_build_object('message_id',v_id,'subject',left(p_subject,100)));
  return v_id;
end;
$$;

create or replace function public.be_banker_adjust_balance(p_username text, p_currency text, p_amount numeric, p_reason text)
returns bigint language plpgsql security definer set search_path=public
as $$
declare v_actor uuid:=auth.uid(); v_target uuid; v_account uuid; v_balance numeric(18,2); v_id bigint; v_currency text:=upper(trim(p_currency));
begin
  if not public.be_has_role(array['banchiere_supremo','admin_supremo']) then raise exception 'Permesso negato.'; end if;
  if p_amount is null or p_amount=0 or p_amount<>round(p_amount,2) or abs(p_amount)>1000000000000 then raise exception 'Importo non valido (massimo due decimali).'; end if;
  if char_length(trim(coalesce(p_reason,'')))<3 or char_length(trim(p_reason))>200 then raise exception 'Inserisci una causale da 3 a 200 caratteri.'; end if;
  if not exists(select 1 from public.currencies where code=v_currency and enabled) then raise exception 'Valuta non disponibile.'; end if;
  select id into v_target from public.profiles where lower(username)=lower(trim(p_username));
  if v_target is null then raise exception 'Utente non trovato.'; end if;
  select id into v_account from public.bank_accounts where owner_id=v_target and is_initial order by created_at limit 1;
  if v_account is null then raise exception 'L’utente non ha un conto iniziale.'; end if;
  insert into public.account_balances(account_id,currency,balance) values(v_account,v_currency,0) on conflict(account_id,currency) do nothing;
  select balance into v_balance from public.account_balances where account_id=v_account and currency=v_currency for update;
  if v_balance+p_amount<0 then raise exception 'Saldo insufficiente: non puoi portarlo sotto zero.'; end if;
  update public.account_balances set balance=balance+p_amount,updated_at=now() where account_id=v_account and currency=v_currency;
  insert into public.admin_audit_log(actor_id,action,target_user_id,details)
  values(v_actor,case when p_amount>0 then 'money_created' else 'money_removed' end,v_target,
    jsonb_build_object('username',p_username,'currency',v_currency,'amount',p_amount,'reason',trim(p_reason),'account_id',v_account)) returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.be_emperor_update_empire(p_name text, p_leader text, p_insurance_plan_id bigint)
returns void language plpgsql security definer set search_path=public
as $$
declare v_empire text;
begin
  if not public.be_has_role(array['imperatore','admin_supremo']) then raise exception 'Permesso negato.'; end if;
  select empire_id into v_empire from public.profiles where id=auth.uid();
  if v_empire is null then raise exception 'Impero non trovato.'; end if;
  if char_length(trim(p_name)) not between 3 and 60 or char_length(trim(p_leader)) not between 2 and 60 then raise exception 'Nome impero o leader non valido.'; end if;
  if p_insurance_plan_id is not null and not exists(select 1 from public.insurance_plans where id=p_insurance_plan_id and active) then raise exception 'Piano assicurativo non disponibile.'; end if;
  update public.empires set name=trim(p_name),leader=trim(p_leader),selected_insurance_plan_id=p_insurance_plan_id where id=v_empire;
  insert into public.admin_audit_log(actor_id,action,details) values(auth.uid(),'empire_updated',jsonb_build_object('empire_id',v_empire,'name',p_name,'insurance_plan_id',p_insurance_plan_id));
end;
$$;

create or replace function public.be_emperor_save_tax(p_activity_code text, p_label text, p_rate_percent numeric, p_enabled boolean)
returns bigint language plpgsql security definer set search_path=public
as $$
declare v_empire text; v_id bigint;
begin
  if not public.be_has_role(array['imperatore','admin_supremo']) then raise exception 'Permesso negato.'; end if;
  select empire_id into v_empire from public.profiles where id=auth.uid();
  insert into public.empire_tax_rules(empire_id,activity_code,label,rate_percent,enabled,updated_at)
  values(v_empire,lower(trim(p_activity_code)),trim(p_label),p_rate_percent,coalesce(p_enabled,true),now())
  on conflict(empire_id,activity_code) do update set label=excluded.label,rate_percent=excluded.rate_percent,enabled=excluded.enabled,updated_at=now()
  returning id into v_id;
  insert into public.admin_audit_log(actor_id,action,details) values(auth.uid(),'empire_tax_updated',jsonb_build_object('empire_id',v_empire,'tax_id',v_id,'rate_percent',p_rate_percent));
  return v_id;
end;
$$;


create or replace function public.be_emperor_broadcast(p_subject text, p_body text)
returns bigint language plpgsql security definer set search_path=public
as $
declare v_empire text; v_id bigint;
begin
  if not public.be_has_role(array['imperatore','admin_supremo']) then raise exception 'Permesso negato.'; end if;
  select empire_id into v_empire from public.profiles where id=auth.uid();
  if v_empire is null then raise exception 'Impero non trovato.'; end if;
  insert into public.user_messages(sender_id,empire_id,subject,body)
  values(auth.uid(),v_empire,trim(p_subject),trim(p_body)) returning id into v_id;
  insert into public.admin_audit_log(actor_id,action,details)
  values(auth.uid(),'empire_message_sent',jsonb_build_object('empire_id',v_empire,'message_id',v_id,'subject',left(p_subject,100)));
  return v_id;
end;
$;

create or replace function public.be_get_my_messages()
returns table(id bigint, sender_username text, empire_id text, subject text, body text, created_at timestamptz)
language plpgsql stable security definer set search_path=public
as $$
begin
  if auth.uid() is null then raise exception 'Accedi per leggere i messaggi.'; end if;
  return query
    select m.id,coalesce(p.username,'Sistema'),m.empire_id,m.subject,m.body,m.created_at
    from public.user_messages m left join public.profiles p on p.id=m.sender_id
    where m.recipient_id=auth.uid()
       or (m.recipient_id is null and m.empire_id is null)
       or m.empire_id=(select empire_id from public.profiles where id=auth.uid())
    order by m.created_at desc limit 100;
end;
$$;

create or replace function public.be_get_my_tax_rules()
returns setof public.empire_tax_rules language plpgsql stable security definer set search_path=public
as $$
declare v_empire text;
begin
  if auth.uid() is null then raise exception 'Accedi per continuare.'; end if;
  select empire_id into v_empire from public.profiles where id=auth.uid();
  return query select * from public.empire_tax_rules where empire_id=v_empire order by id;
end;
$$;

do $$
declare fn record;
begin
  for fn in select p.oid::regprocedure as signature from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.proname like 'be_%'
  loop
    execute format('revoke all on function %s from public, anon',fn.signature);
    execute format('grant execute on function %s to authenticated',fn.signature);
  end loop;
end $$;

-- IMPORTANT: after applying this migration, bootstrap the first admin manually in SQL:
-- update public.profiles set role='admin_supremo' where username='YOUR_EXISTING_USERNAME';
-- Never expose a service_role key in browser code.
