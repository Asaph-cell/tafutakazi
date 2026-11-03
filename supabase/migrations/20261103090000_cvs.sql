-- The CV builder. A graduate's phone, town, summary and past jobs. Private to that graduate:
-- recruiters, other graduates and the app's admin screens can't read it.

create table public.cvs (
  grad_id uuid primary key references public.grads (id) on delete cascade,
  data jsonb not null check (jsonb_typeof(data) = 'object' and octet_length(data::text) <= 20000),
  updated_at timestamptz not null default now()
);

alter table public.cvs enable row level security;

create policy cvs_own on public.cvs for all to authenticated
  using (grad_id = auth.uid())
  with check (grad_id = auth.uid() and public.my_role() = 'grad');

grant select, insert, update, delete on public.cvs to authenticated;
