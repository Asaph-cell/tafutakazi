-- Task requests: a graduate asks for a practice task that lets them show a specific skill.
-- Only Tafutakazi (admin) answers them, by publishing a practice task. Recruiters never see them.

create type public.request_status as enum ('open', 'done', 'declined');

create table public.task_requests (
  id uuid primary key default gen_random_uuid(),
  grad_id uuid not null references public.grads (id) on delete cascade,
  role text not null,
  tools text[] not null default '{}' check (cardinality(tools) <= 8),
  details text not null check (char_length(details) between 10 and 600),
  status public.request_status not null default 'open',
  task_id uuid references public.tasks (id) on delete set null,
  admin_note text,
  created_at timestamptz not null default now(),
  answered_at timestamptz
);
create index task_requests_status on public.task_requests (status, created_at);

alter table public.task_requests enable row level security;

create policy task_requests_own_select on public.task_requests for select to authenticated
  using (grad_id = auth.uid());
create policy task_requests_own_insert on public.task_requests for insert to authenticated
  with check (grad_id = auth.uid() and public.my_role() = 'grad' and status = 'open' and task_id is null);
create policy task_requests_own_delete on public.task_requests for delete to authenticated
  using (grad_id = auth.uid() and status = 'open');
create policy task_requests_admin on public.task_requests for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

grant select, insert, delete on public.task_requests to authenticated;
grant update (status, task_id, admin_note, answered_at) on public.task_requests to authenticated;

-- At most three open requests per graduate.
create function public.limit_task_requests() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if (select count(*) from public.task_requests where grad_id = new.grad_id and status = 'open') >= 3 then
    raise exception 'You can have up to 3 open requests. Wait for one to be answered, or remove one.';
  end if;
  return new;
end;
$$;
create trigger limit_task_requests
  before insert on public.task_requests
  for each row execute function public.limit_task_requests();

revoke execute on function public.limit_task_requests() from public, anon;

-- Admins see who asked (names) alongside each request.
-- (admin_profiles / admin_grads policies already allow this.)
