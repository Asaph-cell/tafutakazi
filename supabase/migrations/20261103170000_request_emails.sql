-- Task requests by email: admins hear about each new request straight away, and the graduate hears
-- when Tafutakazi publishes a task for them.

create function public.email_request_new() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  grad_name text;
  course text;
begin
  select p.full_name, g.course into grad_name, course
  from public.profiles p join public.grads g on g.id = p.id where p.id = new.grad_id;
  perform public.email_admins('New task request: ' || new.role,
    '<p style="margin:0 0 16px"><strong>' || public.html_escape(coalesce(grad_name, 'A graduate')) || '</strong>'
    || coalesce(' (' || public.html_escape(course) || ')', '') || ' asked for a practice task.</p>'
    || '<p style="margin:0 0 4px"><strong>Role:</strong> ' || public.html_escape(new.role) || '</p>'
    || case when cardinality(new.tools) > 0 then '<p style="margin:0 0 4px"><strong>Tools:</strong> ' || public.html_escape(array_to_string(new.tools, ', ')) || '</p>' else '' end
    || '<p style="margin:12px 0 24px;padding:12px 16px;background:#F6F6F3;border-radius:8px">' || public.html_escape(new.details) || '</p>'
    || '<p style="margin:0"><a href="https://tafutakazi.co.ke/admin/requests" style="color:#0A6B4D;font-weight:bold">Answer the request</a></p>');
  return new;
end;
$$;
revoke execute on function public.email_request_new() from public, anon, authenticated;

create trigger email_request_new
  after insert on public.task_requests
  for each row execute function public.email_request_new();

-- Sent once, when a request is answered with a task graduates can already see.
create function public.email_request_answered() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  grad_email text;
  grad_name text;
  task_title text;
begin
  if new.status <> 'done' or old.status = 'done' or new.task_id is null then
    return new;
  end if;
  select title into task_title from public.tasks where id = new.task_id and status = 'live';
  if task_title is null then
    return new;
  end if;
  select u.email, p.full_name into grad_email, grad_name
  from auth.users u join public.profiles p on p.id = u.id where u.id = new.grad_id;
  perform public.send_email(grad_email, 'We made a task for you: ' || task_title,
    public.email_wrap(
      '<p style="margin:0 0 16px">Hi ' || public.html_escape(split_part(grad_name, ' ', 1)) || ',</p>'
      || '<p style="margin:0 0 16px">You asked for a task to show your ' || public.html_escape(new.role) || ' skills. We have made one for you:</p>'
      || '<p style="margin:0 0 24px;font-size:20px;font-weight:bold">' || public.html_escape(task_title) || '</p>'
      || '<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px"><tr><td style="background:#0A6B4D;border-radius:8px">'
      || '<a href="https://tafutakazi.co.ke/tasks/' || new.task_id || '" style="display:inline-block;padding:13px 24px;color:#FFFFFF;font-weight:bold;text-decoration:none">Start the task</a>'
      || '</td></tr></table>'
      || '<p style="margin:0">When you finish it, the work goes on your profile, where employers can see it.</p>',
      'You are getting this because you asked for a task on Tafutakazi.'));
  return new;
end;
$$;
revoke execute on function public.email_request_answered() from public, anon, authenticated;

create trigger email_request_answered
  after update of status on public.task_requests
  for each row execute function public.email_request_answered();
