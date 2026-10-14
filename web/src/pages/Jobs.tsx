import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { PublicHeader } from '../components/PublicHeader'
import { Seo } from '../components/Seo'
import { SiteFooter } from '../components/SiteFooter'
import { LinkButton } from '../components/ui'
import { postedAgo, useJobs } from '../lib/jobs'

export default function Jobs() {
  const [params, setParams] = useSearchParams()
  const role = params.get('role') ?? ''
  const { data, isLoading } = useJobs()
  const roles = useMemo(() => [...new Set((data ?? []).map((j) => j.role))].sort(), [data])
  const jobs = (data ?? []).filter((j) => !role || j.role === role)
  const heading = role ? `${role} jobs for fresh graduates in Kenya` : 'Jobs for fresh graduates in Kenya'

  return (
    <div className="min-h-screen">
      <Seo
        title={heading}
        description={`Open ${role ? role.toLowerCase() + ' ' : ''}roles at Kenyan companies that hire fresh graduates with no work experience. Do a short task from the job to show the company what you can do.`}
      />
      <PublicHeader />
      <main className="mx-auto flex max-w-[1280px] flex-col gap-8 px-5 pb-10 pt-6 sm:px-6 sm:pt-10">
        <div className="flex flex-col gap-3">
          <h1 className="m-0 text-[32px] font-bold leading-tight tracking-[-0.03em] sm:text-[42px]">{heading}</h1>
          <p className="m-0 max-w-[60ch] text-[17px] text-ink-2">
            These companies are hiring and are open to graduates with no work experience. Each has posted a short task
            from the job. Do it to show what you can do. The company sees your work and invites the people it wants to
            interview.
          </p>
        </div>

        {roles.length > 1 && (
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by role">
            {['', ...roles].map((r) => (
              <button key={r || 'all'} aria-pressed={role === r} onClick={() => setParams(r ? { role: r } : {})}
                className={`press min-h-11 cursor-pointer rounded-full border px-4 text-sm ${role === r ? 'border-ink bg-ink text-white' : 'border-line-strong bg-white text-ink'}`}>
                {r || 'All roles'}
              </button>
            ))}
          </div>
        )}

        {isLoading && <p className="text-muted">Loading jobs…</p>}
        {!isLoading && jobs.length === 0 && (
          <div className="flex max-w-[720px] flex-col gap-3 rounded-2xl border border-line bg-white p-6">
            <span className="text-lg font-semibold">No open jobs right now</span>
            <span className="text-ink-2">
              New ones are posted often. Sign up and start a practice task: recruiters see that work too, and we'll
              email you when a job in your field is posted.
            </span>
            <LinkButton to="/join" className="self-start">I just graduated</LinkButton>
          </div>
        )}

        <div className="grid gap-3 md:grid-cols-2">
          {jobs.map((j) => (
            <Link key={j.id} to={`/jobs/${j.id}`}
              className="press flex flex-col gap-1 rounded-xl border border-line bg-white p-5 text-ink no-underline hover:border-line-strong hover:text-ink">
              <span className="text-lg font-semibold">{j.role} · {j.title}</span>
              <span className="text-muted">{j.company_name} · {j.industry}</span>
              <span className="text-sm text-ink-2">
                {[
                  j.openings ? `${j.openings} ${j.openings === 1 ? 'opening' : 'openings'}` : null,
                  j.location,
                  j.salary_range,
                  postedAgo(j.created_at),
                ].filter(Boolean).join(' · ')}
              </span>
            </Link>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
