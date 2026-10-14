import type { ReactNode } from 'react'
import { PublicHeader } from '../components/PublicHeader'
import { Seo, SITE_URL } from '../components/Seo'
import { SiteFooter } from '../components/SiteFooter'
import { LinkButton } from '../components/ui'

const SOURCE = 'https://www.businessdailyafrica.com/bd/economy/kenya-s-youth-joblessness-highest-in-the-region-5432820'

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

function Section({ eyebrow, title, children }: { eyebrow: string; title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <span className="text-[13px] font-semibold uppercase tracking-[0.08em] text-brand">{eyebrow}</span>
        <h2 className="m-0 max-w-[24ch] text-[28px] font-semibold leading-tight tracking-[-0.025em] sm:text-[36px]">{title}</h2>
      </div>
      {children}
    </section>
  )
}

export default function About() {
  return (
    <div className="min-h-screen">
      <Seo
        title="Why Tafutakazi exists"
        description="Kenyan employers ask for experience that fresh graduates can't get without a job. Tafutakazi breaks that loop: graduates prove what they can do through short tasks from real companies."
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'AboutPage',
          url: `${SITE_URL}/about`,
          name: 'Why Tafutakazi exists',
          about: { '@id': `${SITE_URL}/#organization` },
        }}
      />
      <PublicHeader />

      <main className="mx-auto flex max-w-[1280px] flex-col gap-12 px-5 pb-6 pt-4 sm:gap-16 sm:px-6 sm:pt-10">
        <section className="flex flex-col gap-6">
          <span className="text-[13px] font-semibold uppercase tracking-[0.08em] text-brand">Why Tafutakazi</span>
          <h1 className="m-0 max-w-[18ch] text-[clamp(36px,8vw,64px)] font-bold leading-[1.04] tracking-[-0.04em]">
            Every graduate deserves a chance to show what they can do.
          </h1>
          <p className="m-0 max-w-[60ch] text-[18px] leading-relaxed text-ink-2 sm:text-[20px]">
            Tafutakazi means "look for work". It exists to help reduce graduate unemployment in Kenya by giving fresh
            graduates something the job market rarely offers them: a fair chance to prove their skills before anyone
            asks about experience.
          </p>
        </section>

        <Section eyebrow="The problem" title="Too many graduates, too few first chances">
          <div className="grid gap-4 sm:grid-cols-3">
            {stats.map(([n, label]) => (
              <div key={n} className="flex flex-col gap-2 rounded-2xl border border-line bg-white p-6">
                <span className="text-[40px] font-bold leading-none tracking-[-0.03em] tabular-nums">{n}</span>
                <span className="text-ink-2">{label}</span>
              </div>
            ))}
          </div>
          <span className="text-sm text-muted">
            Source: <a href={SOURCE} target="_blank" rel="noopener noreferrer">Business Daily, 22 April 2026</a>, reporting KNBS and ILO figures.
          </span>
          <div className="flex max-w-[66ch] flex-col gap-4 text-[17px] leading-relaxed text-ink-2">
            <p className="m-0">
              Behind those numbers are people who did everything they were told. They studied for years, sat their
              exams and graduated, often after their families paid hundreds of thousands, sometimes millions, of
              shillings in fees. Then they meet a job market that asks for something no classroom can give them.
            </p>
          </div>
        </Section>

        <Section eyebrow="The trap" title="No experience, no job. No job, no experience.">
          <div className="flex flex-wrap gap-4">
            {[
              ['1', 'A company advertises a junior role and asks for 2–3 years of experience.'],
              ['2', 'It receives hundreds of CVs that look almost the same, and can’t tell who can actually do the work.'],
              ['3', 'So it hires the person who has done the job before, the safe choice.'],
              ['4', 'The fresh graduate is never given the chance to get that experience. The loop starts again.'],
            ].map(([n, text]) => (
              <div key={n} className="flex flex-[1_1_200px] flex-col gap-2 border-t-2 border-ink pt-4">
                <span className="font-semibold text-brand">{n}</span>
                <span className="text-ink-2">{text}</span>
              </div>
            ))}
          </div>
          <p className="m-0 max-w-[66ch] text-[17px] leading-relaxed text-ink-2">
            Capable graduates end up selling odds and ends, taking any casual job, or waiting for years. Not because
            they can't do the work, but because nobody gave them a way to show it. Employers lose too: they miss
            sharp, hungry people who would grow with them, and they spend weeks sorting CVs that tell them very
            little.
          </p>
        </Section>

        <Section eyebrow="The idea" title="Let graduates show the work, not just describe it">
          <p className="m-0 max-w-[66ch] text-[17px] leading-relaxed text-ink-2">
            Research on young job seekers in Africa has found the same thing again and again: employers will take a
            chance on people without experience when they have trustworthy proof of what those people can do. A
            reference from someone who has seen your work, or a skills result you can show, changes who gets
            called back. Tafutakazi turns that proof into something every graduate can earn.
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            {[
              ['For graduates', forGrads],
              ['For employers', forEmployers],
            ].map(([title, items]) => (
              <div key={title as string} className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-6">
                <span className="text-lg font-semibold">{title as string}</span>
                <ol className="m-0 flex flex-col gap-2.5 pl-5 text-ink-2">
                  {(items as string[]).map((i) => <li key={i}>{i}</li>)}
                </ol>
              </div>
            ))}
          </div>
        </Section>

        <Section eyebrow="What we believe" title="The principles behind every decision">
          <div className="grid gap-x-10 gap-y-7 md:grid-cols-2">
            {beliefs.map(([title, body]) => (
              <div key={title} className="flex flex-col gap-1.5">
                <span className="text-lg font-semibold">{title}</span>
                <span className="leading-relaxed text-ink-2">{body}</span>
              </div>
            ))}
          </div>
        </Section>

        <Section eyebrow="Trust" title="Built so it can't be abused">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {safeguards.map(([title, body]) => (
              <div key={title} className="flex flex-col gap-1.5 rounded-xl border border-line bg-white p-5">
                <span className="font-semibold">{title}</span>
                <span className="text-[15px] leading-relaxed text-ink-2">{body}</span>
              </div>
            ))}
          </div>
        </Section>

        <Section eyebrow="What Tafutakazi is not" title="Not another CV pile">
          <ul className="m-0 flex max-w-[66ch] flex-col gap-2.5 pl-5 text-[17px] leading-relaxed text-ink-2">
            <li><strong className="text-ink">Not a job board of CVs.</strong> Graduates show their work, and companies invite the people they want to interview.</li>
            <li><strong className="text-ink">Not a paid course.</strong> We don't sell training; the tasks are free and the experience is real.</li>
            <li><strong className="text-ink">Not a recruitment agency.</strong> We never charge graduates, and employers talk to graduates directly.</li>
          </ul>
        </Section>

        <Section eyebrow="Who runs it" title="An independent project, built in Kenya">
          <p className="m-0 max-w-[66ch] text-[17px] leading-relaxed text-ink-2">
            Tafutakazi is an independent project, free for everyone who uses it. It is kept going by people who believe in it, through
            small contributions and partnerships with companies, universities and organisations that want more young
            Kenyans in work. Success is measured in one number: how many graduates get their first job.
          </p>
          <p className="m-0 text-[17px] text-ink-2">
            Questions, ideas or partnerships: <a href="mailto:hello@tafutakazi.co.ke">hello@tafutakazi.co.ke</a>
          </p>
        </Section>

        <section className="flex flex-col gap-5 rounded-[18px] bg-ink p-7 text-ground sm:p-11">
          <h2 className="m-0 text-[26px] font-semibold leading-tight tracking-[-0.025em] sm:text-[34px]">Be part of the first chance.</h2>
          <div className="flex flex-col gap-3 sm:flex-row">
            <LinkButton to="/join" variant="light">I just graduated</LinkButton>
            <LinkButton to="/hiring" variant="outlineLight">I'm hiring</LinkButton>
            <LinkButton to="/support" variant="outlineLight">Partner or support us</LinkButton>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
