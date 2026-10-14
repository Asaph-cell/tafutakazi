import { useState, type FormEvent } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Card, GradLayout, initials } from '../../components/GradLayout'
import { OtherWorkEditor } from '../../components/OtherWork'
import { Button, Field, Notice, Select } from '../../components/ui'
import { useAuth } from '../../lib/auth'
import { useGrad, useMyActivity, useMySubmissions } from '../../lib/grad'
import { gradYears, ROLES } from '../../lib/lists'
import { supabase } from '../../lib/supabase'

const SITE = 'tafutakazi.co.ke'

function CopyButton({ text, label, primary = false }: { text: string; label: string; primary?: boolean }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      onClick={async () => {
        try { await navigator.clipboard.writeText(text) } catch { /* shown on screen anyway */ }
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }}
      className={`press min-h-11 cursor-pointer rounded-[10px] px-4 text-[15px] font-semibold ${primary ? 'border-0 bg-brand text-white' : 'border border-line-strong bg-white text-ink'}`}
    >
      {copied ? 'Copied' : label}
    </button>
  )
}

function Toggle({ on, onClick, labelId }: { on: boolean; onClick: () => void; labelId: string }) {
  return (
    <button role="switch" aria-checked={on} aria-labelledby={labelId} onClick={onClick}
      className="press h-8 w-[52px] shrink-0 cursor-pointer rounded-full border-0 p-[3px] transition-colors duration-200"
      style={{ background: on ? '#0E5C45' : '#C9C9C3' }}>
      <span className="block h-[26px] w-[26px] rounded-full bg-white transition-transform duration-200 ease-[var(--ease-out-strong)]"
        style={{ transform: `translateX(${on ? 20 : 0}px)` }} />
    </button>
  )
}

