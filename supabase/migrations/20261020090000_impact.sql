-- Impact numbers for funders and partners, for the admin dashboard.
-- Counts only, never names. Admin accounts and their test work are left out.

create function public.impact_stats() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  result jsonb;
begin
  if not public.is_admin() then
    raise exception 'Only Tafutakazi admins can see impact numbers';
  end if;

  with
  g as (
    select gr.id, gr.created_at, nullif(lower(btrim(gr.institution)), '') as institution, gr.track
    from public.grads gr join public.profiles p on p.id = gr.id
    where p.role = 'grad'
  ),
  s as (
    select s.id, s.grad_id, s.created_at, t.company_id, t.kind, t.role
    from public.submissions s
    join public.tasks t on t.id = s.task_id
    join g on g.id = s.grad_id
  ),
  i as (
    select i.id, i.company_id, i.created_at, s.grad_id,
      i.company_status::text as cs, i.grad_status::text as gs,
      case
        when i.company_status = 'hired' then coalesce(i.company_updated_at, i.created_at)
        when i.grad_status = 'hired' then coalesce(i.grad_updated_at, i.created_at)
      end as hired_at
    from public.invites i join s on s.id = i.submission_id
  ),
  c as (
    select co.id, co.created_at from public.companies co
    where exists (select 1 from public.recruiters r join public.profiles p on p.id = r.id where r.company_id = co.id and p.role = 'recruiter')
  ),
  first_invite as (
    select grad_id, min(created_at) as at from i group by grad_id
  ),
  first_hire as (
    select grad_id, min(hired_at) as at from i where hired_at is not null group by grad_id
  ),
  months as (
    select generate_series(date_trunc('month', now()) - interval '11 months', date_trunc('month', now()), interval '1 month') as m
  )
  select jsonb_build_object(
    'graduates', (select count(*) from g),
    'graduates_with_work', (select count(distinct grad_id) from s),
    'submissions', (select count(*) from s),
    'company_submissions', (select count(*) from s where company_id is not null),
    'practice_submissions', (select count(*) from s where company_id is null),
    'institutions', (select count(distinct institution) from g),
    'companies', (select count(*) from c),
    'companies_posting', (select count(distinct t.company_id) from public.tasks t join c on c.id = t.company_id where t.status in ('live', 'off')),
    'opportunities', (select count(*) from public.tasks t join c on c.id = t.company_id where t.status in ('live', 'off')),
    'opportunities_live', (select count(*) from public.tasks t join c on c.id = t.company_id where t.status = 'live'),
    'opportunities_by_type', (
      select coalesce(jsonb_object_agg(kind, n), '{}'::jsonb) from (
        select t.kind::text as kind, count(*) as n from public.tasks t join c on c.id = t.company_id
        where t.status in ('live', 'off') group by t.kind
      ) x),
    'invites', (select count(*) from i),
    'graduates_invited', (select count(distinct grad_id) from i),
    'graduates_interviewed', (select count(distinct grad_id) from i where cs in ('interviewed', 'hired') or gs in ('interviewed', 'hired')),
    'graduates_hired', (select count(*) from first_hire),
    'median_days_to_invite', (
      select round(percentile_cont(0.5) within group (order by extract(epoch from fi.at - g.created_at) / 86400)::numeric, 1)
      from first_invite fi join g on g.id = fi.grad_id),
    'median_days_to_hire', (
      select round(percentile_cont(0.5) within group (order by extract(epoch from fh.at - g.created_at) / 86400)::numeric, 1)
      from first_hire fh join g on g.id = fh.grad_id),
    'monthly', (
      select jsonb_agg(jsonb_build_object(
        'month', to_char(m, 'YYYY-MM'),
        'graduates', (select count(*) from g where date_trunc('month', g.created_at) = m),
        'submissions', (select count(*) from s where date_trunc('month', s.created_at) = m),
        'invites', (select count(*) from i where date_trunc('month', i.created_at) = m),
        'hires', (select count(*) from first_hire where date_trunc('month', first_hire.at) = m)
      ) order by m) from months),
    'top_roles', (
      select coalesce(jsonb_agg(jsonb_build_object('name', role, 'n', n) order by n desc), '[]'::jsonb) from (
        select role, count(*) as n from s group by role order by count(*) desc limit 8
      ) x),
    'top_institutions', (
      select coalesce(jsonb_agg(jsonb_build_object('name', institution, 'n', n) order by n desc), '[]'::jsonb) from (
        select institution, count(*) as n from g where institution is not null group by institution order by count(*) desc limit 8
      ) x)
  ) into result;

  return result;
end;
$$;
revoke execute on function public.impact_stats() from public, anon;
grant execute on function public.impact_stats() to authenticated;
