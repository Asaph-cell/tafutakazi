import { useEffect, useState, type ReactNode } from 'react'

// Local-only page (dev builds) for choosing loading, page-change and button styles.

const css = `
.sk { background: #E9E9E4; border-radius: 8px; }
.sk-pulse { animation: skPulse 1.4s ease-in-out infinite; }
@keyframes skPulse { 50% { opacity: .45 } }
.sk-shimmer { position: relative; overflow: hidden; }
.sk-shimmer::after { content: ''; position: absolute; inset: 0; transform: translateX(-100%);
  background: linear-gradient(90deg, transparent, rgba(255,255,255,.75), transparent); animation: skShimmer 1.3s infinite; }
@keyframes skShimmer { to { transform: translateX(100%) } }
.sk-brand { background: #E6EFEB; }
.sk-brand.sk-shimmer::after { background: linear-gradient(90deg, transparent, rgba(255,255,255,.8), transparent); }
.reveal { animation: reveal 380ms var(--ease-out-strong) both; }
@keyframes reveal { from { opacity: 0; transform: translateY(6px) } }

.pt-fade { animation: ptFade 220ms ease-out both; }
@keyframes ptFade { from { opacity: 0 } }
.pt-rise { animation: ptRise 340ms var(--ease-out-strong) both; }
@keyframes ptRise { from { opacity: 0; transform: translateY(10px) } }
.pt-blur { animation: ptBlur 420ms var(--ease-out-strong) both; }
@keyframes ptBlur { from { opacity: 0; transform: translateY(8px); filter: blur(6px) } }
.pt-slide { animation: ptSlide 320ms var(--ease-out-strong) both; }
@keyframes ptSlide { from { opacity: 0; transform: translateX(24px) } }
.bar { position: absolute; left: 0; top: 0; height: 3px; background: var(--color-brand); animation: bar 700ms var(--ease-out-strong) forwards; }
@keyframes bar { from { width: 0 } 70% { width: 85%; opacity: 1 } to { width: 100%; opacity: 0 } }

.b { min-height: 44px; padding: 0 20px; border-radius: 10px; font-weight: 600; cursor: pointer; border: 0;
  background: var(--color-brand); color: #fff; display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  position: relative; overflow: hidden; font: inherit; font-weight: 600; }
.b-scale { transition: transform 160ms var(--ease-out-strong), background 160ms; }
.b-scale:active { transform: scale(.97); }
.b-deep { transition: transform 120ms var(--ease-out-strong); box-shadow: 0 3px 0 var(--color-brand-dark); }
.b-deep:active { transform: translateY(3px); box-shadow: 0 0 0 var(--color-brand-dark); }
.b-dim { transition: transform 160ms var(--ease-out-strong), filter 160ms; }
.b-dim:active { transform: scale(.97); filter: brightness(.85); }
.ripple { position: absolute; border-radius: 50%; background: rgba(255,255,255,.45); transform: scale(0); animation: ripple 550ms ease-out forwards; pointer-events: none; }
@keyframes ripple { to { transform: scale(4); opacity: 0 } }
.spin { width: 16px; height: 16px; border-radius: 50%; border: 2px solid rgba(255,255,255,.4); border-top-color: #fff; animation: spin 600ms linear infinite; }
@keyframes spin { to { transform: rotate(360deg) } }
.swap { animation: swap 220ms var(--ease-out-strong) both; display: inline-flex; align-items: center; gap: 8px; }
@keyframes swap { from { opacity: 0; transform: translateY(6px); filter: blur(2px) } }
.fill { position: absolute; inset: 0; background: var(--color-brand-dark); transform-origin: left; animation: fill 1100ms ease-out forwards; }
@keyframes fill { from { transform: scaleX(0) } to { transform: scaleX(1) } }
.toast { animation: toast 320ms var(--ease-out-strong) both; }
@keyframes toast { from { opacity: 0; transform: translateY(12px) scale(.97) } }
.shake { animation: shake 360ms ease-in-out; }
@keyframes shake { 20%, 60% { transform: translateX(-5px) } 40%, 80% { transform: translateX(5px) } }
`

function Section({ id, title, note, children }: { id: string; title: string; note: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="m-0 text-[22px] font-semibold tracking-[-0.02em]">{id}. {title}</h2>
        <p className="m-0 text-muted">{note}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{children}</div>
    </section>
  )
}

function Card({ label, desc, children }: { label: string; desc: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-5">
      <div>
        <p className="m-0 font-semibold">{label}</p>
        <p className="m-0 text-sm text-muted">{desc}</p>
      </div>
      {children}
    </div>
  )
}