export default function Profile() {
  const { session, profile, signOut, refreshProfile } = useAuth()
  const queryClient = useQueryClient()
  const { data: grad } = useGrad()
  const { data: subs } = useMySubmissions()
  const { data: activity } = useMyActivity()
  const [editing, setEditing] = useState(false)
  const [saved, setSaved] = useState('')
  const [error, setError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)

  if (!grad || !profile || !session) return <GradLayout><p className="text-muted">Loading…</p></GradLayout>

  const link = `${SITE}/${grad.slug}`
  const work = subs ?? []
  const invites = new Set(activity?.invites.map((i) => i.company?.name)).size
  const thumbs = activity?.thumbs.length ?? 0
  const views = activity?.views.length ?? 0
  const study = [grad.course, grad.institution, grad.grad_year].filter(Boolean).join(' · ')
  const cvLines = [
    'Practical work · Tafutakazi',
    link,
    ...work.map((s) => `• ${s.task?.title ?? 'Task'}${s.tools?.length ? ` (${s.tools.join(', ')})` : ''}: ${s.summary}`),
    [invites ? `Invited to interview by ${invites} ${invites === 1 ? 'company' : 'companies'}` : '', thumbs ? `${thumbs} recruiter thumbs up` : '']
      .filter(Boolean).join(' · '),
  ].filter(Boolean)

  async function saveDetails(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    const f = new FormData(e.currentTarget)
    const [a, b] = await Promise.all([
      supabase.from('profiles').update({ full_name: String(f.get('name')).trim() }).eq('id', session!.user.id),
      supabase.from('grads').update({
        course: String(f.get('course')).trim(),
        institution: String(f.get('institution')).trim() || null,
        grad_year: Number(f.get('year')),
        track: String(f.get('track')),
      }).eq('id', session!.user.id),
    ])
    if (a.error || b.error) return setError("Couldn't save. Try again.")
    await refreshProfile()
    await queryClient.invalidateQueries({ queryKey: ['grad'] })
    setEditing(false)
    setSaved('Your details are saved.')
  }

  async function toggleDigest() {
    await supabase.from('grads').update({ digest_enabled: !grad!.digest_enabled }).eq('id', session!.user.id)
    queryClient.invalidateQueries({ queryKey: ['grad'] })
  }

  async function changePassword() {
    const { error } = await supabase.auth.resetPasswordForEmail(session!.user.email!, { redirectTo: `${window.location.origin}/reset-password` })
    if (error) setError(error.message)
    else setSaved(`We sent a link to ${session!.user.email} to choose a new password.`)
  }

  async function deleteAccount() {
    const { data: files } = await supabase.storage.from('previews').list(session!.user.id)
    if (files?.length) await supabase.storage.from('previews').remove(files.map((f) => `${session!.user.id}/${f.name}`))
    const { error } = await supabase.rpc('delete_my_account')
    if (error) return setError("Couldn't delete your account. Email hello@tafutakazi.co.ke and we'll do it.")
    await signOut()
  }

  return (
    <GradLayout>
      {/* Identity */}
      <section className="flex flex-wrap items-center gap-x-6 gap-y-5 rounded-2xl border border-line bg-white p-5 sm:p-7">
        <span aria-hidden="true" className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-full bg-brand-soft text-2xl font-semibold text-brand">
          {initials(profile.full_name)}
        </span>
        <div className="flex min-w-0 flex-[999_1_260px] flex-col gap-1">
          <h1 className="m-0 text-[26px] font-bold leading-tight tracking-[-0.03em] sm:text-[32px]">{profile.full_name}</h1>
          <span className="text-ink-2">Fresh graduate · {grad.track}</span>
          {study && <span className="text-sm text-muted">{study}</span>}
        </div>
        <div className="flex flex-[1_1_260px] flex-col gap-2 sm:items-end">
          <span className="break-all text-sm text-brand">{link}</span>
          <div className="flex flex-wrap gap-2">
            <CopyButton text={`https://${link}`} label="Copy my link" primary />
            <Link to={`/${grad.slug}`} className="press flex min-h-11 items-center rounded-[10px] border border-line-strong px-4 text-[15px] font-semibold text-ink no-underline hover:text-ink">
              View
            </Link>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-3 gap-3">
        {[[work.length, work.length === 1 ? 'task done' : 'tasks done'], [views, 'views'], [invites, invites === 1 ? 'invite' : 'invites']].map(([n, l]) => (
          <div key={l as string} className="flex flex-col rounded-2xl border border-line bg-white px-4 py-3">
            <span className="text-[26px] font-bold leading-tight tabular-nums">{n}</span>
            <span className="text-sm text-muted">{l}</span>
          </div>
        ))}
      </div>

      {saved && <Notice tone="info">{saved}</Notice>}
      {error && <Notice>{error}</Notice>}

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        {/* Left: what you show the world */}
        <div className="flex flex-col gap-6">
          <Card title="For your CV" action={work.length > 0 ? <CopyButton text={cvLines.join('\n')} label="Copy" /> : undefined}>
            {work.length === 0 ? (
              <p className="m-0 text-ink-2">Finish a task and a ready-made CV entry appears here, with your link. <Link to="/tasks">Find a task</Link></p>
            ) : (
              <div className="flex flex-col gap-1.5 rounded-xl bg-ground p-4 text-[15px] leading-relaxed">
                {cvLines.map((line, k) => (
                  <span key={k} className={k === 0 ? 'font-semibold' : k === 1 ? 'break-all text-brand' : ''}>{line}</span>
                ))}
              </div>
            )}
            <span className="text-[13px] text-muted">Your link shows your tasks and verdicts. Videos and work stay private to signed-in recruiters.</span>
          </Card>

          <Card title={`Your work · ${work.length}`}>
            {work.length === 0 && <p className="m-0 text-ink-2">Nothing yet. Your finished tasks show here.</p>}
            {work.map((s) => (
              <Link key={s.id} to={`/tasks/${s.task_id}`} className="press flex flex-col gap-1.5 border-t border-[#EEEEE9] pt-4 text-ink no-underline first:border-0 first:pt-0 hover:text-ink">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-semibold">{s.task?.title ?? 'Task'}</span>
                  <span className={`text-[13px] font-semibold ${s.verdict ? 'text-brand' : 'text-muted'}`}>
                    {s.verdict ? 'Verdict ready' : 'Awaiting verdict'}
                  </span>
                </div>
                <span className="text-[15px] text-ink-2">{s.summary}</span>
                {s.tools?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {s.tools.map((t) => <span key={t} className="rounded-full bg-ground px-2.5 py-0.5 text-[13px] text-ink-2">{t}</span>)}
                  </div>
                )}
                {s.verdict && (
                  <span className="text-sm text-muted"><strong className="text-ink">Strong:</strong> {s.verdict.strengths}</span>
                )}
              </Link>
            ))}
          </Card>

          <Card title="Other work">
            <OtherWorkEditor gradId={grad.id} />
          </Card>
        </div>

        {/* Right: settings */}
        <div className="flex flex-col gap-6">
          <Card title="Your details" action={!editing ? (
            <button onClick={() => { setSaved(''); setEditing(true) }} className="press min-h-9 cursor-pointer border-0 bg-transparent p-0 text-sm font-semibold text-brand">Edit</button>
          ) : undefined}>
            {editing ? (
              <form onSubmit={saveDetails} className="flex flex-col gap-4">
                <Field id="name" name="name" label="Full name" defaultValue={profile.full_name} required minLength={2} />
                <Field id="course" name="course" label="What did you study?" defaultValue={grad.course} required />
                <Field id="institution" name="institution" label="University or college" defaultValue={grad.institution ?? ''} />
                <Select id="year" name="year" label="Year you finished" defaultValue={String(grad.grad_year ?? gradYears()[0])}>
                  {gradYears().map((y) => <option key={y}>{y}</option>)}
                </Select>
                <Select id="track" name="track" label="What job do you want?" defaultValue={grad.track}>
                  {ROLES.map((r) => <option key={r}>{r}</option>)}
                </Select>
                <div className="flex gap-2">
                  <Button type="submit" className="min-h-11">Save</Button>
                  <Button type="button" variant="outline" onClick={() => setEditing(false)} className="min-h-11">Cancel</Button>
                </div>
              </form>
            ) : (
              <dl className="m-0 flex flex-col gap-3">
                {[
                  ['Studied', study || '—'],
                  ['Job you want', grad.track],
                  ['Email', `${session.user.email} · confirmed`],
                ].map(([k, v]) => (
                  <div key={k} className="flex flex-col">
                    <dt className="text-[13px] text-muted">{k}</dt>
                    <dd className="m-0 break-words">{v}</dd>
                  </div>
                ))}
              </dl>
            )}
          </Card>

          <Card title="Emails">
            <div className="flex items-center justify-between gap-4">
              <span className="flex flex-col">
                <span id="digest-label" className="font-semibold">Daily digest</span>
                <span className="text-sm text-muted">
                  {grad.digest_enabled ? 'New tasks and recruiter comments, once a day at most.' : "Off. You won't get alerts from us."}
                </span>
              </span>
              <Toggle on={grad.digest_enabled} onClick={toggleDigest} labelId="digest-label" />
            </div>
            <span className="text-[13px] text-muted">Interview invites, password resets and email confirmations are always sent.</span>
          </Card>

          <Card title="Account">
            <div className="flex flex-col">
              <button onClick={changePassword} className="press min-h-11 cursor-pointer self-start border-0 bg-transparent p-0 text-ink">Change password</button>
              <button onClick={signOut} className="press min-h-11 cursor-pointer self-start border-0 bg-transparent p-0 text-ink">Log out</button>
              {!confirmDelete ? (
                <button onClick={() => setConfirmDelete(true)} className="press min-h-11 cursor-pointer self-start border-0 bg-transparent p-0 text-danger">Delete my account</button>
              ) : (
                <div className="mt-2 flex flex-col gap-3 rounded-xl border border-[#E8C9BF] bg-[#FBF1EE] p-4">
                  <span className="text-[15px]">This permanently deletes your profile, tasks, previews and comments. It can't be undone.</span>
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={deleteAccount} className="min-h-11 bg-danger hover:bg-[#82290F]">Yes, delete everything</Button>
                    <Button variant="outline" onClick={() => setConfirmDelete(false)} className="min-h-11">Keep my account</Button>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </GradLayout>
  )
}
