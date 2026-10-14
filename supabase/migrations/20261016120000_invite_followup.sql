-- Closing the loop on interview invites, so companies can't invite and disappear.
--  1. Both sides mark what happened (contacted, interviewed, hired / not moving forward, no contact).
--  2. Companies get a reminder if they haven't marked an invite as contacted after 3 days.
--  3. Graduates see each company's contact record.
--  4. Three "no contact" reports pause a company until an admin reviews it.
--  5. "Not moving forward" sends the graduate a kind email, so nobody is left wondering.

create type public.invite_company_status as enum ('invited', 'contacted', 'interviewed', 'hired', 'not_moving_forward');
create type public.invite_grad_status as enum ('waiting', 'contacted', 'interviewed', 'hired', 'no_contact');

alter table public.invites
  add column company_status public.invite_company_status not null default 'invited',
  add column grad_status public.invite_grad_status not null default 'waiting',
  add column company_updated_at timestamptz,
  add column grad_updated_at timestamptz,
  add column nudged_at timestamptz;

alter table public.companies
  add column paused boolean not null default false,
  add column paused_reason text;

-- Who may change what on an invite.
create policy invites_update_company on public.invites for update to authenticated
  using (company_id = public.my_company()) with check (company_id = public.my_company());
create policy invites_update_grad on public.invites for update to authenticated
  using (exists (select 1 from public.submissions s where s.id = submission_id and s.grad_id = auth.uid()))
  with check (exists (select 1 from public.submissions s where s.id = submission_id and s.grad_id = auth.uid()));
grant update (company_status, grad_status) on public.invites to authenticated;

create function public.guard_invite_update() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  is_company boolean := coalesce(new.company_id = public.my_company(), false);
begin
  if auth.uid() is null or pg_trigger_depth() > 1 or public.is_admin() then
    return new;
  end if;
  if new.company_status is distinct from old.company_status then
    if not is_company then raise exception 'Only the company can change its side of the invite'; end if;
    new.company_updated_at := now();
  end if;
  if new.grad_status is distinct from old.grad_status then
    if is_company then raise exception 'Only the graduate can change their side of the invite'; end if;
    if new.grad_status = 'no_contact' and old.created_at > now() - interval '5 days' then
      raise exception 'Give the company 5 days to get in touch before reporting no contact';
    end if;
    new.grad_updated_at := now();
  end if;
  return new;
end;
$$;
create trigger guard_invite_update
  before update on public.invites
  for each row execute function public.guard_invite_update();

-- Paused companies can't invite or post until an admin reviews them.
drop policy invites_insert on public.invites;
create policy invites_insert on public.invites for insert to authenticated
  with check (
    recruiter_id = auth.uid() and company_id = public.my_company()
    and not exists (select 1 from public.companies c where c.id = company_id and c.paused)
  );

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
    if co.paused then
      raise exception 'Your company is paused while we look into reports from graduates. Email hello@tafutakazi.co.ke.';
    end if;
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

-- Three graduates reporting no contact pauses the company and its live tasks.
create function public.pause_ghosting_company() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.grad_status = 'no_contact' and old.grad_status is distinct from 'no_contact' then
    if (select count(distinct s.grad_id) from public.invites i join public.submissions s on s.id = i.submission_id
        where i.company_id = new.company_id and i.grad_status = 'no_contact') >= 3 then
      update public.companies set paused = true, paused_reason = 'Three graduates said they were invited but never contacted'
        where id = new.company_id and not paused;
      update public.tasks set status = 'flagged', check_notes = 'Paused: graduates reported no contact after interview invites'
        where company_id = new.company_id and status = 'live';
    end if;
  end if;
  return new;
end;
$$;
create trigger pause_ghosting_company
  after update on public.invites
  for each row execute function public.pause_ghosting_company();

-- Admins can unpause a company after looking into it.
create policy admin_companies_update on public.companies for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
grant update (paused, paused_reason) on public.companies to authenticated;

create function public.guard_company_pause() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if (new.paused is distinct from old.paused or new.paused_reason is distinct from old.paused_reason)
     and auth.uid() is not null and pg_trigger_depth() <= 1 and not public.is_admin() then
    raise exception 'Only Tafutakazi can pause or unpause a company';
  end if;
  return new;
end;
$$;
create trigger guard_company_pause
  before update on public.companies
  for each row execute function public.guard_company_pause();

