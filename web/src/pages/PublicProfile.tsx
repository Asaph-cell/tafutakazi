import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { Logo } from '../components/Logo'
import { Seo } from '../components/Seo'
import { LinkButton } from '../components/ui'
import { supabase } from '../lib/supabase'
import { NotFound } from './SmallPages'

type PublicTask = {
  title: string
  role: string
  industry: string
  summary: string
  tools: string[] | null
  strengths: string | null
  improve: string | null
  submitted_at: string
}
type PublicProfileData = {
  full_name: string
  course: string
  institution: string | null
  grad_year: number | null
  track: string
  thumbs: number
  invites: number
  tasks: PublicTask[]
}

function forWhom(industry: string) {
  if (industry === 'practice') return 'Tafutakazi practice task'
  return `For a company in ${industry.toLowerCase()}`
}

// The page a graduate's CV links to. Shows tasks and verdicts, never the work itself.
export default function PublicProfile() {
  const { slug = '' } = useParams()
  const { data, isLoading } = useQuery({
    queryKey: ['public-profile', slug],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_public_profile', { handle: slug })
      if (error) throw error
      return data as PublicProfileData | null
    },
  })

  if (isLoading) return <div className="p-10 text-muted">Loading…</div>
  if (!data) return <NotFound />

  const first = data.full_name.split(' ')[0]
  const study = [data.course, [data.institution, data.grad_year].filter(Boolean).join(' ')].filter(Boolean).join(', ')

  return (
    <div className="min-h-screen">
      <Seo title={`${data.full_name} · Practical work`} description={`${data.full_name}, fresh graduate in ${data.course}. Practical tasks and honest verdicts on Tafutakazi.`} noindex />
      <header className="mx-auto flex max-w-[960px] items-center gap-4 px-5 py-5 sm:px-6">
        <Link to="/" className="flex-1 text-xl no-underline"><Logo /></Link>
        <Link to="/login" className="flex min-h-11 items-center font-semibold text-ink no-underline">Log in</Link>
      </header>
      <main className="mx-auto flex max-w-[960px] flex-col gap-10 px-5 pb-20 pt-6 sm:px-6">
        <section className="flex flex-col gap-2.5">
          <span className="text-sm text-muted">tafutakazi.co.ke/{slug}</span>
          <h1 className="m-0 text-[36px] font-bold leading-tight tracking-[-0.03em] sm:text-[44px]">{data.full_name}</h1>
          <span className="text-[18px] text-ink-2">Fresh graduate · {study}</span>
          <div className="mt-1.5 flex flex-wrap gap-2 text-sm">
            {data.invites > 0 && (
              <span className="rounded-full bg-brand-soft px-3 py-1.5 font-semibold text-brand">
                Invited to interview by {data.invites} {data.invites === 1 ? 'company' : 'companies'}
              </span>
            )}
            {data.thumbs > 0 && <span className="rounded-full border border-line bg-white px-3 py-1.5">{data.thumbs} thumbs up from recruiters</span>}
            <span className="rounded-full border border-line bg-white px-3 py-1.5">{data.tasks.length} {data.tasks.length === 1 ? 'task' : 'tasks'} done</span>
          </div>
        </section>

        <section className="flex flex-col gap-3.5">
          <h2 className="m-0 text-[13px] font-semibold uppercase tracking-[0.08em] text-muted">Practical work</h2>
          {data.tasks.length === 0 && <p className="m-0 text-ink-2">{first} hasn't finished a task yet.</p>}
          {data.tasks.map((t) => (
            <div key={t.title + t.submitted_at} className="flex flex-wrap gap-x-8 gap-y-4 rounded-xl border border-line bg-white p-5">
              <div className="flex min-w-0 flex-[999_1_380px] flex-col gap-1">
                <span className="text-[18px] font-semibold">{t.title}</span>
                <span className="text-sm text-muted">
                  {forWhom(t.industry)} · {new Date(t.submitted_at).toLocaleDateString('en-KE', { month: 'short', year: 'numeric' })}
                </span>
                <span className="text-ink-2">{t.summary}</span>
                {t.tools && t.tools.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {t.tools.map((x) => <span key={x} className="rounded-full bg-ground px-2.5 py-0.5 text-[13px] text-ink-2">{x}</span>)}
                  </div>
                )}
              </div>
              {t.strengths && (
                <div className="flex min-w-0 flex-[1_1_220px] flex-col gap-1">
                  <span className="text-[13px] font-semibold uppercase tracking-[0.04em] text-brand">Verdict</span>
                  <span className="text-[15px] text-ink-2"><strong className="font-semibold text-ink">Strong:</strong> {t.strengths}</span>
                  <span className="text-[15px] text-ink-2"><strong className="font-semibold text-ink">To improve:</strong> {t.improve}</span>
                </div>
              )}
            </div>
          ))}
        </section>

        <section className="flex flex-wrap items-center gap-7 rounded-2xl bg-ink p-7 text-ground">
          <div className="flex flex-[1_1_300px] flex-col gap-2">
            <span className="text-[22px] font-semibold tracking-[-0.02em]">Watch {first} explain their work</span>
            <span className="text-[#C9C9C3]">Videos, work previews and write-ups are only for recruiters. Signing up is free and takes two minutes.</span>
          </div>
          <LinkButton to="/hiring" variant="light" className="w-full sm:w-auto">I'm hiring, sign up free</LinkButton>
        </section>

        <span className="text-sm text-muted">
          Every task here was completed on Tafutakazi and explained by {first} on video. Verdicts are honest: strengths and
          what to improve.
        </span>
      </main>
    </div>
  )
}
