import type { ReactNode } from 'react'
import { PublicHeader } from '../components/PublicHeader'
import { Seo, SITE_URL } from '../components/Seo'
import { SiteFooter } from '../components/SiteFooter'
import { LinkButton } from '../components/ui'
// Our own photo, recorded in docs/photo-licences.md.
const HERO = { src: '/about/graduates.webp', alt: 'Four graduates in gowns and caps, smiling together on graduation day.' }

// Revised operational validity estimates, Sackett et al. (2022), Table 3.
const EVIDENCE: [string, number, boolean][] = [
  ['A sample of their real work', 0.33, true],
  ['A free-flowing, unstructured interview', 0.19, false],
  ['How many years of experience they have', 0.07, false],
]

const SOURCE ='https://www.businessdailyafrica.com/bd/economy/kenya-s-youth-joblessness-highest-in-the-region-5432820'

const mission: { title: string; sub: string; caption: string; gold: boolean; icon: ReactNode }[] = [
  {
    title: 'First jobs',
    sub: 'for fresh graduates',
    caption: 'Give fresh graduates a real chance at their first job',
    gold: true,
    icon: <><path d="M3 9.5 12 5l9 4.5-9 4.5z" /><path d="M7 12v4.5c0 1 2.2 2.5 5 2.5s5-1.5 5-2.5V12" /></>,
  },
  {
    title: 'Skills',
    sub: 'before anything else',
    caption: 'Make skills-based hiring the norm, so people are judged on what they can do',
    gold: false,
    icon: <><path d="M12 3.5 14.6 9l6 .8-4.4 4.2 1.1 6-5.3-2.9L6.7 20l1.1-6-4.4-4.2 6-.8z" /></>,
  },
  {
    title: 'Merit',
    sub: 'over who you know',
    caption: 'Beat connections, nepotism and lies on CVs',
    gold: true,
    icon: <><path d="M12 3.5 19.5 6v5.5c0 4.5-3 7.5-7.5 9-4.5-1.5-7.5-4.5-7.5-9V6z" /><path d="m8.5 12 2.5 2.5 4.5-5" /></>,
  },
  {
    title: 'More jobs',
    sub: 'from like-minded employers',
    caption: 'Reduce unemployment by opening up job opportunities with like-minded employers',
    gold: false,
    icon: <><rect x="3.5" y="8" width="17" height="11.5" rx="2" /><path d="M9 8V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3.5 13h17" /></>,
  },
]

const stats = [
  ['286,695', 'graduates from universities and TVET colleges entered the job market in Kenya in 2024'],
  ['75,000', 'formal jobs were created in the same year'],
  ['2.83 million', 'young Kenyans are not in work, education or training, the highest in East Africa'],
]

const beliefs = [
  ['Work speaks louder than a CV', 'Five hundred CVs look the same. One finished task, explained in your own voice, shows how you think, how you handle messy problems and how you communicate. That is what an employer actually needs to know.'],
  ['A first chance should be free', 'Graduates and their families have already paid for years of fees. Nobody should pay again to be noticed. Tafutakazi is free for graduates and employers, and no one on it may ask a graduate for money.'],
  ['Fresh graduates first', "People with a work history already have a track record. Tafutakazi is for the ones who don't yet: degree and diploma graduates looking for their first job."],
  ['Honesty over hype', 'Every piece of work gets an honest verdict: what is strong and what to improve. Employers trust it because it is not all praise, and graduates learn from it.'],
]

const forGrads = [
  'Pick a short task based on a real job, from a company or from our practice tasks',
  'Do it in a few hours, record a 2–3 minute video explaining it, and write how you did it',
  'Recruiters watch, comment and invite the best to interview, and you see every view',
  'Every task becomes a line on your CV with a link that proves it',
]

const forEmployers = [
  "Post a short test task for the role you're hiring for",
  'Graduates do it to show what they can do, so you see real work instead of reading CVs',
  'Watch them explain it, give a thumbs up or a comment, and invite the ones you want to meet',
  'Search every graduate by role and by the tools they have actually used',
]

const safeguards = [
  ['Work stays private', 'Only signed-in recruiters can see graduates’ work. Other graduates cannot, so nobody can copy it.'],
  ['Leaks can be traced', 'Every preview carries the viewer’s name and the date, and every view is logged.'],
  ['Real companies only', 'Companies show a company email, website, LinkedIn or business page before they can post, and every task is checked before it goes live.'],
  ['No free labour', 'Tasks are short tests with sample data, never real client work, and the full work stays locked until a company invites the graduate.'],
  ['Graduates can report', 'If three graduates report a task, it is paused automatically.'],
  ['Your data is yours', 'Graduates can delete their account and everything in it at any time.'],
]