-- The company record now includes how many invited graduates it actually contacts.
-- Invites under 3 days old aren't counted yet: the company still has time.
create or replace function public.company_record(c uuid) returns jsonb
language sql stable security definer set search_path = '' as $$
  with subs as (
    select s.id from public.submissions s join public.tasks t on t.id = s.task_id where t.company_id = c
  ), inv as (
    select * from public.invites where company_id = c and created_at < now() - interval '3 days'
  )
  select jsonb_build_object(
    'received', (select count(*) from subs),
    'viewed', (select count(*) from subs where exists (
      select 1 from public.views v join public.recruiters r on r.id = v.viewer_id
      where v.submission_id = subs.id and r.company_id = c)),
    'feedback', (select count(*) from subs where exists (
      select 1 from public.comments cm where cm.submission_id = subs.id and cm.company_id = c)
      or exists (select 1 from public.reactions re join public.recruiters r on r.id = re.recruiter_id
                 where re.submission_id = subs.id and r.company_id = c)),
    'invited', (select count(*) from inv),
    'contacted', (select count(*) from inv where company_status <> 'invited'
                  or grad_status in ('contacted', 'interviewed', 'hired'))
  )
$$;

-- grad_work: the recruiter's own invite on each piece of work, with both sides' status.
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
    'company_paused', coalesce((select paused from public.companies where id = public.my_company()), false),
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
        'invite', (select jsonb_build_object('id', i.id, 'company_status', i.company_status, 'grad_status', i.grad_status, 'created_at', i.created_at)
                   from public.invites i where i.submission_id = s.id and i.company_id = public.my_company()),
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

-- Total hires reported, for the admin area (and later the homepage).
create function public.hire_count() returns int
language sql stable security definer set search_path = '' as $$
  select count(distinct submission_id)::int from public.invites
  where grad_status = 'hired' or company_status = 'hired'
$$;
revoke execute on function public.hire_count() from public, anon;
grant execute on function public.hire_count() to authenticated;

-- ─── Emails ──────────────────────────────────────────────────────────────────

create function public.send_email(to_email text, subject text, html text, reply_to text default null) returns void
language plpgsql security definer set search_path = '' as $$
declare
  key text;
begin
  select decrypted_secret into key from vault.decrypted_secrets where name = 'resend_api_key' limit 1;
  if key is null or to_email is null then
    return;
  end if;
  perform net.http_post(
    url := 'https://api.resend.com/emails',
    headers := jsonb_build_object('Authorization', 'Bearer ' || key, 'Content-Type', 'application/json'),
    body := jsonb_build_object('from', 'Tafutakazi <hello@tafutakazi.co.ke>', 'to', jsonb_build_array(to_email),
                               'subject', subject, 'html', html)
            || case when reply_to is null then '{}'::jsonb else jsonb_build_object('reply_to', reply_to) end
  );
exception when others then
  raise warning 'email not sent: %', sqlerrm;
end;
$$;
revoke execute on function public.send_email(text, text, text, text) from public, anon, authenticated;

create function public.email_wrap(body text, footer text) returns text
language sql immutable as $$
  select '<div style="font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.55;color:#141414;max-width:560px">'
      || '<p style="font-size:20px;font-weight:bold;margin:0 0 16px">tafutakazi<span style="color:#0E5C45">.</span></p>'
      || body
      || '<p style="color:#5C5C57;font-size:13px;margin-top:32px">' || footer || '</p></div>'
$$;

-- "Not moving forward": tell the graduate kindly, straight away.
create function public.email_not_moving_forward() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  grad_email text; grad_name text; task_title text; company text;
begin
  if new.company_status <> 'not_moving_forward' or old.company_status = 'not_moving_forward' then
    return new;
  end if;
  select u.email, p.full_name, t.title into grad_email, grad_name, task_title
  from public.submissions s join auth.users u on u.id = s.grad_id join public.profiles p on p.id = s.grad_id
  join public.tasks t on t.id = s.task_id where s.id = new.submission_id;
  select name into company from public.companies where id = new.company_id;
  perform public.send_email(grad_email, 'An update from ' || company,
    public.email_wrap(
      '<p>Hi ' || public.html_escape(split_part(grad_name, ' ', 1)) || ',</p>'
      || '<p>' || public.html_escape(company) || ' has decided not to move forward after inviting you to interview.</p>'
      || '<p>That is never easy to hear. But a company chose to invite you because of your work on <strong>"'
      || public.html_escape(task_title) || '"</strong>. That work stays on your profile, and other recruiters can still see it.</p>'
      || '<p>The best next step: do another task, or ask for one on a skill you want to show.</p>'
      || '<p><a href="https://tafutakazi.co.ke/tasks" style="color:#0E5C45">See open tasks</a></p>',
      'You are getting this because a company updated an interview invite on Tafutakazi.'));
  return new;
