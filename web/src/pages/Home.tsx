import type { ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { PublicHeader } from '../components/PublicHeader'
import { Seo } from '../components/Seo'
import { LinkButton } from '../components/ui'
import { SiteFooter } from '../components/SiteFooter'
import { unsplash } from '../blog/ui'
import { supabase } from '../lib/supabase'

// Photos: recorded in docs/photo-licences.md. Unsplash photos load from Unsplash; ours are in public/home.
const HERO = { src: '/home/graduates.webp', alt: 'Four graduates in gowns, smiling as they look at a photo on a phone.' }
const PHOTO = {
  data: { src: '/home/data.webp', alt: 'A laptop showing a sales and revenue dashboard with charts.' },
  business: { src: '/home/business.webp', alt: 'A desk with a laptop, printed plans, a pencil and a mug of coffee.' },
  tech: { src: unsplash('photo-1653566031486-dc4ead13a35d', 640, 4 / 3), alt: 'A team around a table with laptops.' },
  city: { id: 'photo-1781504842018-c51ce0dac23f', alt: '' },
}

// Simple line icons, drawn for this page.
const icon = (d: ReactNode) => (
  <svg aria-hidden="true" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">{d}</svg>
)
const ICONS = {
  free: icon(<><circle cx="12" cy="12" r="8.5" /><path d="M8.5 12.5 11 15l4.5-5.5" /></>),
  clock: icon(<><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></>),
  cap: icon(<><path d="M2.5 9 12 4.5 21.5 9 12 13.5Z" /><path d="M6.5 11v4.5c0 1.5 2.5 3 5.5 3s5.5-1.5 5.5-3V11" /></>),
  doors: icon(<><rect x="4" y="3.5" width="16" height="17" rx="1.5" /><path d="M12 3.5v17M9.5 12h.01M14.5 12h.01" /></>),
  video: icon(<><rect x="3" y="6" width="13" height="12" rx="2" /><path d="m16 10.5 5-3v9l-5-3" /></>),
}

const FACTS = [
  { icon: ICONS.free, value: 'Free', label: 'Always', sub: 'For graduates and employers.' },
  { icon: ICONS.cap, value: '0 years', label: 'Experience needed', sub: 'Fresh graduates, degree or diploma.' },
  { icon: ICONS.clock, value: '2–3 hrs', label: 'Per task', sub: 'A real problem from a real role.' },
  { icon: ICONS.video, value: '3 min', label: 'Video', sub: 'You explain your work, in your words.' },
  { icon: ICONS.doors, value: '4 ways in', label: 'Opportunities', sub: 'Jobs, internships, trainee and volunteer.' },
]

const FIELDS = [
  { photo: PHOTO.data, title: 'Data and analysis', sub: 'Clean data, find the story, chart it.' },
  { photo: PHOTO.business, title: 'Business and finance', sub: 'Accounts, reports, sales and operations.' },
  { photo: PHOTO.tech, title: 'Software and IT', sub: 'Build, fix and explain working code.' },
]

const STEPS = [
  ['Pick a task', 'A short problem from a real Kenyan role, done in two or three hours. Data, marketing, design, accounting, code.'],
  ['Do it, then explain it', 'Submit your work, a two to three minute video and a write-up of how you did it. That is your proof, not a CV.'],
  ['Get invited', 'Employers watch, comment and invite the graduates they want to meet. You see every view and comment.'],
]

export default function Home() {
  // Shown only once someone has actually been hired.
  const { data: hires = 0 } = useQuery({
    queryKey: ['hire-count'],
    queryFn: async () => ((await supabase.rpc('hire_count')).data as number | null) ?? 0,
    staleTime: 3600000,
  })

  return (
    <div className="min-h-screen">
      <Seo />

      {/* ── Hero: deep green, the photo on the right fading into it ─────── */}
      <section className="relative isolate overflow-hidden bg-brand-deep">
        <PublicHeader overlay />
        <div className="absolute -right-px top-0 -z-10 h-[420px] w-full sm:h-[480px] lg:bottom-0 lg:h-auto lg:w-[52%]">
          <img src={HERO.src} alt={HERO.alt} fetchPriority="high" width={1024} height={916}
            className="h-full w-full object-cover object-[55%_25%]" />
          {/* wide screens: fade in from the left; phones: darken under the text */}
          <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(90deg,rgba(4,61,44,1)_0%,rgba(4,61,44,1)_5%,rgba(4,61,44,0.6)_25%,rgba(4,61,44,0)_52%)] max-lg:bg-[linear-gradient(180deg,rgba(4,61,44,0.15)_0%,rgba(4,61,44,0.05)_40%,rgba(4,61,44,0.85)_82%,rgba(4,61,44,1)_100%)]" />
          <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-40 bg-[linear-gradient(0deg,rgba(4,61,44,0.6),transparent)] max-lg:hidden" />
          {/* keeps the menu readable over the bright top of the photo */}
          <div aria-hidden="true" className="absolute inset-x-0 top-0 h-32 bg-[linear-gradient(180deg,rgba(4,61,44,0.75),transparent)]" />
        </div>

        <div className="mx-auto max-w-[1280px] px-5 pb-36 pt-[330px] sm:px-6 sm:pb-48 sm:pt-[390px] lg:pt-40">
          <div className="flex max-w-[560px] flex-col gap-6 text-white">
            <h1 className="rise m-0 text-[clamp(44px,7vw,72px)] font-semibold leading-[1.02] tracking-[-0.01em]">
              Breaking Kenya's
              <span className="block italic text-accent">unemployment loop.</span>
            </h1>
            <span aria-hidden="true" className="rise block h-[3px] w-20 bg-accent [animation-delay:80ms]" />
            <p className="rise m-0 flex items-center gap-2.5 text-[14px] font-medium uppercase tracking-[0.12em] text-accent [animation-delay:110ms]">
              <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 12a8 8 0 0 1-14 5.3M4 12a8 8 0 0 1 14-5.3" /><path d="M18 3v4h-4M6 21v-4h4" /></svg>
              No job without experience. No experience without a job.
            </p>
            <p className="rise m-0 max-w-[44ch] text-[17px] leading-relaxed text-[#D2E2DA] [animation-delay:140ms] sm:text-[19px]">
              We're working to change that by giving young Kenyans a chance to show their skills on real tasks they can
              be hired on, not on years they haven't had the chance to work.
            </p>
            <div className="rise flex flex-col gap-3 [animation-delay:220ms] sm:flex-row">
              <LinkButton to="/join" variant="accent" className="gap-2">I just graduated <span aria-hidden="true" className="arrow">→</span></LinkButton>
              <LinkButton to="/hiring" variant="outlineLight">I'm hiring</LinkButton>
            </div>
          </div>
        </div>

      </section>

      <main className="mx-auto flex max-w-[1280px] flex-col gap-20 px-5 sm:gap-24 sm:px-6">
        {/* ── Facts strip, overlapping the photo ─────────────────────────── */}
        <section aria-label="At a glance" className="relative z-10 -mt-24 grid grid-cols-2 gap-x-4 gap-y-7 rounded-2xl bg-white p-6 shadow-[0_24px_60px_rgba(4,61,44,0.14)] sm:-mt-28 sm:p-8 md:grid-cols-3 lg:grid-cols-5 lg:gap-0 lg:divide-x lg:divide-line">
          {FACTS.map((f) => (
            <div key={f.value} className="flex flex-col gap-2.5 sm:flex-row sm:gap-3.5 lg:px-6 lg:first:pl-0 lg:last:pr-0">
              <span className="grid h-11 w-11 flex-none place-items-center rounded-full bg-ground text-brand sm:h-12 sm:w-12">{f.icon}</span>
              <div className="flex min-w-0 flex-col">
                <span className="font-[family-name:var(--font-display)] text-[22px] font-semibold leading-tight whitespace-nowrap text-ink sm:text-[24px]">{f.value}</span>
                <span className="text-[14px] font-semibold text-ink-2">{f.label}</span>
                <span className="mt-1 text-[13px] leading-snug text-muted">{f.sub}</span>
              </div>
            </div>
          ))}
        </section>

        {/* ── Fields, as photo cards ─────────────────────────────────────── */}
        <section className="grid gap-8 lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-12">
          <div className="flex flex-col gap-4">
            <span className="text-[13px] font-semibold uppercase tracking-[0.14em] text-brand">Find your field</span>
            <h2 className="m-0 text-[34px] font-semibold leading-tight tracking-[-0.015em] sm:text-[40px]">Prove it in the work you want</h2>
            <span aria-hidden="true" className="block h-[3px] w-14 bg-brand" />
            <p className="m-0 text-ink-2">Practice tasks in each field are open now. Employers post tasks from their own jobs, and you build proof while you wait.</p>
            <Link to="/join" className="mt-1 inline-flex items-center gap-2 font-semibold no-underline">See the tasks <span aria-hidden="true">→</span></Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {FIELDS.map((c) => (
              <Link key={c.title} to="/join" className="press group flex flex-col overflow-hidden rounded-xl border border-line bg-white text-ink no-underline hover:border-line-strong hover:text-ink">
                <div className="aspect-[4/3] overflow-hidden bg-line">
                  <img src={c.photo.src} alt={c.photo.alt} loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 ease-[var(--ease-out-strong)] group-hover:scale-[1.04]" />
                </div>
                <div className="flex flex-col gap-1 p-4">
                  <span className="font-[family-name:var(--font-display)] text-[19px] font-semibold">{c.title}</span>
                  <span className="text-[14px] text-muted">{c.sub}</span>
                </div>
              </Link>
            ))}
            <Link to="/join" className="press flex flex-col justify-between gap-6 rounded-xl bg-brand p-5 text-white no-underline hover:bg-brand-dark hover:text-white">
              <span className="font-[family-name:var(--font-display)] text-[22px] font-semibold leading-snug">Marketing, design, HR, logistics and more</span>
              <span className="text-[14px] text-[#C5D6CE]">Not listed? Ask for a task in your field. <span aria-hidden="true" className="text-accent">→</span></span>
            </Link>
          </div>
        </section>

        {/* ── Why, and how it works ─────────────────────────────────────── */}
        <section className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="flex flex-col gap-4">
            <span className="text-[13px] font-semibold uppercase tracking-[0.14em] text-brand">Why Tafutakazi exists</span>
            <h2 className="m-0 text-[30px] font-semibold leading-tight tracking-[-0.015em] sm:text-[38px]">
              Every job ad asks for experience. You can't get experience without a job.
            </h2>
            <p className="m-0 text-ink-2 sm:text-[18px]">
              So capable graduates stay unemployed, not because they can't do the work, but because no one lets them show it.
              Here, employers judge what you can do, not how many years you've worked.
            </p>
            {hires > 0 && (
              <p className="m-0 text-[18px] font-semibold text-brand">
                {hires} {hires === 1 ? 'graduate has' : 'graduates have'} been hired through Tafutakazi so far.
              </p>
            )}
          </div>
          <ol className="m-0 flex list-none flex-col gap-0 p-0">
            {STEPS.map(([title, body], k) => (
              <li key={title} className="grid grid-cols-[56px_minmax(0,1fr)] gap-4 border-t border-line py-6 last:border-b">
                <span className="font-[family-name:var(--font-display)] text-[34px] font-semibold leading-none text-brand">0{k + 1}</span>
                <div className="flex flex-col gap-1.5">
                  <span className="font-[family-name:var(--font-display)] text-[21px] font-semibold">{title}</span>
                  <span className="text-ink-2">{body}</span>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* ── For employers, over the city ──────────────────────────────── */}
        <section className="relative isolate overflow-hidden rounded-2xl bg-brand-dark">
          <img src={unsplash(PHOTO.city.id, 1600, 21 / 9)} alt="" loading="lazy" className="absolute inset-0 -z-10 h-full w-full object-cover" />
          <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(4,61,44,0.95)_0%,rgba(4,61,44,0.85)_55%,rgba(4,61,44,0.55)_100%)]" />
          <div className="flex flex-col gap-5 p-7 text-white sm:p-12 lg:max-w-[640px]">
            <span className="text-[13px] font-semibold uppercase tracking-[0.14em] text-accent">For employers</span>
            <h2 className="m-0 text-[30px] font-semibold leading-tight tracking-[-0.015em] sm:text-[40px]">Skip the 500 CVs.</h2>
            <p className="m-0 text-[#D2E2DA] sm:text-[18px]">
              Post a short task from the role. Graduates do it and explain their work on video. You score it, then invite the
              ones you want to meet. Jobs, internships, graduate trainee roles and volunteering.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <LinkButton to="/hiring" variant="accent">Post a task, free</LinkButton>
              <LinkButton to="/about" variant="outlineLight">Why work samples work</LinkButton>
            </div>
          </div>
        </section>

        {/* ── Promises ──────────────────────────────────────────────────── */}
        <section className="grid gap-8 sm:grid-cols-3">
          {[
            ['Your work stays private', "Only signed-in recruiters can see it. Other graduates can't."],
            ['Real companies only', 'Every company shows where to find it online, and no one may ever ask you for money.'],
            ['Free, always', 'Never pay to join or to do a task.'],
          ].map(([title, body]) => (
            <div key={title} className="flex flex-col gap-1.5 border-l-[3px] border-brand pl-4">
              <span className="font-[family-name:var(--font-display)] text-[19px] font-semibold">{title}</span>
              <span className="text-ink-2">{body}</span>
            </div>
          ))}
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
