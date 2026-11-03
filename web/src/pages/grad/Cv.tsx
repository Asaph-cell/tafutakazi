import { useState, type ChangeEvent, type FormEvent, type MouseEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { CvPage, CV_COLOURS, CV_TEMPLATES, SAMPLE_CV, useFit, type CvProps } from '../../components/CvTemplates'
import { GradLayout } from '../../components/GradLayout'
import { Seo } from '../../components/Seo'
import { Button, Field, Notice, SkeletonPage } from '../../components/ui'
import { useAuth } from '../../lib/auth'
import { EMPTY_CV, useMyCv, type CvData } from '../../lib/cv'
import { useGrad, useMySubmissions, type GradRow, type MySubmission } from '../../lib/grad'
import { supabase } from '../../lib/supabase'
import { toast } from '../../lib/toast'

type Job = CvData['jobs'][number]

const NEW_JOB: Job = { title: '', place: '', dates: '', details: '' }
const NEW_SCHOOL = { years: '', school: '', course: '' }
const NEW_REFEREE = { name: '', title: '', phone: '', email: '' }

function Area({ id, label, hint, value, onChange, rows = 3, maxLength }: {
  id: string; label: string; hint?: string; value: string; rows?: number; maxLength: number
  onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="font-semibold">{label}</label>
      <textarea id={id} rows={rows} maxLength={maxLength} value={value} onChange={onChange}
        className="w-full rounded-[10px] border border-line-strong bg-white p-3 text-[16px] leading-relaxed outline-none focus:border-brand" />
      {hint && <span className="text-[13px] text-muted">{hint}</span>}
    </div>
  )
}



// Preview sections that are filled in from a shared form part.
const PART_FOR: Record<string, string> = { tasks: 'work', competencies: 'skills', languages: 'skills' }

function Part({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={`cv-${id}`} className="flex scroll-mt-24 flex-col gap-4 border-t border-line pt-6 first:border-0 first:pt-0">
      <h2 className="m-0 text-[22px] font-semibold">{title}</h2>
      {children}
    </section>
  )
}

// Details the CV takes from the graduate's profile, edited there rather than here.
function FromProfile({ rows }: { rows: string[] }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-xl bg-ground px-4 py-3">
      <span className="flex items-baseline justify-between gap-3 text-[13px] text-muted">From your profile <Link to="/me/profile" className="font-semibold">Edit</Link></span>
      {rows.filter(Boolean).map((r) => <span key={r} className="break-words">{r}</span>)}
    </div>
  )
}

// Shows the bullets as they will appear, while the graduate types.
function BulletPreview({ text }: { text: string }) {
  const points = text.split('\n').map((l) => l.replace(/^[\s•-]+/, '').trim()).filter(Boolean)
  if (points.length === 0) return null
  return (
    <ul className="m-0 flex list-disc flex-col gap-0.5 rounded-lg bg-ground py-2.5 pl-8 pr-3 text-[14px] text-ink-2">
      {points.map((p, k) => <li key={k}>{p}</li>)}
    </ul>
  )
}

function Thumb({ sheet, template }: { sheet: CvProps; template: string }) {
  const { box, zoom } = useFit(794)
  return (
    <span ref={box} aria-hidden="true" inert className="block h-[190px] overflow-hidden rounded-md border border-line">
      <CvPage {...sheet} cv={{ ...sheet.cv, ...SAMPLE_CV, template }} zoom={zoom} />
    </span>
  )
}