// A job card, real or as a skeleton.
function JobCard() {
  return (
    <div className="reveal flex flex-col gap-2 rounded-xl border border-line p-4">
      <span className="w-fit rounded-full bg-brand-soft px-2.5 py-0.5 text-xs font-semibold text-brand">Internship</span>
      <p className="m-0 font-semibold">Clean a sales spreadsheet and chart it</p>
      <p className="m-0 text-sm text-muted">Data analyst · Nairobi · 2 hours</p>
    </div>
  )
}
function JobSkeleton({ cls }: { cls: string }) {
  return (
    <div className="flex flex-col gap-2.5 rounded-xl border border-line p-4">
      <div className={`sk ${cls} h-5 w-20 rounded-full`} />
      <div className={`sk ${cls} h-4 w-4/5`} />
      <div className={`sk ${cls} h-3.5 w-1/2`} />
    </div>
  )
}

function SkeletonDemo({ cls }: { cls: string }) {
  const [loading, setLoading] = useState(true)
  const [n, setN] = useState(0)
  useEffect(() => {
    setLoading(true)
    const t = setTimeout(() => setLoading(false), 1800)
    return () => clearTimeout(t)
  }, [n])
  return (
    <>
      <div className="flex flex-col gap-2">
        {loading ? <><JobSkeleton cls={cls} /><JobSkeleton cls={cls} /></> : <><JobCard /><JobCard /></>}
      </div>
      <button className="press w-fit cursor-pointer rounded-lg border border-line-strong bg-white px-3 py-1.5 text-sm font-semibold" onClick={() => setN(n + 1)}>Replay</button>
    </>
  )
}

const PAGES = [
  { name: 'Jobs', body: 'Browse tasks from companies hiring now.' },
  { name: 'About', body: 'Why doing the work beats a CV.' },
  { name: 'Blog', body: 'Notes for employers hiring graduates.' },
]
function PageDemo({ cls, bar }: { cls: string; bar?: boolean }) {
  const [page, setPage] = useState(0)
  const [key, setKey] = useState(0)
  const go = (i: number) => { setPage(i); setKey(key + 1) }
  return (
    <div className="relative overflow-hidden rounded-xl border border-line">
      {bar && key > 0 && <div key={`b${key}`} className="bar" />}
      <div className="flex gap-1 border-b border-line bg-ground px-3 py-2 text-sm">
        {PAGES.map((p, i) => (
          <button key={p.name} onClick={() => go(i)}
            className={`press cursor-pointer rounded-md border-0 px-2.5 py-1 font-semibold ${i === page ? 'bg-white text-ink' : 'bg-transparent text-muted'}`}>{p.name}</button>
        ))}
      </div>
      <div key={key} className={`${cls} flex min-h-[120px] flex-col gap-2 p-4`}>
        <p className="m-0 text-lg font-semibold">{PAGES[page].name}</p>
        <p className="m-0 text-sm text-muted">{PAGES[page].body}</p>
      </div>
    </div>
  )
}

function RippleButton() {
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number; s: number }[]>([])
  return (
    <button className="b b-scale" onPointerDown={(e) => {
      const r = e.currentTarget.getBoundingClientRect()
      const s = Math.max(r.width, r.height)
      const id = Date.now()
      setRipples((x) => [...x, { id, x: e.clientX - r.left - s / 2, y: e.clientY - r.top - s / 2, s }])
      setTimeout(() => setRipples((x) => x.filter((p) => p.id !== id)), 600)
    }}>
      {ripples.map((p) => <span key={p.id} className="ripple" style={{ left: p.x, top: p.y, width: p.s, height: p.s }} />)}
      Apply now
    </button>
  )
}

type State = 'idle' | 'busy' | 'done'
function useSubmit() {
  const [state, setState] = useState<State>('idle')
  const run = () => {
    if (state !== 'idle') return
    setState('busy')
    setTimeout(() => setState('done'), 1100)
    setTimeout(() => setState('idle'), 2800)
  }
  return [state, run] as const
}

