-- Skills, proven by work: graduates tag the tools they used on each task, and
-- recruiters filter by them (e.g. Data Analyst + Power BI).

alter table public.submissions
  add column tools text[] not null default '{}'
  check (cardinality(tools) <= 8);

grant select (tools), insert (tools), update (tools) on public.submissions to authenticated;

-- Browse now filters by tools (a graduate must have used every chosen tool in that role)
-- and returns the tools each graduate has used.
drop function public.browse_grads(text);
create function public.browse_grads(p_role text, p_tools text[] default '{}') returns table (
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
  thumbs int,
  tools text[]
)
language sql stable security definer set search_path = '' as $$
  with work as (
    select s.*, t.title
    from public.submissions s join public.tasks t on t.id = s.task_id
    where t.role = p_role
  ), used as (
    select w.grad_id, array_agg(distinct lower(x)) as tools_lower, array_agg(distinct x) as tools
    from work w, unnest(w.tools) as x
    group by w.grad_id
  ), latest as (
    select distinct on (grad_id) grad_id, id, title, summary, created_at from work order by grad_id, created_at desc
  )
  select g.id, p.full_name, g.course, g.institution, g.grad_year,
         (select count(*)::int from work w where w.grad_id = g.id),
         l.title, l.summary, l.created_at,
         (select v.strengths from public.verdicts v where v.submission_id = l.id),
         (select count(*)::int from public.views v join work w on w.id = v.submission_id where w.grad_id = g.id and v.kind = 'work'),
         (select count(*)::int from public.reactions r join work w on w.id = r.submission_id where w.grad_id = g.id),
         coalesce(u.tools, '{}')
  from latest l
  join public.grads g on g.id = l.grad_id
  join public.profiles p on p.id = g.id
  left join used u on u.grad_id = g.id
  where public.my_role() in ('recruiter', 'admin')
    and (cardinality(p_tools) = 0
         or coalesce(u.tools_lower, '{}') @> (select array_agg(lower(x)) from unnest(p_tools) as x))
$$;

-- Which tools graduates have used in a role, most common first (for the filter chips).
create function public.role_tools(p_role text) returns table (tool text, grads int)
language sql stable security definer set search_path = '' as $$
  select min(x), count(distinct s.grad_id)::int
  from public.submissions s
  join public.tasks t on t.id = s.task_id, unnest(s.tools) as x
  where t.role = p_role and public.my_role() in ('recruiter', 'admin')
  group by lower(x)
  order by 2 desc, 1
$$;

revoke execute on function public.browse_grads(text, text[]), public.role_tools(text) from public, anon;
grant execute on function public.browse_grads(text, text[]), public.role_tools(text) to authenticated;

-- The work view and the public CV page include the tools used.
create or replace function public.grad_work(p_grad uuid) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'grad_id', g.id,
    'full_name', p.full_name,
    'course', g.course,
    'institution', g.institution,
    'grad_year', g.grad_year,
    'track', g.track,
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
        'tools', s.tools,
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

create or replace function public.get_public_profile(handle text) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'full_name', p.full_name,
    'course', g.course,
    'institution', g.institution,
    'grad_year', g.grad_year,
    'track', g.track,
    'thumbs', (select count(*) from public.reactions re join public.submissions s on s.id = re.submission_id
               where s.grad_id = g.id),
    'invites', (select count(distinct i.company_id) from public.invites i join public.submissions s on s.id = i.submission_id
                where s.grad_id = g.id),
    'tasks', coalesce((
      select jsonb_agg(jsonb_build_object(
        'title', t.title,
        'role', t.role,
        'industry', coalesce(t.industry, 'practice'),
        'summary', s.summary,
        'tools', s.tools,
        'strengths', v.strengths,
        'improve', v.improve,
        'submitted_at', s.created_at
      ) order by s.created_at desc)
      from public.submissions s
      join public.tasks t on t.id = s.task_id
      left join public.verdicts v on v.submission_id = s.id
      where s.grad_id = g.id
    ), '[]'::jsonb)
  )
  from public.grads g join public.profiles p on p.id = g.id
  where g.slug = handle
$$;