const display = 'font-[family-name:var(--font-display)]'

function Section({ eyebrow, title, children }: { eyebrow: string; title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-8">
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="text-[13px] font-semibold uppercase tracking-[0.14em] text-brand">{eyebrow}</span>
        <h2 className="m-0 max-w-[26ch] text-[30px] font-semibold leading-tight sm:text-[40px]">{title}</h2>
        <span aria-hidden="true" className="block h-[3px] w-14 bg-brand" />
      </div>
      {children}
    </section>
  )
}

const check = (
  <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5 10 17 19 7" /></svg>
)

export default function About() {
  return (
    <div className="min-h-screen">
      <Seo
        title="Why Tafutakazi exists"
        description="Tafutakazi brings skills-based hiring to Kenya: fresh graduates prove what they can do through short tasks from real companies, so hiring rests on skills, not connections or CVs."
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'AboutPage',
          url: `${SITE_URL}/about`,
          name: 'Why Tafutakazi exists',
          about: { '@id': `${SITE_URL}/#organization` },
        }}
      />

      <PublicHeader />

      <main className="mx-auto flex max-w-[1280px] flex-col gap-20 px-5 pb-6 pt-6 sm:gap-24 sm:px-6 sm:pt-12">
        {/* ── Opening: headline on the left, what the name means on the right ── */}
        <section className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
          <div className="flex flex-col gap-5">
            <span className="rise text-[13px] font-semibold uppercase tracking-[0.14em] text-brand">Why Tafutakazi</span>
            <h1 className="rise m-0 text-[clamp(40px,6.4vw,76px)] font-semibold leading-[1.02] [animation-delay:60ms]">
              Every graduate deserves <em className="text-brand">a chance</em> to show what they can do.
            </h1>
          </div>
          <div className="rise flex flex-col gap-5 [animation-delay:140ms]">
            {/* The name, set like a dictionary entry */}
            <div className="flex flex-col gap-1.5 border-l-[3px] border-accent pl-5">
              <span className={`${display} text-[28px] font-semibold leading-none`}>
                tafuta<span className="text-muted">·</span>kazi
              </span>
              <span className="text-[14px] italic text-muted">Swahili · /ta-fu-ta-ka-zi/</span>
              <span className="text-[17px] text-ink-2">"Look for work."</span>
            </div>
            <p className="m-0 text-[17px] leading-relaxed text-ink-2 sm:text-[18px]">
              Tafutakazi exists to help reduce graduate unemployment in Kenya by giving fresh graduates something the
              job market rarely offers them: a fair chance to prove their skills before anyone asks about experience.
            </p>
          </div>
        </section>

        {/* ── Mission ── */}
        <section aria-label="Our mission" className="flex flex-col items-center gap-10 rounded-2xl bg-brand-soft/60 px-5 py-10 sm:gap-14 sm:px-8 sm:py-14">
          <div className="flex flex-col items-center gap-3 text-center">
            <span className="text-[13px] font-semibold uppercase tracking-[0.14em] text-brand">Our mission</span>
            <h2 className="m-0 max-w-[26ch] text-[30px] font-semibold leading-tight sm:text-[40px]">Hiring that rewards what you can do</h2>
            <span aria-hidden="true" className="block h-[3px] w-14 bg-brand" />
          </div>
          <ul className="m-0 grid w-full list-none grid-cols-2 gap-x-5 gap-y-10 p-0 lg:grid-cols-4 lg:gap-x-8">
            {mission.map(({ title, sub, caption, gold, icon }, k) => (
              <li key={title} className={`flex flex-col items-center gap-5 text-center ${k % 2 ? 'lg:mt-16' : ''}`}>
                <div className="relative w-full max-w-[250px]">
                  <span aria-hidden="true" className={`absolute -inset-1.5 rounded-full border-2 border-dotted sm:-inset-2.5 ${gold ? 'border-accent-dark/50' : 'border-brand/35'}`} />
                  <div className={`relative flex aspect-square flex-col items-center justify-center gap-1 rounded-full p-4 sm:gap-2 ${gold ? 'bg-[linear-gradient(160deg,#F7CD6B,#F2B632_55%,#DDA21F)] text-brand-deep' : 'bg-[linear-gradient(200deg,#0A6B4D,#075A40_50%,#043D2C)] text-white'}`}>
                    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7 sm:h-9 sm:w-9">{icon}</svg>
                    <span className={`${display} text-[25px] font-semibold leading-none sm:text-[36px]`}>{title}</span>
                    <span className="max-w-[17ch] text-[12px] leading-snug sm:text-[14px]">{sub}</span>
                  </div>
                </div>
                <span className="max-w-[28ch] text-[15px] leading-snug text-ink sm:text-[17px]">{caption}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* ── 2. The problem: photo beside the numbers and what they mean ── */}
        <section aria-label="The problem in numbers" className="grid gap-6 lg:grid-cols-2 lg:items-stretch">
          <img src={HERO.src} alt={HERO.alt} fetchPriority="high" width={1024} height={644}
            className="block aspect-[1024/644] w-full rounded-2xl bg-line object-cover lg:h-full" />
          <div className="flex flex-col justify-center gap-5 rounded-2xl bg-brand-deep p-6 text-white sm:p-8">
            <span className="text-[13px] font-semibold uppercase tracking-[0.14em] text-accent">The problem</span>
            <div className="flex flex-col divide-y divide-white/15">
              {stats.map(([n, label]) => (
                <div key={n} className="grid gap-1 py-4 first:pt-0 last:pb-0 sm:grid-cols-[minmax(0,190px)_minmax(0,1fr)] sm:items-baseline sm:gap-6">
                  <span className={`${display} text-[38px] font-semibold leading-none tabular-nums text-accent`}>{n}</span>
                  <span className="text-[15px] text-[#D2E2DA]">{label}</span>
                </div>
              ))}
            </div>
            <p className="m-0 border-t border-white/15 pt-4 text-[15px] leading-relaxed text-white">
              Behind those numbers are people who did everything they were told: years of study and fees, then a job
              market that asks for something no classroom can give them.
            </p>
            <span className="text-[13px] text-[#A9C2B7]">
              Source: <a href={SOURCE} target="_blank" rel="noopener noreferrer" className="text-white underline hover:text-accent">Business Daily, 22 April 2026</a>, reporting KNBS and ILO figures.
            </span>
          </div>
        </section>

        {/* ── 3. The loop, and how Tafutakazi breaks it ── */}
        <Section eyebrow="The loop" title="No experience, no job. No job, no experience.">
          <ol className="m-0 grid list-none gap-0 p-0 md:grid-cols-2 md:gap-x-12">
            {[
              'A company advertises a junior role and asks for 2–3 years of experience.',
              'It receives hundreds of CVs that look almost the same, and can’t tell who can actually do the work.',
              'So it hires the person who has done the job before, the safe choice.',
              'The fresh graduate never gets the chance to gain that experience, and the loop starts again.',
            ].map((text, k) => (
              <li key={k} className="grid grid-cols-[56px_minmax(0,1fr)] gap-4 border-t border-line py-6">
                <span className={`${display} text-[34px] font-semibold leading-none text-brand`}>0{k + 1}</span>
                <span className="text-[17px] leading-relaxed text-ink-2">{text}</span>
              </li>
            ))}
          </ol>
          <p className={`${display} m-0 mx-auto max-w-[40ch] text-center text-[26px] font-semibold leading-snug sm:text-[30px]`}>
            Tafutakazi breaks it by letting graduates <em className="text-brand">show the work</em>, not just describe it.
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            {([
              ['For graduates', forGrads, false],
              ['For employers', forEmployers, true],
            ] as [string, string[], boolean][]).map(([title, items, dark]) => (
              <div key={title} className={`flex flex-col gap-5 rounded-2xl p-7 ${dark ? 'bg-brand-deep text-white' : 'border border-line bg-white'}`}>
                <span className={`${display} text-[26px] font-semibold`}>{title}</span>
                <ol className="m-0 flex list-none flex-col gap-4 p-0">
                  {items.map((i, k) => (
                    <li key={i} className="grid grid-cols-[32px_minmax(0,1fr)] gap-3">
                      <span className={`${display} text-[22px] font-semibold leading-none ${dark ? 'text-accent' : 'text-brand'}`}>{k + 1}</span>
                      <span className={dark ? 'text-[#D2E2DA]' : 'text-ink-2'}>{i}</span>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </Section>

        {/* ── 4. The evidence ── */}
        <Section eyebrow="The evidence" title="Real work says more than years of experience">
          <div className="grid gap-6 rounded-2xl border border-line bg-white p-6 sm:p-8 lg:grid-cols-2 lg:gap-10">
            <div className="flex flex-col gap-5">
              {EVIDENCE.map(([label, value, highlight]) => (
                <div key={label} className="flex flex-col gap-2">
                  <div className="flex items-baseline justify-between gap-4">
                    <span className={highlight ? 'font-semibold text-ink' : 'text-ink-2'}>{label}</span>
                    <span className={`${display} text-[22px] tabular-nums ${highlight ? 'font-semibold text-brand' : 'text-muted'}`}>{value.toFixed(2)}</span>
                  </div>
                  <div className="h-3 rounded-full bg-ground">
                    <div className="h-full rounded-full" style={{ width: `${(value / 0.5) * 100}%`, background: highlight ? 'var(--color-brand)' : '#B9B9B2' }} />
                  </div>
                </div>
              ))}
              <span className="text-[13px] text-muted">How strongly each method predicts job performance. 0 means no link, 1 a perfect one.</span>
            </div>
            <div className="flex flex-col justify-center gap-3 border-t border-line pt-6 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
              <span className={`${display} text-[56px] font-semibold leading-none text-brand`}>4.7×</span>
              <span className="text-ink-2">
                A sample of real work predicts performance almost five times better than years of experience (0.33
                against 0.07). That is why every opportunity on Tafutakazi starts with one.
              </span>
            </div>
          </div>
          <span className="mx-auto max-w-[90ch] text-center text-sm leading-relaxed text-muted">
            Sources: Sackett, P. R., Zhang, C., Berry, C. M., &amp; Lievens, F. (2022). Revisiting meta-analytic estimates of
            validity in personnel selection. <em>Journal of Applied Psychology</em>, 107(11), 2040–2068.{' '}
            <a href="https://doi.org/10.1037/apl0000994" target="_blank" rel="noopener noreferrer">doi.org/10.1037/apl0000994</a>.
            Updating Schmidt, F. L., &amp; Hunter, J. E. (1998). <em>Psychological Bulletin</em>, 124(2), 262–274.{' '}
            <a href="https://doi.org/10.1037/0033-2909.124.2.262" target="_blank" rel="noopener noreferrer">doi.org/10.1037/0033-2909.124.2.262</a>.
          </span>
        </Section>

        {/* ── 5. What we stand for: principles, and the safeguards that back them ── */}
        <Section eyebrow="What we stand for" title="Free, fair and built so it can't be abused">
          <div className="grid gap-x-12 gap-y-8 md:grid-cols-2">
            {beliefs.map(([title, body]) => (
              <div key={title} className="flex flex-col gap-2 border-l-[3px] border-brand pl-5">
                <span className={`${display} text-[22px] font-semibold`}>{title}</span>
                <span className="leading-relaxed text-ink-2">{body}</span>
              </div>
            ))}
          </div>
          <div className="grid gap-x-8 gap-y-5 rounded-2xl border border-line bg-white p-6 sm:grid-cols-2 sm:p-8 lg:grid-cols-3">
            {safeguards.map(([title, body]) => (
              <div key={title} className="grid grid-cols-[36px_minmax(0,1fr)] gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-soft text-brand">{check}</span>
                <div className="flex flex-col gap-0.5">
                  <span className="font-semibold">{title}</span>
                  <span className="text-[14px] leading-relaxed text-ink-2">{body}</span>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* ── 6. Who runs it, and the way in ── */}
        <section className="relative isolate overflow-hidden rounded-2xl bg-brand-deep p-8 text-white sm:p-12">
          <div aria-hidden="true" className="absolute -right-24 -top-24 -z-10 h-72 w-72 rounded-full border-[40px] border-white/5" />
          <div aria-hidden="true" className="absolute -bottom-24 -left-24 -z-10 h-72 w-72 rounded-full border-[40px] border-white/5" />
          <div className="mx-auto flex max-w-[760px] flex-col items-center gap-6 text-center">
            <span className="text-[13px] font-semibold uppercase tracking-[0.14em] text-accent">An independent project, built in Kenya</span>
            <h2 className="m-0 text-[30px] font-semibold leading-tight sm:text-[42px]">Be part of the first chance.</h2>
            <p className="m-0 text-[17px] leading-relaxed text-[#D2E2DA]">
              Tafutakazi is free for everyone who uses it, kept going by people who believe in it and by partners who want
              more young Kenyans in work. Success is measured in one number: how many graduates get their first job.
            </p>
            <div className="flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row">
              <LinkButton to="/join" variant="accent">I just graduated <span aria-hidden="true" className="arrow">→</span></LinkButton>
              <LinkButton to="/hiring" variant="outlineLight">I'm hiring</LinkButton>
              <LinkButton to="/partners" variant="outlineLight">Partner with us</LinkButton>
            </div>
            <span className="text-[15px] text-[#A9C2B7]">
              Questions or ideas: <a href="mailto:hello@tafutakazi.co.ke" className="text-white underline hover:text-accent">hello@tafutakazi.co.ke</a>
            </span>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
