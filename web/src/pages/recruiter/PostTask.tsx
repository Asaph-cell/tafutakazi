import { useState, type FormEvent } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { RecruiterLayout } from '../../components/RecruiterLayout'
import { SectionTitle } from '../../components/GradLayout'
import { Button, Field, LinkButton, Notice, Select } from '../../components/ui'
import { useAuth } from '../../lib/auth'
import { normRole } from '../../lib/lists'
import { RoleInput } from '../../components/RoleInput'
import { useAllowance, useRecruiter } from '../../lib/recruiter'
import { supabase } from '../../lib/supabase'
import { KIND_LABEL, KINDS, STARTER_RUBRIC, type Kind, type RubricPart } from '../../lib/opportunity'

const MINUTES = [60, 90, 120, 150, 180, 210, 240]
const MAX_FILE = 20 * 1024 * 1024

export default function PostTask() {
  const { session } = useAuth()
  const queryClient = useQueryClient()
  const { data: me } = useRecruiter()
  const { data: allowance } = useAllowance()
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [posted, setPosted] = useState('')
  const [kind, setKind] = useState<Kind>('job')
  const [questions, setQuestions] = useState<string[]>([])
  const [rubric, setRubric] = useState<RubricPart[]>([])
  const rubricTotal = rubric.reduce((n, r) => n + (Number(r.weight) || 0), 0)
  const rubricBad = rubric.length > 0 && (rubricTotal !== 100 || rubric.some((r) => r.name.trim().length < 2))

  const company = me?.company
  const industry = company?.industry.toLowerCase() ?? 'your industry'
  const full = allowance ? allowance.open >= allowance.limit : false

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    const f = new FormData(e.currentTarget)
    if (file && file.size > MAX_FILE) return setError('The data file must be 20 MB or smaller.')
    if (rubricBad) return setError('Give every part of the scoring guide a name, and make the weights add up to 100.')
    setBusy(true)
    const openings = Number(f.get('openings'))
    const { data, error } = await supabase.from('tasks').insert({
      role: normRole(String(f.get('role'))),
      title: String(f.get('title')).trim(),
      instructions: String(f.get('instructions')).trim(),
      minutes_estimate: Number(f.get('minutes')),
      openings: openings > 0 ? openings : null,
      location: String(f.get('location')) || null,
      start_note: String(f.get('start')).trim() || null,
      salary_range: kind === 'job' ? String(f.get('salary') ?? '').trim() || null : null,
      kind,
      stipend: kind === 'internship' || kind === 'graduate_trainee' ? String(f.get('stipend')).trim() || null : null,
      duration_months: kind === 'job' ? null : Number(f.get('months')),
      hours_per_week: kind === 'volunteer' ? Number(f.get('hours')) || null : null,
      questions: questions.map((q) => q.trim()).filter(Boolean),
      rubric: rubric.map((r) => ({ name: r.name.trim(), weight: Number(r.weight) })),
      status: 'checking',
      // Recruiters get their own company from the database anyway; this matters when an admin posts a test task.
      company_id: company?.id,
      industry: company?.industry,
    }).select('id, title').single()
    if (error) {
      setBusy(false)
      return setError(error.message)
    }
    if (file && company) {
      const path = `${company.id}/${data.id}/A-${file.name.replace(/[^\w.-]+/g, '-')}`
      const up = await supabase.storage.from('task-files').upload(path, file, { contentType: file.type || undefined })
      if (!up.error) await supabase.from('task_files').insert({ task_id: data.id, variant: 'A', storage_path: path, file_name: file.name, size_bytes: file.size })
      else setError(`The task was saved, but the data file didn't upload: ${up.error.message}`)
    }
    setBusy(false)
    await queryClient.invalidateQueries()
    setPosted(data.title)
  }

  if (posted) {
    return (
      <RecruiterLayout>
        <div className="flex max-w-[620px] flex-col gap-4">
          <h1 className="m-0 text-[30px] font-bold tracking-[-0.03em]">"{posted}" is being checked</h1>
          <p className="m-0 text-ink-2">
            We check every task before graduates see it: no real customer data, no live client work, and doable in
            4 hours or less. This usually takes a few minutes. You'll see it go live in My tasks.
          </p>
          <div className="flex flex-wrap gap-2">
            <LinkButton to="/my-tasks">Go to My tasks</LinkButton>
            <LinkButton to="/browse" variant="outline">Browse graduates</LinkButton>
          </div>
        </div>
      </RecruiterLayout>
    )
  }

  return (
    <RecruiterLayout>
      <div className="flex flex-wrap items-start gap-10">
        <div className="flex min-w-0 flex-[999_1_560px] flex-col gap-6">
          <div className="flex flex-col gap-1.5">
            <h1 className="m-0 text-[30px] font-bold tracking-[-0.03em] sm:text-[34px]">Post a task</h1>
            <p className="m-0 text-muted">A short test task for a role you're hiring for. Graduates do it, and you invite the ones you want to interview.</p>
          </div>

          {allowance && !allowance.can_post && (
            <Notice>
              Before you can post, add a company website, LinkedIn page or business social media page in your{' '}
              <Link to="/account">account</Link>. (A company email address also counts.)
            </Notice>
          )}
          {full && allowance?.can_post && (
            <Notice>You have {allowance.open} open tasks, your limit for now. Turn one off in <Link to="/my-tasks">My tasks</Link>, or give feedback on more work to unlock up to 7.</Notice>
          )}

          <form onSubmit={onSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <span className="font-semibold">What is it for?</span>
              <div className="flex flex-wrap gap-2" role="group" aria-label="Type">
                {KINDS.map((k) => {
                  const locked = k === 'volunteer' && !company?.is_nonprofit
                  return (
                    <button key={k} type="button" aria-pressed={kind === k} disabled={locked} onClick={() => setKind(k)}
                      className={`press min-h-11 cursor-pointer rounded-full border px-4 text-sm disabled:cursor-not-allowed disabled:opacity-45 ${kind === k ? 'border-ink bg-ink text-white' : 'border-line-strong bg-white text-ink'}`}>
                      {KIND_LABEL[k]}
                    </button>
                  )
                })}
              </div>
              {!company?.is_nonprofit && (
                <span className="text-[13px] text-muted">Volunteer roles are for checked non-profits only. Email hello@tafutakazi.co.ke to have your organisation checked.</span>
              )}
            </div>

            {kind !== 'job' && (
              <div className="flex flex-wrap gap-4">
                <div className="flex-[1_1_160px]">
                  <Select id="months" name="months" label="How long" defaultValue="6">
                    {[1, 2, 3, 4, 5, 6, 9, 12, 18, 24].map((m) => <option key={m} value={m}>{m} {m === 1 ? 'month' : 'months'}</option>)}
                  </Select>
                </div>
                {kind === 'volunteer' ? (
                  <div className="flex-[1_1_160px]"><Field id="hours" name="hours" type="number" min={1} max={60} required defaultValue={10} label="Hours a week" /></div>
                ) : (
                  <div className="flex-[2_1_240px]">
                    <Field id="stipend" name="stipend" required maxLength={80} label={kind === 'internship' ? 'Monthly stipend' : 'Pay'}
                      placeholder="e.g. KSh 20,000 a month" hint="Shown to graduates. Unpaid internships are not allowed." />
                  </div>
                )}
              </div>
            )}

            <RoleInput id="role" name="role" label="Role you're hiring for" required defaultValue={me?.roles?.[0] ?? ''} extra={me?.roles ?? []} />

            <div className="flex flex-wrap gap-4">
              <div className="flex-[1_1_100px]"><Field id="openings" name="openings" type="number" min={1} max={50} defaultValue={1} label="Openings" /></div>
              <div className="flex-[1_1_160px]">
                <Select id="location" name="location" label="Where" defaultValue="On site">
                  <option>On site</option><option>Hybrid</option><option>Remote</option>
                </Select>
              </div>
              <div className="flex-[1_1_180px]"><Field id="start" name="start" label="Start" placeholder="As soon as possible" /></div>
            </div>

            <Field id="title" name="title" label="Task title" required minLength={3} maxLength={120} placeholder="e.g. Delivery times dashboard" />

            <div className="flex flex-col gap-1.5">
              <label htmlFor="instructions" className="font-semibold">What should they do?</label>
              <textarea id="instructions" name="instructions" rows={9} required minLength={20} maxLength={4000}
                placeholder={'The situation, then the steps. e.g.\n\nOur operations manager wants to know which delivery routes are late most often.\n\n1. Using the sample data, find the routes that are late most often.\n2. Build a one-page dashboard for the manager.\n3. Share it as a view-only link.'}
                className="w-full resize-y rounded-[10px] border border-line-strong bg-white p-3 text-base leading-relaxed" />
            </div>

            <div className="flex flex-wrap gap-4">
              <div className="flex-[1_1_200px]">
                <Select id="minutes" name="minutes" label="Time it should take" defaultValue="180">
                  {MINUTES.map((m) => <option key={m} value={m}>{m / 60} hours{m === 240 ? ' (max)' : ''}</option>)}
                </Select>
              </div>
              {kind === 'job' && (
                <div className="flex-[1_1_200px]">
                  <Field id="salary" name="salary" label={<>Salary range <span className="font-normal text-muted">(optional)</span></>} placeholder="e.g. KSh 40,000 – 55,000" />
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="font-semibold">Sample data <span className="font-normal text-muted">(optional)</span></span>
              <label className="press flex min-h-14 cursor-pointer items-center justify-between gap-3 rounded-[10px] border border-dashed border-[#BDBDB6] bg-white px-4">
                <input type="file" className="sr-only" accept=".csv,.xlsx,.xls,.pdf,.zip,.json,.txt" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
                <span className="truncate">{file ? file.name : 'Upload a CSV, Excel, PDF or ZIP file'}</span>
                <span className="shrink-0 text-sm text-muted">{file ? 'Replace' : 'Choose'}</span>
              </label>
            </div>

            <div className="flex flex-col gap-2 rounded-xl border border-line bg-white p-4">
              <span className="font-semibold">Screening questions <span className="font-normal text-muted">(optional, up to 3)</span></span>
              <span className="text-[13px] text-muted">Short, fair questions about the role, answered when graduates submit. Never ask about tribe, religion, age, marital status or health.</span>
              {questions.map((q, i) => (
                <div key={i} className="flex gap-2">
                  <input aria-label={`Question ${i + 1}`} value={q} maxLength={200} onChange={(e) => setQuestions(questions.map((x, j) => (j === i ? e.target.value : x)))}
                    placeholder={['e.g. When could you start?', 'e.g. Are you based in Nairobi?', 'e.g. Why this role?'][i]}
                    className="min-h-11 min-w-0 flex-1 rounded-[10px] border border-line-strong bg-white px-3 text-base" />
                  <button type="button" onClick={() => setQuestions(questions.filter((_, j) => j !== i))} className="press min-h-11 cursor-pointer border-0 bg-transparent px-2 text-sm text-muted">Remove</button>
                </div>
              ))}
              {questions.length < 3 && (
                <button type="button" onClick={() => setQuestions([...questions, ''])} className="press min-h-10 cursor-pointer self-start border-0 bg-transparent p-0 font-semibold text-brand">+ Add a question</button>
              )}
            </div>

            <div className="flex flex-col gap-2 rounded-xl border border-line bg-white p-4">
              <span className="font-semibold">Scoring guide <span className="font-normal text-muted">(optional)</span></span>
              <span className="text-[13px] text-muted">What you will judge the work on. You mark each part 1 to 5 and get a score out of 100, so you can rank everyone.</span>
              {rubric.map((r, i) => (
                <div key={i} className="flex gap-2">
                  <input aria-label={`Part ${i + 1}`} value={r.name} maxLength={40} placeholder="e.g. Accuracy"
                    onChange={(e) => setRubric(rubric.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))}
                    className="min-h-11 min-w-0 flex-1 rounded-[10px] border border-line-strong bg-white px-3 text-base" />
                  <input aria-label={`Weight of part ${i + 1}`} type="number" min={5} max={100} value={r.weight}
                    onChange={(e) => setRubric(rubric.map((x, j) => (j === i ? { ...x, weight: Number(e.target.value) } : x)))}
                    className="min-h-11 w-20 rounded-[10px] border border-line-strong bg-white px-3 text-base tabular-nums" />
                  <span className="flex items-center text-sm text-muted">%</span>
                  <button type="button" onClick={() => setRubric(rubric.filter((_, j) => j !== i))} className="press min-h-11 cursor-pointer border-0 bg-transparent px-2 text-sm text-muted">Remove</button>
                </div>
              ))}
              <div className="flex flex-wrap items-center gap-4">
                {rubric.length === 0 && (
                  <button type="button" onClick={() => setRubric(STARTER_RUBRIC)} className="press min-h-10 cursor-pointer border-0 bg-transparent p-0 font-semibold text-brand">Use a starter guide</button>
                )}
                {rubric.length < 5 && (
                  <button type="button" onClick={() => setRubric([...rubric, { name: '', weight: 10 }])} className="press min-h-10 cursor-pointer border-0 bg-transparent p-0 font-semibold text-brand">+ Add a part</button>
                )}
                {rubric.length > 0 && (
                  <span className={`text-sm tabular-nums ${rubricTotal === 100 ? 'text-brand' : 'text-danger'}`}>Total {rubricTotal}% {rubricTotal === 100 ? '✓' : '(must be 100)'}</span>
                )}
              </div>
            </div>

            <label className="flex items-start gap-2.5">
              <input type="checkbox" required className="mt-1 h-[18px] w-[18px] accent-brand" />
              <span>This is sample or made-up data, not real customers or live client work. I will never ask graduates for money.</span>
            </label>

            <span className="text-sm text-muted">
              Open roles are listed publicly at tafutakazi.co.ke/jobs and on Google's job search, so more graduates find them.
              Work done on this task stays on graduates' profiles. Other recruiters see it as "a task from a company in{' '}
              {industry}", never your company's name.
            </span>
            {error && <Notice>{error}</Notice>}
            <Button type="submit" disabled={busy || !allowance?.can_post || full || rubricBad} className="self-start">
              {busy ? 'Sending…' : 'Send for a quick check'}
            </Button>
          </form>
        </div>

        <aside className="flex min-w-0 flex-[1_1_280px] flex-col gap-5">
          <section className="flex flex-col gap-2.5 rounded-xl border border-line bg-white p-5">
            <SectionTitle>Open tasks</SectionTitle>
            <span className="text-lg font-semibold">{allowance ? `${allowance.open} of ${allowance.limit}` : '…'}</span>
            <span className="text-sm text-muted">Give feedback on 80% of the work you receive to unlock up to 7 open per company. Turned-off tasks don't count.</span>
          </section>
          <section className="flex flex-col gap-2.5 rounded-xl border border-line bg-white p-5">
            <SectionTitle>Checked before it goes live</SectionTitle>
            <span>No real personal data</span>
            <span>No live client work</span>
            <span>Takes 4 hours or less</span>
            <span className="text-sm text-muted">If something's off, we'll tell you what to fix.</span>
          </section>
          <span className="px-1 text-sm text-muted">Signed in as {session?.user.email}</span>
        </aside>
      </div>
    </RecruiterLayout>
  )
}
