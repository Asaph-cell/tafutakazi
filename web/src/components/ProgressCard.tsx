import { Link } from 'react-router-dom'
import { Card } from './GradLayout'
import { useMyCv } from '../lib/cv'
import type { MySubmission } from '../lib/grad'
import { useGradLinks } from './OtherWork'

type Step = { label: string; done: boolean; to?: string; action?: string }

// Only steps the graduate controls, ticked from what they have really done.
export function ProgressCard({ work, gradId }: { work: MySubmission[]; gradId: string | undefined }) {
  const { data: cv } = useMyCv()
  const { data: links } = useGradLinks(gradId)
  const steps: Step[] = [
    { label: 'Join Tafutakazi', done: true },
    { label: 'Finish your first task', done: work.length > 0, to: '/tasks', action: 'Find a task' },
    { label: 'Build your CV', done: Boolean(cv), to: '/me/cv', action: 'Build it' },
    { label: 'Add your other work', done: (links?.length ?? 0) > 0, to: '/me/profile', action: 'Add a link' },
    { label: 'Finish three tasks', done: work.length >= 3, to: '/tasks', action: 'Find a task' },
  ]
  const done = steps.filter((s) => s.done).length
  const next = steps.find((s) => !s.done)
  const skills = [...new Set(work.flatMap((s) => s.tools ?? []))]

  return (
    <Card title="Your progress" action={<span className="text-sm font-semibold tabular-nums text-brand">{done} of {steps.length}</span>}>
      <div className="h-2.5 overflow-hidden rounded-full bg-ground" role="progressbar" aria-valuenow={done} aria-valuemin={0} aria-valuemax={steps.length} aria-label="Steps done">
        <div className="h-full rounded-full bg-brand transition-[width] duration-500" style={{ width: `${(done / steps.length) * 100}%` }} />
      </div>
      <ol className="m-0 flex list-none flex-col gap-2 p-0">
        {steps.map((s) => (
          <li key={s.label} className="flex min-h-9 flex-wrap items-center gap-x-3 gap-y-1">
            <span aria-hidden="true" className={`grid h-6 w-6 flex-none place-items-center rounded-full border-2 text-[13px] font-bold ${s.done ? 'border-brand bg-brand text-white' : s === next ? 'border-accent-dark' : 'border-line-strong'}`}>
              {s.done ? '✓' : ''}
            </span>
            <span className={`flex-1 ${s.done ? 'text-muted' : s === next ? 'font-semibold' : 'text-ink-2'}`}>
              {s.label}<span className="sr-only">{s.done ? ' (done)' : ''}</span>
            </span>
            {s === next && s.to && <Link to={s.to} className="text-sm font-semibold">{s.action} →</Link>}
          </li>
        ))}
      </ol>
      {!next && <p className="m-0 text-[15px] text-ink-2">You're all set. Every task you add makes your profile stronger.</p>}
      {skills.length > 0 && (
        <div className="flex flex-col gap-2 border-t border-[#EEEEE9] pt-4">
          <span className="text-sm font-semibold">Tools you've used on tasks</span>
          <div className="flex flex-wrap gap-1.5">
            {skills.map((t) => <span key={t} className="rounded-full bg-brand-soft px-2.5 py-0.5 text-[13px] text-brand">{t}</span>)}
          </div>
        </div>
      )}
    </Card>
  )
}
