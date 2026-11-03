-- Welcome email for new graduates, sent once, when they confirm their email address
-- (so it never goes to an address that was typed wrong).

-- Sends the welcome to one graduate. Also used once by hand for graduates who joined before this existed.
create or replace function public.send_welcome(uid uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  to_email text;
  grad_name text;
begin
  select u.email, p.full_name into to_email, grad_name
  from auth.users u join public.profiles p on p.id = u.id
  where u.id = uid and p.role = 'grad';
  if not found then
    return;
  end if;
  perform public.send_email(to_email, 'Welcome to Tafutakazi. Your first task is ready',
    public.email_wrap(
      '<p style="margin:0 0 16px">Hi ' || public.html_escape(split_part(grad_name, ' ', 1)) || ',</p>'
      || '<p style="margin:0 0 16px">Welcome to Tafutakazi. We built this because employers keep asking for experience you can''t get without a first job.</p>'
      || '<p style="margin:0 0 8px">Here, you show what you can do instead:</p>'
      || '<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 16px">'
      || '<tr><td valign="top" style="padding:0 12px 8px 0;font-weight:bold;color:#0A6B4D">1</td><td style="padding:0 0 8px">Pick a short task for your field.</td></tr>'
      || '<tr><td valign="top" style="padding:0 12px 8px 0;font-weight:bold;color:#0A6B4D">2</td><td style="padding:0 0 8px">Do it in a few hours, then record a 2 to 3 minute video explaining your work.</td></tr>'
      || '<tr><td valign="top" style="padding:0 12px 0 0;font-weight:bold;color:#0A6B4D">3</td><td>It goes on your profile, where employers can see it and invite you to interview.</td></tr>'
      || '</table>'
      || '<p style="margin:0 0 24px"><strong>Start your first task today.</strong> Everything you finish stays on your profile, so when an employer joins, your work is already there for them to see.</p>'
      || '<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px"><tr><td style="background:#0A6B4D;border-radius:8px">'
      || '<a href="https://tafutakazi.co.ke/tasks" style="display:inline-block;padding:13px 24px;color:#FFFFFF;font-weight:bold;text-decoration:none">See the tasks</a>'
      || '</td></tr></table>'
      || '<p style="margin:0">While you''re there, try our free <a href="https://tafutakazi.co.ke/skills" style="color:#0A6B4D">skill tracks</a>, which show what each job needs, '
      || 'and the <a href="https://tafutakazi.co.ke/me/cv" style="color:#0A6B4D">CV builder</a>, which puts your proven work on a professional CV.</p>',
      'You are getting this because you signed up on Tafutakazi.'));
end;
$$;
revoke execute on function public.send_welcome(uuid) from public, anon, authenticated;

create or replace function public.email_welcome() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.email_confirmed_at is not null and (tg_op = 'INSERT' or old.email_confirmed_at is null) then
    perform public.send_welcome(new.id);
  end if;
  return new;
end;
$$;
revoke execute on function public.email_welcome() from public, anon, authenticated;

-- Named to run after on_auth_user_created, which creates the profile.
drop trigger if exists welcome_email_on_confirm on auth.users;
create trigger welcome_email_on_confirm
  after insert or update of email_confirmed_at on auth.users
  for each row execute function public.email_welcome();
