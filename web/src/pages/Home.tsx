import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { PublicHeader } from '../components/PublicHeader'
import { Seo } from '../components/Seo'
import { LinkButton } from '../components/ui'
import { SiteFooter } from '../components/SiteFooter'
import { WorkScene, type SceneKind } from '../components/WorkScene'
import { supabase } from '../lib/supabase'

// Example people for the hero. Replace with real graduates (with their permission) before launch.
const PEOPLE: { kind: SceneKind; progress: number; word: string; name: string; role: string; quote: string; event: string; video: string }[] = [
  { kind: 'dashboard', progress: 38, word: 'dashboard.', name: 'Wanjiru Kamau', role: 'Data analysis · Statistics, JKUAT 2026', quote: '"Caught duplicate receipts most people miss."', event: 'Invited to interview by Umoja SACCO', video: 'Grocery sales dashboard · 2:41' },
  { kind: 'campaign', progress: 55, word: 'campaign.', name: 'Grace Achieng', role: 'Marketing · BCom, Strathmore 2026', quote: '"A clear plan with a budget a small business could afford."', event: 'Invited to interview by Duka Bora', video: 'Social media plan · 2:15' },
  { kind: 'poster', progress: 27, word: 'poster.', name: 'Ian Mwangi', role: 'Graphic design · Kenyatta University 2025', quote: '"Clean, readable from across a room, true to the brand."', event: '6 thumbs up from recruiters', video: 'Clinic open-day poster · 2:03' },
  { kind: 'spreadsheet', progress: 64, word: 'spreadsheet.', name: 'Faith Chebet', role: 'Accounting · Diploma, KCA 2026', quote: '"Every number reconciles, and the summary fits on one page."', event: 'Invited to interview by Pwani Insurance', video: 'Fuel costs summary · 2:30' },
  { kind: 'code', progress: 46, word: 'code.', name: 'Kevin Mutua', role: 'Software · IT, Multimedia University 2025', quote: '"Simple, tested, and the README explains it in a minute."', event: 'Invited to interview by Kamau & Co.', video: 'Delivery tracker app · 2:51' },
]

function useCycle(length: number, ms: number) {
  const [i, setI] = useState(0)
  const [still, setStill] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setStill(mq.matches)
    const id = setInterval(() => {
      if (!document.hidden) setI((n) => (n + 1) % length)
    }, ms)
    return () => clearInterval(id)
  }, [length, ms])
  return { i, still }
}

function SwapWord({ i, still }: { i: number; still: boolean }) {
  const n = PEOPLE.length
  return (
    <span className="relative block text-brand">
      <span aria-hidden="true" className="invisible">spreadsheet.</span>
      {PEOPLE.map((p, k) => {
        const d = (k - i + n) % n
        const on = d === 0
        const gone = d === n - 1
        return (
          <span key={p.word} aria-hidden={!on} className="absolute left-0 top-0 whitespace-nowrap">
            {p.word.split('').map((t, j) => (
              <span
                key={j}
                className="ch"
                style={{
                  opacity: on ? 1 : 0,
                  transform: `translateY(${still || on ? '0' : gone ? '-0.45em' : '0.45em'})`,
                  filter: `blur(${still || on ? 0 : 8}px)`,
                  transitionDelay: still ? '0ms' : on ? `${200 + j * 45}ms` : gone ? `${j * 22}ms` : '0ms',
                }}
              >
                {t}
              </span>
            ))}
          </span>
        )
      })}
    </span>
  )
}

