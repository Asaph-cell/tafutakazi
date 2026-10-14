import { Link, useParams } from 'react-router-dom'
import { PublicHeader } from '../components/PublicHeader'
import { Seo } from '../components/Seo'
import { SiteFooter } from '../components/SiteFooter'
import { LinkButton } from '../components/ui'
import { useAuth } from '../lib/auth'
import { minutesLabel } from '../lib/grad'
import { jobPostingLd, postedAgo, useJobs } from '../lib/jobs'

export default function JobPage() {
  const { id = '' } = useParams()
  const { profile } = useAuth()
  const { data, isLoading } = useJobs(id)
  const job = data?.[0]

  if (isLoading) return <div className="p-10 text-muted">Loading…</div>
  if (!job) {
    return (
      <div className="min-h-screen">
        <Seo title="Job closed" noindex />
        <PublicHeader />
        <main className="mx-auto flex max-w-[760px] flex-col gap-4 px-5 py-10 sm:px-6">
          <h1 className="m-0 text-[30px] font-bold tracking-[-0.03em]">This job has closed</h1>
          <p className="m-0 text-ink-2">The company has filled it or stopped hiring for now.</p>
          <LinkButton to="/jobs" className="self-start">See open jobs</LinkButton>
        </main>
      </div>
    )
  }

  const links = [job.company_website, job.company_linkedin, job.company_social].filter(Boolean) as string[]
  const host = (u: string) => {
    try { return new URL(u.startsWith('http') ? u : `https://${u}`).hostname.replace(/^www\./, '') } catch { return u }
  }
  const apply = profile?.role === 'grad' ? `/tasks/${job.id}` : '/join'

  return (
    <div className="min-h-screen">
      <Seo
        title={`${job.role} at ${job.company_name}`}
        description={`${job.company_name} is hiring a ${job.role} and is open to fresh graduates with no experience. Do its short task to show what you can do: ${job.title}.`}
        jsonLd={jobPostingLd(job)}
      />
      <PublicHeader />
      <main className="mx-auto flex max-w-[760px] flex-col gap-7 px-5 pb-10 pt-4 sm:px-6 sm:pt-8">
        <Link to="/jobs" className="flex min-h-11 items-center self-start no-underline">← All jobs</Link>
        <div className="-mt-4 flex flex-col gap-2">
          <span className="text-muted">
            {job.company_name} · {job.industry}
            {links.map((l) => <span key={l}> · <a href={l.startsWith('http') ? l : `https://${l}`} target="_blank" rel="noopener noreferrer">{host(l)}</a></span>)}
          </span>
          <h1 className="m-0 text-[30px] font-bold leading-tight tracking-[-0.03em] sm:text-[40px]">{job.role}</h1>
          <span className="text-[17px] text-ink-2">The task: {job.title}</span>
        </div>

        <div className="-mt-2 flex flex-wrap gap-2 text-sm">
          {job.openings && <span className="rounded-full bg-brand-soft px-3 py-1.5 font-semibold text-brand">{job.openings} {job.openings === 1 ? 'opening' : 'openings'}</span>}
          {job.location && <span className="rounded-full border border-line bg-white px-3 py-1.5">{job.location}</span>}
          {job.salary_range && <span className="rounded-full border border-line bg-white px-3 py-1.5">{job.salary_range}</span>}
          {job.start_note && <span className="rounded-full border border-line bg-white px-3 py-1.5">Starts: {job.start_note}</span>}
          <span className="rounded-full border border-line bg-white px-3 py-1.5">{postedAgo(job.created_at)}</span>
        </div>

        <section className="flex flex-col gap-3 rounded-2xl bg-ink p-6 text-ground">
          <span className="text-xl font-semibold">No experience needed. Show what you can do.</span>
          <span className="text-[#C9C9C3]">
            Do the task below ({minutesLabel(job.minutes_estimate).toLowerCase()}), explain your work in a short video, and the
            company sees it directly. It's free.
          </span>
          <LinkButton to={apply} variant="light" className="self-start">{profile?.role === 'grad' ? 'Start this task' : 'Sign up to do this task'}</LinkButton>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="m-0 text-[13px] font-semibold uppercase tracking-[0.06em] text-muted">The task</h2>
          <div className="whitespace-pre-line text-[17px] leading-relaxed">{job.instructions}</div>
        </section>

        <p className="m-0 text-sm text-muted">
          Tafutakazi never charges graduates. If anyone asks you for money for a job or a task, report it to hello@tafutakazi.co.ke.
        </p>
      </main>
      <SiteFooter />
    </div>
  )
}
