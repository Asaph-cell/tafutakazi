-- Emails in the new look: the logo on a deep green band with a gold rule, the message on a white card,
-- and the footer underneath. Every email the database sends goes through email_wrap, so this one change
-- puts the logo in all of them. Tables and inline styles, because that's what email apps understand.
-- The logo is a PNG (email apps block SVG): web/public/brand/email-logo.png, shown at 220 x 40.

create or replace function public.email_wrap(body text, footer text) returns text
language sql immutable as $$
  select
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F6F6F3;margin:0;padding:0">'
    || '<tr><td align="center" style="padding:24px 12px">'
    || '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;border-collapse:separate">'
    -- Header: logo on deep green, gold rule beneath.
    || '<tr><td style="background:#043D2C;padding:20px 28px;border-radius:12px 12px 0 0">'
    ||   '<a href="https://tafutakazi.co.ke" style="text-decoration:none;color:#FFFFFF;font-family:Arial,Helvetica,sans-serif;font-size:22px;font-weight:bold">'
    ||   '<img src="https://tafutakazi.co.ke/brand/email-logo.png" width="220" height="40" alt="tafutakazi" style="display:block;border:0;outline:none;width:220px;height:40px;color:#FFFFFF">'
    ||   '</a></td></tr>'
    || '<tr><td style="background:#F2B632;height:3px;line-height:3px;font-size:0">&nbsp;</td></tr>'
    -- The message.
    || '<tr><td style="background:#FFFFFF;padding:28px;border:1px solid #E3E3DE;border-top:0;border-radius:0 0 12px 12px;'
    ||   'font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.6;color:#141414">'
    || body
    || '</td></tr>'
    -- Footer.
    || '<tr><td style="padding:18px 8px 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.5;color:#5C5C57">'
    || footer
    || '<br><span style="color:#8A8A84">Tafutakazi · Breaking Kenya''s unemployment loop · <a href="https://tafutakazi.co.ke" style="color:#0A6B4D">tafutakazi.co.ke</a></span>'
    || '</td></tr>'
    || '</table></td></tr></table>'
$$;

-- Links and buttons inside the emails used the old green. Swap it for the new one in every function that has it.
do $$
declare
  f record;
begin
  for f in
    select p.oid from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.prosrc like '%#0E5C45%'
  loop
    execute replace(pg_get_functiondef(f.oid), '#0E5C45', '#0A6B4D');
  end loop;
end;
$$;
