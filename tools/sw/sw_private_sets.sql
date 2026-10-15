create table if not exists public.sw_private_sets (
  id text primary key, kind text not null, data jsonb not null,
  rooms text[] not null default '{TJ}', created_at timestamptz default now());
alter table public.sw_private_sets enable row level security;
revoke all on public.sw_private_sets from anon, authenticated;
create or replace function public.sw_private_get(p_room text)
returns setof jsonb language sql security definer set search_path = public as $$
  select data from public.sw_private_sets where upper(coalesce(p_room,'')) = any(select upper(x) from unnest(rooms) x) order by id $$;
revoke all on function public.sw_private_get(text) from public;
grant execute on function public.sw_private_get(text) to anon, authenticated;
