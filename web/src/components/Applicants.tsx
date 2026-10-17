import { useState, type FormEvent } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { RubricPart } from '../lib/opportunity'
import { Button } from './ui'

type Round2 = {
  id: string; status: 'invited' | 'submitted'; due_at: string; brief: string; questions: string[]
  video_url: string | null; link: string | null; note: string | null; responded_at: string | null
}
type Applicant = {
  submission_id: string; grad_id: string; full_name: string; course: string; summary: string; created_at: string
  answered: boolean; invited: boolean; answers: string[]; score: number | null; marks: Record<string, number> | null; round2: Round2 | null
}

const day = (iso: string) => new Date(iso).toLocaleDateString('en-KE', { weekday: 'short', day: 'numeric', month: 'short' })
const inputClass = 'w-full rounded-[10px] border border-line-strong bg-white p-3 text-base'

function ScoreForm({ a, rubric, onSaved }: { a: Applicant; rubric: RubricPart[]; onSaved: () => void }) {
  const [marks, setMarks] = useState<Record<string, number>>(a.marks ?? {})
  const [error, setError] = useState('')
  const complete = rubric.every((r) => marks[r.name])
  async function save() {
    setError('')
    const { error } = await supabase.rpc('score_submission', { p_submission: a.submission_id, p_marks: marks })
    if (error) return setError(error.message)
    onSaved()
  }
  return (
    <div className="flex flex-col gap-2.5">
      {rubric.map((r) => (
        <div key={r.name} className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm">{r.name} <span className="text-muted">· {r.weight}%</span></span>
          <div className="flex gap-1" role="group" aria-label={`${r.name} mark`}>
            {[1, 2, 3, 4, 5].map((m) => (
              <button key={m} type="button" aria-pressed={marks[r.name] === m} onClick={() => setMarks({ ...marks, [r.name]: m })}
                className={`press h-9 w-9 cursor-pointer rounded-lg border text-sm ${marks[r.name] === m ? 'border-brand bg-brand text-white' : 'border-line-strong bg-white text-ink'}`}>
                {m}
              </button>
            ))}
          </div>
        </div>
      ))}
      <div className="flex items-center gap-3">
        <Button type="button" onClick={save} disabled={!complete} className="min-h-10 px-4 text-sm">Save score</Button>
        {a.score != null && <span className="text-sm text-muted">Saved: {Number(a.score)} / 100</span>}
      </div>
      {error && <span className="text-sm text-danger">{error}</span>}
    </div>
  )
}

function Round2Form({ a, onSent }: { a: Applicant; onSent: () => void }) {
  const [open, setOpen] = useState(false)
  const [questions, setQuestions] = useState<string[]>([''])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  async function send(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setBusy(true)
    const f = new FormData(e.currentTarget)
    const { error } = await supabase.rpc('move_to_round2', {
      p_submission: a.submission_id,
      p_brief: String(f.get('brief')).trim(),
      p_questions: questions.map((q) => q.trim()).filter(Boolean),
      p_days: Number(f.get('days')),
    })
    setBusy(false)
    if (error) return setError(error.message)
    onSent()
  }
  if (!open) {
    return <button type="button" onClick={() => setOpen(true)} className="press min-h-10 cursor-pointer self-start border-0 bg-transparent p-0 text-sm font-semibold text-brand">Move to round 2</button>
  }
  return (
    <form onSubmit={send} className="flex flex-col gap-3 rounded-xl bg-ground p-4">
      <span className="font-semibold">Round 2 for {a.full_name.split(' ')[0]}</span>
      <span className="text-[13px] text-muted">A short follow-up, under 2 hours. They answer on video. They'll get an email.</span>
      <label className="flex flex-col gap-1.5 text-sm font-semibold">
        What should they do?
        <textarea name="brief" required minLength={20} maxLength={2000} rows={3} className={inputClass}
          placeholder="e.g. Take your analysis and present it to our credit committee in 5 slides. Record yourself presenting." />
      </label>
      {questions.map((q, i) => (
        <input key={i} aria-label={`Question ${i + 1}`} value={q} maxLength={200} placeholder={i === 0 ? 'A question to answer on video (optional)' : 'Another question (optional)'}
          onChange={(e) => setQuestions(questions.map((x, j) => (j === i ? e.target.value : x)))} className={`${inputClass} min-h-11 py-0`} />
      ))}
      {questions.length < 3 && (
        <button type="button" onClick={() => setQuestions([...questions, ''])} className="press min-h-9 cursor-pointer self-start border-0 bg-transparent p-0 text-sm font-semibold text-brand">+ Add a question</button>
      )}
      <label className="flex items-center gap-2 text-sm">
        Days to answer
        <select name="days" defaultValue="5" className="min-h-10 rounded-md border border-line-strong bg-white px-2">
          {[2, 3, 5, 7, 10, 14].map((d) => <option key={d}>{d}</option>)}
        </select>
      </label>
      {error && <span className="text-sm text-danger">{error}</span>}
      <div className="flex gap-2">
        <Button type="submit" disabled={busy} className="min-h-10 px-4 text-sm">{busy ? 'Sending…' : 'Send round 2'}</Button>
        <Button type="button" variant="outline" onClick={() => setOpen(false)} className="min-h-10 px-4 text-sm">Cancel</Button>
      </div>
    </form>
  )
}

