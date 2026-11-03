import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import type { CvData } from '../lib/cv'
import type { GradRow, MySubmission } from '../lib/grad'

// ghost: sections showing placeholder text, drawn faint in the builder's preview.
// sample: an example CV on a public page, so its contact lines are plain text rather than links.
export type CvProps = { cv: CvData; name: string; email: string; grad: GradRow; work: MySubmission[]; ghost?: Set<string>; sample?: boolean }

export const CV_TEMPLATES = [
  { id: 'modern', label: 'Modern', note: 'Colour sidebar and timeline' },
  { id: 'banner', label: 'Banner', note: 'Bold header and two columns' },
  { id: 'editorial', label: 'Editorial', note: 'Refined and spacious' },
  { id: 'classic', label: 'Classic', note: 'Best for online application systems' },
]

export const CV_COLOURS = [
  ['Navy', '#16395C'], ['Green', '#075A40'], ['Maroon', '#7A2233'], ['Charcoal', '#2F3237'],
]

const SERIF = "'EB Garamond', Georgia, serif"
const SANS = "'Instrument Sans', Arial, sans-serif"
const INK = '#2B2B2B'

const svg = (d: ReactNode) => <svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="flex-none">{d}</svg>
const ICON = {
  phone: svg(<path d="M5 4h4l2 5-2.5 1.500a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A15 15 0 0 1 3 6a2 2 0 0 1 2-2z" />),
  mail: svg(<><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>),
  pin: svg(<><path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z" /><circle cx="12" cy="10" r="2.5" /></>),
  web: svg(<><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" /></>),
  linkedin: svg(<><rect x="3" y="3" width="18" height="18" rx="3" /><path d="M8 11v6M8 7.500v.01M12 17v-6M12 13.500c0-3 5-3.5 5 .5V17" /></>),
}

type Line = { icon: ReactNode; text: string; href?: string }
type Entry = { head: string; sub?: string; dates?: string; points: string[]; foot?: string }

// Everything a template needs, tidied once.
function parts({ cv, email, grad, work, ghost, sample }: CvProps) {
  const linkedin = cv.linkedin.trim().replace(/^https?:\/\//i, '').replace(/^www\./i, '').replace(/\/+$/, '')
  const site = `tafutakazi.co.ke/${grad.slug}`
  const list = (text: string) => text.split(',').map((s) => s.trim()).filter(Boolean)
  const contact: Line[] = [
    ...(cv.phone ? [{ icon: ICON.phone, text: cv.phone }] : []),
    { icon: ICON.mail, text: email },
    ...(cv.town ? [{ icon: ICON.pin, text: cv.town }] : []),
    ...(linkedin ? [{ icon: ICON.linkedin, text: linkedin, href: sample ? undefined : `https://${linkedin}` }] : []),
    { icon: ICON.web, text: site, href: sample ? undefined : `https://${site}` },
  ]
  const jobs: Entry[] = cv.jobs.filter((j) => j.title).map((j) => ({
    head: j.place || j.title,
    sub: j.place ? j.title : undefined,
    dates: j.dates,
    points: j.details.split('\n').map((l) => l.replace(/^[\s•-]+/, '').trim()).filter(Boolean),
  }))
  const tasks: Entry[] = work.map((s) => ({
    head: s.task?.title ?? 'Task',
    sub: 'Practical task, Tafutakazi',
    points: [s.summary],
    foot: s.tools?.length ? `Tools: ${s.tools.join(', ')}` : undefined,
  }))
  const schools = [
    { years: grad.grad_year ? String(grad.grad_year) : '', school: grad.institution ?? '', course: grad.course },
    ...cv.education.filter((e) => e.school || e.course),
  ]
  return {
    contact, jobs, tasks, schools, ghost: ghost ?? new Set<string>(),
    skills: [...new Set([...list(cv.skills), ...work.flatMap((s) => s.tools ?? [])])],
    competencies: list(cv.competencies),
    languages: list(cv.languages),
    referees: cv.referees.filter((r) => r.name),
  }
}

function Name({ name, colour }: { name: string; colour?: string }) {
  const [first, ...rest] = name.trim().split(/\s+/)
  return (
    <div className="uppercase leading-[1.1] tracking-[0.03em]" style={{ color: colour }}>
      <span className="font-bold">{first}</span>{rest.length > 0 && <span className="font-normal"> {rest.join(' ')}</span>}
    </div>
  )
}

function ContactList({ lines }: { lines: Line[] }) {
  return (
    <div className="flex flex-col gap-2.5">
      {lines.map((l) => (
        <div key={l.text} className="flex items-start gap-2.5">
          <span className="mt-0.5">{l.icon}</span>
          {l.href ? <a href={l.href} className="min-w-0 break-words text-inherit no-underline">{l.text}</a> : <span className="min-w-0 break-words">{l.text}</span>}
        </div>
      ))}
    </div>
  )
}

function Bullets({ items }: { items: string[] }) {
  return <ul className="m-0 flex list-disc flex-col gap-0.5 pl-[18px]">{items.map((p, k) => <li key={k} className="text-justify">{p}</li>)}</ul>
}

// Work and tasks. `line` draws the dated timeline down the left.
function Entries({ items, accent, line = false }: { items: Entry[]; accent: string; line?: boolean }) {
  return (
    <div className={`relative flex flex-col gap-4 ${line ? 'pl-5' : ''}`}>
      {line && <span aria-hidden="true" className="absolute bottom-2 left-[3.500px] top-2 w-[1.500px]" style={{ background: accent }} />}
      {items.map((e, k) => (
        <div key={k} className="relative break-inside-avoid">
          {line && <span aria-hidden="true" className="absolute -left-5 top-[6px] h-2 w-2 rounded-full" style={{ background: accent }} />}
          <div className="flex items-baseline justify-between gap-4">
            <span className="text-[14.5px] font-bold">{e.head}</span>
            {e.dates && <span className="flex-none text-[12.5px]">{e.dates}</span>}
          </div>
          {e.sub && <div className="mb-1">{e.sub}</div>}
          <Bullets items={e.points} />
          {e.foot && <div className="mt-0.5 text-[12px] opacity-75">{e.foot}</div>}
        </div>
      ))}
    </div>
  )
}

function Schools({ items }: { items: ReturnType<typeof parts>['schools'] }) {
  return (
    <div className="flex flex-col gap-3">
      {items.map((s, k) => (
        <div key={k} className="break-inside-avoid">
          {k > 0 && <span aria-hidden="true" className="mb-3 block w-12" style={{ borderTop: '2px dotted currentColor' }} />}
          {s.years && <div className="font-bold">{s.years}</div>}
          {s.school && <div className="font-bold uppercase tracking-[0.02em]">{s.school}</div>}
          {s.course && <div>{s.course}</div>}
        </div>
      ))}
    </div>
  )
}

function Referees({ items, accent }: { items: CvData['referees']; accent: string }) {
  return (
    <div className="grid grid-cols-2 gap-x-8 gap-y-3">
      {items.map((r, k) => (
        <div key={k} className="break-inside-avoid">
          <div className="text-[14.5px] font-bold" style={{ color: accent }}>{r.name}</div>
          {r.title && <div>{r.title}</div>}
          {r.phone && <div className="text-[12.5px]"><strong>Phone:</strong> {r.phone}</div>}
          {r.email && <div className="break-words text-[12.5px]"><strong>Email:</strong> {r.email}</div>}
        </div>
      ))}
    </div>
  )
}

function Sec({ id, p, children }: { id: string; p: ReturnType<typeof parts>; children: ReactNode }) {
  return <section data-cv-section={id} className={p.ghost.has(id) ? 'opacity-40' : undefined}>{children}</section>
}

// The sections every template shares, in the usual order for a CV.
function Body({ cv, p, title, line }: { cv: CvData; p: ReturnType<typeof parts>; title: (t: string) => ReactNode; line?: boolean }) {
  return (
    <>
      {cv.summary && <Sec id="profile" p={p}>{title('Profile')}<p className="m-0 whitespace-pre-line text-justify">{cv.summary}</p></Sec>}
      {p.competencies.length > 0 && (
        <Sec id="competencies" p={p}>
          {title('Key competencies')}
          <ul className="m-0 grid list-disc grid-cols-2 gap-x-8 gap-y-0.5 pl-[18px]">{p.competencies.map((c, k) => <li key={k}>{c}</li>)}</ul>
        </Sec>
      )}
      {p.tasks.length > 0 && <Sec id="tasks" p={p}>{title('Proven work')}<Entries items={p.tasks} accent={cv.accent} line={line} /></Sec>}
      {p.jobs.length > 0 && <Sec id="work" p={p}>{title('Work experience')}<Entries items={p.jobs} accent={cv.accent} line={line} /></Sec>}
    </>
  )
}

function Modern(props: CvProps) {
  const { cv, name, grad } = props
  const p = parts(props)
  const side = (t: string) => <div className="mb-3 border-b border-white/70 pb-1.5 text-[17px] font-bold uppercase tracking-[0.14em]">{t}</div>
  const main = (t: string) => <div className="mb-2.5 border-b border-[#555] pb-1 text-[17px] font-bold uppercase tracking-[0.14em]" style={{ color: cv.accent }}>{t}</div>
  return (
    <div className="flex text-[13.5px] leading-[1.5]" style={{ fontFamily: SANS, minHeight: 'inherit', color: INK }}>
      <aside className="flex w-[280px] flex-none flex-col gap-7 px-8 pb-10 pt-9 text-white" style={{ background: cv.accent }}>
        <Sec id="contact" p={p}>{side('Contact')}<ContactList lines={p.contact} /></Sec>
        <Sec id="education" p={p}>{side('Education')}<Schools items={p.schools} /></Sec>
        {p.skills.length > 0 && <Sec id="skills" p={p}>{side('Skills')}<Bullets items={p.skills} /></Sec>}
        {p.languages.length > 0 && <Sec id="languages" p={p}>{side('Languages')}<Bullets items={p.languages} /></Sec>}
      </aside>
      <div className="flex min-w-0 flex-1 flex-col gap-6 px-9 pb-10 pt-12">
        <header>
          <div className="text-[36px]"><Name name={name} colour={cv.accent} /></div>
          <div className="mt-2 text-[18px] uppercase tracking-[0.06em]">{grad.track}</div>
          <span aria-hidden="true" className="mt-2.5 block h-1 w-14" style={{ background: cv.accent }} />
        </header>
        <Body cv={cv} p={p} title={main} line />
        {p.referees.length > 0 && <Sec id="references" p={p}>{main('References')}<Referees items={p.referees} accent={cv.accent} /></Sec>}
      </div>
    </div>
  )
}

function Banner(props: CvProps) {
  const { cv, name, grad } = props
  const p = parts(props)
  const title = (t: string) => (
    <div className="mb-2.5 flex items-center gap-3 text-[15px] font-bold uppercase tracking-[0.14em]" style={{ color: cv.accent }}>
      {t}<span className="h-[1.500px] flex-1" style={{ background: cv.accent }} />
    </div>
  )
  return (
    <div className="text-[13.5px] leading-[1.5]" style={{ fontFamily: SANS, color: INK }}>
      <header data-cv-section="contact" className="flex items-center gap-8 px-11 py-9 text-white" style={{ background: cv.accent }}>
        <div className="min-w-0">
          <div className="text-[40px]"><Name name={name} /></div>
          <div className="mt-2 text-[18px] uppercase tracking-[0.08em]">{grad.track}</div>
        </div>
      </header>
      <div className="grid grid-cols-[minmax(0,1fr)_230px] gap-9 px-11 py-8">
        <div className="flex flex-col gap-6">
          <Body cv={cv} p={p} title={title} line />
          {p.referees.length > 0 && <Sec id="references" p={p}>{title('References')}<Referees items={p.referees} accent={cv.accent} /></Sec>}
        </div>
        <div className="flex flex-col gap-6">
          <Sec id="contact" p={p}>{title('Contact')}<ContactList lines={p.contact} /></Sec>
          <Sec id="education" p={p}>{title('Education')}<Schools items={p.schools} /></Sec>
          {p.skills.length > 0 && <Sec id="skills" p={p}>{title('Skills')}<Bullets items={p.skills} /></Sec>}
          {p.languages.length > 0 && <Sec id="languages" p={p}>{title('Languages')}<Bullets items={p.languages} /></Sec>}
        </div>
      </div>
    </div>
  )
}

function Editorial(props: CvProps) {
  const { cv, name, grad } = props
  const p = parts(props)
  const title = (t: string) => <div className="mb-2 text-[23px] italic leading-none" style={{ fontFamily: SERIF, color: cv.accent }}>{t}</div>
  return (
    <div className="flex flex-col gap-6 px-14 py-12 text-[13.5px] leading-[1.55]" style={{ fontFamily: SANS, color: INK }}>
      <header data-cv-section="contact" className="flex items-center justify-between gap-8 border-b-2 pb-6" style={{ borderColor: cv.accent }}>
        <div className="min-w-0 flex-1">
          <div className="text-[48px] font-semibold capitalize leading-[1.05]" style={{ fontFamily: SERIF }}>{name}</div>
          <div className="mt-1 text-[13px] font-semibold uppercase tracking-[0.2em]" style={{ color: cv.accent }}>{grad.track}</div>
          <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-1 text-[12.5px]">{p.contact.map((l) => <div key={l.text} className="flex items-center gap-2"><span style={{ color: cv.accent }}>{l.icon}</span><span className="min-w-0 break-words">{l.text}</span></div>)}</div>
        </div>
      </header>
      <Body cv={cv} p={p} title={title} />
      <div className="grid grid-cols-3 gap-8">
        <Sec id="education" p={p}>{title('Education')}<Schools items={p.schools} /></Sec>
        {p.skills.length > 0 && <Sec id="skills" p={p}>{title('Skills')}<Bullets items={p.skills} /></Sec>}
        {p.languages.length > 0 && <Sec id="languages" p={p}>{title('Languages')}<Bullets items={p.languages} /></Sec>}
      </div>
      {p.referees.length > 0 && <Sec id="references" p={p}>{title('References')}<Referees items={p.referees} accent={cv.accent} /></Sec>}
    </div>
  )
}

// One column and plain lists, which application systems read most reliably.
function Classic(props: CvProps) {
  const { cv, name, grad } = props
  const p = parts(props)
  const title = (t: string) => <div className="mb-1.5 border-b-2 pb-0.5 text-[14px] font-bold uppercase tracking-[0.14em]" style={{ color: cv.accent, borderColor: cv.accent, fontFamily: SANS }}>{t}</div>
  return (
    <div className="flex flex-col gap-5 px-14 py-12 text-[15px] leading-[1.45]" style={{ fontFamily: SERIF, color: INK }}>
      <header data-cv-section="contact" className="text-center">
        <div className="text-[42px] font-semibold capitalize leading-[1.1]" style={{ color: cv.accent }}>{name}</div>
        <div className="text-[18px] italic">{grad.track}</div>
        <div className="mt-2 flex flex-wrap justify-center gap-x-4 text-[14px]">{p.contact.map((l) => <span key={l.text}>{l.text}</span>)}</div>
      </header>
      <Body cv={cv} p={p} title={title} />
      <Sec id="education" p={p}>{title('Education')}<Schools items={p.schools} /></Sec>
      {p.skills.length > 0 && <Sec id="skills" p={p}>{title('Skills')}<p className="m-0">{p.skills.join(' · ')}</p></Sec>}
      {p.languages.length > 0 && <Sec id="languages" p={p}>{title('Languages')}<p className="m-0">{p.languages.join(' · ')}</p></Sec>}
      {p.referees.length > 0 && <Sec id="references" p={p}>{title('References')}<Referees items={p.referees} accent={cv.accent} /></Sec>}
    </div>
  )
}

// One A4 page. `zoom` shrinks it to fit the preview, and the printed copy is always full size.
// `guide` fills empty sections with faint placeholder text, so people can see where everything goes.
export function CvPage({ zoom = 1, style, guide = false, ...p }: CvProps & { zoom?: number; style?: CSSProperties; guide?: boolean }) {
  const Template = { banner: Banner, editorial: Editorial, classic: Classic }[p.cv.template] ?? Modern
  const props = guide ? withPlaceholders(p) : p
  return (
    <div className="cv-page bg-white text-left" style={{ width: 794, minHeight: 1120, zoom, ...style }}>
      <Template {...props} />
    </div>
  )
}

function withPlaceholders(p: CvProps): CvProps {
  const ghost = new Set<string>()
  const cv = { ...p.cv }
  let work = p.work
  if (!cv.summary.trim()) {
    cv.summary = 'Your profile goes here: two or three lines on what you can do and the job you want.'
    ghost.add('profile')
  }
  if (work.length === 0) {
    work = [{ id: 'ghost', task_id: '', summary: 'Tasks you finish on Tafutakazi appear here by themselves.', tools: [], created_at: '', task: { id: '', title: 'Your Tafutakazi tasks', role: '', industry: null }, verdict: null }]
    ghost.add('tasks')
  }
  if (!cv.jobs.some((j) => j.title)) {
    cv.jobs = [{ title: 'Your role', place: 'Where you worked', dates: 'Dates', details: 'What you did, one point per line.\nEach line becomes a bullet.' }]
    ghost.add('work')
  }
  if (!cv.skills.trim() && !p.work.some((s) => s.tools?.length)) {
    cv.skills = 'Your skills, separated by commas'
    ghost.add('skills')
  }
  if (!cv.competencies.trim()) {
    cv.competencies = 'Problem solving, Communication, Attention to detail, Teamwork'
    ghost.add('competencies')
  }
  if (!cv.languages.trim()) {
    cv.languages = 'English, Kiswahili'
    ghost.add('languages')
  }
  if (!cv.referees.some((r) => r.name)) {
    cv.referees = [{ name: 'Referee name', title: 'Title, company', phone: 'Their phone', email: 'Their email' }]
    ghost.add('references')
  }
  return { ...p, cv, work, ghost }
}

// Scales the A4 page to the width of the column it sits in.
export function useFit(pageWidth: number) {
  const box = useRef<HTMLDivElement>(null)
  const [zoom, setZoom] = useState(0.6)
  useEffect(() => {
    if (!box.current) return
    const watch = new ResizeObserver(([e]) => setZoom(e.contentRect.width / pageWidth))
    watch.observe(box.current)
    return () => watch.disconnect()
  }, [pageWidth])
  return { box, zoom }
}

// Sample words so an empty template still shows its shape. They never reach the real CV.
export const SAMPLE_CV: Partial<CvData> = {
  town: 'Nairobi', phone: '0700 000 000',
  summary: 'A short profile goes here: what you can do, what you have proven, and the job you want next.',
  skills: 'Communication, Excel, Research, Teamwork, Planning',
  competencies: 'Problem solving, Communication, Attention to detail, Teamwork',
  languages: 'English, Kiswahili',
  education: [{ years: '2016 - 2019', school: 'Your high school', course: 'KCSE' }],
  referees: [
    { name: 'Referee name', title: 'Title, Company', phone: '0700 000 000', email: 'name@company.co.ke' },
    { name: 'Referee name', title: 'Title, Company', phone: '0700 000 000', email: 'name@company.co.ke' },
  ],
  jobs: [
    { title: 'Your role', place: 'Where you worked', dates: '2025', details: 'What you did and what changed because of it.\nA second point, with a number if you have one.\nA third point that shows a skill the job needs.' },
    { title: 'Attachment', place: 'Company name', dates: '2024', details: 'A real result you helped to deliver.\nSomething you learned and used.' },
  ],
}
