-- Instant email to a graduate when a company invites them to interview.
-- Sent from the database through Resend (pg_net), so nothing else needs hosting.
-- One-time setup: store a Resend API key in the Vault (run once, with your own key):
--   select vault.create_secret('re_YOUR_KEY', 'resend_api_key');

create extension if not exists pg_net;

create function public.html_escape(t text) returns text
language sql immutable as $$
  select replace(replace(replace(replace(coalesce(t, ''), '&', '&amp;'), '<', '&lt;'), '>', '&gt;'), '"', '&quot;')
$$;

create function public.email_invite() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  key text;
  grad_email text;
  grad_name text;
  recruiter_email text;
  recruiter_name text;
  company text;
  task_title text;
  task_role text;
  first text;
  html text;
begin
  select decrypted_secret into key from vault.decrypted_secrets where name = 'resend_api_key' limit 1;
  if key is null then
    return new; -- email not set up yet; the invite still saves
  end if;

  select u.email, p.full_name, t.title, t.role
    into grad_email, grad_name, task_title, task_role
  from public.submissions s
  join auth.users u on u.id = s.grad_id
  join public.profiles p on p.id = s.grad_id
  join public.tasks t on t.id = s.task_id
  where s.id = new.submission_id;

  select u.email, p.full_name into recruiter_email, recruiter_name
  from auth.users u join public.profiles p on p.id = u.id
  where u.id = new.recruiter_id;

  select name into company from public.companies where id = new.company_id;
  first := split_part(grad_name, ' ', 1);

  html :=
    '<div style="font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.55;color:#141414;max-width:560px">'
    || '<p style="font-size:20px;font-weight:bold;margin:0 0 16px">tafutakazi<span style="color:#0E5C45">.</span></p>'
    || '<p>Hi ' || public.html_escape(first) || ',</p>'
    || '<p><strong>' || public.html_escape(company) || ' has invited you to interview.</strong></p>'
    || '<p>They looked at your work on <strong>"' || public.html_escape(task_title) || '"</strong> and want to talk to you about a '
    || public.html_escape(task_role) || ' role.</p>'
    || '<p>' || public.html_escape(recruiter_name) || ' will contact you at this email address. You can also reply to this email '
    || 'and it goes straight to them.</p>'
    || '<p style="margin:24px 0 8px"><strong>Before the interview</strong></p>'
    || '<ul style="margin:0;padding-left:20px"><li>Reply within a day if you can.</li>'
    || '<li>Be ready to walk them through your task and the choices you made.</li>'
    || '<li>Tafutakazi never charges graduates. If anyone asks you for money, report it to hello@tafutakazi.co.ke.</li></ul>'
    || '<p style="margin-top:24px"><a href="https://tafutakazi.co.ke/me" style="color:#0E5C45">See it on Tafutakazi</a></p>'
    || '<p style="color:#5C5C57;font-size:13px;margin-top:32px">You are getting this because a company invited you to interview '
    || 'on Tafutakazi. Interview invites are always sent, even if daily emails are off.</p>'
    || '</div>';

  perform net.http_post(
    url := 'https://api.resend.com/emails',
    headers := jsonb_build_object('Authorization', 'Bearer ' || key, 'Content-Type', 'application/json'),
    body := jsonb_build_object(
      'from', 'Tafutakazi <hello@tafutakazi.co.ke>',
      'to', jsonb_build_array(grad_email),
      'reply_to', recruiter_email,
      'subject', company || ' invited you to interview',
      'html', html
    )
  );
  return new;
exception when others then
  raise warning 'invite email not sent: %', sqlerrm;
  return new; -- never block the invite because of email trouble
end;
$$;

create trigger email_invite
  after insert on public.invites
  for each row execute function public.email_invite();

revoke execute on function public.email_invite() from public, anon, authenticated;
