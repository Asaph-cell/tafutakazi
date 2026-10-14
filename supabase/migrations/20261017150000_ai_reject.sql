-- Doubtful tasks wait for the admin, who is emailed at their own account address (not hello@, which
-- loops back through Email Routing). The admin can reject a task: it's turned off and the recruiter is
-- emailed the reason, and can reply to hello@ if they disagree.

-- Who to tell about a company task: the person who posted it, or else someone at the company.
create function public.task_contact(p_task uuid) returns table (email text, first_name text)
language sql stable security definer set search_path = '' as $$
  select u.email::text, split_part(p.full_name, ' ', 1)
  from public.tasks t
  join public.recruiters r on r.company_id = t.company_id
  join public.profiles p on p.id = r.id
  join auth.users u on u.id = r.id
  where t.id = p_task
  order by (r.id = t.created_by) desc nulls last, p.created_at
  limit 1
$$;

-- Email every admin.
create function public.email_admins(subject text, body text) returns void
language plpgsql security definer set search_path = '' as $$
declare
  a record;
begin
  for a in select u.email::text as email from public.profiles p join auth.users u on u.id = p.id where p.role = 'admin' loop
    perform public.send_email(a.email, subject, public.email_wrap(body, 'Sent to Tafutakazi admins.'));
  end loop;
end;
$$;

create function public.ai_tell_admin(p_task uuid, why text, ai_was_unsure boolean) returns void
language plpgsql security definer set search_path = '' as $$
declare
  t record;
begin
  select tk.title, tk.role, c.name as company into t
  from public.tasks tk left join public.companies c on c.id = tk.company_id
  where tk.id = p_task and tk.status = 'checking';
  if t.title is null then
    return;
  end if;
  perform public.email_admins(
    (case when ai_was_unsure then 'Check this task: ' else 'Check this task by hand: ' end) || t.title,
    '<p><strong>' || public.html_escape(t.title) || '</strong><br>'
      || public.html_escape(coalesce(t.company, '?')) || ' · ' || public.html_escape(t.role) || '</p>'
      || (case when ai_was_unsure
           then '<p>The automatic check wasn''t happy with it:</p><p style="border-left:3px solid #0E5C45;padding-left:12px">' || public.html_escape(why) || '</p>'
           else '<p>The automatic check couldn''t look at it, so it''s waiting for you.</p><p style="color:#5C5C57;font-size:14px">' || public.html_escape(why) || '</p>' end)
      || '<p>Approve it, or reject it and the recruiter gets the reason by email.</p>'
      || '<p><a href="https://tafutakazi.co.ke/admin" style="color:#0E5C45;font-weight:bold">Open the admin page</a></p>');
end;
$$;

create or replace function public.process_ai_checks() returns void
language plpgsql security definer set search_path = '' as $$
declare
  c record;
  r record;
  answer jsonb;
  v text;
  why text;
  req bigint;
begin
  for c in select * from public.ai_checks where status = 'sent' loop
    select * into r from net._http_response where id = c.request_id;

    if r.id is null then
      if c.sent_at < now() - interval '15 minutes' then
        update public.ai_checks set status = 'failed', reason = 'No answer from Gemini', answered_at = now() where id = c.id;
        perform public.ai_tell_admin(c.task_id, 'Gemini didn''t answer.', false);
      end if;
      continue;
    end if;

    -- Busy, slow or unreachable: try again with the other model.
    if r.status_code is distinct from 200 and coalesce(r.status_code, 0) not in (400, 401, 403) and c.attempts < 5 then
      begin
        req := public.ai_send_task(c.task_id, public.ai_model(c.attempts + 1));
      exception when others then
        req := null;
      end;
      if req is not null then
        update public.ai_checks set request_id = req, attempts = c.attempts + 1, model = public.ai_model(c.attempts + 1),
          sent_at = now(), reason = 'Retrying: ' || coalesce(r.status_code::text, 'no answer')
        where id = c.id;
        continue;
      end if;
    end if;

    begin
      if r.status_code is distinct from 200 then
        raise exception 'Gemini returned %: %', coalesce(r.status_code::text, 'nothing'), left(coalesce(r.content, r.error_msg, ''), 300);
      end if;
      answer := ((r.content::jsonb) #>> '{candidates,0,content,parts,0,text}')::jsonb;
      v := lower(answer ->> 'verdict');
      why := left(coalesce(answer ->> 'reason', ''), 400);
      if v is null or v not in ('pass', 'review') then
        raise exception 'Unclear answer: %', left(answer::text, 300);
      end if;
    exception when others then
      update public.ai_checks set status = 'failed', reason = left(sqlerrm, 400), answered_at = now() where id = c.id;
      perform public.ai_tell_admin(c.task_id, left(sqlerrm, 300), false);
      continue;
    end;

    update public.ai_checks set status = 'done', verdict = v, reason = why, answered_at = now() where id = c.id;

    if v = 'pass' then
      update public.tasks set status = 'live', check_notes = null where id = c.task_id and status = 'checking';
    else
      perform public.ai_tell_admin(c.task_id, why, true);
    end if;
  end loop;
end;
$$;

-- Admin rejects a task: turn it off, keep the reason on it, and email the recruiter.
create function public.reject_task(p_task uuid, p_reason text) returns void
language plpgsql security definer set search_path = '' as $$
declare
  t_title text;
  who record;
begin
  if not public.is_admin() then
    raise exception 'Only admins can reject tasks';
  end if;
  if char_length(trim(coalesce(p_reason, ''))) < 5 then
    raise exception 'Give the recruiter a reason';
  end if;
  update public.tasks set status = 'off', check_notes = 'Not approved: ' || trim(p_reason)
    where id = p_task and company_id is not null
    returning title into t_title;
  if t_title is null then
    raise exception 'Task not found';
  end if;

  select * into who from public.task_contact(p_task);
  if who.email is not null then
    perform public.send_email(who.email, 'Your task wasn''t approved: ' || t_title,
      public.email_wrap(
        '<p>Hi ' || public.html_escape(coalesce(nullif(who.first_name, ''), 'there')) || ',</p>'
        || '<p>We couldn''t put <strong>' || public.html_escape(t_title) || '</strong> live, so it''s been turned off. Graduates haven''t seen it.</p>'
        || '<p><strong>Why:</strong> ' || public.html_escape(trim(p_reason)) || '</p>'
        || '<p>Tasks on Tafutakazi need to be a short sample of the real job that a fresh graduate can finish in 4 hours or less. '
        || 'They can''t ask graduates to do live work for your business, sell for you, pay anything, share ID or M-Pesa details, '
        || 'or contact you off the site.</p>'
        || '<p><a href="https://tafutakazi.co.ke/post" style="color:#0E5C45;font-weight:bold">Post a corrected task</a></p>'
        || '<p>If you think we got this wrong, reply to this email.</p>',
        'You''re getting this because you posted a task on Tafutakazi.'));
  end if;
end;
$$;

revoke execute on function public.task_contact(uuid), public.email_admins(text, text), public.ai_tell_admin(uuid, text, boolean)
  from public, anon, authenticated;
revoke execute on function public.reject_task(uuid, text) from public, anon;
grant execute on function public.reject_task(uuid, text) to authenticated;
