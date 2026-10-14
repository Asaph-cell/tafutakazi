-- The free Gemini models are sometimes busy (503) or slow. Try again, up to 5 times,
-- switching between the main model and the lighter one. Bad key or bad request: give up straight away.

alter table public.ai_checks
  add column attempts int not null default 1,
  add column model text;

create function public.ai_send_task(p_task uuid, p_model text) returns bigint
language plpgsql security definer set search_path = '' as $$
declare
  key text;
  t record;
begin
  select decrypted_secret into key from vault.decrypted_secrets where name = 'gemini_api_key' limit 1;
  select tk.*, c.name as company_name into t
  from public.tasks tk left join public.companies c on c.id = tk.company_id
  where tk.id = p_task;
  if key is null or t.id is null or t.company_id is null then
    return null;
  end if;

  return net.http_post(
    url := 'https://generativelanguage.googleapis.com/v1beta/models/' || p_model || ':generateContent',
    headers := jsonb_build_object('x-goog-api-key', key, 'Content-Type', 'application/json'),
    body := jsonb_build_object(
      'systemInstruction', jsonb_build_object('parts', jsonb_build_array(jsonb_build_object('text', public.ai_task_prompt()))),
      'contents', jsonb_build_array(jsonb_build_object('role', 'user', 'parts', jsonb_build_array(jsonb_build_object('text',
        'Company: ' || coalesce(t.company_name, '?') || ' (' || coalesce(t.industry, '?') || ')' || chr(10)
        || 'Role: ' || t.role || chr(10)
        || 'Time the company estimates: ' || t.minutes_estimate || ' minutes' || chr(10)
        || 'Title: ' || t.title || chr(10)
        || coalesce('Openings: ' || t.openings || chr(10), '')
        || coalesce('Location: ' || t.location || chr(10), '')
        || coalesce('Salary: ' || t.salary_range || chr(10), '')
        || coalesce('Start: ' || t.start_note || chr(10), '')
        || '--- Task instructions ---' || chr(10) || t.instructions)))),
      'generationConfig', jsonb_build_object('responseMimeType', 'application/json', 'temperature', 0)
    ),
    timeout_milliseconds := 30000
  );
end;
$$;

-- Main model, or the one named in Vault as 'gemini_model'. The lighter one is the fallback.
create function public.ai_model(attempt int) returns text
language sql stable security definer set search_path = '' as $$
  select case when attempt % 2 = 0 then 'gemini-flash-lite-latest'
              else coalesce((select decrypted_secret from vault.decrypted_secrets where name = 'gemini_model' limit 1), 'gemini-flash-latest') end
$$;

create or replace function public.ask_ai_about_task(p_task uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  req bigint;
begin
  req := public.ai_send_task(p_task, public.ai_model(1));
  if req is not null then
    insert into public.ai_checks (task_id, request_id, model) values (p_task, req, public.ai_model(1));
  end if;
exception when others then
  raise warning 'ai check not sent: %', sqlerrm;
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
  title text;
  req bigint;
begin
  for c in select * from public.ai_checks where status = 'sent' loop
    select * into r from net._http_response where id = c.request_id;

    if r.id is null then
      if c.sent_at < now() - interval '15 minutes' then
        update public.ai_checks set status = 'failed', reason = 'No answer from Gemini', answered_at = now() where id = c.id;
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
      continue;
    end;

    update public.ai_checks set status = 'done', verdict = v, reason = why, answered_at = now() where id = c.id;

    if v = 'pass' then
      update public.tasks set status = 'live', check_notes = null where id = c.task_id and status = 'checking';
    else
      select tk.title into title from public.tasks tk where tk.id = c.task_id and tk.status = 'checking';
      if title is not null then
        perform public.send_email('hello@tafutakazi.co.ke', 'A task needs your check: ' || title,
          public.email_wrap('<p>The automatic check wasn''t sure about <strong>' || public.html_escape(title) || '</strong>.</p>'
            || '<p>' || public.html_escape(why) || '</p>'
            || '<p><a href="https://tafutakazi.co.ke/admin" style="color:#0E5C45;font-weight:bold">Open the admin page</a></p>',
            'Sent to the Tafutakazi admin.'));
      end if;
    end if;
  end loop;
end;
$$;

revoke execute on function public.ai_send_task(uuid, text), public.ai_model(int) from public, anon, authenticated;