end;
$$;
create trigger email_not_moving_forward
  after update on public.invites
  for each row execute function public.email_not_moving_forward();

-- The invite email now also sets honest expectations.
create or replace function public.email_invite() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  grad_email text; grad_name text; recruiter_email text; recruiter_name text; company text; task_title text; task_role text;
begin
  select u.email, p.full_name, t.title, t.role into grad_email, grad_name, task_title, task_role
  from public.submissions s join auth.users u on u.id = s.grad_id join public.profiles p on p.id = s.grad_id
  join public.tasks t on t.id = s.task_id where s.id = new.submission_id;
  select u.email, p.full_name into recruiter_email, recruiter_name
  from auth.users u join public.profiles p on p.id = u.id where u.id = new.recruiter_id;
  select name into company from public.companies where id = new.company_id;

  perform public.send_email(grad_email, company || ' invited you to interview',
    public.email_wrap(
      '<p>Hi ' || public.html_escape(split_part(grad_name, ' ', 1)) || ',</p>'
      || '<p><strong>' || public.html_escape(company) || ' has invited you to interview.</strong></p>'
      || '<p>They looked at your work on <strong>"' || public.html_escape(task_title) || '"</strong> and want to talk to you about a '
      || public.html_escape(task_role) || ' role.</p>'
      || '<p>' || public.html_escape(recruiter_name) || ' will contact you at this email address. You can also reply to this email '
      || 'and it goes straight to them.</p>'
      || '<p style="margin:24px 0 8px"><strong>What to expect</strong></p>'
      || '<ul style="margin:0;padding-left:20px">'
      || '<li>Most companies get in touch within a few days. An invite is a strong sign, not a promise, so keep doing tasks while you wait.</li>'
      || '<li>When they contact you, mark it on Tafutakazi. If you hear nothing after 5 days, you can tell us there.</li>'
      || '<li>Be ready to walk them through your task and the choices you made.</li>'
      || '<li>Tafutakazi never charges graduates. If anyone asks you for money, report it to hello@tafutakazi.co.ke.</li></ul>'
      || '<p style="margin-top:24px"><a href="https://tafutakazi.co.ke/me" style="color:#0E5C45">See it on Tafutakazi</a></p>',
      'You are getting this because a company invited you to interview on Tafutakazi. Interview invites are always sent, even if daily emails are off.'),
    recruiter_email);
  return new;
end;
$$;

-- The 3-day reminder to companies, run every morning at 9:00 Nairobi time.
create function public.send_invite_nudges() returns int
language plpgsql security definer set search_path = '' as $$
declare
  r record;
  sent int := 0;
begin
  for r in
    select i.id, i.created_at, u.email as recruiter_email, rp.full_name as recruiter_name,
           gp.full_name as grad_name, s.grad_id
    from public.invites i
    join auth.users u on u.id = i.recruiter_id
    join public.profiles rp on rp.id = i.recruiter_id
    join public.submissions s on s.id = i.submission_id
    join public.profiles gp on gp.id = s.grad_id
    where i.company_status = 'invited' and i.nudged_at is null and i.created_at < now() - interval '3 days'
  loop
    perform public.send_email(r.recruiter_email, 'Have you contacted ' || split_part(r.grad_name, ' ', 1) || '?',
      public.email_wrap(
        '<p>Hi ' || public.html_escape(split_part(r.recruiter_name, ' ', 1)) || ',</p>'
        || '<p>On ' || to_char(r.created_at at time zone 'Africa/Nairobi', 'FMDay DD Mon') || ' you invited <strong>'
        || public.html_escape(r.grad_name) || '</strong> to interview. They are waiting to hear from you.</p>'
        || '<p>Please get in touch, or let them know you are not moving forward. It takes one click, and graduates see '
        || 'how many of the people a company invites it actually contacts.</p>'
        || '<p><a href="https://tafutakazi.co.ke/browse/' || r.grad_id || '" style="color:#0E5C45">Update this invite</a></p>',
        'You are getting this because you invited a graduate to interview on Tafutakazi.'));
    update public.invites set nudged_at = now() where id = r.id;
    sent := sent + 1;
  end loop;
  return sent;
end;
$$;
revoke execute on function public.send_invite_nudges() from public, anon, authenticated;
revoke execute on function public.guard_invite_update(), public.pause_ghosting_company(), public.guard_company_pause(),
  public.email_not_moving_forward(), public.email_wrap(text, text) from public, anon;

create extension if not exists pg_cron;
select cron.schedule('invite-nudges', '0 6 * * *', 'select public.send_invite_nudges()');
