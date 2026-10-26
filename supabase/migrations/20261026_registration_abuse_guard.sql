-- Bank Empire 1.0: low-cost registration abuse guard.
-- Deterrent only: users can clear browser storage or switch devices.
create table if not exists public.registration_attempts (
  id bigint generated always as identity primary key,
  browser_id uuid not null,
  attempted_at timestamptz not null default now()
);
create index if not exists registration_attempts_browser_time_idx
  on public.registration_attempts (browser_id, attempted_at desc);
alter table public.registration_attempts enable row level security;
revoke all on public.registration_attempts from public, anon, authenticated;

create or replace function public.be_check_registration_guard(p_browser_id uuid)
returns boolean language plpgsql security definer set search_path = public
as $$
declare v_recent_count integer;
begin
  if p_browser_id is null then
    raise exception 'Impossibile verificare il dispositivo. Ricarica la pagina e riprova.';
  end if;
  delete from public.registration_attempts where attempted_at < now() - interval '30 days';
  select count(*) into v_recent_count
  from public.registration_attempts
  where browser_id = p_browser_id and attempted_at > now() - interval '24 hours';
  if v_recent_count >= 3 then
    raise exception 'Hai raggiunto il limite temporaneo di registrazioni da questo browser. Riprova più tardi.';
  end if;
  insert into public.registration_attempts(browser_id) values (p_browser_id);
  return true;
end;
$$;
revoke all on function public.be_check_registration_guard(uuid) from public;
grant execute on function public.be_check_registration_guard(uuid) to anon, authenticated;
