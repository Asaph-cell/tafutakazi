-- Public job board: live company tasks are listed at tafutakazi.co.ke/jobs and marked up
-- for Google for Jobs. Practice tasks are not jobs and are never listed.

create or replace function public.public_jobs(p_job uuid default null) returns table (
  id uuid,
  title text,
  role text,
  instructions text,
  minutes_estimate int,
  openings int,
  location text,
  start_note text,
  salary_range text,
  created_at timestamptz,
  updated_at timestamptz,
  company_name text,
  company_website text,
  company_linkedin text,
  company_social text,
  industry text
)
language sql stable security definer set search_path = '' as $$
  select t.id, t.title, t.role, t.instructions, t.minutes_estimate, t.openings, t.location, t.start_note,
         t.salary_range, t.created_at, t.updated_at, c.name, c.website, c.linkedin, c.social, c.industry
  from public.tasks t
  join public.companies c on c.id = t.company_id
  where t.status = 'live' and (p_job is null or t.id = p_job)
  order by t.created_at desc
$$;

revoke execute on function public.public_jobs(uuid) from public;
grant execute on function public.public_jobs(uuid) to anon, authenticated;