function Row({ a, questions, rubric, refresh }: { a: Applicant; questions: string[]; rubric: RubricPart[]; refresh: () => void }) {
  const [open, setOpen] = useState(false)
  const r2 = a.round2
  const status = a.invited ? 'Invited' : r2?.status === 'submitted' ? 'Round 2 answered' : r2 ? 'In round 2' : a.answered ? 'Feedback given' : 'Needs your feedback'
  return (
    <div className="flex flex-col gap-3 px-4 py-3">
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open}
        className="press flex w-full cursor-pointer flex-wrap items-baseline justify-between gap-2 border-0 bg-transparent p-0 text-left text-ink">
        <span className="flex min-w-0 flex-col">
          <span className="font-semibold">{a.full_name} <span className="font-normal text-muted">· {a.course}</span></span>
          <span className="text-sm text-ink-2">{a.summary}</span>
        </span>
        <span className="flex items-baseline gap-3 text-sm">
          {a.score != null && <span className="font-semibold tabular-nums text-ink">{Number(a.score)}/100</span>}
          <span className={a.invited || r2 ? 'font-semibold text-brand' : a.answered ? 'text-muted' : 'font-semibold text-ink'}>{status}</span>
        </span>
      </button>

      {open && (
        <div className="flex flex-col gap-4 border-t border-[#EEEEE9] pt-3">
          <Link to={`/browse/${a.grad_id}`} className="self-start text-sm font-semibold">Watch their work →</Link>

          {questions.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="text-[13px] font-semibold uppercase tracking-[0.06em] text-muted">Their answers</span>
              {questions.map((q, i) => (
                <div key={i} className="flex flex-col">
                  <span className="text-sm text-muted">{q}</span>
                  <span>{a.answers?.[i] || '—'}</span>
                </div>
              ))}
            </div>
          )}

          {rubric.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="text-[13px] font-semibold uppercase tracking-[0.06em] text-muted">Your score</span>
              <ScoreForm a={a} rubric={rubric} onSaved={refresh} />
            </div>
          )}

          <div className="flex flex-col gap-2">
            <span className="text-[13px] font-semibold uppercase tracking-[0.06em] text-muted">Round 2</span>
            {!r2 && <Round2Form a={a} onSent={refresh} />}
            {r2 && (
              <div className="flex flex-col gap-1.5 rounded-xl bg-ground p-4 text-[15px]">
                <span className="whitespace-pre-line">{r2.brief}</span>
                {r2.questions?.map((q) => <span key={q} className="text-sm text-muted">• {q}</span>)}
                {r2.status === 'invited' ? (
                  <span className="text-sm text-muted">Waiting for their answer. Due {day(r2.due_at)}.</span>
                ) : (
                  <>
                    <a href={r2.video_url!} target="_blank" rel="noopener noreferrer nofollow" className="font-semibold">Watch their answer ↗</a>
                    {r2.link && <a href={r2.link} target="_blank" rel="noopener noreferrer nofollow" className="text-sm">Their file or link ↗</a>}
                    {r2.note && <span className="text-sm text-ink-2">"{r2.note}"</span>}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// Everyone who did one of the company's tasks, best score first, with answers, scoring and round 2.
export function Applicants({ taskId }: { taskId: string }) {
  const queryClient = useQueryClient()
  const { data: task } = useQuery({
    queryKey: ['task-screening', taskId],
    queryFn: async () => {
      const { data } = await supabase.from('tasks').select('questions, rubric').eq('id', taskId).single()
      return data as { questions: string[]; rubric: RubricPart[] } | null
    },
  })
  const { data, isLoading } = useQuery({
    queryKey: ['task-submissions', taskId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('task_submissions', { p_task: taskId })
      if (error) throw error
      return (data ?? []) as Applicant[]
    },
  })
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['task-submissions', taskId] })

  if (isLoading) return <p className="m-0 text-sm text-muted">Loading…</p>
  if (!data?.length) return <p className="m-0 text-sm text-muted">No submissions yet. You'll get a daily email when work comes in.</p>
  return (
    <div className="flex flex-col divide-y divide-[#EEEEE9] rounded-lg border border-line bg-white">
      {data.map((a) => <Row key={a.submission_id} a={a} questions={task?.questions ?? []} rubric={task?.rubric ?? []} refresh={refresh} />)}
    </div>
  )
}
