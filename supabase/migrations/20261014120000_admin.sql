-- Admin area: the person running Tafutakazi can add practice tasks, approve or pause
-- company tasks, and write verdicts on graduates' work.
-- Make an account admin (run once, with your own email):
--   update public.profiles set role = 'admin'
--   where id = (select id from auth.users where email = 'you@example.com');

create function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((select role = 'admin' from public.profiles where id = auth.uid()), false)
$$;
grant execute on function public.is_admin() to authenticated;

-- Admins skip the recruiter rules on tasks (they can create practice tasks and set any status).
create or replace function public.guard_task() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  co public.companies;
  open_count int;
begin
  new.updated_at := now();

  if auth.uid() is null or pg_trigger_depth() > 1 or public.is_admin() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.created_by := auth.uid();
    new.company_id := public.my_company();
    if new.company_id is null then
      raise exception 'Only recruiters can post tasks';
    end if;
  elsif new.company_id is distinct from old.company_id then
    raise exception 'A task cannot move to another company';
  end if;

  select * into co from public.companies where id = new.company_id;
  new.industry := co.industry;

  if tg_op = 'INSERT' or new.status is distinct from old.status then
    if new.status in ('live', 'flagged') then
      raise exception 'Tasks go live only after the automatic check';
    end if;
  end if;

  if new.status = 'checking' and (tg_op = 'INSERT' or old.status = 'off') then
    if co.email_domain is null and co.website is null and co.linkedin is null and co.social is null then
      raise exception 'Add a company email, website, LinkedIn page or business social media page before posting tasks';
    end if;
    select count(*) into open_count from public.tasks
      where company_id = new.company_id and status <> 'off' and id <> new.id;
    if open_count >= public.company_task_limit(new.company_id) then
      raise exception 'You have reached your open task limit. Turn a task off, or give feedback on more work to unlock more.';
    end if;
  end if;

  return new;
end;
$$;

-- Extra permissive policies: admins see and manage everything they need.
create policy admin_tasks on public.tasks for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy admin_task_files on public.task_files for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy admin_submissions on public.submissions for select to authenticated
  using (public.is_admin());
create policy admin_verdicts on public.verdicts for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy admin_profiles on public.profiles for select to authenticated
  using (public.is_admin());
create policy admin_grads on public.grads for select to authenticated
  using (public.is_admin());
create policy admin_companies on public.companies for select to authenticated
  using (public.is_admin());

grant delete on public.tasks to authenticated;
grant insert, update, delete on public.verdicts to authenticated;

-- Admins may see a submission's full-work link to review it (logged like everyone else).
create or replace function public.get_work_link(sub uuid) returns text
language plpgsql security definer set search_path = '' as $$
declare
  s public.submissions;
begin
  select * into s from public.submissions where id = sub;
  if s.id is null then
    return null;
  end if;
  if s.grad_id = auth.uid() then
    return s.work_link;
  end if;
  if public.is_admin()
     or exists (select 1 from public.invites i where i.submission_id = sub and i.company_id = public.my_company()) then
    insert into public.views (submission_id, viewer_id, kind) values (sub, auth.uid(), 'full_work_link');
    return s.work_link;
  end if;
  return null;
end;
$$;

-- Practice task files live under task-files/practice/…; previews are readable for review.
create policy task_files_obj_admin on storage.objects for all to authenticated
  using (bucket_id = 'task-files' and (storage.foldername(name))[1] = 'practice' and public.is_admin())
  with check (bucket_id = 'task-files' and (storage.foldername(name))[1] = 'practice' and public.is_admin());
create policy previews_admin_select on storage.objects for select to authenticated
  using (bucket_id = 'previews' and public.is_admin());

-- New functions are callable by everyone by default; keep them for signed-in users only.
revoke execute on function public.is_admin(), public.company_record(uuid), public.task_feed(uuid),
  public.delete_my_account() from public, anon;

-- ─── More practice tasks: data and marketing ─────────────────────────────────

