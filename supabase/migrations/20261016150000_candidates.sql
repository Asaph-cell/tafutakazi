-- Recruiters: one place for everyone they've invited or liked, and which roles have work.

create function public.my_candidates() returns table (
  kind text,              -- 'invited' or 'liked'
  grad_id uuid,
  full_name text,
  course text,
  institution text,
  task_title text,
  task_role text,
  submission_id uuid,
  invite_id uuid,
  company_status public.invite_company_status,
  grad_status public.invite_grad_status,
  at timestamptz,
  email text            -- only for people this company invited
)
language sql stable security definer set search_path = '' as $$
  select 'invited', g.id, p.full_name, g.course, g.institution, t.title, t.role, s.id, i.id,
         i.company_status, i.grad_status, i.created_at,
         (select u.email from auth.users u where u.id = g.id)::text
  from public.invites i
  join public.submissions s on s.id = i.submission_id
  join public.tasks t on t.id = s.task_id
  join public.grads g on g.id = s.grad_id
  join public.profiles p on p.id = g.id
  where i.company_id = public.my_company()
  union all
  select 'liked', g.id, p.full_name, g.course, g.institution, t.title, t.role, s.id, null, null, null, max(r.created_at), null
  from public.reactions r
  join public.recruiters rr on rr.id = r.recruiter_id
  join public.submissions s on s.id = r.submission_id
  join public.tasks t on t.id = s.task_id
  join public.grads g on g.id = s.grad_id
  join public.profiles p on p.id = g.id
  where rr.company_id = public.my_company()
    and not exists (select 1 from public.invites i where i.submission_id = s.id and i.company_id = public.my_company())
  group by g.id, p.full_name, g.course, g.institution, t.title, t.role, s.id
  order by 12 desc
$$;

-- Roles that have finished work, with how many graduates, for Browse.
create function public.roles_with_work() returns table (role text, grads int)
language sql stable security definer set search_path = '' as $$
  select t.role, count(distinct s.grad_id)::int
  from public.submissions s join public.tasks t on t.id = s.task_id
  where public.my_role() in ('recruiter', 'admin')
  group by t.role
  order by 2 desc, 1
$$;

revoke execute on function public.my_candidates(), public.roles_with_work() from public, anon;
grant execute on function public.my_candidates(), public.roles_with_work() to authenticated;
