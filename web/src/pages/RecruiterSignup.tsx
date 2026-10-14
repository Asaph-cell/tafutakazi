import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthShell } from '../components/AuthShell'
import { Seo } from '../components/Seo'
import { RolePicker } from '../components/RolePicker'
import { Button, Field, Notice, Select } from '../components/ui'
import { COMPANY_SIZES, INDUSTRIES, isCompanyEmail } from '../lib/lists'
import { supabase, supabaseConfigured } from '../lib/supabase'

const steps = [
  "Pick the role you're hiring for",
  'Watch graduates explain their work and preview it',
  'Invite the best to interview, or post your own task',
]

export default function RecruiterSignup() {
  const navigate = useNavigate()
  const [roles, setRoles] = useState<string[]>([])
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    const f = new FormData(e.currentTarget)
    if (roles.length === 0) {
      setError('Add at least one role you hire for.')
      return
    }
    if (!supabaseConfigured) {
      setError('The site is not connected to its database yet.')
      return
    }
    setBusy(true)
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password: String(f.get('password')),
      options: {
        emailRedirectTo: `${window.location.origin}/browse`,
        data: {
          role: 'recruiter',
          full_name: String(f.get('name')).trim(),
          job_title: String(f.get('title')).trim(),
          company: String(f.get('company')).trim(),
          company_size: String(f.get('size')),
          industry: String(f.get('industry')),
          website: String(f.get('website')).trim(),
          linkedin: String(f.get('linkedin')).trim(),
          social: String(f.get('social')).trim(),
          roles,
        },
      },
    })
    setBusy(false)
    if (error) {
      setError(error.message)
      return
    }
    if (data.session) navigate('/browse')
    else navigate('/check-email', { state: { email: email.trim() } })
  }

  const companyEmail = email.includes('@') && isCompanyEmail(email)

  return (
    <AuthShell
      title="Hire from real work, not CVs."
      intro="Watch fresh graduates explain work they actually did. Free to join."
      aside={
        <div className="sticky top-8 flex flex-col gap-3 pt-24">
          {steps.map((s, k) => (
            <div key={s} className="flex items-baseline gap-3">
              <span className="font-semibold text-brand">{k + 1}</span>
              <span>{s}</span>
            </div>
          ))}
        </div>
      }
    >
      <Seo title="Hire fresh graduates in Kenya" description="Post a short task for the role and watch graduates explain work they actually did. Hire from real work, not CVs. Free for employers." />
      <form onSubmit={onSubmit} className="flex max-w-[560px] flex-col gap-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-[1_1_200px]"><Field id="name" name="name" label="Your name" autoComplete="name" required minLength={2} /></div>
          <div className="flex-[1_1_200px]"><Field id="title" name="title" label="Your job title" placeholder="e.g. HR Manager" /></div>
        </div>
        <Field id="email" name="email" type="email" label="Work email" autoComplete="email" required
          value={email} onChange={(e) => setEmail(e.target.value)} hint="We'll send a link to confirm it." />
        <Field id="password" name="password" type="password" label="Password" autoComplete="new-password" required minLength={8}
          hint="At least 8 characters." />
        <div className="flex flex-wrap gap-4">
          <div className="flex-[2_1_220px]"><Field id="company" name="company" label="Company" required minLength={2} /></div>
          <div className="flex-[1_1_140px]">
            <Select id="size" name="size" label="Company size" defaultValue="11–50">
              {COMPANY_SIZES.map((s) => <option key={s}>{s}</option>)}
            </Select>
          </div>
        </div>
        <Select id="industry" name="industry" label="Industry" required defaultValue="">
          <option value="" disabled>Choose one</option>
          {INDUSTRIES.map((s) => <option key={s}>{s}</option>)}
        </Select>

        <fieldset className="m-0 flex flex-col gap-3 border-0 p-0">
          <legend className="mb-1 p-0 font-semibold">Where can graduates find your company online?</legend>
          <span className="text-[13px] text-muted">
            {companyEmail
              ? "Your company email already counts. Links are optional but help graduates trust you."
              : 'Add at least one to post tasks. It is shown on your tasks so graduates know you are real.'}
          </span>
          <Field id="website" name="website" label="Company website" placeholder="e.g. kamaulogistics.co.ke" />
          <Field id="linkedin" name="linkedin" label="LinkedIn page" placeholder="linkedin.com/company/…" />
          <Field id="social" name="social" label="Business page on Facebook, Instagram or TikTok" placeholder="e.g. instagram.com/yourshop" />
        </fieldset>

        <RolePicker value={roles} onChange={setRoles} />

        <label className="mt-1 flex items-start gap-2.5 text-[15px]">
          <input type="checkbox" required className="mt-0.5 h-5 w-5 accent-brand" />
          <span>
            I agree to the <Link to="/terms">Terms</Link> and <Link to="/privacy">Privacy Policy</Link>. I'll use
            graduates' work only to assess them, and I'm responsible for anything shared from my account.
          </span>
        </label>

        {error && <Notice>{error}</Notice>}
        <Button type="submit" disabled={busy}>{busy ? 'Creating your account…' : 'Create recruiter account'}</Button>
        <span className="text-[13px] text-muted">
          You can browse straight away. To post tasks you need a company email, or one of the links above.
        </span>
        <span className="text-[15px] text-muted">Already have an account? <Link to="/login">Log in</Link></span>
      </form>
    </AuthShell>
  )
}