function Builder({ start, grad, work }: { start: CvData; grad: GradRow; work: MySubmission[] }) {
  const { session, profile } = useAuth()
  const queryClient = useQueryClient()
  const [cv, setCv] = useState(start)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const { box, zoom } = useFit(794)
  const set = (key: 'phone' | 'town' | 'linkedin' | 'summary' | 'skills' | 'competencies' | 'languages') => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setCv({ ...cv, [key]: e.target.value })
  const setJob = (k: number, key: keyof Job, value: string) => setCv({ ...cv, jobs: cv.jobs.map((j, i) => (i === k ? { ...j, [key]: value } : j)) })
  const setSchool = (k: number, key: keyof CvData['education'][number], value: string) => setCv({ ...cv, education: cv.education.map((e, i) => (i === k ? { ...e, [key]: value } : e)) })
  const setReferee = (k: number, key: keyof CvData['referees'][number], value: string) => setCv({ ...cv, referees: cv.referees.map((r, i) => (i === k ? { ...r, [key]: value } : r)) })
  const sheet = { cv, name: profile?.full_name ?? '', email: session?.user.email ?? '', grad, work }

  // Clicking a part of the preview opens that part of the form.
  function jump(e: MouseEvent<HTMLDivElement>) {
    const part = (e.target as HTMLElement).closest('[data-cv-section]')?.getAttribute('data-cv-section')
    const target = document.getElementById(`cv-${PART_FOR[part ?? ''] ?? part}`)
    if (!target) return
    target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    target.querySelector<HTMLElement>('input, textarea, button')?.focus({ preventScroll: true })
  }

  async function save(e: FormEvent) {
    e.preventDefault()
    setError('')
    setSaving(true)
    const { error } = await supabase.from('cvs').upsert({ grad_id: session!.user.id, data: cv, updated_at: new Date().toISOString() })
    setSaving(false)
    if (error) return setError("Couldn't save your CV. Check your connection and try again.")
    queryClient.invalidateQueries({ queryKey: ['my-cv'] })
    toast('CV saved')
  }

  // The browser's print window saves the PDF, and the file is named after the page title.
  function download() {
    const title = document.title
    document.title = `${profile?.full_name ?? 'My'} CV`
    window.print()
    document.title = title
  }

  return (
    <>
      <section aria-label="Choose a template" className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {CV_TEMPLATES.map((t) => (
            <button key={t.id} type="button" aria-pressed={cv.template === t.id} onClick={() => setCv({ ...cv, template: t.id })}
              className={`press flex cursor-pointer flex-col gap-2 rounded-xl border-2 bg-white p-2.5 text-left ${cv.template === t.id ? 'border-brand' : 'border-line hover:border-line-strong'}`}>
              <Thumb sheet={sheet} template={t.id} />
              <span className="font-semibold">{t.label}</span>
              <span className="text-[13px] leading-snug text-muted">{t.note}</span>
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-semibold">Colour</span>
          {CV_COLOURS.map(([label, value]) => (
            <button key={value} type="button" aria-label={label} aria-pressed={cv.accent === value} onClick={() => setCv({ ...cv, accent: value })}
              className={`press h-9 w-9 cursor-pointer rounded-full border-[3px] ${cv.accent === value ? 'border-accent' : 'border-white'}`} style={{ background: value }} />
          ))}
        </div>
      </section>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <form onSubmit={save} className="flex min-w-0 flex-col gap-6 rounded-2xl border border-line bg-white p-5 sm:p-6">
          <Part id="contact" title="Contact">
            <FromProfile rows={[profile?.full_name ?? '', grad.track, session?.user.email ?? '']} />
            <div className="flex flex-wrap gap-4">
              <div className="flex-[1_1_180px]"><Field id="phone" label="Phone" type="tel" autoComplete="tel" maxLength={30} value={cv.phone} onChange={set('phone')} /></div>
              <div className="flex-[1_1_180px]"><Field id="town" label="Town" placeholder="e.g. Nairobi" maxLength={60} value={cv.town} onChange={set('town')} /></div>
            </div>
            <Field id="linkedin" label="LinkedIn page" placeholder="linkedin.com/in/your-name" maxLength={120} value={cv.linkedin} onChange={set('linkedin')} />
          </Part>

          <Part id="profile" title="Profile">
            <Area id="summary" label="About you" rows={4} maxLength={500} value={cv.summary} onChange={set('summary')}
              hint="Two or three lines: what you can do and the job you want." />
          </Part>

          <Part id="work" title="Work experience">
            <p className="m-0 text-[14px] text-ink-2">Tasks you finish on Tafutakazi go on your CV as <strong>Proven work</strong> by themselves. Add jobs, attachments or volunteering here.</p>
            {cv.jobs.map((j, k) => (
              <fieldset key={k} className="m-0 flex flex-col gap-3 rounded-xl border border-line p-4">
                <legend className="px-1 text-sm text-muted">Entry {k + 1}</legend>
                <Field id={`job-title-${k}`} label="Role" maxLength={80} value={j.title} onChange={(e) => setJob(k, 'title', e.target.value)} />
                <div className="flex flex-wrap gap-3">
                  <div className="flex-[2_1_180px]"><Field id={`job-place-${k}`} label="Company or organisation" maxLength={80} value={j.place} onChange={(e) => setJob(k, 'place', e.target.value)} /></div>
                  <div className="flex-[1_1_120px]"><Field id={`job-dates-${k}`} label="Dates" placeholder="Jan–Apr 2025" maxLength={40} value={j.dates} onChange={(e) => setJob(k, 'dates', e.target.value)} /></div>
                </div>
                <Area id={`job-details-${k}`} label="What you did" rows={4} maxLength={700} hint="Press Enter to start a new bullet point." value={j.details} onChange={(e) => setJob(k, 'details', e.target.value)} />
                <BulletPreview text={j.details} />
                <button type="button" onClick={() => setCv({ ...cv, jobs: cv.jobs.filter((_, i) => i !== k) })}
                  className="press min-h-9 cursor-pointer self-start border-0 bg-transparent p-0 text-sm text-danger">Remove</button>
              </fieldset>
            ))}
            {cv.jobs.length < 6 && (
              <Button type="button" variant="outline" className="self-start" onClick={() => setCv({ ...cv, jobs: [...cv.jobs, NEW_JOB] })}>Add an entry</Button>
            )}
          </Part>

          <Part id="education" title="Education">
            <FromProfile rows={[grad.course, [grad.institution, grad.grad_year].filter(Boolean).join(', ')]} />
            {cv.education.map((s, k) => (
              <fieldset key={k} className="m-0 flex flex-col gap-3 rounded-xl border border-line p-4">
                <legend className="px-1 text-sm text-muted">School {k + 1}</legend>
                <div className="flex flex-wrap gap-3">
                  <div className="flex-[2_1_180px]"><Field id={`school-name-${k}`} label="School or college" maxLength={80} value={s.school} onChange={(e) => setSchool(k, 'school', e.target.value)} /></div>
                  <div className="flex-[1_1_120px]"><Field id={`school-years-${k}`} label="Years" placeholder="2016 - 2019" maxLength={30} value={s.years} onChange={(e) => setSchool(k, 'years', e.target.value)} /></div>
                </div>
                <Field id={`school-course-${k}`} label="Course or result" placeholder="KCSE, B+" maxLength={80} value={s.course} onChange={(e) => setSchool(k, 'course', e.target.value)} />
                <button type="button" onClick={() => setCv({ ...cv, education: cv.education.filter((_, i) => i !== k) })}
                  className="press min-h-9 cursor-pointer self-start border-0 bg-transparent p-0 text-sm text-danger">Remove</button>
              </fieldset>
            ))}
            {cv.education.length < 3 && <Button type="button" variant="outline" className="self-start" onClick={() => setCv({ ...cv, education: [...cv.education, NEW_SCHOOL] })}>Add high school or another course</Button>}
          </Part>

          <Part id="skills" title="Skills, competencies and languages">
            <Area id="skills" label="Skills" rows={2} maxLength={300} value={cv.skills} onChange={set('skills')}
              hint="Tools and technical skills, separated by commas. Tools from your tasks are added for you." />
            <Area id="competencies" label="Key competencies" rows={2} maxLength={300} value={cv.competencies} onChange={set('competencies')}
              hint="Strengths employers look for, like problem solving or attention to detail. Separate them with commas." />
            <Field id="languages" label="Languages" placeholder="English (Fluent), Kiswahili (Fluent)" maxLength={150} value={cv.languages} onChange={set('languages')} hint="Separate them with commas." />
          </Part>

          <Part id="references" title="References">
            <p className="m-0 text-[14px] text-ink-2">Ask each person before you list them.</p>
            {cv.referees.map((r, k) => (
              <fieldset key={k} className="m-0 flex flex-col gap-3 rounded-xl border border-line p-4">
                <legend className="px-1 text-sm text-muted">Referee {k + 1}</legend>
                <div className="flex flex-wrap gap-3">
                  <div className="flex-[1_1_180px]"><Field id={`ref-name-${k}`} label="Name" maxLength={80} value={r.name} onChange={(e) => setReferee(k, 'name', e.target.value)} /></div>
                  <div className="flex-[1_1_180px]"><Field id={`ref-title-${k}`} label="Title and company" maxLength={80} value={r.title} onChange={(e) => setReferee(k, 'title', e.target.value)} /></div>
                  <div className="flex-[1_1_180px]"><Field id={`ref-phone-${k}`} label="Phone" type="tel" maxLength={30} value={r.phone} onChange={(e) => setReferee(k, 'phone', e.target.value)} /></div>
                  <div className="flex-[1_1_180px]"><Field id={`ref-email-${k}`} label="Email" type="email" maxLength={100} value={r.email} onChange={(e) => setReferee(k, 'email', e.target.value)} /></div>
                </div>
                <button type="button" onClick={() => setCv({ ...cv, referees: cv.referees.filter((_, i) => i !== k) })}
                  className="press min-h-9 cursor-pointer self-start border-0 bg-transparent p-0 text-sm text-danger">Remove</button>
              </fieldset>
            ))}
            {cv.referees.length < 2 && <Button type="button" variant="outline" className="self-start" onClick={() => setCv({ ...cv, referees: [...cv.referees, NEW_REFEREE] })}>Add a referee</Button>}
          </Part>

          {error && <Notice>{error}</Notice>}
          <div className="flex flex-wrap gap-2 border-t border-line pt-5">
            <Button type="submit" busy={saving} busyLabel="Saving…">Save</Button>
            <Button type="button" variant="outline" onClick={download}>Download PDF</Button>
          </div>
          <span className="text-[13px] text-muted">Only you can see these details. In the print window, choose "Save as PDF".</span>
        </form>
        <div className="flex min-w-0 flex-col gap-2 lg:sticky lg:top-6">
          <span className="text-[13px] text-muted">Click any part of your CV to edit it. Faint text shows where your details will go.</span>
          <div ref={box} onClick={jump} className="cv-guide min-w-0 overflow-hidden rounded-xl border border-line">
            <CvPage {...sheet} zoom={zoom} guide />
          </div>
        </div>
      </div>
      {createPortal(<div className="cv-print"><CvPage {...sheet} /></div>, document.body)}
    </>
  )
}

export default function Cv() {
  const { data: grad, isError: noGrad } = useGrad()
  const { data: subs } = useMySubmissions()
  const { data: saved, isLoading } = useMyCv()
  return (
    <GradLayout>
      <Seo title="CV builder" noindex />
      <div className="flex flex-col gap-1">
        <h1 className="m-0 text-[28px] font-bold tracking-[-0.03em] sm:text-[34px]">CV builder</h1>
        <span className="text-ink-2">Choose a template, fill it in, and download it as a PDF.</span>
      </div>
      {noGrad ? <p className="m-0 text-ink-2">Only graduate accounts have a CV.</p>
        : !grad || isLoading ? <SkeletonPage cards={2} />
        : <Builder start={saved ?? EMPTY_CV} grad={grad} work={subs ?? []} />}
    </GradLayout>
  )
}
