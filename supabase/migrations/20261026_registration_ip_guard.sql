-- Bank Empire 1.0: server-side browser + pseudonymized-IP registration guard.
alter table public.registration_attempts
  add column if not exists ip_hmac text;

create index if not exists registration_attempts_ip_time_idx
  on public.registration_attempts (ip_hmac, attempted_at desc);

drop function if exists public.be_check_registration_guard(uuid);

create or replace function public.be_check_registration_guard(p_browser_id uuid, p_ip_hmac text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_browser_count integer;
  v_ip_count integer;
begin
  if p_browser_id is null or p_ip_hmac is null or length(p_ip_hmac) <> 64
     or p_ip_hmac !~ '^[0-9a-f]{64}$' then
    raise exception 'Impossibile verificare il dispositivo. Ricarica la pagina e riprova.';
  end if;

  delete from public.registration_attempts
  where attempted_at < now() - interval '30 days';

  select count(*) into v_browser_count
  from public.registration_attempts
  where browser_id = p_browser_id
    and attempted_at > now() - interval '24 hours';

  if v_browser_count >= 3 then
    raise exception 'Hai raggiunto il limite temporaneo di registrazioni da questo browser. Riprova più tardi.';
  end if;

  select count(*) into v_ip_count
  from public.registration_attempts
  where ip_hmac = p_ip_hmac
    and attempted_at > now() - interval '24 hours';

  -- Network-level limit is intentionally higher because households and schools share IPs.
  if v_ip_count >= 8 then
    raise exception 'Troppe registrazioni da questa rete nelle ultime 24 ore. Riprova più tardi.';
  end if;

  insert into public.registration_attempts(browser_id, ip_hmac)
  values (p_browser_id, p_ip_hmac);
  return true;
end;
$$;

revoke all on function public.be_check_registration_guard(uuid, text) from public, anon, authenticated;
grant execute on function public.be_check_registration_guard(uuid, text) to service_role;
