-- Phase 3: what recruiters need to find graduates, judge their work and post tasks.
-- Counts (views, thumbs) come from functions, because recruiters can't read other
-- recruiters' rows directly.

-- Graduates with work in a role, for the Browse page.
create function public.browse_grads(p_role text) returns table (
  grad_id uuid,
  full_name text,
  course text,
  institution text,
  grad_year int,
  tasks_done int,
  latest_title text,
  latest_summary text,
  latest_at timestamptz,
  latest_strengths text,
  views int,
  thumbs int
)
language sql stable security definer set search_path = '' as $$
  with work as (
    select s.*, t.title
    from public.submissions s join public.tasks t on t.id = s.task_id
    where t.role = p_role
  ), latest as (
    select distinct on (grad_id) grad_id, id, title, summary, created_at from work order by grad_id, created_at desc
  )
  select g.id, p.full_name, g.course, g.institution, g.grad_year,
         (select count(*)::int from work w where w.grad_id = g.id),
         l.title, l.summary, l.created_at,
         (select v.strengths from public.verdicts v where v.submission_id = l.id),
         (select count(*)::int from public.views v join work w on w.id = v.submission_id where w.grad_id = g.id and v.kind = 'work'),
         (select count(*)::int from public.reactions r join work w on w.id = r.submission_id where w.grad_id = g.id)
  from latest l
  join public.grads g on g.id = l.grad_id
  join public.profiles p on p.id = g.id
  where public.my_role() in ('recruiter', 'admin')
$$;

-- One graduate's work, for the recruiter's view of it.
create function public.grad_work(p_grad uuid) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'grad_id', g.id,
    'full_name', p.full_name,
    'course', g.course,
    'institution', g.institution,
    'grad_year', g.grad_year,
    'track', g.track,
    -- Contact details only for a company that has invited this graduate.
    'email', case when exists (
      select 1 from public.invites i join public.submissions s on s.id = i.submission_id
      where s.grad_id = g.id and i.company_id = public.my_company()
    ) then (select email from auth.users where id = g.id) end,
    'submissions', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', s.id,
        'summary', s.summary,
        'writeup', s.writeup,
        'word_count', s.word_count,
        'video_url', s.video_url,
        'preview_path', s.preview_path,
        'created_at', s.created_at,
        'task_id', t.id,
        'task_title', t.title,
        'task_role', t.role,
        'task_instructions', t.instructions,
        'task_minutes', t.minutes_estimate,
        'industry', t.industry,
        'is_practice', t.company_id is null,
        'is_mine', t.company_id is not distinct from public.my_company() and t.company_id is not null,
        'my_company_name', case when t.company_id = public.my_company() then (select name from public.companies where id = t.company_id) end,
        'strengths', v.strengths,
        'improve', v.improve,
        'views', (select count(*) from public.views x where x.submission_id = s.id and x.kind = 'work'),
        'thumbs', (select count(*) from public.reactions r where r.submission_id = s.id),
        'my_thumb', exists (select 1 from public.reactions r where r.submission_id = s.id and r.recruiter_id = auth.uid()),
        'invited', exists (select 1 from public.invites i where i.submission_id = s.id and i.company_id = public.my_company()),
        'my_comments', coalesce((select jsonb_agg(jsonb_build_object('id', c.id, 'body', c.body, 'created_at', c.created_at) order by c.created_at)
                                 from public.comments c where c.submission_id = s.id and c.recruiter_id = auth.uid()), '[]'::jsonb)
      ) order by s.created_at desc)
      from public.submissions s
      join public.tasks t on t.id = s.task_id
      left join public.verdicts v on v.submission_id = s.id
      where s.grad_id = g.id
    ), '[]'::jsonb)
  )
  from public.grads g join public.profiles p on p.id = g.id
  where g.id = p_grad and public.my_role() in ('recruiter', 'admin')
$$;

-- The company's tasks with how much work each has received and answered.
create function public.my_tasks() returns table (
  id uuid,
  title text,
  role text,
  status public.task_status,
  check_notes text,
  openings int,
  created_at timestamptz,
  received int,
  answered int
)
language sql stable security definer set search_path = '' as $$
  select t.id, t.title, t.role, t.status, t.check_notes, t.openings, t.created_at,
         (select count(*)::int from public.submissions s where s.task_id = t.id),
         (select count(*)::int from public.submissions s where s.task_id = t.id and (
            exists (select 1 from public.comments c where c.submission_id = s.id and c.company_id = t.company_id)
            or exists (select 1 from public.reactions r join public.recruiters rr on rr.id = r.recruiter_id
                       where r.submission_id = s.id and rr.company_id = t.company_id)))
  from public.tasks t
  where t.company_id = public.my_company()
  order by t.created_at desc
$$;

-- Who did one of my company's tasks.
create function public.task_submissions(p_task uuid) returns table (
  submission_id uuid,
  grad_id uuid,
  full_name text,
  course text,
  summary text,
  created_at timestamptz,
  answered boolean,
  invited boolean
)
language sql stable security definer set search_path = '' as $$
  select s.id, g.id, p.full_name, g.course, s.summary, s.created_at,
         exists (select 1 from public.comments c where c.submission_id = s.id and c.company_id = public.my_company())
           or exists (select 1 from public.reactions r join public.recruiters rr on rr.id = r.recruiter_id
                      where r.submission_id = s.id and rr.company_id = public.my_company()),
         exists (select 1 from public.invites i where i.submission_id = s.id and i.company_id = public.my_company())
  from public.submissions s
  join public.tasks t on t.id = s.task_id
  join public.grads g on g.id = s.grad_id
  join public.profiles p on p.id = g.id
  where s.task_id = p_task and t.company_id = public.my_company()
  order by s.created_at desc
$$;

-- How many tasks the company can have open right now.
create function public.my_task_allowance() returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'open', (select count(*) from public.tasks where company_id = public.my_company() and status <> 'off'),
    'limit', public.company_task_limit(public.my_company()),
    'can_post', exists (select 1 from public.companies c where c.id = public.my_company()
                        and (c.email_domain is not null or c.website is not null or c.linkedin is not null or c.social is not null))
  )
$$;

revoke execute on function public.browse_grads(text), public.grad_work(uuid), public.my_tasks(),
  public.task_submissions(uuid), public.my_task_allowance() from public, anon;
grant execute on function public.browse_grads(text), public.grad_work(uuid), public.my_tasks(),
  public.task_submissions(uuid), public.my_task_allowance() to authenticated;

-- Recruiters see their own company's details (for the account page).
grant select on public.companies to authenticated;
