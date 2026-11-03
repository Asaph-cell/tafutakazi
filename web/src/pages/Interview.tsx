import { Link, useSearchParams } from 'react-router-dom'
import { Seo } from '../components/Seo'
import { ToolLayout, useTitleClass } from '../components/ToolLayout'
import { Select } from '../components/ui'
import { useAuth } from '../lib/auth'
import { useGrad } from '../lib/grad'
import { COMMON_QUESTIONS, TRACKS, trackBySlug, trackForRole } from '../lib/tracks'

// The four parts of a STAR answer, each next to its part of the worked example.
// Seconds: a rough split of a two-minute answer.
const STAR = [
  { letter: 'S', word: 'Situation', guide: 'Set the scene in one or two sentences: where you were and what was going on.', seconds: 15,
    example: 'In my final year, our group of five had a market research project due in two weeks. The survey answers we collected were full of gaps and duplicates.' },
  { letter: 'T', word: 'Task', guide: 'What you had to do, or the problem you had to solve.', seconds: 15,
    example: 'I offered to clean the data so the group could start the analysis.' },
  { letter: 'A', word: 'Action', guide: 'What you did, step by step. Say "I", not "we". Spend most of your answer here.', seconds: 60,
    example: 'I removed the duplicates in Excel, followed up with 20 people on WhatsApp to fill the gaps, and built a simple sheet that checked new answers as they came in.' },
  { letter: 'R', word: 'Result', guide: 'What happened because of it. Use a number if you can, and say what you learned.', seconds: 30,
    example: 'We submitted three days early and got an A. I still use that checking sheet on every dataset I work with.' },
]

function Question({ q, tip }: { q: string; tip: string }) {
  return (
    <details className="rounded-xl border border-line bg-white p-4">
      <summary className="cursor-pointer font-semibold">{q}</summary>
      <div className="mt-2 flex flex-col gap-3">
        <p className="m-0 text-[15px] text-ink-2">{tip}</p>
      </div>
    </details>
  )
}

export default function Interview() {
  const [params, setParams] = useSearchParams()
  const { profile } = useAuth()
  const { data: grad } = useGrad()
  const titleClass = useTitleClass()
  const chosen = trackBySlug(params.get('role') ?? undefined) ?? (profile?.role === 'grad' ? trackForRole(grad?.track) : undefined)
  const groups: [string, [string, string][]][] = [
    ['Asked in almost every interview', COMMON_QUESTIONS],
    ...(chosen ? [[`For ${chosen.name.toLowerCase()} roles`, chosen.questions] as [string, [string, string][]]] : []),
  ]

  return (
    <ToolLayout>
      <Seo title="Interview practice for jobs in Kenya"
        description="Free interview practice for Kenyan job seekers: the questions employers ask, how to answer them, and questions for each field." />
      <div className="flex max-w-[760px] flex-col gap-3">
        <span className="text-[13px] font-semibold uppercase tracking-[0.14em] text-brand">Interview practice</span>
        <h1 className={titleClass}>Practise before it counts</h1>
        <p className="m-0 text-[17px] leading-relaxed text-ink-2 sm:text-[18px]">
          Read each question, plan your answer, then say it out loud before the real thing. Practising out loud is what makes an answer sound natural.
        </p>
      </div>

      <div className="max-w-[360px]">
        <Select id="role" label="The job you're preparing for" value={chosen?.slug ?? ''}
          onChange={(e) => setParams(e.target.value ? { role: e.target.value } : {}, { replace: true })}>
          <option value="">Choose a field</option>
          {TRACKS.map((t) => <option key={t.slug} value={t.slug}>{t.name}</option>)}
        </Select>
      </div>

      <div className="grid items-start gap-8 lg:grid-cols-2">
        {groups.map(([title, list]) => (
          <section key={title} className="flex flex-col gap-3">
            <h2 className="m-0 text-[24px] font-semibold leading-tight">{title}</h2>
            {list.map(([q, tip]) => <Question key={q} q={q} tip={tip} />)}
          </section>
        ))}
      </div>

      {!chosen && <p className="m-0 text-ink-2">Choose a field above for questions about that job, or start with a <Link to="/skills">skill track</Link>.</p>}

      <section className="flex flex-col gap-8 border-t border-line pt-12">
        <div className="flex max-w-[760px] flex-col gap-3">
          <span className="text-[13px] font-semibold uppercase tracking-[0.14em] text-brand">The STAR method</span>
          <h2 className="m-0 text-[32px] font-semibold leading-tight sm:text-[42px]">How to answer "Tell me about a time…"</h2>
          <p className="m-0 text-[17px] leading-relaxed text-ink-2 sm:text-[18px]">
            These questions want a story, not an opinion. Tell it in four parts and keep it to about two minutes.
          </p>
        </div>

        {/* How the two minutes split, so Action visibly gets the most time */}
        <div className="flex flex-col gap-2">
          <div className="flex h-12 overflow-hidden rounded-xl">
            {STAR.map((p) => (
              <div key={p.letter} className={`flex items-center justify-center gap-1.5 font-semibold ${p.letter === 'A' ? 'bg-brand text-white' : 'bg-brand-soft text-brand'} border-r-2 border-ground last:border-0`}
                style={{ flexGrow: p.seconds, flexBasis: 0 }}>
                <span className="font-[family-name:var(--font-display)] text-[22px]">{p.letter}</span>
                <span className="hidden text-[13px] sm:inline">{p.seconds}s</span>
              </div>
            ))}
          </div>
          <span className="text-[13px] text-muted">A rough split of a two-minute answer.</span>
        </div>

        <div className="overflow-hidden rounded-2xl border border-line bg-white">
          <div className="flex flex-col gap-1 bg-brand-deep px-6 py-5 text-white sm:px-8">
            <span className="text-[13px] font-semibold uppercase tracking-[0.14em] text-accent">Worked example</span>
            <span className="font-[family-name:var(--font-display)] text-[22px] font-semibold leading-snug sm:text-[26px]">"Tell me about a time you solved a problem under pressure."</span>
          </div>
          <ol className="m-0 list-none p-0">
            {STAR.map((p) => (
              <li key={p.letter} className="grid gap-4 border-t border-line px-6 py-6 first:border-0 sm:px-8 lg:grid-cols-[72px_minmax(0,0.9fr)_minmax(0,1.2fr)] lg:gap-8">
                <span className="grid h-[60px] w-[60px] place-items-center rounded-2xl bg-accent font-[family-name:var(--font-display)] text-[34px] font-semibold text-brand-deep">{p.letter}</span>
                <div className="flex flex-col gap-1">
                  <span className="font-[family-name:var(--font-display)] text-[22px] font-semibold">{p.word}</span>
                  <span className="text-ink-2">{p.guide}</span>
                </div>
                <p className="m-0 self-center border-l-[3px] border-accent pl-4 text-[17px] italic leading-relaxed text-ink">{p.example}</p>
              </li>
            ))}
          </ol>
        </div>

        <p className="m-0 max-w-[760px] text-ink-2">
          Your Tafutakazi tasks make good STAR stories: a real problem, what you did, and a result you can show.
        </p>
      </section>
    </ToolLayout>
  )
}
