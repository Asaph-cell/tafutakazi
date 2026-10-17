import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { AdminLayout } from '../../components/AdminLayout'
import { supabase } from '../../lib/supabase'
import { SkeletonCards } from '../../components/ui'

export type ReviewRow = {
  id: string
  summary: string
  created_at: string
  task: { title: string; role: string; company_id: string | null } | null
  grad: { course: string; institution: string | null; profile: { full_name: string } | null } | null
  verdict: { strengths: string } | null
}

export const reviewSelect =
  'id, summary, created_at, task:tasks(title, role, company_id), grad:grads(course, institution, profile:profiles(full_name)), verdict:verdicts(strengths)'

export function useReviewList() {
  return useQuery({
    queryKey: ['admin-review'],
    queryFn: async () => {
      const { data, error } = await supabase.from('submissions').select(reviewSelect).order('created_at', { ascending: true })
      if (error) throw error
      return (data ?? []) as unknown as ReviewRow[]
    },
  })
}

export default function AdminReview() {
  const [done, setDone] = useState(false)
  const { data, isLoading } = useReviewList()
  const rows = (data ?? []).filter((r) => Boolean(r.verdict) === done)

  return (
    <AdminLayout>
      <div className="flex flex-col gap-3">
        <h1 className="m-0 text-[32px] font-bold tracking-[-0.03em]">Review work</h1>
        <p className="m-0 max-w-[60ch] text-ink-2">
          Write an honest verdict on each submission: what's strong and what to improve. It shows on the graduate's
          profile and CV link. Oldest first, so nobody waits too long.
        </p>
        <div className="flex gap-2">
          {[[false, 'Needs a verdict'], [true, 'Done']].map(([v, label]) => (
            <button key={String(v)} aria-pressed={done === v} onClick={() => setDone(v as boolean)}
              className={`press min-h-11 cursor-pointer rounded-full border px-4 text-sm ${done === v ? 'border-ink bg-ink text-white' : 'border-line-strong bg-white text-ink'}`}>
              {label as string}{data ? ` · ${(data ?? []).filter((r) => Boolean(r.verdict) === v).length}` : ''}
            </button>
          ))}
        </div>
      </div>

      {isLoading && <SkeletonCards count={3} />}
      {!isLoading && rows.length === 0 && <p className="text-muted">{done ? 'No verdicts written yet.' : 'All caught up. Nothing waiting for a verdict.'}</p>}

      <div className="flex flex-col gap-2.5">
        {rows.map((r) => (
          <Link key={r.id} to={`/admin/review/${r.id}`}
            className="press flex flex-col gap-0.5 rounded-xl border border-line bg-white p-4 text-ink no-underline hover:text-ink">
            <span className="font-semibold">{r.grad?.profile?.full_name ?? 'Graduate'} · {r.task?.title}</span>
            <span className="text-sm text-muted">
              {r.task?.company_id ? 'Company task' : 'Practice task'} · {r.task?.role} · submitted {new Date(r.created_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })}
            </span>
            <span className="text-[15px] text-ink-2">{r.summary}</span>
          </Link>
        ))}
      </div>
    </AdminLayout>
  )
}
