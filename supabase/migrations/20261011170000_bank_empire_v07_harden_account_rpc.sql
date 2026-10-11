-- Bank Empire 0.7: serializza la creazione dei conti e limita l'esecuzione delle RPC ai ruoli autenticati.
create or replace function public.create_bank_account(p_account_name text, p_account_password text)
returns table(account_id uuid, access_token text)
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_count integer;
  v_account_id uuid;
  v_token text;
begin
  if v_user_id is null then raise exception 'Devi accedere.'; end if;
  if p_account_name is null or char_length(trim(p_account_name)) < 2 or char_length(trim(p_account_name)) > 32 then
    raise exception 'Il nome del conto deve contenere da 2 a 32 caratteri.';
  end if;
  if p_account_password is null or char_length(p_account_password) < 8 or char_length(p_account_password) > 72 then
    raise exception 'La password del conto deve contenere da 8 a 72 caratteri.';
  end if;

  -- Blocca la riga del profilo per evitare che richieste simultanee superino il limite di quattro conti.
  perform 1 from public.profiles p where p.id = v_user_id for update;
  if not found then raise exception 'Profilo utente non trovato.'; end if;

  select count(*) into v_count from public.bank_accounts a where a.owner_id = v_user_id;
  if v_count >= 4 then raise exception 'Puoi avere al massimo quattro conti.'; end if;

  insert into public.bank_accounts(owner_id, name, password_hash, is_initial)
  values (v_user_id, trim(p_account_name), extensions.crypt(p_account_password, extensions.gen_salt('bf')), false)
  returning id into v_account_id;

  insert into public.account_balances(account_id, currency, balance)
  select v_account_id, c.code, 0 from public.currencies c where c.enabled;

  v_token := encode(extensions.gen_random_bytes(32), 'hex');
  insert into public.account_access_tokens(token_hash, account_id, user_id, expires_at)
  values (encode(extensions.digest(v_token, 'sha256'), 'hex'), v_account_id, v_user_id, now() + interval '8 hours');
  account_id := v_account_id;
  access_token := v_token;
  return next;
exception when unique_violation then
  raise exception 'Questo nome conto è già utilizzato. Scegline un altro.';
end;
$function$;

revoke all on function public.create_bank_account(text,text) from public, anon;
revoke all on function public.get_my_accounts() from public, anon;
revoke all on function public.unlock_bank_account(text,text) from public, anon;
revoke all on function public.set_initial_account_password(text,text) from public, anon;
revoke all on function public.get_account_balances(text) from public, anon;
revoke all on function public.get_account_transactions(text) from public, anon;
revoke all on function public.transfer_between_accounts(text,text,text,numeric,text) from public, anon;
revoke all on function public.transfer_funds(text,text,numeric,text) from public, anon;
revoke all on function public.handle_new_user() from public, anon, authenticated;

grant execute on function public.create_bank_account(text,text) to authenticated;
grant execute on function public.get_my_accounts() to authenticated;
grant execute on function public.unlock_bank_account(text,text) to authenticated;
grant execute on function public.set_initial_account_password(text,text) to authenticated;
grant execute on function public.get_account_balances(text) to authenticated;
grant execute on function public.get_account_transactions(text) to authenticated;
grant execute on function public.transfer_between_accounts(text,text,text,numeric,text) to authenticated;
grant execute on function public.transfer_funds(text,text,numeric,text) to authenticated;
