-- Add currency conversion basis and empire ownership.
alter table public.currencies add column if not exists units_per_eur numeric(24,8) not null default 1;
alter table public.currencies add column if not exists empire_id text references public.empires(id);
insert into public.currencies(code,name,enabled,units_per_eur) values ('EUR','Euro',true,1) on conflict (code) do update set name=excluded.name, enabled=true, units_per_eur=1;
