import { useEffect, useState, type FormEvent } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { GradLayout } from '../../components/GradLayout'
import { Button, Notice, SkeletonPage } from '../../components/ui'
import { useAuth } from '../../lib/auth'
import { useTask, wordCount } from '../../lib/grad'
import { toolsFor } from '../../lib/lists'
import { ToolPicker } from '../../components/ToolPicker'
import { supabase } from '../../lib/supabase'
import { stampPreview, StampError } from '../../lib/stamp'

const MAX_PREVIEW = 5 * 1024 * 1024
const PREVIEW_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'application/pdf']
const MIN_WORDS = 250

const isLink = (s: string) => /^https?:\/\/\S+\.\S+/i.test(s.trim())

type Existing = { id: string; summary: string; preview_path: string | null; video_url: string; writeup: string; tools: string[]; work_link: string | null }

function Step({ n, title, done, children }: { n: number; title: string; done: boolean; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-4 sm:p-5">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="m-0 text-[17px] font-semibold">{n}. {title}</h2>
        {done && <span className="text-sm font-semibold text-brand">Done</span>}
      </div>
      {children}
    </section>
  )
}

const inputClass = 'min-h-[48px] w-full rounded-[10px] border border-line-strong bg-white px-3 text-base'

export default function Submit() {
  const { id = '' } = useParams()
  const { session, profile } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: task } = useTask(id)

  const { data: existing, isLoading } = useQuery({
    queryKey: ['my-submission', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('submissions').select('id, summary, preview_path, video_url, writeup, tools')
        .eq('task_id', id).eq('grad_id', session!.user.id).maybeSingle()
      if (!data) return null
      const { data: link } = await supabase.rpc('get_work_link', { sub: data.id })
      return { ...data, work_link: link as string | null } as Existing
    },
  })

  const [summary, setSummary] = useState('')
  const [workLink, setWorkLink] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [videoUrl, setVideoUrl] = useState('')
  const [writeup, setWriteup] = useState('')
  const [tools, setTools] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [answers, setAnswers] = useState<string[]>([])
  const questions = task?.questions ?? []

  // Answers already given, when editing.
  const { data: savedAnswers } = useQuery({
    queryKey: ['my-answers', id],
    enabled: Boolean(existing),
    queryFn: async () => ((await supabase.rpc('my_answers', { p_task: id })).data as string[] | null) ?? [],
  })
  useEffect(() => {
    if (savedAnswers) setAnswers(savedAnswers)
  }, [savedAnswers])

  useEffect(() => {
    if (existing) {
      setSummary(existing.summary)
      setWorkLink(existing.work_link ?? '')
      setVideoUrl(existing.video_url)
      setWriteup(existing.writeup)
      setTools(existing.tools ?? [])
    }
  }, [existing])

  const words = wordCount(writeup)
  const hasPreview = Boolean(file || existing?.preview_path)
  const done = {
    work: isLink(workLink) && hasPreview && tools.length > 0,
    video: isLink(videoUrl),
    writeup: words >= MIN_WORDS && summary.trim().length >= 10,
    ...(questions.length ? { answers: questions.every((_, i) => (answers[i] ?? '').trim().length > 0) } : {}),
  }
  const totalSteps = Object.keys(done).length
  const doneCount = Object.values(done).filter(Boolean).length
  // Exactly what's still stopping the submission, in plain words.
  const missing = [
    !isLink(workLink) && 'a link to your work (starting with https://)',
    !hasPreview && 'a preview image or PDF',
    tools.length === 0 && 'the tools you used',
    !isLink(videoUrl) && 'your video link (starting with https://)',
    summary.trim().length < 10 && 'your one-sentence summary',
    words < MIN_WORDS && `${MIN_WORDS - words} more ${MIN_WORDS - words === 1 ? 'word' : 'words'} in your write-up`,
    questions.length > 0 && !done.answers && "answers to the employer's questions",
  ].filter(Boolean) as string[]

  function chooseFile(f: File | undefined) {
    setError('')
    if (!f) return
    if (!PREVIEW_TYPES.includes(f.type)) return setError('The preview must be a PDF, PNG, JPG or WebP file.')
    if (f.size > MAX_PREVIEW) return setError('The preview must be 5 MB or smaller. Export a smaller PDF or a screenshot.')
    setFile(f)
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (doneCount < totalSteps || !session) return
    setBusy(true)
    setError('')
    let previewPath = existing?.preview_path ?? null
    if (file) {
      let stamped: File
      try {
        stamped = await stampPreview(file, `tafutakazi.co.ke · ${profile?.full_name ?? ''} · preview`)
      } catch (err) {
        setBusy(false)
        return setError(err instanceof StampError ? err.message : "Couldn't prepare the preview. Try another file.")
      }
      const ext = stamped.name.split('.').pop() || 'pdf'
      previewPath = `${session.user.id}/${id}-${Date.now()}.${ext}`
      const up = await supabase.storage.from('previews').upload(previewPath, stamped, { contentType: stamped.type })
      if (up.error) {
        setBusy(false)
        return setError("Couldn't upload the preview. Check your connection and try again.")
      }
      if (existing?.preview_path) await supabase.storage.from('previews').remove([existing.preview_path])
    }
    const fields = { summary: summary.trim(), work_link: workLink.trim(), preview_path: previewPath, video_url: videoUrl.trim(), writeup: writeup.trim(), tools, answers: questions.map((_, i) => (answers[i] ?? '').trim()) }
    const { error } = existing
      ? await supabase.from('submissions').update(fields).eq('id', existing.id)
      : await supabase.from('submissions').insert({ ...fields, task_id: id, grad_id: session.user.id })
    setBusy(false)
    if (error) return setError(error.message.includes('live') || error.message.includes('security') ? 'This task is no longer open.' : error.message)
    await queryClient.invalidateQueries()
    navigate('/me', { state: { submitted: task?.title } })
  }

  async function deleteWork() {
    if (!existing) return
    setBusy(true)
    setError('')
    if (existing.preview_path) await supabase.storage.from('previews').remove([existing.preview_path])
    const { error } = await supabase.from('submissions').delete().eq('id', existing.id)
    setBusy(false)
    if (error) return setError("Couldn't delete it. Try again.")
    await queryClient.invalidateQueries()
    navigate('/me')
  }

  if (isLoading) return <GradLayout narrow><SkeletonPage cards={2} /></GradLayout>

  return (
    <GradLayout narrow>
      <Link to={`/tasks/${id}`} className="flex min-h-11 items-center self-start text-[15px] no-underline">← {task?.title ?? 'Back to the task'}</Link>
      <div className="-mt-4 flex flex-col gap-1">
        <h1 className="m-0 text-[28px] font-bold tracking-[-0.03em] sm:text-[34px]">{existing ? 'Edit your submission' : 'Submit your work'}</h1>
        <span className="text-muted">{doneCount} of {totalSteps} done</span>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Step n={1} title="Your work" done={done.work}>
          <label htmlFor="work" className="text-sm text-muted">Link to your full work</label>
          <input id="work" type="url" inputMode="url" value={workLink} onChange={(e) => setWorkLink(e.target.value)}
            placeholder="Google Drive, Canva, Figma, GitHub…" className={inputClass} />
          <span className="text-[13px] text-muted">Set it to "view only". Recruiters see this link only after they invite you.</span>

          <label className="press flex min-h-12 cursor-pointer items-center justify-center rounded-[10px] border border-dashed border-[#BDBDB6] bg-[#FAFAF8] px-3 text-center text-[15px]">
            <input type="file" accept={PREVIEW_TYPES.join(',')} className="sr-only" onChange={(e) => chooseFile(e.target.files?.[0])} />
            {file ? `${file.name} · ${(file.size / 1048576).toFixed(1)} MB` : existing?.preview_path ? 'Preview added · tap to replace' : 'Add a preview: image or PDF, max 5 MB'}
          </label>
          <span className="text-[13px] text-muted">This is what recruiters see first, so make it your best screenshot or a short PDF.</span>

          <span className="mt-2 text-sm font-semibold">Which tools did you use?</span>
          <ToolPicker suggestions={toolsFor(task?.role)} value={tools} onChange={setTools} />
          <span className="text-[13px] text-muted">Recruiters search by tool, e.g. "Data Analyst who knows Power BI". Only pick what you really used.</span>
        </Step>

        <Step n={2} title="Your video" done={done.video}>
          <span className="text-sm text-muted">2–3 minutes. Show your screen and explain what you did and why.</span>
          <label htmlFor="video" className="sr-only">Video link</label>
          <input id="video" type="url" inputMode="url" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="Paste a YouTube, Google Drive or Loom link" className={inputClass} />
          <details className="text-[13px] text-muted">
            <summary className="cursor-pointer text-brand">How do I record and share it?</summary>
            <ol className="mb-0 mt-2 flex flex-col gap-1 pl-5">
              <li>Record your screen while you talk. Phones have a built-in screen recorder; on Windows press Win+Alt+R (or use the Xbox Game Bar); on a Mac press Cmd+Shift+5.</li>
              <li>Upload it to YouTube and set it to <strong>Unlisted</strong>, so only people with the link can watch. Google Drive (shared as "anyone with the link") or Loom work too.</li>
              <li>Copy the link and paste it above. It plays right on the recruiter's page.</li>
            </ol>
          </details>
        </Step>

        <Step n={3} title="How you did it" done={done.writeup}>
          <label htmlFor="summary" className="text-sm font-semibold">In one sentence, what did you do?</label>
          <input id="summary" value={summary} maxLength={200} onChange={(e) => setSummary(e.target.value)}
            placeholder="e.g. Found 312 duplicate receipts and built a dashboard of losing branches" className={inputClass} />
          <span className="text-[13px] text-muted">This line goes on your public profile and CV.</span>

          <div className="mt-1 flex items-baseline justify-between gap-2">
            <label htmlFor="writeup" className="text-sm font-semibold">The full story</label>
            <span className={`text-sm tabular-nums ${words >= MIN_WORDS ? 'font-semibold text-brand' : 'text-muted'}`}>{words >= MIN_WORDS ? `✓ ${words} words` : `${words} of ${MIN_WORDS} words`}</span>
          </div>
          <textarea id="writeup" rows={10} value={writeup} onChange={(e) => setWriteup(e.target.value)}
            placeholder="What was messy in the data? What did you check first? Why did you choose these charts? What would you do next?"
            className="w-full resize-y rounded-[10px] border border-line-strong bg-white p-3 text-base" />
          <div aria-hidden="true" className="h-1 overflow-hidden rounded-full bg-[#EEEEE9]">
            <div className="h-1 w-full origin-left bg-brand transition-transform duration-200 ease-[var(--ease-out-strong)]"
              style={{ transform: `scaleX(${Math.min(1, words / MIN_WORDS)})` }} />
          </div>
        </Step>

        {questions.length > 0 && (
          <Step n={4} title="The employer's questions" done={Boolean(done.answers)}>
            <span className="text-sm text-muted">Only this employer sees your answers.</span>
            {questions.map((q, i) => (
              <div key={i} className="flex flex-col gap-1.5">
                <label htmlFor={`answer-${i}`} className="text-sm font-semibold">{q}</label>
                <textarea id={`answer-${i}`} rows={2} maxLength={600} value={answers[i] ?? ''}
                  onChange={(e) => setAnswers(questions.map((_, j) => (j === i ? e.target.value : answers[j] ?? '')))}
                  className="w-full resize-y rounded-[10px] border border-line-strong bg-white p-3 text-base" />
              </div>
            ))}
          </Step>
        )}

        <span className="text-sm text-muted">Only signed-in recruiters can see your work. Other graduates can't.</span>
        {error && <Notice>{error}</Notice>}

        <div className="sticky bottom-[72px] -mx-5 border-t border-line bg-ground/95 px-5 py-3 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0">
          <Button type="submit" busy={busy} fill busyLabel="Uploading…" disabled={doneCount < totalSteps} className="w-full sm:w-auto">
            {existing ? 'Save changes' : 'Submit'}
          </Button>
          {missing.length > 0 && (
            <p className="m-0 mt-1.5 text-center text-[13px] text-ink-2 sm:text-left">
              <span className="font-semibold">Still needed:</span> {missing.join(' · ')}
            </p>
          )}
        </div>
      </form>

      {existing && (
        <section className="flex flex-col gap-3 border-t border-line pt-6">
          {!confirmDelete ? (
            <button onClick={() => setConfirmDelete(true)} className="press min-h-11 cursor-pointer self-start border-0 bg-transparent p-0 text-danger">
              Delete this work
            </button>
          ) : (
            <div className="flex flex-col gap-3 rounded-xl border border-[#E8C9BF] bg-[#FBF1EE] p-4">
              <span className="text-[15px]">
                This removes your work on this task from your profile, with its preview, verdict, comments, thumbs up and any
                interview invite. It can't be undone. You can do the task again afterwards.
              </span>
              <div className="flex flex-wrap gap-2">
                <Button onClick={deleteWork} busy={busy} busyLabel="Deleting…" className="min-h-11 bg-danger hover:bg-[#82290F]">Yes, delete it</Button>
                <Button variant="outline" onClick={() => setConfirmDelete(false)} className="min-h-11">Keep it</Button>
              </div>
            </div>
          )}
        </section>
      )}
    </GradLayout>
  )
}
