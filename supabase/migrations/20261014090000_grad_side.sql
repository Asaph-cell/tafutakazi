-- Phase 2: what graduates need to find, do and track tasks.

-- Graduates can still see a task they worked on after the company turns it off.
drop policy tasks_select on public.tasks;
create policy tasks_select on public.tasks for select to authenticated
  using (
    status = 'live'
    or company_id = public.my_company()
    or exists (select 1 from public.submissions s where s.task_id = tasks.id and s.grad_id = auth.uid())
  );

-- Task data can point at a public practice file (e.g. /practice/grocery-sales-A.csv)
-- instead of a file in storage.
alter table public.task_files add column public_url text;
alter table public.task_files alter column storage_path drop not null;
alter table public.task_files add constraint task_files_location
  check (storage_path is not null or public_url is not null);

-- A company's record, shown to graduates next to its tasks.
create function public.company_record(c uuid) returns jsonb
language sql stable security definer set search_path = '' as $$
  with subs as (
    select s.id from public.submissions s join public.tasks t on t.id = s.task_id where t.company_id = c
  )
  select jsonb_build_object(
    'received', (select count(*) from subs),
    'viewed', (select count(*) from subs where exists (
      select 1 from public.views v join public.recruiters r on r.id = v.viewer_id
      where v.submission_id = subs.id and r.company_id = c)),
    'feedback', (select count(*) from subs where exists (
      select 1 from public.comments cm where cm.submission_id = subs.id and cm.company_id = c)
      or exists (select 1 from public.reactions re join public.recruiters r on r.id = re.recruiter_id
                 where re.submission_id = subs.id and r.company_id = c))
  )
$$;

-- Everything a graduate sees on a task card or task page, in one call.
create function public.task_feed(only_task uuid default null) returns table (
  id uuid,
  title text,
  role text,
  instructions text,
  minutes_estimate int,
  openings int,
  location text,
  start_note text,
  salary_range text,
  status public.task_status,
  created_at timestamptz,
  is_practice boolean,
  company_name text,
  company_website text,
  company_linkedin text,
  company_social text,
  record jsonb,
  submitted boolean
)
language sql stable security definer set search_path = '' as $$
  select t.id, t.title, t.role, t.instructions, t.minutes_estimate, t.openings, t.location, t.start_note,
         t.salary_range, t.status, t.created_at, t.company_id is null,
         c.name, c.website, c.linkedin, c.social,
         case when t.company_id is null then null else public.company_record(t.company_id) end,
         exists (select 1 from public.submissions s where s.task_id = t.id and s.grad_id = auth.uid())
  from public.tasks t
  left join public.companies c on c.id = t.company_id
  where public.my_role() in ('grad', 'admin')
    and (t.status = 'live' or exists (select 1 from public.submissions s where s.task_id = t.id and s.grad_id = auth.uid()))
    and (only_task is null or t.id = only_task)
  order by t.created_at desc
$$;

-- Delete your own account and everything attached to it. The app removes the person's
-- preview files through the storage API first (storage files can't be deleted from SQL).
create function public.delete_my_account() returns void
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

grant execute on function public.company_record(uuid) to authenticated;
grant execute on function public.task_feed(uuid) to authenticated;
grant execute on function public.delete_my_account() to authenticated;

-- ─── Practice tasks: always open, written by Tafutakazi ──────────────────────

with t as (
  insert into public.tasks (role, title, instructions, minutes_estimate, status)
  values (
    'Data Analyst',
    'Grocery chain sales dashboard',
    E'A grocery chain with 6 branches in Nairobi wants to know which branches and products are losing money.\n\n'
    'Your file has three months of till receipts. The data is messy, like real data: some receipts were recorded twice, '
    'some branch names are spelled differently, and a few prices are missing.\n\n'
    '1. Clean the data and say what you fixed.\n'
    '2. Work out revenue and margin by branch and by product category (cost is 78% of price for every product).\n'
    '3. Build a one-page dashboard the manager can read in two minutes: which branch is weakest, which categories '
    'carry the business, and one thing you would change.\n\n'
    'Use Excel, Google Sheets or Power BI. Share the finished file or dashboard as a view-only link.',
    240, 'live')
  returning id
)
insert into public.task_files (task_id, variant, public_url, file_name)
select t.id, v, '/practice/grocery-sales-' || v || '.csv', 'grocery-sales-' || v || '.csv'
from t, unnest(array['A', 'B', 'C']) as v;

with t as (
  insert into public.tasks (role, title, instructions, minutes_estimate, status)
  values (
    'Accountant',
    'Delivery fleet fuel costs',
    E'A small delivery company in Mombasa runs 8 vans. The owner thinks fuel spending is out of control and wants answers '
    'before the end of the quarter.\n\n'
    'Your file has every fuel receipt for the last quarter.\n\n'
    '1. Check the receipts: find duplicates, impossible fills (more litres than the tank holds: 70 litres) and missing '
    'details.\n'
    '2. Work out fuel cost per van, per month, and cost per kilometre using the odometer readings.\n'
    '3. Write a one-page summary for the owner: which vans cost the most, which receipts look wrong, and what you '
    'recommend.\n\n'
    'Use Excel or Google Sheets. Share it as a view-only link.',
    180, 'live')
  returning id
)
insert into public.task_files (task_id, variant, public_url, file_name)
select t.id, v, '/practice/fuel-receipts-' || v || '.csv', 'fuel-receipts-' || v || '.csv'
from t, unnest(array['A', 'B', 'C']) as v;

insert into public.tasks (role, title, instructions, minutes_estimate, status)
values (
  'Digital Marketer',
  'Social media plan for a juice shop',
  E'Mama Pima Juices is a small shop in Kisumu selling fresh juice and smoothies. It has 900 Instagram followers, posts '
  'when the owner remembers, and wants more walk-in customers from students at the nearby university.\n\n'
  'The owner can spend KSh 5,000 a month on adverts and 30 minutes a day on social media.\n\n'
  '1. Say who the shop should be talking to and why.\n'
  '2. Plan four weeks of posts: what to post, on which platform, and when. Make at least three example posts '
  '(the image or video idea and the caption).\n'
  '3. Say how the KSh 5,000 should be spent and how the owner will know it worked.\n\n'
  'Use Canva, Google Docs or Slides. Share it as a view-only link.',
  180, 'live'
);
