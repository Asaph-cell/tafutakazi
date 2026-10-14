import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AuthShell } from '../components/AuthShell'
import { Seo } from '../components/Seo'
import { Button, Field, LinkButton, Notice } from '../components/ui'
import { supabase } from '../lib/supabase'

export function CheckEmail() {
  const email = (useLocation().state as { email?: string } | null)?.email
  return (
    <AuthShell
      title="Check your email"
      intro={
        <>
          We sent a confirmation link to {email ? <strong>{email}</strong> : 'your email'}. Open it to finish
          signing up. It can take a minute, and sometimes lands in spam.
        </>
      }
    >
      <Link to="/login">Back to log in</Link>
    </AuthShell>
  )
}

export function ResetPassword() {
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setBusy(true)
    const password = String(new FormData(e.currentTarget).get('password'))
    const { error } = await supabase.auth.updateUser({ password })
    setBusy(false)
    if (error) setError(error.message)
    else navigate('/login')
  }

  return (
    <AuthShell title="Choose a new password">
      <form onSubmit={onSubmit} className="flex max-w-[440px] flex-col gap-4">
        <Field id="password" name="password" type="password" label="New password" autoComplete="new-password" required minLength={8} hint="At least 8 characters." />
        {error && <Notice>{error}</Notice>}
        <Button type="submit" disabled={busy}>Save password</Button>
      </form>
    </AuthShell>
  )
}

export function NotFound() {
  return (
    <AuthShell title="This page doesn't exist" intro="The link may be old or mistyped.">
      <Seo title="Page not found" noindex />
      <LinkButton to="/" className="self-start">Go to the homepage</LinkButton>
    </AuthShell>
  )
}
