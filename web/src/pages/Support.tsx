import { PublicHeader } from '../components/PublicHeader'
import { SiteFooter } from '../components/SiteFooter'
import { Seo } from '../components/Seo'

const EMAIL = 'hello@tafutakazi.co.ke'
const MAIL = `mailto:${EMAIL}?subject=${encodeURIComponent('Partnering with Tafutakazi')}`

const partners = [
  ['Companies', 'Open your entry-level roles to graduates without experience. Hire on what they can do, write practice tasks from your industry so more graduates are ready for your jobs, or sponsor a skills track.'],
  ['Universities and colleges', 'Get your final-year students and recent graduates in front of employers before they lose momentum, and see how many are invited to interview and hired.'],
  ['NGOs, foundations and government programmes', 'Help more young Kenyans get their first job: support a group of graduates through their first tasks, design tasks with us, or help us reach counties where jobs are hardest to find.'],
]

export default function Partners() {
  return (
    <div className="min-h-screen">
      <Seo title="Partner with Tafutakazi" description="Partner with Tafutakazi to reduce youth unemployment in Kenya. Companies, universities, NGOs and government programmes help fresh graduates into their first job." />
      <PublicHeader />
      <main className="mx-auto max-w-[1280px] px-5 pb-10 pt-4 sm:px-6 sm:pt-10">
        <div className="flex max-w-[720px] flex-col gap-10">
          <div className="flex flex-col gap-3">
            <h1 className="m-0 text-[34px] font-bold leading-tight tracking-[-0.03em] sm:text-[44px]">Partner with us to reduce youth unemployment</h1>
            <p className="m-0 text-[18px] text-ink-2">
              In 2024, 286,695 graduates entered Kenya's job market and 75,000 formal jobs were created. Employers ask
              for experience that fresh graduates can't get without a job. Tafutakazi breaks that loop: graduates do
              real tasks, employers see what they can do, and the best get invited to interview.
            </p>
            <span className="text-sm text-muted">
              Source: <a href="https://www.businessdailyafrica.com/bd/economy/kenya-s-youth-joblessness-highest-in-the-region-5432820" target="_blank" rel="noopener noreferrer">Business Daily, 22 April 2026</a>, reporting KNBS and ILO figures.
            </span>
            <p className="m-0 mt-2 text-[18px] font-semibold text-ink">
              Every partnership we take on has one goal: more young Kenyans in their first job.
            </p>
          </div>

          <div className="flex flex-col gap-5 border-t border-line pt-7">
            {partners.map(([title, body]) => (
              <div key={title} className="flex flex-col gap-1">
                <span className="text-lg font-semibold">{title}</span>
                <span className="text-ink-2">{body}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-3 border-t border-line pt-7">
            <span className="text-ink-2">
              Tell us who you are and how you'd like to help graduates into work. We share results as combined numbers
              (tasks done, interview invites, hires), never graduates' personal details. We reply within a few working days.
            </span>
            <a href={MAIL} className="press inline-flex min-h-12 items-center self-start rounded-lg bg-brand px-5 font-semibold text-white no-underline hover:text-white">
              Email {EMAIL}
            </a>
            <span className="text-sm text-muted">Tafutakazi is free for graduates and recruiters, and always will be for graduates.</span>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