with t as (
  insert into public.tasks (role, title, instructions, minutes_estimate, status)
  values (
    'Data Analyst',
    'SACCO loan arrears report',
    E'A SACCO with three branches in Western Kenya is worried that more members are falling behind on loan repayments. '
    'The credit committee meets next week and wants a clear picture.\n\n'
    'Your file has every active loan as at 30 September 2026. It was exported from two different systems, so dates and '
    'amounts are not always written the same way.\n\n'
    '1. Clean the data and list what you fixed.\n'
    '2. Work out portfolio at risk: the share of the total loan balance that is more than 30 days behind (PAR 30). '
    'Show it by branch and by loan type.\n'
    '3. Build a one-page report for the credit committee: where the risk is, what it is costing, and two actions you '
    'would take first.\n\n'
    'Use Excel, Google Sheets or Power BI. Share it as a view-only link.',
    210, 'live')
  returning id
)
insert into public.task_files (task_id, variant, public_url, file_name)
select t.id, v, '/practice/sacco-loans-' || v || '.csv', 'sacco-loans-' || v || '.csv'
from t, unnest(array['A', 'B', 'C']) as v;

with t as (
  insert into public.tasks (role, title, instructions, minutes_estimate, status)
  values (
    'Data Analyst',
    'Supermarket customer survey',
    E'A supermarket chain ran a customer survey across its stores. The marketing manager wants to know why some '
    'customers rate it badly and what to fix first.\n\n'
    'Your file has about 600 responses typed in by staff. Ages, genders and ratings were entered in different ways, '
    'and some answers are missing.\n\n'
    '1. Clean the responses and say how you handled each problem.\n'
    '2. Find what goes with low overall ratings: store, price, staff, age group, how often people visit.\n'
    '3. Read the comments and group them into the three most common complaints.\n'
    '4. Write a one-page summary with three recommendations, starting with the one that would help most.\n\n'
    'Use any tool you like. Share it as a view-only link.',
    210, 'live')
  returning id
)
insert into public.task_files (task_id, variant, public_url, file_name)
select t.id, v, '/practice/survey-responses-' || v || '.csv', 'survey-responses-' || v || '.csv'
from t, unnest(array['A', 'B', 'C']) as v;

with t as (
  insert into public.tasks (role, title, instructions, minutes_estimate, status)
  values (
    'Digital Marketer',
    'Which ads worked? Driving school campaign',
    E'A driving school in Nairobi has spent eight weeks running Facebook and Instagram adverts. The owner has KSh 40,000 '
    'for next month and wants to stop wasting money.\n\n'
    'Your file has weekly results for every advert: what was spent, how many people saw and clicked it, how many sent a '
    'WhatsApp message, and how many actually enrolled.\n\n'
    '1. Work out the cost per enrolment for each advert and each audience.\n'
    '2. Say which adverts and audiences to keep, change or stop, and why.\n'
    '3. Split next month''s KSh 40,000 and explain the split.\n'
    '4. Write two new adverts (image or video idea plus caption) based on what worked.\n\n'
    'Use Google Sheets or Excel for the numbers and any tool for the adverts. Share it as a view-only link.',
    180, 'live')
  returning id
)
insert into public.task_files (task_id, variant, public_url, file_name)
select t.id, v, '/practice/ad-results-' || v || '.csv', 'ad-results-' || v || '.csv'
from t, unnest(array['A', 'B', 'C']) as v;

insert into public.tasks (role, title, instructions, minutes_estimate, status)
values (
  'Digital Marketer',
  'Back-to-school sale for a bookshop',
  E'Soma Bookshop in Nakuru sells textbooks, stationery and school bags. Its back-to-school sale runs for the last two '
  'weeks of December. Last year it only put a banner outside, and sales were flat.\n\n'
  'The shop has a WhatsApp Business number with 1,200 parent contacts, an Instagram page with 2,400 followers, and '
  'KSh 15,000 to spend.\n\n'
  '1. Plan the campaign: what happens on WhatsApp, Instagram and in the shop, and when, from four weeks before the '
  'sale to the last day.\n'
  '2. Write the first WhatsApp broadcast and two Instagram posts (the image idea and the caption).\n'
  '3. Say how the KSh 15,000 should be spent and how the owner will know the campaign worked.\n\n'
  'Use Canva, Google Docs or Slides. Share it as a view-only link.',
  150, 'live'
);
