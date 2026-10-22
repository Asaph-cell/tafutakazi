import { JsonLd } from './Seo'

export type QA = { q: string; a: string }

// Questions people actually ask (often to AI assistants), answered plainly. Marked up as an FAQ so
// search engines and AI answers can quote them. Every answer is visible on the page.
export function Faq({ title, items }: { title: string; items: QA[] }) {
  return (
    <section className="flex flex-col gap-8">
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: items.map(({ q, a }) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
        }}
      />
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="text-[13px] font-semibold uppercase tracking-[0.14em] text-brand">Questions</span>
        <h2 className="m-0 text-[30px] font-semibold leading-tight sm:text-[40px]">{title}</h2>
        <span aria-hidden="true" className="block h-[3px] w-14 bg-brand" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {items.map(({ q, a }) => (
          <div key={q} className="flex flex-col gap-2 rounded-2xl border border-line bg-white p-6">
            <h3 className="m-0 font-sans text-[17px] font-semibold leading-snug">{q}</h3>
            <p className="m-0 leading-relaxed text-ink-2">{a}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

// For fresh graduates (homepage). Phrased the way young Kenyans ask job-search questions.
export const GRADUATE_FAQ: QA[] = [
  {
    q: 'How do I get a job in Kenya with no experience?',
    a: "Show proof of what you can do instead of years of experience. On Tafutakazi you do a short task from a real role, explain it in a 2–3 minute video and a write-up, and employers invite the graduates whose work they like to interview. It's free.",
  },
  {
    q: 'How can I gain experience before my first job?',
    a: 'Do real work on real problems and keep the proof. Practice tasks on Tafutakazi are modelled on actual entry-level roles (data, accounting, marketing, design, software and more), and each one becomes a line on your CV with a link that shows the work.',
  },
  {
    q: 'Where can I find internships and graduate trainee roles in Kenya?',
    a: 'Kenyan companies post jobs, internships, graduate trainee roles and volunteer opportunities on Tafutakazi, each with a short task from the role. New ones are emailed to you when they match your field.',
  },
  {
    q: 'What jobs can I apply for as a fresh graduate in Kenya?',
    a: 'Entry-level roles that match your course, such as junior analyst, accounts assistant, marketing or social media assistant, customer service, sales, design and junior developer roles. Tafutakazi lets you prove you can do one before you apply.',
  },
  {
    q: 'How do I get an internship without connections?',
    a: "Let your work speak for you. Employers on Tafutakazi see what you did and how you explain it, not who you know, and they invite people to interview based on that.",
  },
  {
    q: 'How can I tell if a job advert is a scam?',
    a: 'Be careful if anyone asks you to pay a fee, the pay sounds too good for the role, or the company has no website, office or real contacts. On Tafutakazi every company shows where to find it online, and no one is ever allowed to ask a graduate for money.',
  },
  {
    q: 'Is Tafutakazi free, and who can join?',
    a: 'Yes, it is free. It is for fresh graduates in Kenya, from universities and TVET colleges, with a degree or diploma and little or no work experience.',
  },
  {
    q: 'Who can see my work?',
    a: "Only signed-in recruiters. Other graduates can't see it, so nobody can copy it, and the full work stays locked until a company invites you.",
  },
]

// For employers (hiring page).
export const EMPLOYER_FAQ: QA[] = [
  {
    q: 'How do I hire fresh graduates in Kenya without reading hundreds of CVs?',
    a: 'Post a short task from the role. Graduates do it and explain their work on video, you score it with a simple guide, and you invite the ones you want to meet. You judge real work instead of near-identical CVs.',
  },
  {
    q: 'Does it cost anything to hire through Tafutakazi?',
    a: 'No. Posting tasks, seeing work and inviting graduates to interview is free for employers.',
  },
  {
    q: 'Can I hire interns, attachés or graduate trainees?',
    a: 'Yes. You can post jobs, internships, graduate trainee roles and volunteer opportunities, with the stipend or pay, duration and hours shown to graduates.',
  },
  {
    q: 'Is this free labour?',
    a: 'No. Tasks are short tests with sample data that take two or three hours, never real client work, and a graduate’s full work stays locked until you invite them.',
  },
  {
    q: 'Why judge a work sample instead of years of experience?',
    a: 'The most thorough recent review of hiring research (Sackett and colleagues, 2022) found that a sample of real work predicts job performance almost five times better than years of experience.',
  },
  {
    q: 'How do you check that companies are real?',
    a: 'Before posting, a company shows a company email, website, LinkedIn or business page, and every task is checked before it goes live. Graduates can report a task, and three reports pause it automatically.',
  },
]
