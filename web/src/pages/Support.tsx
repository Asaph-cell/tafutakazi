import { PublicHeader } from '../components/PublicHeader'
import { SiteFooter } from '../components/SiteFooter'
import { Seo } from '../components/Seo'

const EMAIL = 'hello@tafutakazi.co.ke'
const MAIL = `mailto:${EMAIL}?subject=${encodeURIComponent('Partnering with Tafutakazi')}`

const partners = [
  ['Companies', 'Hire from Tafutakazi, write practice tasks from your industry, or sponsor a skills track such as data or marketing.'],
  ['Universities and colleges', 'Bring your final-year students and recent graduates on, and see how many of them get invited to interview.'],
  ['NGOs and foundations', 'Support a group of graduates, design tasks with us, or help us reach more counties.'],
]

export default function Partners() {
  return (
    <div className="min-h-screen">
      <Seo title="Partner with Tafutakazi" description="Tafutakazi helps fresh graduates in Kenya show what they can do. Companies, universities and NGOs can partner with us." />
      <PublicHeader />
      <main className="mx-auto max-w-[1280px] px-5 pb-10 pt-4 sm:px-6 sm:pt-10">
        <div className="flex max-w-[720px] flex-col gap-10">
          <div className="flex flex-col gap-3">
            <h1 className="m-0 text-[34px] font-bold leading-tight tracking-[-0.03em] sm:text-[44px]">Partner with us</h1>
            <p className="m-0 text-[18px] text-ink-2">
              Tafutakazi exists to help reduce graduate unemployment in Kenya. Employers ask for experience that fresh
              graduates can't get without a job, so we give them a way to show what they can do. We work with
              organisations that want more young Kenyans in work.
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
            <span className="text-ink-2">Tell us who you are and what you have in mind. We reply within a few working days.</span>
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
