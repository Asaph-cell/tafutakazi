import type { ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Seo } from '../components/Seo'
import { TaskCardLink } from '../components/TaskCardLink'
import { ToolLayout, useTitleClass } from '../components/ToolLayout'
import { LinkButton, SkeletonCards } from '../components/ui'
import { useAuth } from '../lib/auth'
import { useGrad, useTaskFeed } from '../lib/grad'
import { TRACKS, trackBySlug, trackForRole, type Track } from '../lib/tracks'
import { NotFound } from './SmallPages'

const display = 'font-[family-name:var(--font-display)]'

function Heading({ eyebrow, title, intro }: { eyebrow: string; title: string; intro: string }) {
  const titleClass = useTitleClass()
  return (
    <div className="flex max-w-[760px] flex-col gap-3">
      <span className="text-[13px] font-semibold uppercase tracking-[0.14em] text-brand">{eyebrow}</span>
      <h1 className={titleClass}>{title}</h1>
      <p className="m-0 text-[17px] leading-relaxed text-ink-2 sm:text-[18px]">{intro}</p>
    </div>
  )
}

function TrackCard({ track, mine = false }: { track: Track; mine?: boolean }) {
  return (
    <Link to={`/skills/${track.slug}`}
      className={`press flex flex-col gap-1.5 rounded-2xl border p-5 text-ink no-underline hover:border-brand hover:text-ink ${mine ? 'border-brand bg-brand-soft' : 'border-line bg-white'}`}>
      {mine && <span className="text-[13px] font-semibold text-brand">Your track</span>}
      <span className={`${display} text-[22px] font-semibold leading-snug`}>{track.name}</span>
      <span className="text-[15px] leading-snug text-ink-2">{track.summary}</span>
    </Link>
  )
}

export function SkillsIndex() {
  const { profile } = useAuth()
  const isGrad = profile?.role === 'grad'
  const { data: grad } = useGrad()
  const mine = isGrad ? trackForRole(grad?.track) : undefined
  return (
    <ToolLayout>
      <Seo title="Free skill tracks for jobs in Kenya"
        description="Free skill tracks for 15 entry-level careers in Kenya: what each job needs, where to learn it for free, practice tasks to prove it, and interview questions." />
      <Heading eyebrow="Skill tracks" title="Learn what the job needs, then prove it"
        intro="Each track shows what a job usually needs, where to learn it for free, a task that proves you can do it, and the interview questions to prepare for." />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {mine && <TrackCard track={mine} mine />}
        {TRACKS.filter((t) => t !== mine).map((t) => <TrackCard key={t.slug} track={t} />)}
      </div>
    </ToolLayout>
  )
}

function Step({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <section className="grid gap-3 border-t border-line pt-6 sm:grid-cols-[64px_minmax(0,1fr)]">
      <span className={`${display} text-[34px] font-semibold leading-none text-brand`}>0{n}</span>
      <div className="flex min-w-0 flex-col gap-4">
        <h2 className="m-0 text-[24px] font-semibold leading-tight sm:text-[28px]">{title}</h2>
        {children}
      </div>
    </section>
  )
}

// Task lists are for signed-in graduates, so visitors get the way in instead.
function TrackTasks({ track }: { track: Track }) {
  const { data: feed, isLoading } = useTaskFeed()
  const tasks = (feed ?? []).filter((t) => t.status === 'live' && t.role.toLowerCase() === track.role.toLowerCase())
  const done = tasks.filter((t) => t.submitted).length
  if (isLoading) return <SkeletonCards count={2} />
  if (tasks.length === 0) return <p className="m-0 text-ink-2">No {track.name.toLowerCase()} tasks are open right now. <Link to="/tasks/request">Request one</Link>.</p>
  return (
    <>
      <span className="text-sm font-semibold text-brand">{done} of {tasks.length} done</span>
      <div className="grid gap-3 md:grid-cols-2">{tasks.map((t) => <TaskCardLink key={t.id} task={t} />)}</div>
    </>
  )
}

export function SkillTrack() {
  const { slug } = useParams()
  const { profile } = useAuth()
  const track = trackBySlug(slug)
  if (!track) return <NotFound />
  const lower = track.name.toLowerCase()
  return (
    <ToolLayout>
      <Seo title={`${track.name} skills for jobs in Kenya`}
        description={`${track.summary} What a ${track.role} job usually needs, free places to learn it, a task to prove it, and interview questions.`} />
      <Link to="/skills" className="self-start text-sm font-semibold no-underline">← All skill tracks</Link>
      <Heading eyebrow="Skill track" title={track.name} intro={track.summary} />
      <div className="flex max-w-[860px] flex-col gap-8">
        <Step n={1} title="Know what the job needs">
          <div className="grid gap-4 sm:grid-cols-2">
            {track.skills.map(([name, why]) => (
              <div key={name} className="flex flex-col gap-1 border-l-[3px] border-accent pl-4">
                <span className="font-semibold">{name}</span>
                <span className="text-[15px] text-ink-2">{why}</span>
              </div>
            ))}
          </div>
        </Step>
        <Step n={2} title="Learn it for free">
          <div className="flex flex-col gap-3">
            {track.learn.map(([name, url, note]) => (
              <a key={url} href={url} target="_blank" rel="noopener noreferrer"
                className="flex flex-col gap-0.5 rounded-xl border border-line bg-white p-4 text-ink no-underline hover:border-brand hover:text-ink">
                <span className="font-semibold text-brand">{name} <span aria-hidden="true">↗</span></span>
                <span className="text-[15px] text-ink-2">{note}</span>
              </a>
            ))}
          </div>
        </Step>
        <Step n={3} title="Prove it with a task">
          <p className="m-0 text-ink-2">Knowing it isn't enough. Do a short task, explain it on video, and keep the proof on your profile.</p>
          {profile?.role === 'grad' ? <TrackTasks track={track} /> : <LinkButton to="/join" className="self-start">Sign up free to do the tasks</LinkButton>}
        </Step>
        <Step n={4} title="Get ready for the interview">
          <div className="flex flex-col gap-2">
            {track.questions.map(([q, tip]) => (
              <details key={q} className="rounded-xl border border-line bg-white p-4">
                <summary className="cursor-pointer font-semibold">{q}</summary>
                <p className="m-0 mt-2 text-[15px] text-ink-2">{tip}</p>
              </details>
            ))}
          </div>
          <LinkButton to={`/interview?role=${track.slug}`} variant="outline" className="self-start">Practise your {lower} answers</LinkButton>
        </Step>
      </div>
    </ToolLayout>
  )
}
