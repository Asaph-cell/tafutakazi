import { useEffect, useState, type FormEvent } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AdminLayout } from '../../components/AdminLayout'
import { SectionTitle } from '../../components/GradLayout'
import { Button, Notice, SkeletonPage } from '../../components/ui'
import { supabase } from '../../lib/supabase'
import { useReviewList } from './AdminReview'

type Detail = {
  id: string
  summary: string
  writeup: string
  word_count: number
  video_url: string
  preview_path: string | null
  created_at: string
  task: { id: string; title: string; role: string; instructions: string } | null
  grad: { course: string; institution: string | null; grad_year: number | null; profile: { full_name: string } | null } | null
  verdict: { strengths: string; improve: string } | null
}

export default function AdminSubmission() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: list } = useReviewList()
  const [strengths, setStrengths] = useState('')
  const [improve, setImprove] = useState('')
  const [workLink, setWorkLink] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const { data: s, isLoading } = useQuery({
    queryKey: ['admin-submission', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('submissions')
        .select('id, summary, writeup, word_count, video_url, preview_path, created_at, task:tasks(id, title, role, instructions), grad:grads(course, institution, grad_year, profile:profiles(full_name)), verdict:verdicts(strengths, improve)')
        .eq('id', id)
        .single()
      if (error) throw error
      return data as unknown as Detail
    },
  })

  const { data: previewUrl } = useQuery({
    queryKey: ['admin-preview', s?.preview_path],
    enabled: Boolean(s?.preview_path),
    queryFn: async () => (await supabase.storage.from('previews').createSignedUrl(s!.preview_path!, 600)).data?.signedUrl ?? null,
  })

  useEffect(() => {
    setStrengths(s?.verdict?.strengths ?? '')
    setImprove(s?.verdict?.improve ?? '')
    setWorkLink(null)
  }, [s])

  async function openWork() {
    const { data } = await supabase.rpc('get_work_link', { sub: id })
    if (typeof data === 'string') {
      setWorkLink(data)
      window.open(data, '_blank', 'noopener')
    }
  }

  const next = list?.find((r) => !r.verdict && r.id !== id)

  async function save(e: FormEvent) {
    e.preventDefault()
    setError('')
    setBusy(true)
    const { error } = await supabase.from('verdicts').upsert({ submission_id: id, strengths: strengths.trim(), improve: improve.trim() })
    setBusy(false)
    if (error) return setError(error.message)
    await queryClient.invalidateQueries({ queryKey: ['admin-review'] })
    await queryClient.invalidateQueries({ queryKey: ['admin-submission', id] })
    if (next) navigate(`/admin/review/${next.id}`)
    else navigate('/admin/review')
  }

  if (isLoading || !s) return <AdminLayout><SkeletonPage cards={2} /></AdminLayout>

  const isPdf = s.preview_path?.toLowerCase().endsWith('.pdf')

  return (
    <AdminLayout>
      <Link to="/admin/review" className="flex min-h-11 items-center self-start no-underline">← Review work</Link>
      <div className="-mt-4 flex flex-col gap-1">
        <h1 className="m-0 text-[28px] font-bold tracking-[-0.03em]">{s.grad?.profile?.full_name}</h1>
        <span className="text-muted">
          {[s.grad?.course, s.grad?.institution, s.grad?.grad_year].filter(Boolean).join(', ')} · {s.task?.title}
        </span>
      </div>

      <div className="flex flex-wrap items-start gap-8">
        <div className="flex min-w-0 flex-[999_1_480px] flex-col gap-6">
          <section className="flex flex-col gap-2">
            <SectionTitle>Their one line</SectionTitle>
            <p className="m-0 text-[17px]">{s.summary}</p>
          </section>

          <section className="flex flex-col gap-2">
            <SectionTitle>Preview</SectionTitle>
            {!s.preview_path && <p className="m-0 text-muted">No preview.</p>}
            {previewUrl && (isPdf
              ? <a href={previewUrl} target="_blank" rel="noopener noreferrer">Open the PDF preview</a>
              : <img src={previewUrl} alt="Preview of the submitted work" className="w-full rounded-xl border border-line" />)}
          </section>

          <div className="flex flex-wrap gap-2">
            <a href={s.video_url} target="_blank" rel="noopener noreferrer"
              className="press flex min-h-12 items-center rounded-xl bg-ink px-5 font-semibold text-white no-underline hover:text-white">Watch the video</a>
            <button onClick={openWork} className="press min-h-12 cursor-pointer rounded-xl border border-ink bg-white px-5 font-semibold text-ink">Open the full work</button>
          </div>
          {workLink && <span className="break-all text-sm text-muted">{workLink}</span>}

          <section className="flex flex-col gap-2">
            <SectionTitle>How they did it · {s.word_count} words</SectionTitle>
            <div className="whitespace-pre-line rounded-xl border border-line bg-white p-5 leading-relaxed">{s.writeup}</div>
          </section>

          <details className="rounded-xl border border-line bg-white p-5">
            <summary className="cursor-pointer font-semibold">The task they were given</summary>
            <div className="mt-3 whitespace-pre-line leading-relaxed text-ink-2">{s.task?.instructions}</div>
          </details>
        </div>

        <form onSubmit={save} className="flex min-w-0 flex-[1_1_300px] flex-col gap-4 rounded-2xl border border-line bg-white p-5 lg:sticky lg:top-6">
          <SectionTitle>Your verdict</SectionTitle>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="strengths" className="font-semibold">What's strong</label>
            <textarea id="strengths" rows={4} required maxLength={400} value={strengths} onChange={(e) => setStrengths(e.target.value)}
              placeholder="e.g. Caught the duplicate receipts most people miss. The dashboard answers the manager's question at a glance."
              className="w-full resize-y rounded-[10px] border border-line-strong p-3 text-base" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="improve" className="font-semibold">What to improve</label>
            <textarea id="improve" rows={3} required maxLength={400} value={improve} onChange={(e) => setImprove(e.target.value)}
              placeholder="e.g. Chart labels are too small on a phone."
              className="w-full resize-y rounded-[10px] border border-line-strong p-3 text-base" />
          </div>
          <span className="text-[13px] text-muted">Be specific and honest. Perfect scores make employers trust verdicts less.</span>
          {error && <Notice>{error}</Notice>}
          <Button type="submit" busy={busy} busyLabel="Saving…">{next ? 'Save and go to the next one' : 'Save verdict'}</Button>
        </form>
      </div>
    </AdminLayout>
  )
}
