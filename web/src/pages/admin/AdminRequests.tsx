import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { AdminLayout } from '../../components/AdminLayout'
import { SectionTitle } from '../../components/GradLayout'
import { supabase } from '../../lib/supabase'
import { SkeletonCards } from '../../components/ui'

type Row = {
  id: string
  role: string
  tools: string[]
  details: string
  status: 'open' | 'done' | 'declined'
  task_id: string | null
  admin_note: string | null
  created_at: string
  grad: { course: string; profile: { full_name: string } | null } | null
}

export default function AdminRequests() {
  const queryClient = useQueryClient()
  const [show, setShow] = useState<'open' | 'answered'>('open')
  const { data, isLoading } = useQuery({
    queryKey: ['admin-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_requests')
        .select('id, role, tools, details, status, task_id, admin_note, created_at, grad:grads(course, profile:profiles(full_name))')
        .order('created_at', { ascending: true })
      if (error) throw error
      return (data ?? []) as unknown as Row[]
    },
  })

  const rows = (data ?? []).filter((r) => (show === 'open' ? r.status === 'open' : r.status !== 'open'))
  // Demand by role and tool, so the most-wanted tasks get written first.
  const demand = Object.entries(
    (data ?? []).filter((r) => r.status === 'open').reduce<Record<string, number>>((acc, r) => {
      const key = r.role + (r.tools.length ? ` · ${r.tools.join(', ')}` : '')
      acc[key] = (acc[key] ?? 0) + 1
      return acc
    }, {}),
  ).sort((a, b) => b[1] - a[1])

  async function decline(id: string) {
    const note = window.prompt('A short reason the graduate will see (optional):', 'We already have a task like this. Look under All tasks.')
    if (note === null) return
    await supabase.from('task_requests').update({ status: 'declined', admin_note: note || null, answered_at: new Date().toISOString() }).eq('id', id)
    queryClient.invalidateQueries({ queryKey: ['admin-requests'] })
  }

  return (
    <AdminLayout>
      <div className="flex flex-col gap-3">
        <h1 className="m-0 text-[32px] font-bold tracking-[-0.03em]">Task requests</h1>
        <p className="m-0 max-w-[62ch] text-ink-2">
          Graduates asking for a practice task to show a particular skill. Turn the best ones into practice tasks;
          everyone can then do them. Recruiters never see this list.
        </p>
        <div className="flex gap-2">
          {(['open', 'answered'] as const).map((v) => (
            <button key={v} aria-pressed={show === v} onClick={() => setShow(v)}
              className={`press min-h-11 cursor-pointer rounded-full border px-4 text-sm ${show === v ? 'border-ink bg-ink text-white' : 'border-line-strong bg-white text-ink'}`}>
              {v === 'open' ? 'Waiting' : 'Answered'}
            </button>
          ))}
        </div>
      </div>

      {show === 'open' && demand.length > 0 && (
        <section className="flex flex-col gap-2">
          <SectionTitle>Most wanted</SectionTitle>
          <div className="flex flex-wrap gap-2">
            {demand.map(([k, n]) => (
              <span key={k} className="rounded-full border border-line bg-white px-3 py-1.5 text-sm">{k} · <strong>{n}</strong></span>
            ))}
          </div>
        </section>
      )}

      {isLoading && <SkeletonCards count={3} />}
      {!isLoading && rows.length === 0 && <p className="text-muted">{show === 'open' ? 'No requests waiting.' : 'Nothing answered yet.'}</p>}

      <div className="flex flex-col gap-2.5">
        {rows.map((r) => (
          <div key={r.id} className="flex flex-wrap items-start gap-x-6 gap-y-3 rounded-xl border border-line bg-white p-4">
            <div className="flex min-w-0 flex-[999_1_380px] flex-col gap-1">
              <span className="font-semibold">{r.role}{r.tools.length ? ` · ${r.tools.join(', ')}` : ''}</span>
              <span className="text-[15px] text-ink-2">{r.details}</span>
              <span className="text-sm text-muted">
                {r.grad?.profile?.full_name ?? 'Graduate'} · {r.grad?.course} · {new Date(r.created_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })}
              </span>
              {r.status !== 'open' && (
                <span className="text-sm text-muted">
                  {r.status === 'done' ? 'Answered with a task' : 'Declined'}{r.admin_note ? `: ${r.admin_note}` : ''}
                </span>
              )}
            </div>
            {r.status === 'open' && (
              <div className="flex flex-wrap gap-2">
                <Link to={`/admin/new?request=${r.id}`} className="press flex min-h-10 items-center rounded-lg bg-brand px-3 text-sm font-semibold text-white no-underline hover:text-white">Create task</Link>
                <button onClick={() => decline(r.id)} className="press min-h-10 cursor-pointer rounded-lg border border-line-strong bg-white px-3 text-sm font-semibold">Decline</button>
              </div>
            )}
            {r.status === 'done' && r.task_id && <Link to={`/admin/tasks/${r.task_id}`} className="text-sm font-semibold">See the task</Link>}
          </div>
        ))}
      </div>
    </AdminLayout>
  )
}
