-- Tafutakazi: initial schema.
-- Privacy rules this file enforces:
--   * Graduates' work is visible only to signed-in recruiters, never to other graduates.
--   * The link to a graduate's full work is revealed only to a company that invited them.
--   * Recruiters see other companies' tasks by industry only, never by company name.
--   * Task status can only be set live/flagged by the server (the automatic task check).
-- "Automatically expose new tables" is off for this project, so every grant is explicit.

create extension if not exists pgcrypto;

-- ─── Types ───────────────────────────────────────────────────────────────────

create type public.user_role as enum ('grad', 'recruiter', 'admin');
create type public.task_status as enum ('checking', 'live', 'flagged', 'off');

-- ─── Tables ──────────────────────────────────────────────────────────────────

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.user_role not null,
  full_name text not null check (char_length(full_name) between 2 and 80),
  created_at timestamptz not null default now()
);

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  size text,
  industry text not null,
  website text,
  linkedin text,
  social text,
  -- Set when the recruiter signed up with a company address (not Gmail, Yahoo...).
  email_domain text,
  created_at timestamptz not null default now()
);

create table public.grads (
  id uuid primary key references public.profiles (id) on delete cascade,
  course text not null,
  institution text,
  grad_year int check (grad_year between 2000 and 2100),
  track text not null,
  slug text not null unique,
  digest_enabled boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.recruiters (
  id uuid primary key references public.profiles (id) on delete cascade,
  company_id uuid not null references public.companies (id) on delete cascade,
  job_title text,
  roles text[] not null default '{}',
  digest_enabled boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  -- Null company = a Tafutakazi practice task.
  company_id uuid references public.companies (id) on delete cascade,
  created_by uuid references public.profiles (id) on delete set null,
  -- Copied from the company so other recruiters can see the industry, not the name.
  industry text,
  role text not null,
  title text not null check (char_length(title) between 3 and 120),
  instructions text not null check (char_length(instructions) between 20 and 4000),
  minutes_estimate int not null check (minutes_estimate between 30 and 240),
  openings int check (openings >= 1),
  location text,
  start_note text,
  salary_range text,
  status public.task_status not null default 'checking',
  check_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index tasks_live_role on public.tasks (role) where status = 'live';
create index tasks_company on public.tasks (company_id);

create table public.task_files (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks (id) on delete cascade,
  -- Each graduate gets one of several dataset versions to make copying pointless.
  variant text not null default 'A',
  storage_path text not null,
  file_name text not null,
  size_bytes int,
  created_at timestamptz not null default now()
);

create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks (id) on delete cascade,
  grad_id uuid not null references public.grads (id) on delete cascade,
  summary text not null check (char_length(summary) between 10 and 200),
  work_link text not null check (work_link ~* '^https?://'),
  preview_path text,
  video_url text not null check (video_url ~* '^https?://'),
  writeup text not null check (
    coalesce(array_length(regexp_split_to_array(btrim(writeup), '\s+'), 1), 0) >= 250
  ),
  word_count int generated always as (
    coalesce(array_length(regexp_split_to_array(btrim(writeup), '\s+'), 1), 0)
  ) stored,
  created_at timestamptz not null default now(),
  unique (task_id, grad_id)
);
create index submissions_grad on public.submissions (grad_id);
create index submissions_task on public.submissions (task_id);

create table public.verdicts (
  submission_id uuid primary key references public.submissions (id) on delete cascade,
  strengths text not null,
  improve text not null,
  created_at timestamptz not null default now()
);

create table public.reactions (
  submission_id uuid not null references public.submissions (id) on delete cascade,
  recruiter_id uuid not null references public.recruiters (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (submission_id, recruiter_id)
);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions (id) on delete cascade,
  recruiter_id uuid not null references public.recruiters (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now()
);
create index comments_submission on public.comments (submission_id);

create table public.invites (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions (id) on delete cascade,
  company_id uuid not null references public.companies (id) on delete cascade,
  recruiter_id uuid not null references public.recruiters (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (submission_id, company_id)
);

-- Access log: who opened what. Used to trace leaks and to count views.
create table public.views (
  id bigint generated always as identity primary key,
  submission_id uuid not null references public.submissions (id) on delete cascade,
  viewer_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null check (kind in ('work', 'preview', 'full_work_link')),
  created_at timestamptz not null default now()
);
create index views_submission on public.views (submission_id);

create table public.reports (
  task_id uuid not null references public.tasks (id) on delete cascade,
  grad_id uuid not null references public.grads (id) on delete cascade,
  reason text not null check (char_length(reason) between 3 and 500),
  created_at timestamptz not null default now(),
  primary key (task_id, grad_id)
);

-- ─── Helpers ─────────────────────────────────────────────────────────────────

create function public.my_role() returns public.user_role
language sql stable security definer set search_path = '' as $$
  select role from public.profiles where id = auth.uid()
$$;

create function public.my_company() returns uuid
language sql stable security definer set search_path = '' as $$
  select company_id from public.recruiters where id = auth.uid()
$$;

-- Graduates see which company commented, without seeing the recruiter's account.
alter table public.comments
  add column company_id uuid not null default public.my_company()
  references public.companies (id) on delete cascade;

-- 4 open tasks per company; 7 once it has given feedback on at least 80% of
-- the work it received. Turned-off tasks don't count.
create function public.company_task_limit(c uuid) returns int
language sql stable security definer set search_path = '' as $$
  with received as (
    select s.id,
      exists (select 1 from public.comments cm join public.recruiters r on r.id = cm.recruiter_id
              where cm.submission_id = s.id and r.company_id = c)
      or exists (select 1 from public.reactions re join public.recruiters r on r.id = re.recruiter_id
              where re.submission_id = s.id and r.company_id = c) as answered
    from public.submissions s join public.tasks t on t.id = s.task_id
    where t.company_id = c
  )
  select case
    when (select count(*) from received) > 0
     and (select count(*) filter (where answered)::numeric / count(*) from received) >= 0.8
    then 7 else 4 end
$$;

-- ─── Triggers ────────────────────────────────────────────────────────────────

-- Create the profile rows from the sign-up form's metadata.
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  r text := meta ->> 'role';
  base text;
  new_company uuid;
  domain text := lower(split_part(new.email, '@', 2));
  free_domains text[] := array['gmail.com', 'yahoo.com', 'yahoo.co.uk', 'hotmail.com', 'outlook.com',
                               'live.com', 'icloud.com', 'aol.com', 'proton.me', 'protonmail.com', 'ymail.com'];
begin
  -- Accounts created without the sign-up form (e.g. Google) finish their profile in the app.
  if r is null or r not in ('grad', 'recruiter') then
    return new;
  end if;

  insert into public.profiles (id, role, full_name)
  values (new.id, r::public.user_role, btrim(meta ->> 'full_name'));

  if r = 'grad' then
    base := trim(both '-' from regexp_replace(lower(meta ->> 'full_name'), '[^a-z0-9]+', '-', 'g'));
    insert into public.grads (id, course, institution, grad_year, track, slug)
    values (
      new.id,
      btrim(meta ->> 'course'),
      nullif(btrim(meta ->> 'institution'), ''),
      nullif(meta ->> 'grad_year', '')::int,
      btrim(meta ->> 'track'),
      coalesce(nullif(base, ''), 'graduate') || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 4)
    );
  else
    insert into public.companies (name, size, industry, website, linkedin, social, email_domain)
    values (
      btrim(meta ->> 'company'),
      meta ->> 'company_size',
      btrim(meta ->> 'industry'),
      nullif(btrim(meta ->> 'website'), ''),
      nullif(btrim(meta ->> 'linkedin'), ''),
      nullif(btrim(meta ->> 'social'), ''),
      case when domain = any (free_domains) then null else domain end
    )
    returning id into new_company;

    insert into public.recruiters (id, company_id, job_title, roles)
    values (
      new.id,
      new_company,
      nullif(btrim(meta ->> 'job_title'), ''),
      coalesce(array(select jsonb_array_elements_text(meta -> 'roles')), '{}')
    );
  end if;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Fill company/industry, keep recruiters from going live on their own,
-- require proof the company is real, and enforce the open-task limit.
create function public.guard_task() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  co public.companies;
  open_count int;
begin
  new.updated_at := now();

  -- The server (service role) and other triggers (e.g. pausing a reported task) can do
  -- anything; the rules below apply to people editing tasks directly.
  if auth.uid() is null or pg_trigger_depth() > 1 then
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

create trigger guard_task
  before insert or update on public.tasks
  for each row execute function public.guard_task();

-- ─── Row level security ──────────────────────────────────────────────────────

alter table public.profiles enable row level security;
alter table public.companies enable row level security;
alter table public.grads enable row level security;
alter table public.recruiters enable row level security;
alter table public.tasks enable row level security;
alter table public.task_files enable row level security;
alter table public.submissions enable row level security;
alter table public.verdicts enable row level security;
alter table public.reactions enable row level security;
alter table public.comments enable row level security;
alter table public.invites enable row level security;
alter table public.views enable row level security;
alter table public.reports enable row level security;

-- profiles: yourself; recruiters can see graduates' names.
create policy profiles_select on public.profiles for select to authenticated
  using (id = auth.uid() or (role = 'grad' and public.my_role() = 'recruiter'));
create policy profiles_update on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- companies: graduates see every company (to trust tasks); recruiters only their own.
create policy companies_select on public.companies for select to authenticated
  using (public.my_role() = 'grad' or id = public.my_company());
create policy companies_update on public.companies for update to authenticated
  using (id = public.my_company()) with check (id = public.my_company());

-- grads: yourself, and any recruiter.
create policy grads_select on public.grads for select to authenticated
  using (id = auth.uid() or public.my_role() = 'recruiter');
create policy grads_update on public.grads for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- recruiters: yourself.
create policy recruiters_select on public.recruiters for select to authenticated
  using (id = auth.uid());
create policy recruiters_update on public.recruiters for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- tasks: live tasks for everyone signed in; your company's tasks in any state.
create policy tasks_select on public.tasks for select to authenticated
  using (status = 'live' or company_id = public.my_company());
create policy tasks_insert on public.tasks for insert to authenticated
  with check (public.my_role() = 'recruiter');
create policy tasks_update on public.tasks for update to authenticated
  using (company_id = public.my_company()) with check (company_id = public.my_company());

create policy task_files_select on public.task_files for select to authenticated
  using (exists (select 1 from public.tasks t where t.id = task_id
                 and (t.status = 'live' or t.company_id = public.my_company())));
create policy task_files_insert on public.task_files for insert to authenticated
  with check (exists (select 1 from public.tasks t where t.id = task_id and t.company_id = public.my_company()));
create policy task_files_delete on public.task_files for delete to authenticated
  using (exists (select 1 from public.tasks t where t.id = task_id and t.company_id = public.my_company()));

-- submissions: your own; every recruiter. Never other graduates.
create policy submissions_select on public.submissions for select to authenticated
  using (grad_id = auth.uid() or public.my_role() = 'recruiter');
create policy submissions_insert on public.submissions for insert to authenticated
  with check (
    grad_id = auth.uid() and public.my_role() = 'grad'
    and exists (select 1 from public.tasks t where t.id = task_id and t.status = 'live')
  );
create policy submissions_update on public.submissions for update to authenticated
  using (grad_id = auth.uid()) with check (grad_id = auth.uid());

create policy verdicts_select on public.verdicts for select to authenticated
  using (public.my_role() = 'recruiter'
         or exists (select 1 from public.submissions s where s.id = submission_id and s.grad_id = auth.uid()));

-- reactions & comments: recruiters manage their own; graduates see those on their work.
create policy reactions_select on public.reactions for select to authenticated
  using (recruiter_id = auth.uid()
         or exists (select 1 from public.submissions s where s.id = submission_id and s.grad_id = auth.uid()));
create policy reactions_insert on public.reactions for insert to authenticated
  with check (recruiter_id = auth.uid());
create policy reactions_delete on public.reactions for delete to authenticated
  using (recruiter_id = auth.uid());

create policy comments_select on public.comments for select to authenticated
  using (recruiter_id = auth.uid()
         or exists (select 1 from public.submissions s where s.id = submission_id and s.grad_id = auth.uid()));
create policy comments_insert on public.comments for insert to authenticated
  with check (recruiter_id = auth.uid() and company_id = public.my_company());
create policy comments_delete on public.comments for delete to authenticated
  using (recruiter_id = auth.uid());

-- invites: made by a recruiter for their own company; seen by that company and the graduate.
create policy invites_select on public.invites for select to authenticated
  using (company_id = public.my_company()
         or exists (select 1 from public.submissions s where s.id = submission_id and s.grad_id = auth.uid()));
create policy invites_insert on public.invites for insert to authenticated
  with check (recruiter_id = auth.uid() and company_id = public.my_company());

-- views: graduates see the log for their own work (to count views). Inserted by functions only.
create policy views_select on public.views for select to authenticated
  using (exists (select 1 from public.submissions s where s.id = submission_id and s.grad_id = auth.uid()));

create policy reports_select on public.reports for select to authenticated
  using (grad_id = auth.uid());
create policy reports_insert on public.reports for insert to authenticated
  with check (grad_id = auth.uid() and public.my_role() = 'grad');

-- Three reports pause a task automatically.
create function public.pause_reported_task() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if (select count(*) from public.reports where task_id = new.task_id) >= 3 then
    update public.tasks set status = 'flagged', check_notes = 'Paused after 3 reports from graduates'
      where id = new.task_id and status = 'live';
  end if;
  return new;
end;
$$;
create trigger pause_reported_task
  after insert on public.reports
  for each row execute function public.pause_reported_task();

-- ─── Functions the app calls ─────────────────────────────────────────────────

-- The full-work link: for the graduate who owns it, or a company that invited them.
create function public.get_work_link(sub uuid) returns text
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
  if exists (select 1 from public.invites i where i.submission_id = sub and i.company_id = public.my_company()) then
    insert into public.views (submission_id, viewer_id, kind) values (sub, auth.uid(), 'full_work_link');
    return s.work_link;
  end if;
  return null;
end;
$$;

-- A recruiter opened a graduate's work: count it and log it.
create function public.log_view(sub uuid, what text default 'work') returns void
language plpgsql security definer set search_path = '' as $$
begin
  if public.my_role() <> 'recruiter' then
    return;
  end if;
  insert into public.views (submission_id, viewer_id, kind) values (sub, auth.uid(), what);
end;
$$;

-- The public CV page: names, tasks and verdicts only. Never the work, videos or write-ups.
create function public.get_public_profile(handle text) returns jsonb
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

-- ─── Grants (tables are not exposed automatically on this project) ───────────

grant usage on schema public to anon, authenticated;

grant select, update (full_name) on public.profiles to authenticated;
grant select, update (name, size, industry, website, linkedin, social) on public.companies to authenticated;
grant select, update (course, institution, grad_year, track, digest_enabled) on public.grads to authenticated;
grant select, update (job_title, roles, digest_enabled) on public.recruiters to authenticated;
grant select, insert, update on public.tasks to authenticated;
grant select, insert, delete on public.task_files to authenticated;
grant select on public.verdicts to authenticated;
grant select, insert, delete on public.reactions to authenticated;
grant select, insert, delete on public.comments to authenticated;
grant select, insert on public.invites to authenticated;
grant select on public.views to authenticated;
grant select, insert on public.reports to authenticated;

-- Submissions: everything except the full-work link, which only get_work_link() reveals.
grant select (id, task_id, grad_id, summary, preview_path, video_url, writeup, word_count, created_at)
  on public.submissions to authenticated;
grant insert (task_id, grad_id, summary, work_link, preview_path, video_url, writeup)
  on public.submissions to authenticated;
grant update (summary, work_link, preview_path, video_url, writeup)
  on public.submissions to authenticated;

revoke execute on all functions in schema public from public, anon;
grant execute on function public.my_role() to authenticated;
grant execute on function public.my_company() to authenticated;
grant execute on function public.company_task_limit(uuid) to authenticated;
grant execute on function public.get_work_link(uuid) to authenticated;
grant execute on function public.log_view(uuid, text) to authenticated;
grant execute on function public.get_public_profile(text) to anon, authenticated;

-- ─── File storage ────────────────────────────────────────────────────────────

-- Previews: one image or PDF per submission, 5 MB max. Path: <grad id>/<file>.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('previews', 'previews', false, 5242880,
        array['image/png', 'image/jpeg', 'image/webp', 'application/pdf']);

-- Task data: the sample files graduates download. Path: <company id>/<task id>/<file>.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('task-files', 'task-files', false, 20971520,
        array['text/csv', 'application/pdf', 'application/zip', 'application/json', 'text/plain',
              'application/vnd.ms-excel',
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']);

create policy previews_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'previews' and (storage.foldername(name))[1] = auth.uid()::text
              and public.my_role() = 'grad');
create policy previews_update on storage.objects for update to authenticated
  using (bucket_id = 'previews' and (storage.foldername(name))[1] = auth.uid()::text);
create policy previews_delete on storage.objects for delete to authenticated
  using (bucket_id = 'previews' and (storage.foldername(name))[1] = auth.uid()::text);
-- TODO (phase 4): serve recruiters name-stamped copies through an edge function and drop
-- direct recruiter reads here.
create policy previews_select on storage.objects for select to authenticated
  using (bucket_id = 'previews'
         and ((storage.foldername(name))[1] = auth.uid()::text or public.my_role() = 'recruiter'));

create policy task_files_obj_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'task-files' and (storage.foldername(name))[1] = public.my_company()::text);
create policy task_files_obj_delete on storage.objects for delete to authenticated
  using (bucket_id = 'task-files' and (storage.foldername(name))[1] = public.my_company()::text);
create policy task_files_obj_select on storage.objects for select to authenticated
  using (bucket_id = 'task-files');
