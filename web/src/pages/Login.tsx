import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthShell } from '../components/AuthShell'
import { Seo } from '../components/Seo'
import { Button, Field, Notice } from '../components/ui'
import { homeFor, type Role } from '../lib/auth'
import { supabase } from '../lib/supabase'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setInfo('')
    setBusy(true)
    const password = String(new FormData(e.currentTarget).get('password'))
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    if (error) {
      setBusy(false)
      setError(error.message === 'Invalid login credentials' ? 'That email and password don’t match.' : error.message)
      return
    }
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).maybeSingle()
    setBusy(false)
    navigate(homeFor((profile?.role as Role | undefined) ?? undefined))
  }

  async function forgot() {
    setError('')
    if (!email.includes('@')) {
      setError('Type your email above first.')
      return
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) setError(error.message)
    else setInfo('If that email has an account, a reset link is on its way.')
  }

  return (
    <AuthShell title="Welcome back">
      <Seo title="Log in" />
      <form onSubmit={onSubmit} className="flex max-w-[440px] flex-col gap-4">
        <Field id="email" name="email" type="email" label="Email" autoComplete="username email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <Field id="password" name="password" type="password" label="Password" autoComplete="current-password" required />
        {error && <Notice>{error}</Notice>}
        {info && <Notice tone="info">{info}</Notice>}
        <Button type="submit" busy={busy} busyLabel="Logging in…">Log in</Button>
        <button type="button" onClick={forgot} className="press min-h-11 cursor-pointer self-start border-0 bg-transparent p-0 text-[15px] text-brand underline">
          Forgot your password?
        </button>
        <div className="flex flex-col gap-1 text-[15px] text-muted">
          <span>New here? <Link to="/join">Sign up as a graduate</Link></span>
          <span>Hiring? <Link to="/hiring">Sign up as a recruiter</Link></span>
        </div>
      </form>
    </AuthShell>
  )
}
