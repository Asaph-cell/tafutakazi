import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { GradLayout, SectionTitle } from '../../components/GradLayout'
import { Button, LinkButton, Notice, SkeletonPage } from '../../components/ui'
import { useAuth } from '../../lib/auth'
import { minutesLabel, recordLine, useTask } from '../../lib/grad'
import { KIND_LABEL } from '../../lib/opportunity'
import { supabase } from '../../lib/supabase'

type TaskFile = { id: string; variant: string; storage_path: string | null; public_url: string | null; file_name: string; size_bytes: number | null }

// Everyone gets one version of the data, chosen from their account, so answers can't be copied.
function pickVariant(files: TaskFile[], userId: string, taskId: string) {
  const variants = [...new Set(files.map((f) => f.variant))].sort()
  if (variants.length === 0) return []
  let h = 0
  for (const ch of userId + taskId) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  const v = variants[h % variants.length]
  return files.filter((f) => f.variant === v)
}

function hostLabel(url: string) {
  try {
    return new URL(url.startsWith('http') ? url : `https://${url}`).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

export default function TaskPage() {
  const { id = '' } = useParams()
  const { session } = useAuth()
  const { data: task, isLoading } = useTask(id)
  const [reporting, setReporting] = useState(false)
  const [reported, setReported] = useState(false)
  const [reportError, setReportError] = useState('')

  const { data: files } = useQuery({
    queryKey: ['task-files', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('task_files').select('id, variant, storage_path, public_url, file_name, size_bytes').eq('task_id', id)
      if (error) throw error
      return (data ?? []) as TaskFile[]
    },
  })

  async function download(f: TaskFile) {
    if (f.public_url) {
      window.open(f.public_url, '_blank', 'noopener')
      return
    }
    const { data } = await supabase.storage.from('task-files').createSignedUrl(f.storage_path!, 60, { download: f.file_name })
    if (data?.signedUrl) window.location.href = data.signedUrl
  }

  async function report(reason: string) {
    setReportError('')
    const { error } = await supabase.from('reports').insert({ task_id: id, grad_id: session!.user.id, reason })
    if (error && !error.message.includes('duplicate')) setReportError("Couldn't send the report. Try again.")
    else setReported(true)
    setReporting(false)
  }

  if (isLoading) return <GradLayout narrow><SkeletonPage cards={2} /></GradLayout>
  if (!task) return <GradLayout narrow><p>This task isn't available any more.</p><Link to="/tasks">See open tasks</Link></GradLayout>

  const mine = session && files ? pickVariant(files, session.user.id, id) : []
  const record = recordLine(task.record)
  const links = [task.company_website, task.company_linkedin, task.company_social].filter(Boolean) as string[]

  return (
    <GradLayout narrow>
      <Link to="/tasks" className="flex min-h-11 items-center self-start text-[15px] no-underline">← All tasks</Link>

      <div className="-mt-4 flex flex-col gap-2">
        <span className="text-[15px] text-muted">
          {task.is_practice ? 'Tafutakazi practice task' : task.company_name} · {task.role}
          {links.map((l) => (
            <span key={l}> · <a href={l.startsWith('http') ? l : `https://${l}`} target="_blank" rel="noopener noreferrer">{hostLabel(l)}</a></span>
          ))}
        </span>
        <h1 className="m-0 text-[28px] font-bold leading-tight tracking-[-0.03em] sm:text-[36px]">{task.title}</h1>
      </div>

      <div className="-mt-2 flex flex-wrap gap-2 text-sm">
        {task.kind && task.kind !== 'job' && <span className="rounded-full bg-ink px-3 py-1.5 font-semibold text-white">{KIND_LABEL[task.kind]}</span>}
        <span className="rounded-full border border-line bg-white px-3 py-1.5">{minutesLabel(task.minutes_estimate)}</span>
        {task.stipend && <span className="rounded-full border border-line bg-white px-3 py-1.5">{task.stipend}</span>}
        {task.duration_months && <span className="rounded-full border border-line bg-white px-3 py-1.5">{task.duration_months} {task.duration_months === 1 ? 'month' : 'months'}</span>}
        {task.kind === 'volunteer' && task.hours_per_week && <span className="rounded-full border border-line bg-white px-3 py-1.5">{task.hours_per_week} hrs a week</span>}
        {task.openings && <span className="rounded-full bg-brand-soft px-3 py-1.5 font-semibold text-brand">{task.openings} {task.kind === 'internship' ? (task.openings === 1 ? 'place' : 'places') : task.openings === 1 ? 'job' : 'jobs'} open</span>}
        {task.location && <span className="rounded-full border border-line bg-white px-3 py-1.5">{task.location}</span>}
        {task.salary_range && <span className="rounded-full border border-line bg-white px-3 py-1.5">{task.salary_range}</span>}
        {task.start_note && <span className="rounded-full border border-line bg-white px-3 py-1.5">Starts: {task.start_note}</span>}
      </div>
      {record && <span className="-mt-3 text-sm text-brand">This company has: {record.toLowerCase()}.</span>}

      {task.status !== 'live' && <Notice tone="info">This task is closed. Your work stays on your profile.</Notice>}

      <section className="flex flex-col gap-2">
        <SectionTitle>The task</SectionTitle>
        <div className="whitespace-pre-line text-[17px] leading-relaxed">{task.instructions}</div>
      </section>

      {mine.length > 0 && (
        <section className="flex flex-col gap-2">
          <SectionTitle>Your data</SectionTitle>
          {mine.map((f) => (
            <button key={f.id} onClick={() => download(f)}
              className="press flex min-h-14 cursor-pointer items-center justify-between gap-3 rounded-xl border border-line bg-white px-4 text-left text-ink">
              <span className="flex flex-col">
                <span className="font-semibold">{f.file_name}</span>
                <span className="text-[13px] text-muted">Your own version{f.size_bytes ? ` · ${(f.size_bytes / 1048576).toFixed(1)} MB` : ''}</span>
              </span>
              <span className="text-[15px] font-semibold text-brand">Download</span>
            </button>
          ))}
        </section>
      )}

      <section className="flex flex-col gap-2.5">
        <SectionTitle>You'll submit</SectionTitle>
        {['Your finished work: a view-only link, plus one image or PDF preview', 'A 2–3 minute video of you explaining it', 'How you did it, at least 250 words'].map((s, k) => (
          <div key={s} className="flex items-baseline gap-3"><span className="font-semibold text-brand">{k + 1}</span><span>{s}</span></div>
        ))}
      </section>

      {task.status === 'live' && (
        <div className="flex flex-col gap-3">
          <LinkButton to={`/tasks/${id}/submit`}>{task.submitted ? 'Edit your submission' : 'Start this task'}</LinkButton>
          {!task.is_practice && !reported && !reporting && (
            <button onClick={() => setReporting(true)} className="press min-h-11 cursor-pointer self-start border-0 bg-transparent p-0 text-sm text-muted underline">
              Report this task
            </button>
          )}
          {reporting && (
            <div className="flex flex-col gap-2 rounded-xl border border-line bg-white p-4">
              <span className="font-semibold">What's wrong with this task?</span>
              {['It uses real customer data', "It's real client work, not a test", 'It asks for money', 'It looks fake'].map((r) => (
                <Button key={r} variant="outline" onClick={() => report(r)} className="min-h-11 justify-start text-[15px] font-normal">{r}</Button>
              ))}
              <button onClick={() => setReporting(false)} className="press min-h-11 cursor-pointer self-start border-0 bg-transparent p-0 text-sm text-muted">Cancel</button>
            </div>
          )}
          {reported && <Notice tone="info">Thanks. If three graduates report a task, it's paused automatically.</Notice>}
          {reportError && <Notice>{reportError}</Notice>}
        </div>
      )}
    </GradLayout>
  )
}
