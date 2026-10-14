-- Other work: links a graduate adds to show what they did before (a website, a project, a portfolio,
-- an internship). Not a CV. Visible to the graduate, recruiters and admin. At most five per graduate.

create table public.grad_links (
  id uuid primary key default gen_random_uuid(),
  grad_id uuid not null references public.grads (id) on delete cascade,
  title text not null check (char_length(title) between 3 and 80),
  url text not null check (url ~* '^https?://[^\s]+$' and char_length(url) <= 500),
  note text check (char_length(note) <= 160),
  created_at timestamptz not null default now()
);
create index grad_links_grad on public.grad_links (grad_id, created_at);

alter table public.grad_links enable row level security;

create policy grad_links_own on public.grad_links for all to authenticated
  using (grad_id = auth.uid())
  with check (grad_id = auth.uid() and public.my_role() = 'grad');
create policy grad_links_recruiters on public.grad_links for select to authenticated
  using (public.my_role() in ('recruiter', 'admin'));

grant select, insert, delete on public.grad_links to authenticated;
grant update (title, url, note) on public.grad_links to authenticated;

create function public.limit_grad_links() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if (select count(*) from public.grad_links where grad_id = new.grad_id) >= 5 then
    raise exception 'You can add up to 5 links. Remove one first.';
  end if;
  return new;
end;
$$;
create trigger limit_grad_links
  before insert on public.grad_links
  for each row execute function public.limit_grad_links();

revoke execute on function public.limit_grad_links() from public, anon;
