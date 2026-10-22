# Supabase sign-in emails

Supabase sends these itself, so they are set in its dashboard, not in the database.
In Supabase: **Authentication → Emails (Templates)**. For each one, paste the subject and the HTML from the file.

| Template in Supabase | Subject | File |
|---|---|---|
| Confirm signup | Confirm your email for Tafutakazi | [confirm-signup.html](confirm-signup.html) |
| Reset password | Reset your Tafutakazi password | [reset-password.html](reset-password.html) |
| Magic link | Your Tafutakazi log-in link | [magic-link.html](magic-link.html) |
| Change email address | Confirm your new email for Tafutakazi | [change-email.html](change-email.html) |

The logo loads from https://tafutakazi.co.ke/brand/email-logo.png, so it shows once the site is live.
