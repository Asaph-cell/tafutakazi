import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthShell } from '../components/AuthShell'
import { Seo } from '../components/Seo'
import { Button, Field, Notice, Select } from '../components/ui'
import { gradYears, normRole } from '../lib/lists'
import { RoleInput } from '../components/RoleInput'
import { supabase, supabaseConfigured } from '../lib/supabase'

export default function GradSignup() {
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    const f = new FormData(e.currentTarget)
    const email = String(f.get('email')).trim()
    if (!supabaseConfigured) {
      setError('The site is not connected to its database yet.')
      return
    }
    setBusy(true)
    const { data, error } = await supabase.auth.signUp({
      email,
      password: String(f.get('password')),
      options: {
        emailRedirectTo: `${window.location.origin}/me`,
        data: {
          role: 'grad',
          full_name: String(f.get('name')).trim(),
          course: String(f.get('course')).trim(),
          institution: String(f.get('institution')).trim(),
          grad_year: String(f.get('year')),
          track: normRole(String(f.get('track'))),
        },
      },
    })
    setBusy(false)
    if (error) {
      setError(error.message)
      return
    }
    if (data.session) navigate('/me')
    else navigate('/check-email', { state: { email } })
  }

  return (
    <AuthShell
      title="Show your work. Get hired."
      intro="Do short tasks from Kenyan companies. Recruiters see what you can do, not just your CV."
    >
      <Seo title="Sign up as a fresh graduate" description="Just graduated with no work experience? Join free, do short tasks from Kenyan companies and get seen by people who are hiring." />
      <form onSubmit={onSubmit} className="flex max-w-[520px] flex-col gap-4">
        <Field id="name" name="name" label="Full name" autoComplete="name" required minLength={2} maxLength={80} />
        <Field id="email" name="email" type="email" label="Email" autoComplete="email" required
          hint="New tasks and recruiter comments come here. We'll send a link to confirm it." />
        <Field id="password" name="password" type="password" label="Password" autoComplete="new-password" required minLength={8}
          hint="At least 8 characters." />
        <Field id="course" name="course" label="What did you study?" placeholder="e.g. BSc Statistics" required />
        <div className="flex flex-wrap gap-4">
          <div className="flex-[2_1_220px]">
            <Field id="institution" name="institution" label="University or college" placeholder="e.g. JKUAT" required />
          </div>
          <div className="flex-[1_1_140px]">
            <Select id="year" name="year" label="Year you finished" required defaultValue={String(gradYears()[0])}>
              {gradYears().map((y) => <option key={y}>{y}</option>)}
            </Select>
          </div>
        </div>
        <RoleInput id="track" name="track" label="What job do you want?" required />

        <label className="mt-1 flex items-start gap-2.5 text-[15px]">
          <input type="checkbox" required className="mt-0.5 h-5 w-5 accent-brand" />
          <span>
            I agree to the <Link to="/terms">Terms</Link> and <Link to="/privacy">Privacy Policy</Link>, and I'll keep
            other people's work confidential.
          </span>
        </label>

        {error && <Notice>{error}</Notice>}
        <Button type="submit" disabled={busy} className="mt-1">{busy ? 'Creating your account…' : 'Create account'}</Button>

        <div className="flex flex-col gap-1 text-[15px] text-muted">
          <span>Already have an account? <Link to="/login">Log in</Link></span>
          <span>Hiring? <Link to="/hiring">Recruiter sign up</Link></span>
        </div>
      </form>
    </AuthShell>
  )
}
