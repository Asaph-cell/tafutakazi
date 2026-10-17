import { Link } from 'react-router-dom'
import { minutesLabel, recordLine, type TaskCard } from '../lib/grad'
import { termsLine } from '../lib/opportunity'

export function TaskCardLink({ task }: { task: TaskCard }) {
  const record = recordLine(task.record)
  return (
    <Link
      to={`/tasks/${task.id}`}
      className="press flex h-full flex-col gap-1 rounded-xl border border-line bg-white p-4 text-ink no-underline hover:border-line-strong hover:text-ink sm:p-5"
    >
      <span className="self-start rounded-full bg-ground px-2.5 py-0.5 text-xs font-semibold text-ink-2">{task.role}</span>
      <span className="mt-1 font-semibold">{task.title}</span>
      <span className="text-sm text-muted">
        {task.is_practice ? 'Tafutakazi practice task' : task.company_name} · {minutesLabel(task.minutes_estimate)}
      </span>
      {termsLine(task) && <span className="text-[13px] font-semibold text-ink-2">{termsLine(task)}</span>}
      {task.openings && (
        <span className="text-[13px] font-semibold text-brand">
          {task.openings} {task.openings === 1 ? 'job' : 'jobs'} open{task.location ? ` · ${task.location}` : ''}
        </span>
      )}
      {record && <span className="text-[13px] text-muted">{record}</span>}
      {task.submitted && <span className="text-[13px] font-semibold text-brand">You've submitted this</span>}
    </Link>
  )
}
