import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { RecruiterLayout } from '../../components/RecruiterLayout'
import { Applicants } from '../../components/Applicants'
import { LinkButton, Notice, SkeletonCards } from '../../components/ui'
import { useAllowance, useMyTasks, type MyTask } from '../../lib/recruiter'
import { supabase } from '../../lib/supabase'

const statusLabel: Record<MyTask['status'], string> = {
  checking: 'Being checked',
  live: 'Live',
  flagged: 'Paused',
  off: 'Off',
}

export default function MyTasks() {
  const queryClient = useQueryClient()
  const { data: tasks, isLoading } = useMyTasks()
  const { data: allowance } = useAllowance()
  const [open, setOpen] = useState<string | null>(null)
  const [error, setError] = useState('')

  async function setOn(t: MyTask, on: boolean) {
    setError('')
    const { error } = await supabase.from('tasks').update({ status: on ? 'checking' : 'off' }).eq('id', t.id)
    if (error) setError(error.message)
    queryClient.invalidateQueries({ queryKey: ['my-tasks'] })
    queryClient.invalidateQueries({ queryKey: ['allowance'] })
  }

  return (
    <RecruiterLayout>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="m-0 text-[30px] font-bold tracking-[-0.03em] sm:text-[34px]">My tasks</h1>
          {allowance && <span className="text-muted">{allowance.open} of {allowance.limit} open · give feedback on 80% to unlock up to 7</span>}
        </div>
        <LinkButton to="/post">Post a task</LinkButton>
      </div>

      {error && <Notice>{error}</Notice>}
      {isLoading && <SkeletonCards count={3} />}
      {!isLoading && !tasks?.length && <p className="m-0 text-ink-2">You haven't posted a task yet. <Link to="/post">Post your first one</Link>. Graduates do it, and you invite the ones you want to interview.</p>}

      <div className="flex flex-col gap-3">
        {tasks?.map((t) => {
          const on = t.status !== 'off'
          return (
            <div key={t.id} className="flex flex-col gap-4 rounded-xl border border-line bg-white p-5">
              <div className="flex flex-wrap items-center gap-5">
                <div className="flex min-w-0 flex-[999_1_300px] flex-col gap-0.5">
                  <span className="text-[17px] font-semibold">{t.title}</span>
                  <span className="text-sm text-muted">
                    {t.role}{t.openings ? ` · ${t.openings} ${t.openings === 1 ? 'job' : 'jobs'}` : ''} · {t.received} submissions, {t.answered} with feedback
                  </span>
                  <span className={`text-sm ${t.status === 'flagged' || t.check_notes?.startsWith('Not approved') ? 'text-danger' : t.status === 'live' ? 'font-semibold text-brand' : 'text-muted'}`}>
                    {statusLabel[t.status]}{t.check_notes ? `: ${t.check_notes}` : ''}
                  </span>
                </div>
                <button onClick={() => setOpen(open === t.id ? null : t.id)} aria-expanded={open === t.id}
                  className="press min-h-11 cursor-pointer border-0 bg-transparent text-sm font-semibold text-brand">
                  {open === t.id ? 'Hide applicants' : 'Review applicants'}
                </button>
                <div className="flex items-center gap-2.5">
                  <span className="min-w-7 text-sm text-ink-2">{on ? 'On' : 'Off'}</span>
                  <button role="switch" aria-checked={on} aria-label={`Show "${t.title}" to graduates`} onClick={() => setOn(t, !on)}
                    className="press h-8 w-[52px] cursor-pointer rounded-full border-0 p-[3px] transition-colors duration-200"
                    style={{ background: on ? 'var(--color-brand)' : '#C9C9C3' }}>
                    <span className="block h-[26px] w-[26px] rounded-full bg-white transition-transform duration-200 ease-[var(--ease-out-strong)]"
                      style={{ transform: `translateX(${on ? 20 : 0}px)` }} />
                  </button>
                </div>
              </div>
              {!on && t.received > 0 && <span className="-mt-2 text-sm text-muted">Off · graduates who did it are told in their daily email.</span>}
              {open === t.id && <Applicants taskId={t.id} />}
            </div>
          )
        })}
      </div>

      <span className="text-sm text-muted">
        Turn a task off when you've hired or aren't hiring any more. Turned-off tasks don't count toward your limit.
        Turning one back on sends it for a quick check again.
      </span>
    </RecruiterLayout>
  )
}
