import { useState } from 'react'
import { Link } from 'react-router-dom'
import { GradLayout, SectionTitle } from '../../components/GradLayout'
import { TaskCardLink } from '../../components/TaskCardLink'
import { useGrad, useTaskFeed } from '../../lib/grad'
import { SkeletonCards } from '../../components/ui'

export default function Tasks() {
  const { data: grad } = useGrad()
  const { data: tasks, isLoading, error } = useTaskFeed()
  const [all, setAll] = useState(false)

  const open = (tasks ?? []).filter((t) => t.status === 'live')
  const shown = all || !grad ? open : open.filter((t) => t.role.toLowerCase() === grad.track.toLowerCase())
  const company = shown.filter((t) => !t.is_practice)
  const practice = shown.filter((t) => t.is_practice)

  return (
    <GradLayout>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="m-0 text-[28px] font-bold tracking-[-0.03em] sm:text-[34px]">Tasks</h1>
          <span className="text-ink-2">Pick one, do it in a few hours, and explain it on video.</span>
        </div>
        {grad && (
          <div className="flex flex-wrap gap-2" role="group" aria-label="Which tasks to show">
            {[[false, `For ${grad.track}`], [true, 'All tasks']].map(([value, label]) => (
              <button key={String(value)} aria-pressed={all === value} onClick={() => setAll(value as boolean)}
                className={`press min-h-11 cursor-pointer rounded-full border px-4 text-sm ${all === value ? 'border-ink bg-ink text-white' : 'border-line-strong bg-white text-ink'}`}>
                {label as string}
              </button>
            ))}
          </div>
        )}
      </div>

      {isLoading && <SkeletonCards count={4} />}
      {error && <p className="text-danger">Couldn't load tasks. Check your connection and try again.</p>}

      {!isLoading && (
        <section className="flex flex-col gap-3">
          <SectionTitle>From companies · {company.length}</SectionTitle>
          {company.length === 0 ? (
            <p className="m-0 max-w-[62ch] rounded-2xl border border-line bg-white p-5 text-ink-2">
              No company has posted {all || !grad ? 'a task' : `a ${grad.track} task`} right now. Start with a practice
              task below: recruiters see that work too. We'll email you when one is posted.
            </p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">{company.map((t) => <TaskCardLink key={t.id} task={t} />)}</div>
          )}
        </section>
      )}

      {!isLoading && practice.length > 0 && (
        <section className="flex flex-col gap-3">
          <SectionTitle>Practice tasks · always open</SectionTitle>
          <div className="grid gap-3 md:grid-cols-2">{practice.map((t) => <TaskCardLink key={t.id} task={t} />)}</div>
          <span className="text-sm text-muted">Written by Tafutakazi, based on real Kenyan businesses. Your work goes on your profile like any other task.</span>
        </section>
      )}

      {!isLoading && !all && grad && practice.length === 0 && company.length === 0 && (
        <button onClick={() => setAll(true)} className="press min-h-11 cursor-pointer self-start border-0 bg-transparent p-0 font-semibold text-brand underline">
          See tasks for other roles
        </button>
      )}

      {!isLoading && (
        <Link to="/tasks/request" className="press flex flex-col gap-1 rounded-2xl border border-dashed border-brand bg-white p-5 text-ink no-underline hover:text-ink md:max-w-[50%]">
          <span className="font-semibold text-brand">Want to show a skill there's no task for?</span>
          <span className="text-sm text-ink-2">Request a task. Tafutakazi writes practice tasks from the best requests.</span>
        </Link>
      )}
    </GradLayout>
  )
}