function SpinnerSubmit() {
  const [state, run] = useSubmit()
  return (
    <button className="b b-scale min-w-[170px]" onClick={run} style={state === 'done' ? { background: '#0B4A38' } : undefined}>
      <span key={state} className="swap">
        {state === 'idle' && 'Submit work'}
        {state === 'busy' && <><span className="spin" />Submitting…</>}
        {state === 'done' && <>✓ Submitted</>}
      </span>
    </button>
  )
}
function FillSubmit() {
  const [state, run] = useSubmit()
  return (
    <button className="b b-scale min-w-[170px]" onClick={run}>
      {state === 'busy' && <span className="fill" />}
      <span key={state} className="swap relative">
        {state === 'idle' && 'Submit work'}
        {state === 'busy' && 'Uploading…'}
        {state === 'done' && '✓ Submitted'}
      </span>
    </button>
  )
}
function ToastSubmit() {
  const [state, run] = useSubmit()
  return (
    <div className="flex flex-col items-start gap-3">
      <button className="b b-scale min-w-[170px]" onClick={run} disabled={state === 'busy'} style={state === 'busy' ? { opacity: 0.75 } : undefined}>
        {state === 'busy' ? <><span className="spin" />Saving…</> : 'Save profile'}
      </button>
      <div className="h-11">
        {state === 'done' && (
          <div className="toast flex items-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white">
            <span className="grid h-5 w-5 place-items-center rounded-full bg-brand text-xs">✓</span> Profile saved
          </div>
        )}
      </div>
    </div>
  )
}
function ErrorShake() {
  const [n, setN] = useState(0)
  const [err, setErr] = useState(false)
  return (
    <div className="flex flex-col gap-2">
      <input key={n} placeholder="you@email.com" className={`rounded-lg border px-3 py-2.5 ${err ? 'shake border-danger' : 'border-line-strong'}`} onChange={() => setErr(false)} />
      {err && <p className="reveal m-0 text-sm text-danger">Enter your email first.</p>}
      <button className="b b-scale w-fit" onClick={() => { setErr(true); setN(n + 1) }}>Log in</button>
    </div>
  )
}

export function Samples() {
  return (
    <main className="mx-auto flex max-w-[1200px] flex-col gap-14 px-5 py-12">
      <style>{css}</style>
      <div>
        <h1 className="m-0 text-[34px] font-semibold tracking-[-0.03em]">Pick your styles</h1>
        <p className="m-0 text-muted">Try each one, then tell me the letters you like, e.g. "A2, B3, C1 + D1".</p>
      </div>

      <Section id="A" title="Loading (skeletons)" note="Grey shapes in the layout of the real content, then the content fades in. Press Replay.">
        <Card label="A1 · Pulse" desc="Shapes gently fade in and out."><SkeletonDemo cls="sk-pulse" /></Card>
        <Card label="A2 · Shimmer" desc="A soft light sweeps across (LinkedIn, YouTube)."><SkeletonDemo cls="sk-shimmer" /></Card>
        <Card label="A3 · Green shimmer" desc="Same sweep, tinted in the Tafutakazi green."><SkeletonDemo cls="sk-shimmer sk-brand" /></Card>
      </Section>

      <Section id="B" title="Changing pages" note="Click the tabs to switch pages.">
        <Card label="B1 · Fade" desc="Quick and quiet. Hardly noticed."><PageDemo cls="pt-fade" /></Card>
        <Card label="B2 · Rise" desc="Fades in while lifting slightly (Apple, Linear)."><PageDemo cls="pt-rise" /></Card>
        <Card label="B3 · Soft focus" desc="Rises out of a light blur. Matches the homepage."><PageDemo cls="pt-blur" /></Card>
        <Card label="B4 · Slide" desc="Slides in from the side, like an app."><PageDemo cls="pt-slide" /></Card>
        <Card label="B5 · Rise + top bar" desc="B2 plus a thin green bar at the top while loading (GitHub, YouTube)."><PageDemo cls="pt-rise" bar /></Card>
      </Section>

      <Section id="C" title="Button press" note="Click and hold each button.">
        <Card label="C1 · Shrink" desc="Shrinks a touch (what the site does now)."><button className="b b-scale w-fit">Apply now</button></Card>
        <Card label="C2 · Shrink + darken" desc="Shrinks and darkens, so it feels pressed in."><button className="b b-dim w-fit">Apply now</button></Card>
        <Card label="C3 · Push down" desc="A raised button that sinks when pressed."><button className="b b-deep w-fit">Apply now</button></Card>
        <Card label="C4 · Ripple" desc="A circle spreads from your finger (Android)."><div><RippleButton /></div></Card>
      </Section>

      <Section id="D" title="Submitting forms" note="Click each button to see the whole flow.">
        <Card label="D1 · Spinner → tick" desc="Button shows a spinner, then 'Submitted' with a tick."><div><SpinnerSubmit /></div></Card>
        <Card label="D2 · Progress fill" desc="Button fills up while uploading, then ticks."><div><FillSubmit /></div></Card>
        <Card label="D3 · Spinner + toast" desc="Spinner in the button, then a small message pops up."><ToastSubmit /></Card>
        <Card label="D4 · Error shake" desc="A wrong field shakes and says what's missing. Goes with any of the above."><ErrorShake /></Card>
      </Section>
    </main>
  )
}
