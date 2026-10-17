import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Card, GradLayout, Stat } from '../../components/GradLayout'
import { GradInviteCard } from '../../components/InviteCards'
import { Round2Card, useMyRound2 } from '../../components/Round2Card'
import { TaskCardLink } from '../../components/TaskCardLink'
import { LinkButton, Notice, Skeleton } from '../../components/ui'
import { useAuth } from '../../lib/auth'
import { plural, useGrad, useMyActivity, useMySubmissions, useTaskFeed } from '../../lib/grad'
import { useMyRequests } from './RequestTask'

function ago(iso: string) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
  if (days <= 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 30) return `${days} days ago`
  return new Date(iso).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })
}

function CopyLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button type="button" onClick={async () => {
      try { await navigator.clipboard.writeText(url) } catch { /* visible anyway */ }
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }} className="press min-h-11 cursor-pointer self-start rounded-[10px] border border-line-strong bg-white px-4 text-[15px] font-semibold text-ink">
      {copied ? 'Copied' : 'Copy link'}
    </button>
  )
}

export default function MyWork() {
  const { session, profile } = useAuth()
  const submittedTitle = (useLocation().state as { submitted?: string } | null)?.submitted
  const { data: grad } = useGrad()
  const { data: subs, isLoading } = useMySubmissions()
  const { data: activity } = useMyActivity()
  const { data: feed } = useTaskFeed()
  const { data: requests } = useMyRequests()

  const first = profile?.full_name.split(' ')[0] ?? ''
  const monthAgo = Date.now() - 30 * 86400000
  const viewsThisMonth = activity?.views.filter((v) => new Date(v.created_at).getTime() > monthAgo).length ?? 0
  const count = (list: { submission_id: string }[] | undefined, id: string) => list?.filter((x) => x.submission_id === id).length ?? 0

  const open = (feed ?? []).filter((t) => t.status === 'live' && !t.submitted)
  const forMe = grad ? open.filter((t) => t.role === grad.track) : open
  const suggestions = (forMe.length ? forMe : open).slice(0, 3)
  const work = subs ?? []
  const hasWork = work.length > 0
  const answered = (requests ?? []).filter((r) => r.status === 'done' && r.task_id && !work.some((s) => s.task_id === r.task_id))
  const comments = activity?.comments ?? []
  const invites = activity?.invites ?? []
  const { data: round2 } = useMyRound2()

  return (
    <GradLayout>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="m-0 text-[28px] font-bold leading-tight tracking-[-0.03em] sm:text-[34px]">Karibu, {first}.</h1>
          <span className="text-ink-2">
            {hasWork ? `Here's how your work is doing${grad ? ` as a ${grad.track}` : ''}.` : 'Your first task is the first step to your first job.'}
          </span>
        </div>
        <LinkButton to="/tasks" className="hidden sm:inline-flex">Find a task</LinkButton>
      </div>

      {submittedTitle && <Notice tone="info">Submitted "{submittedTitle}". Recruiters can see it now.</Notice>}
      {answered.map((r) => (
        <Link key={r.id} to={`/tasks/${r.task_id}`} className="press flex flex-col gap-0.5 rounded-2xl bg-brand-soft p-4 text-brand no-underline hover:text-brand">
          <span className="font-semibold">The task you asked for is live</span>
          <span className="text-sm text-ink-2">{r.role}{r.tools.length ? ` · ${r.tools.join(', ')}` : ''}. Start it now →</span>
        </Link>
      ))}

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-[92px] rounded-2xl" />)}</div>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat value={viewsThisMonth} label="views this month" />
          <Stat value={activity?.thumbs.length ?? 0} label="thumbs up" />
          <Stat value={comments.length} label={comments.length === 1 ? 'comment' : 'comments'} />
          <Stat value={invites.length} label={invites.length === 1 ? 'interview invite' : 'interview invites'} accent={invites.length > 0} />
        </div>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-6">
          {round2 && round2.length > 0 && (
            <Card title="Round 2">
              {round2.map((r) => <Round2Card key={r.id} r={r} />)}
            </Card>
          )}

          {invites.length > 0 && (
            <Card title="Interview invites">
              {invites.map((inv) => <GradInviteCard key={inv.id} invite={inv} />)}
            </Card>
          )}

          {!isLoading && !hasWork && (
            <Card title="How it works">
              <ol className="m-0 flex flex-col gap-3 pl-5 text-ink-2">
                <li><strong className="text-ink">Pick a task</strong> from a company or a practice task. It takes a few hours.</li>
                <li><strong className="text-ink">Do it, then explain it</strong> in a 2–3 minute video and a short write-up.</li>
                <li><strong className="text-ink">Get seen.</strong> Recruiters looking for {grad ? `a ${grad.track}` : 'graduates'} watch, comment and invite.</li>
              </ol>
              <LinkButton to="/tasks" className="self-start">Find your first task</LinkButton>
            </Card>
          )}

          {hasWork && (
            <Card title={`Your tasks · ${work.length}`}>
              {work.map((s) => (
                <Link key={s.id} to={`/tasks/${s.task_id}`}
                  className="press flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-[#EEEEE9] pt-4 text-ink no-underline first:border-0 first:pt-0 hover:text-ink">
                  <span className="flex min-w-0 flex-col">
                    <span className="font-semibold">{s.task?.title ?? 'Task'}</span>
                    <span className="text-sm text-muted">Submitted {ago(s.created_at)}{s.verdict ? ' · verdict ready' : ''}</span>
                  </span>
                  <span className="flex gap-4 text-sm text-ink-2 tabular-nums">
                    <span>{plural(count(activity?.views, s.id), 'view')}</span>
                    <span>{plural(count(activity?.thumbs, s.id), 'thumbs up', 'thumbs up')}</span>
                    <span>{plural(count(activity?.comments, s.id), 'comment')}</span>
                  </span>
                </Link>
              ))}
            </Card>
          )}

          {comments.length > 0 && (
            <Card title="What recruiters said">
              {comments.slice(0, 4).map((c) => (
                <div key={c.id} className="flex flex-col gap-1 border-t border-[#EEEEE9] pt-4 first:border-0 first:pt-0">
                  <span className="text-[13px] text-muted">{c.company?.name ?? 'A recruiter'} · {ago(c.created_at)}</span>
                  <span>{c.body}</span>
                </div>
              ))}
            </Card>
          )}
        </div>

        <div className="flex flex-col gap-6">
          <Card title={hasWork ? 'Next task for you' : 'Tasks to start with'} action={<Link to="/tasks" className="text-sm font-semibold">All tasks</Link>}>
            {suggestions.length === 0 && <p className="m-0 text-sm text-ink-2">You've done every open task. New ones are added often.</p>}
            <div className="flex flex-col gap-2.5">
              {suggestions.map((t) => <TaskCardLink key={t.id} task={t} />)}
            </div>
          </Card>

          {grad && (
            <Card title="Your CV link">
              <span className="break-all text-[15px] text-brand">tafutakazi.co.ke/{grad.slug}</span>
              <span className="text-sm text-ink-2">Put it on your CV and job applications. It shows your tasks and verdicts.</span>
              <CopyLink url={`https://tafutakazi.co.ke/${grad.slug}`} />
            </Card>
          )}

          <Link to="/tasks/request" className="press flex flex-col gap-1 rounded-2xl border border-dashed border-brand bg-white p-5 text-ink no-underline hover:text-ink">
            <span className="font-semibold text-brand">Want to show a specific skill?</span>
            <span className="text-sm text-ink-2">Request a task and Tafutakazi may write it.</span>
          </Link>

          {grad && session && (
            <p className="m-0 px-1 text-sm text-muted">
              {grad.digest_enabled
                ? <>We'll email {session.user.email} when a company posts a {grad.track} task, at most once a day.</>
                : <>Email updates are off. Turn them on in your <Link to="/me/profile">profile</Link>.</>}
            </p>
          )}
        </div>
      </div>
    </GradLayout>
  )
}
