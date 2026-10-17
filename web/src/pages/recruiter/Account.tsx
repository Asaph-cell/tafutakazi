import { useState, type FormEvent } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { RecruiterLayout } from '../../components/RecruiterLayout'
import { SectionTitle } from '../../components/GradLayout'
import { RolePicker } from '../../components/RolePicker'
import { Button, Field, Notice, Select, SkeletonPage } from '../../components/ui'
import { useAuth } from '../../lib/auth'
import { COMPANY_SIZES, INDUSTRIES } from '../../lib/lists'
import { useRecruiter } from '../../lib/recruiter'
import { toast } from '../../lib/toast'
import { supabase } from '../../lib/supabase'

export default function Account() {
  const { session, signOut } = useAuth()
  const queryClient = useQueryClient()
  const { data: me } = useRecruiter()
  const [roles, setRoles] = useState<string[] | null>(null)
  const [saved, setSaved] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  if (!me?.company || !session) return <RecruiterLayout><SkeletonPage cards={2} /></RecruiterLayout>
  const company = me.company
  const currentRoles = roles ?? me.roles

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaved('')
    setError('')
    const f = new FormData(e.currentTarget)
    const clean = (k: string) => String(f.get(k)).trim() || null
    setSaving(true)
    const [a, b] = await Promise.all([
      supabase.from('companies').update({
        name: String(f.get('company')).trim(),
        size: String(f.get('size')),
        industry: String(f.get('industry')),
        website: clean('website'),
        linkedin: clean('linkedin'),
        social: clean('social'),
      }).eq('id', company.id),
      supabase.from('recruiters').update({ job_title: clean('title'), roles: currentRoles }).eq('id', session!.user.id),
    ])
    setSaving(false)
    if (a.error || b.error) return setError("Couldn't save. Try again.")
    await queryClient.invalidateQueries()
    toast('Saved')
  }

  async function toggleDigest() {
    await supabase.from('recruiters').update({ digest_enabled: !me!.digest_enabled }).eq('id', session!.user.id)
    queryClient.invalidateQueries({ queryKey: ['recruiter'] })
  }

  return (
    <RecruiterLayout>
      <h1 className="m-0 text-[30px] font-bold tracking-[-0.03em] sm:text-[34px]">Account</h1>
      <form onSubmit={onSubmit} className="flex max-w-[640px] flex-col gap-5">
        <SectionTitle>Your company</SectionTitle>
        <div className="flex flex-wrap gap-4">
          <div className="flex-[2_1_240px]"><Field id="company" name="company" label="Company" defaultValue={company.name} required minLength={2} /></div>
          <div className="flex-[1_1_140px]">
            <Select id="size" name="size" label="Size" defaultValue={company.size ?? '11–50'}>
              {COMPANY_SIZES.map((s) => <option key={s}>{s}</option>)}
            </Select>
          </div>
        </div>
        <Select id="industry" name="industry" label="Industry" defaultValue={company.industry}>
          {INDUSTRIES.map((s) => <option key={s}>{s}</option>)}
        </Select>
        <Field id="title" name="title" label="Your job title" defaultValue={me.job_title ?? ''} />

        <fieldset className="m-0 flex flex-col gap-3 border-0 p-0">
          <legend className="mb-1 p-0 font-semibold">Where can graduates find your company online?</legend>
          <span className="text-[13px] text-muted">
            {company.email_domain
              ? `Your company email (@${company.email_domain}) already counts. Links help graduates trust you.`
              : 'Add at least one to post tasks.'}
          </span>
          <Field id="website" name="website" label="Company website" defaultValue={company.website ?? ''} placeholder="e.g. kamaulogistics.co.ke" />
          <Field id="linkedin" name="linkedin" label="LinkedIn page" defaultValue={company.linkedin ?? ''} placeholder="linkedin.com/company/…" />
          <Field id="social" name="social" label="Business page on Facebook, Instagram or TikTok" defaultValue={company.social ?? ''} placeholder="e.g. instagram.com/yourshop" />
        </fieldset>

        <RolePicker value={currentRoles} onChange={setRoles} />

        {saved && <Notice tone="info">{saved}</Notice>}
        {error && <Notice>{error}</Notice>}
        <Button type="submit" busy={saving} busyLabel="Saving…" className="self-start">Save</Button>
      </form>

      <section className="flex max-w-[640px] flex-col gap-2.5">
        <SectionTitle>Emails</SectionTitle>
        <div className="flex items-center justify-between gap-4 rounded-xl border border-line bg-white p-4">
          <span className="flex flex-col">
            <span id="r-digest">Daily digest</span>
            <span className="text-sm text-muted">{me.digest_enabled ? 'New work in your roles and submissions to your tasks, once a day at most.' : 'Off.'}</span>
          </span>
          <button role="switch" aria-checked={me.digest_enabled} aria-labelledby="r-digest" onClick={toggleDigest}
            className="press h-8 w-[52px] shrink-0 cursor-pointer rounded-full border-0 p-[3px] transition-colors duration-200"
            style={{ background: me.digest_enabled ? '#0E5C45' : '#C9C9C3' }}>
            <span className="block h-[26px] w-[26px] rounded-full bg-white transition-transform duration-200 ease-[var(--ease-out-strong)]"
              style={{ transform: `translateX(${me.digest_enabled ? 20 : 0}px)` }} />
          </button>
        </div>
      </section>

      <section className="flex flex-col gap-1">
        <span className="text-sm text-muted">Signed in as {session.user.email}</span>
        <button onClick={signOut} className="press min-h-11 cursor-pointer self-start border-0 bg-transparent p-0 text-ink">Log out</button>
      </section>
    </RecruiterLayout>
  )
}