function CardDeck({ i, still }: { i: number; still: boolean }) {
  const n = PEOPLE.length
  return (
    <div aria-hidden="true" className="rise grid pb-9 [animation-delay:380ms]">
      {PEOPLE.map((p, k) => {
        const d = (k - i + n) % n
        let z = 0, o = 0, y = '24px', s = 0.9, b = 0
        if (d === 0) { z = 3; o = 1; y = '0'; s = 1 }
        else if (d === 1) { z = 2; o = 0.85; y = '12px'; s = 0.95 }
        else if (d === 2) { z = 1; o = 0.5; y = '24px'; s = 0.9 }
        else if (d === n - 1) { z = 4; o = 0; y = '-24px'; s = 1; b = 6 }
        if (still) { y = '0'; s = 1; b = 0; o = d === 0 ? 1 : 0 }
        return (
          <div
            key={p.name}
            className="deck-card relative flex flex-col gap-3.5 overflow-hidden rounded-2xl border border-line bg-white p-[18px] shadow-[0_1px_2px_rgba(20,20,20,0.04),0_14px_36px_rgba(20,20,20,0.07)] [grid-area:1/1]"
            style={{ zIndex: z, opacity: o, transform: `translateY(${y}) scale(${s})`, filter: `blur(${b}px)`, transformOrigin: '50% 100%' }}
          >
            <div className="relative">
              <WorkScene kind={p.kind} title={p.video} progress={p.progress} on={d === 0} still={still}
                initials={p.name.split(' ').map((w) => w[0]).join('').slice(0, 2)} />
              <span className="absolute right-4 top-4 rounded-full bg-ink/80 px-2.5 py-0.5 text-xs font-semibold text-white">Example</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[17px] font-semibold">{p.name}</span>
              <span className="text-sm text-muted">{p.role}</span>
            </div>
            <span className="text-[15px] text-ink-2">{p.quote}</span>
            <span
              className="pop mt-auto flex items-center gap-2 self-start rounded-full bg-brand-soft px-3 py-1.5 text-sm font-semibold text-brand"
              style={{
                opacity: d === 0 ? 1 : 0,
                transform: `translateY(${d === 0 || still ? 0 : 6}px)`,
                transitionDelay: d === 0 && !still ? '1600ms' : '0ms',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5 10 17 19 7" /></svg>
              {p.event}
            </span>
          </div>
        )
      })}
    </div>
  )
}

export default function Home() {
  const { i, still } = useCycle(PEOPLE.length, 7000)
  // Shown only once someone has actually been hired.
  const { data: hires = 0 } = useQuery({
    queryKey: ['hire-count'],
    queryFn: async () => ((await supabase.rpc('hire_count')).data as number | null) ?? 0,
    staleTime: 3600000,
  })

  return (
    <div className="min-h-screen">
      <Seo />
      <PublicHeader />

      <main className="mx-auto flex max-w-[1280px] flex-col gap-12 px-5 pt-4 sm:gap-16 sm:px-6 sm:pt-10">
        <section className="flex flex-wrap items-center gap-12 lg:gap-16">
          <div className="flex min-w-0 flex-[1_1_440px] flex-col gap-6 sm:gap-7">
            <h1 className="rise m-0 text-[clamp(30px,12vw,68px)] font-bold leading-[1.02] tracking-[-0.04em]">
              <span aria-hidden="true">
                <span className="block">Show your</span>
                <SwapWord i={i} still={still} />
                <span className="block">Get hired.</span>
              </span>
              <span className="sr-only">Show your work. Get hired.</span>
            </h1>
            <p className="rise m-0 max-w-[36ch] text-[17px] text-ink-2 [animation-delay:90ms] sm:text-[19px]">
              Just graduated, with no work experience yet? Do short tasks set by Kenyan companies, explain your work
              on video, and get seen by people who are hiring.
            </p>
            <div className="rise flex flex-col gap-3 [animation-delay:180ms] sm:flex-row">
              <LinkButton to="/join">I just graduated</LinkButton>
              <LinkButton to="/hiring" variant="outline">I'm hiring</LinkButton>
            </div>
            <span className="rise text-[15px] text-muted [animation-delay:270ms]">
              Free for fresh graduates and recruiters. No experience needed.
            </span>
          </div>
          <div className="min-w-0 flex-[1_1_380px]">
            <CardDeck i={i} still={still} />
          </div>
        </section>

        <section className="flex max-w-[820px] flex-col gap-4 sm:gap-5">
          <span className="text-[13px] font-semibold uppercase tracking-[0.08em] text-brand">Why Tafutakazi exists</span>
          <p className="m-0 text-2xl font-semibold leading-tight tracking-[-0.025em] sm:text-[34px]">
            Every job ad asks for experience. But you can't get experience without a job.
          </p>
          <p className="m-0 text-ink-2 sm:text-[19px]">
            So capable graduates stay unemployed, not because they can't do the work, but because no one gives them a
            chance to show it. Tafutakazi exists to help reduce graduate unemployment. Here, companies post short tasks
            from real jobs, graduates do them, and employers hire based on what you can actually do, not on years of
            experience.
          </p>
          {hires > 0 && (
            <p className="m-0 text-[17px] font-semibold text-brand sm:text-[19px]">
              {hires} {hires === 1 ? 'graduate has' : 'graduates have'} been hired through Tafutakazi so far.
            </p>
          )}
        </section>

        <section className="-mt-2 flex flex-col gap-6">
          <h2 className="m-0 text-[28px] font-semibold tracking-[-0.025em] sm:text-[34px]">How it works</h2>
          <div className="flex flex-wrap gap-10">
            {[
              ['Pick a task', 'A real problem from a Kenyan company, done in a few hours. Data, marketing, design, accounting, code.'],
              ['Do it, then explain it', "Submit your work, a 2–3 minute video and how you did it. That's your proof, not a CV."],
              ['Get seen', 'Recruiters watch, comment and invite the best to interview. You see every view and comment.'],
            ].map(([title, body], k) => (
              <div key={title} className={`flex flex-[1_1_240px] flex-col gap-2 border-t-2 pt-5 ${k === 2 ? 'border-brand' : 'border-ink'}`}>
                <span className="text-[19px] font-semibold">{title}</span>
                <span className="text-ink-2">{body}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="flex flex-wrap items-center gap-8 rounded-[18px] bg-ink p-6 text-ground sm:p-11">
          <div className="flex flex-[1_1_360px] flex-col gap-2.5">
            <h2 className="m-0 text-[24px] font-semibold tracking-[-0.025em] sm:text-[32px]">Hiring? Skip the 500 CVs.</h2>
            <p className="m-0 max-w-[46ch] text-[#C9C9C3]">
              Post a short task for the role. Graduates do it to show what they can do. Watch them explain their work, then invite
              the ones you want to meet.
            </p>
          </div>
          <LinkButton to="/hiring" variant="light" className="w-full sm:w-auto">Post a task, free</LinkButton>
        </section>

        <section className="flex flex-wrap gap-10">
          {[
            ['Your work stays private', "Only signed-in recruiters can see it. Other graduates can't."],
            ['Real companies only', 'Every company shows where to find it online, and no one may ever ask you for money.'],
            ['Free, always', 'Never pay to join or to do a task.'],
          ].map(([title, body]) => (
            <div key={title} className="flex flex-[1_1_240px] flex-col gap-1">
              <span className="font-semibold">{title}</span>
              <span className="text-ink-2">{body}</span>
            </div>
          ))}
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
