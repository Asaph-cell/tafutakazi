-- Daily digests, 8am Nairobi time, only when there's something new.
-- Leak rules: no work content (write-ups, previews, videos, links), no contact details, no surnames or
-- universities, no comment text. Just enough to bring people back to the site, where everything is behind login.
-- Resend's free plan allows 100 emails a day, so digests stop at 60 a day to leave room for invites and the rest.

alter table public.grads add column digest_sent_at timestamptz;
alter table public.recruiters add column digest_sent_at timestamptz;

create function public.send_digests(max_emails int default 60) returns int
language plpgsql security definer set search_path = '' as $$
declare
  p record;
  since timestamptz;
  sent int := 0;
  n_work int; n_own int; work_lines text;
  n_tasks int; task_lines text; n_comments int; n_thumbs int; n_views int;
  body text;
begin
  -- Recruiters: new work in the roles they hire for, and new submissions to their own tasks.
  for p in
    select r.id, r.company_id, r.roles, r.digest_sent_at, r.created_at, u.email::text as email, split_part(pr.full_name, ' ', 1) as first_name
    from public.recruiters r join public.profiles pr on pr.id = r.id join auth.users u on u.id = r.id
    where r.digest_enabled and pr.role = 'recruiter'
      and (r.digest_sent_at is null or r.digest_sent_at < now() - interval '20 hours')
    order by r.digest_sent_at nulls first
  loop
    exit when sent >= max_emails;
    since := greatest(coalesce(p.digest_sent_at, p.created_at), now() - interval '7 days');

    select count(*), string_agg(line, '' order by created_at desc) filter (where rn <= 5)
    into n_work, work_lines
    from (
      select s.created_at, row_number() over (order by s.created_at desc) as rn,
             '<li>' || public.html_escape(split_part(gp.full_name, ' ', 1)) || ' · ' || public.html_escape(g.course)
               || ' · <span style="color:#5C5C57">' || public.html_escape(t.title) || '</span></li>' as line
      from public.submissions s
      join public.tasks t on t.id = s.task_id
      join public.grads g on g.id = s.grad_id
      join public.profiles gp on gp.id = g.id
      where s.created_at > since
        and lower(t.role) in (select lower(x) from unnest(p.roles) x)
    ) w;

    select count(*) into n_own
    from public.submissions s join public.tasks t on t.id = s.task_id
    where t.company_id = p.company_id and s.created_at > since;

    if n_work = 0 and n_own = 0 then
      continue;
    end if;

    body := '<p>Hi ' || public.html_escape(coalesce(nullif(p.first_name, ''), 'there')) || ',</p>';
    if n_own > 0 then
      body := body || '<p><strong>' || n_own || ' new ' || case when n_own = 1 then 'submission' else 'submissions' end
        || ' to your tasks.</strong> <a href="https://tafutakazi.co.ke/my-tasks" style="color:#0E5C45">See them</a></p>';
    end if;
    if n_work > 0 then
      body := body || '<p><strong>' || n_work || ' new ' || case when n_work = 1 then 'piece' else 'pieces' end
        || ' of work in the roles you hire for:</strong></p><ul style="padding-left:20px">' || coalesce(work_lines, '') || '</ul>'
        || case when n_work > 5 then '<p style="color:#5C5C57">And ' || (n_work - 5) || ' more.</p>' else '' end
        || '<p><a href="https://tafutakazi.co.ke/browse" style="color:#0E5C45;font-weight:bold">Watch the work</a></p>';
    end if;

    perform public.send_email(p.email, case when n_own > 0 then 'New submissions to your tasks' else 'New graduate work to watch' end,
      public.email_wrap(body, 'Your daily Tafutakazi digest. <a href="https://tafutakazi.co.ke/account" style="color:#5C5C57">Turn it off</a>'));
    update public.recruiters set digest_sent_at = now() where id = p.id;
    sent := sent + 1;
  end loop;

  -- Graduates: new tasks for the job they want, and what recruiters did with their work.
  for p in
    select g.id, g.track, g.digest_sent_at, g.created_at, u.email::text as email, split_part(pr.full_name, ' ', 1) as first_name
    from public.grads g join public.profiles pr on pr.id = g.id join auth.users u on u.id = g.id
    where g.digest_enabled and pr.role = 'grad'
      and (g.digest_sent_at is null or g.digest_sent_at < now() - interval '20 hours')
    order by g.digest_sent_at nulls first
  loop
    exit when sent >= max_emails;
    since := greatest(coalesce(p.digest_sent_at, p.created_at), now() - interval '7 days');

    select count(*), string_agg(line, '' order by updated_at desc) filter (where rn <= 5)
    into n_tasks, task_lines
    from (
      select t.updated_at, row_number() over (order by t.updated_at desc) as rn,
             '<li>' || public.html_escape(t.title) || ' <span style="color:#5C5C57">· '
               || case when t.company_id is null then 'Practice task' else public.html_escape(coalesce(c.name, 'A company')) end
               || '</span></li>' as line
      from public.tasks t left join public.companies c on c.id = t.company_id
      where t.status = 'live' and t.updated_at > since and lower(t.role) = lower(p.track)
        and not exists (select 1 from public.submissions s where s.task_id = t.id and s.grad_id = p.id)
    ) n;

    select count(*) into n_comments from public.comments cm join public.submissions s on s.id = cm.submission_id
      where s.grad_id = p.id and cm.created_at > since;
    select count(*) into n_thumbs from public.reactions rx join public.submissions s on s.id = rx.submission_id
      where s.grad_id = p.id and rx.created_at > since;
    select count(*) into n_views from public.views v join public.submissions s on s.id = v.submission_id
      where s.grad_id = p.id and v.viewer_id <> p.id and v.created_at > since;

    if n_tasks = 0 and n_comments = 0 and n_thumbs = 0 then
      continue;
    end if;

    body := '<p>Hi ' || public.html_escape(coalesce(nullif(p.first_name, ''), 'there')) || ',</p>';
    if n_comments > 0 or n_thumbs > 0 then
      body := body || '<p><strong>Recruiters looked at your work.</strong> Since your last email: '
        || concat_ws(', ',
             case when n_comments > 0 then n_comments || ' new ' || case when n_comments = 1 then 'comment' else 'comments' end end,
             case when n_thumbs > 0 then n_thumbs || ' thumbs up' end,
             case when n_views > 0 then n_views || ' ' || case when n_views = 1 then 'view' else 'views' end end)
        || '. <a href="https://tafutakazi.co.ke/me" style="color:#0E5C45">Read them</a></p>';
    end if;
    if n_tasks > 0 then
      body := body || '<p><strong>' || n_tasks || ' new ' || public.html_escape(p.track) || ' '
        || case when n_tasks = 1 then 'task' else 'tasks' end || ':</strong></p><ul style="padding-left:20px">' || coalesce(task_lines, '') || '</ul>'
        || '<p><a href="https://tafutakazi.co.ke/tasks" style="color:#0E5C45;font-weight:bold">Pick one</a></p>';
    end if;

    perform public.send_email(p.email,
      case when n_comments > 0 then 'A recruiter commented on your work' when n_thumbs > 0 then 'A recruiter liked your work' else 'New tasks for you' end,
      public.email_wrap(body, 'Your daily Tafutakazi digest. <a href="https://tafutakazi.co.ke/me/profile" style="color:#5C5C57">Turn it off</a>'));
    update public.grads set digest_sent_at = now() where id = p.id;
    sent := sent + 1;
  end loop;

  return sent;
end;
$$;
revoke execute on function public.send_digests(int) from public, anon, authenticated;

select cron.schedule('daily-digests', '0 5 * * *', 'select public.send_digests()');

-- Hires: anyone can see the number, so the homepage can show it once there are hires.
grant execute on function public.hire_count() to anon;
