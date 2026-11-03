import { CV_TEMPLATES, CvPage, SAMPLE_CV, useFit, type CvProps } from '../components/CvTemplates'
import { Seo } from '../components/Seo'
import { ToolLayout, useTitleClass } from '../components/ToolLayout'
import { LinkButton } from '../components/ui'
import { useAuth } from '../lib/auth'
import { EMPTY_CV } from '../lib/cv'

const display = 'font-[family-name:var(--font-display)]'

// What the page shows in place of a real graduate.
const EXAMPLE: CvProps = {
  cv: { ...EMPTY_CV, ...SAMPLE_CV },
  name: 'Your Name',
  email: 'you@example.com',
  grad: { id: '', course: 'Your degree or diploma', institution: 'Your university', grad_year: 2025, track: 'The job you want', slug: 'your-name', digest_enabled: false },
  work: [],
  sample: true,
}

const FEATURES = [
  ['Four professional templates', 'Modern, Banner, Editorial and Classic, each in four colours.'],
  ['See it as you type', 'A live preview shows exactly how your CV will look.'],
  ['Download a PDF', 'Ready to email, print or upload with any application.'],
  ['Your proven work, included', 'Tasks you finish on Tafutakazi go on your CV by themselves.'],
]

function Preview({ template }: { template: string }) {
  const { box, zoom } = useFit(794)
  return (
    <div ref={box} aria-hidden="true" className="overflow-hidden rounded-lg border border-line bg-white shadow-[0_12px_32px_rgba(4,61,44,0.10)]">
      <CvPage {...EXAMPLE} cv={{ ...EXAMPLE.cv, template }} zoom={zoom} />
    </div>
  )
}

export default function CvBuilderInfo() {
  const { profile } = useAuth()
  const isGrad = profile?.role === 'grad'
  const titleClass = useTitleClass('text-[38px] sm:text-[54px]')
  return (
    <ToolLayout>
      <Seo title="Free CV builder for graduates in Kenya"
        description="Build a professional CV for free. Four templates, a live preview and a PDF download, made for graduates in Kenya, with your proven work included." />
      <section className="flex max-w-[760px] flex-col gap-5">
        <span className="text-[13px] font-semibold uppercase tracking-[0.14em] text-brand">Free CV builder</span>
        <h1 className={titleClass}>A CV that shows what you can do</h1>
        <p className="m-0 text-[17px] leading-relaxed text-ink-2 sm:text-[19px]">
          Pick a template, fill in your details, and download a professional CV as a PDF. Free for graduates in Kenya.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          {isGrad ? (
            <LinkButton to="/me/cv">Open my CV builder <span aria-hidden="true" className="arrow">→</span></LinkButton>
          ) : (
            <>
              <LinkButton to="/join">Build my CV free <span aria-hidden="true" className="arrow">→</span></LinkButton>
              <LinkButton to="/login" state={{ from: '/me/cv' }} variant="outline">I have an account</LinkButton>
            </>
          )}
        </div>
      </section>

      <section aria-label="Templates" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {CV_TEMPLATES.map((t) => (
          <div key={t.id} className="flex flex-col gap-2">
            <Preview template={t.id} />
            <span className={`${display} text-[20px] font-semibold`}>{t.label}</span>
            <span className="text-[14px] text-muted">{t.note}</span>
          </div>
        ))}
      </section>

      <section className="grid gap-x-10 gap-y-6 rounded-2xl bg-brand-deep p-6 text-white sm:grid-cols-2 sm:p-10">
        {FEATURES.map(([title, body]) => (
          <div key={title} className="flex flex-col gap-1 border-l-[3px] border-accent pl-4">
            <span className={`${display} text-[22px] font-semibold`}>{title}</span>
            <span className="text-[#D2E2DA]">{body}</span>
          </div>
        ))}
      </section>
    </ToolLayout>
  )
}
