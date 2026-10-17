import { loadFont } from '@remotion/google-fonts/InstrumentSans'
import type { CSSProperties, ReactNode } from 'react'
import { AbsoluteFill, Audio, Easing, interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion'

const { fontFamily } = loadFont('normal', { weights: ['400', '500', '600', '700'] })

const INK = '#141414'
const GROUND = '#F6F6F3'
const GREEN = '#0E5C45'
const MINT = '#9FE1CB'
const SOFT = '#E7EFEB'
const GOLD = '#E9B949'
const CORAL = '#E07A5F'
const MUTED = '#77776F'

// Scene starts (frames at 30fps). Music is timed to these.
const S = { hook: 0, loop: 150, stats: 300, logo: 480, step1: 600, step2: 750, step3: 930, hiring: 1080, free: 1200, end: 1260 }
export const TOTAL = 1380

const E = Easing.bezier(0.22, 1, 0.36, 1)
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const

const t = (f: number, a: number, b: number, from = 0, to = 1, ease = E) =>
  interpolate(f, [a, b], [from, to], { ...clamp, easing: ease })

function rise(f: number, start: number, dist = 40, dur = 22): CSSProperties {
  const p = t(f, start, start + dur)
  return { opacity: p, transform: `translateY(${(1 - p) * dist}px)`, filter: `blur(${(1 - p) * 8}px)` }
}

// Portrait (9:16) when the composition is taller than wide.
function useV() {
  const { width, height } = useVideoConfig()
  return height > width
}

// Words of a line arrive one after another.
function Words({ text, start, gap = 4, style, color }: { text: string; start: number; gap?: number; style?: CSSProperties; color?: (w: string, i: number) => string | undefined }) {
  const f = useCurrentFrame()
  return (
    <span style={{ display: 'inline-flex', flexWrap: 'wrap', columnGap: '0.26em', justifyContent: 'center', ...style }}>
      {text.split(' ').map((w, i) => (
        <span key={i} style={{ display: 'inline-block', color: color?.(w, i), ...rise(f, start + i * gap, 50, 20) }}>{w}</span>
      ))}
    </span>
  )
}

// A slow push-in on every scene, so nothing ever sits still.
function Camera({ children, from = 1.06, to = 1, dur = 150 }: { children: ReactNode; from?: number; to?: number; dur?: number }) {
  const f = useCurrentFrame()
  const s = interpolate(f, [0, dur], [from, to], { ...clamp, easing: Easing.out(Easing.quad) })
  return <AbsoluteFill style={{ transform: `scale(${s})` }}>{children}</AbsoluteFill>
}

// Scene exit: a quick upward slide with blur.
function Exit({ at, children }: { at: number; children: ReactNode }) {
  const f = useCurrentFrame()
  const p = t(f, at - 10, at, 0, 1, Easing.in(Easing.cubic))
  return <AbsoluteFill style={{ opacity: 1 - p, transform: `translateY(${-p * 80}px)`, filter: `blur(${p * 10}px)` }}>{children}</AbsoluteFill>
}

function Wordmark({ size, start, light = false }: { size: number; start: number; light?: boolean }) {
  const f = useCurrentFrame()
  const { fps } = useVideoConfig()
  const letters = 'tafutakazi'.split('')
  const ink = light ? '#FFFFFF' : INK
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', fontSize: size, fontWeight: 700, letterSpacing: '-0.045em', lineHeight: 1 }}>
      {letters.map((ch, i) => {
        const p = spring({ frame: f - start - i * 2.4, fps, config: { damping: 12, stiffness: 160 } })
        const isA = i === 7
        const isI = i === 9
        return (
          <span key={i} style={{ position: 'relative', display: 'inline-block', color: isA ? (light ? MINT : GREEN) : ink, opacity: Math.min(1, p * 1.4), transform: `translateY(${(1 - p) * size * 0.6}px)` }}>
            {isI ? (
              <span style={{ position: 'relative', display: 'inline-block' }}>
                ı
                <span style={{ position: 'absolute', left: '50%', top: size * 0.155, width: size * 0.14, height: size * 0.14, background: light ? MINT : GREEN, transform: `translateX(-50%) scale(${spring({ frame: f - start - 30, fps, config: { damping: 9, stiffness: 200 } })})` }} />
              </span>
            ) : ch}
          </span>
        )
      })}
      <span style={{ display: 'inline-block', width: size * 0.15, height: size * 0.15, marginLeft: size * 0.03, background: light ? MINT : GREEN, transform: `scale(${spring({ frame: f - start - 36, fps, config: { damping: 8, stiffness: 220 } })})` }} />
    </div>
  )
}

const Label = ({ children, color = GREEN }: { children: ReactNode; color?: string }) => (
  <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color }}>{children}</div>
)

// ─── 1. Hook ───────────────────────────────────────────────────────────────
const ADS = [
  { text: 'Minimum 2 years’ experience', x: -560, y: -250, r: -6, at: 38 },
  { text: '3+ years in a similar role', x: 520, y: -210, r: 5, at: 50 },
  { text: 'Experience required', x: -600, y: 230, r: 4, at: 60 },
  { text: '5 years’ experience preferred', x: 480, y: 260, r: -4, at: 70 },
  { text: 'Proven track record', x: 20, y: -360, r: 2, at: 80 },
  { text: 'At least 1 year post-grad', x: 40, y: 360, r: -3, at: 88 },
]
function Hook() {
  const f = useCurrentFrame()
  const { fps } = useVideoConfig()
  const v = useV()
  const scatter = t(f, 104, 124)
  const sx = v ? 0.3 : 1
  const sy = v ? 2.1 : 1
  return (
    <AbsoluteFill style={{ background: INK, color: '#fff', alignItems: 'center', justifyContent: 'center' }}>
      <Camera from={1} to={1.1} dur={150}>
        {ADS.map((a, i) => {
          const p = spring({ frame: f - a.at, fps, config: { damping: 14, stiffness: 120 } })
          return (
            <div key={i} style={{
              position: 'absolute', left: '50%', top: '50%', padding: '22px 30px', borderRadius: 18, background: '#222522', border: '2px solid #3A3D3A',
              fontSize: 34, fontWeight: 600, color: '#E8E8E3', whiteSpace: 'nowrap',
              transform: `translate(-50%,-50%) translate(${a.x * sx * (1 + scatter * 0.6)}px, ${a.y * sy * (1 + scatter * 0.6) + (1 - p) * 120}px) rotate(${a.r}deg) scale(${0.8 + p * 0.2})`,
              opacity: Math.min(p, 1) * (1 - scatter), filter: `blur(${scatter * 12}px)`,
            }}>
              <span style={{ color: CORAL, marginRight: 14 }}>●</span>{a.text}
            </div>
          )
        })}
        <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 18, padding: v ? '0 70px' : 0 }}>
          <div style={{ fontSize: v ? 44 : 40, color: '#B8B8B0', textAlign: 'center', opacity: t(f, 6, 20) * (1 - t(f, 100, 110)) }}>Every job ad says the same thing.</div>
          <div style={{ fontSize: v ? 124 : 120, fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 1.02, opacity: 1 - t(f, 100, 110), transform: `scale(${0.9 + 0.1 * t(f, 14, 34)})` }}>
            <Words text="“Experience required.”" start={14} gap={6} />
          </div>
        </AbsoluteFill>
        <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', padding: v ? '0 70px' : 0 }}>
          <div style={{ fontSize: v ? 140 : 150, fontWeight: 700, letterSpacing: '-0.045em', textAlign: 'center', lineHeight: 1.02 }}>
            <Words text="But you just graduated." start={112} gap={5} color={(w) => (w === 'graduated.' ? MINT : undefined)} />
          </div>
        </AbsoluteFill>
      </Camera>
    </AbsoluteFill>
  )
}

// ─── 1b. The loop ──────────────────────────────────────────────────────────
// Two arrows chasing each other round a ring between "Job" and "Experience", speeding up.
function LoopRing({ size }: { size: number }) {
  const f = useCurrentFrame()
  const { fps } = useVideoConfig()
  const enter = spring({ frame: f - 4, fps, config: { damping: 15, stiffness: 110 } })
  // Angle grows faster and faster, so the loop feels inescapable.
  const angle = 40 * (f / fps) + 26 * (f / fps) ** 2
  const r = 200
  const arc = (from: number, to: number) => {
    const a = (d: number) => [300 + r * Math.cos((d - 90) * Math.PI / 180), 300 + r * Math.sin((d - 90) * Math.PI / 180)]
    const [x1, y1] = a(from)
    const [x2, y2] = a(to)
    return `M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`
  }
  const pill = (label: string, y: number, color: string, at: number): ReactNode => {
    const p = spring({ frame: f - at, fps, config: { damping: 12 } })
    return (
      <div style={{ position: 'absolute', left: '50%', top: y, transform: `translate(-50%,-50%) scale(${p})`, padding: '16px 34px', borderRadius: 99, background: color, color: color === MINT ? INK : '#fff', fontSize: 40, fontWeight: 700, whiteSpace: 'nowrap', boxShadow: '0 10px 30px rgba(0,0,0,0.35)' }}>
        {label}
      </div>
    )
  }
  return (
    <div style={{ position: 'relative', width: size, height: size, transform: `scale(${(size / 600) * (0.85 + enter * 0.15)})`, transformOrigin: 'top left', opacity: Math.min(1, enter) }}>
      <div style={{ position: 'absolute', inset: 0, width: 600, height: 600 }}>
        <svg width="600" height="600" viewBox="0 0 600 600" style={{ position: 'absolute', inset: 0 }}>
          <defs>
            <marker id="head" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
              <path d="M0 0 L10 5 L0 10 z" fill={MINT} />
            </marker>
          </defs>
          <circle cx="300" cy="300" r={r} fill="none" stroke="#2E312E" strokeWidth="18" />
          <g style={{ transform: `rotate(${angle}deg)`, transformOrigin: '300px 300px' }}>
            <path d={arc(20, 150)} fill="none" stroke={MINT} strokeWidth="14" strokeLinecap="round" markerEnd="url(#head)" />
            <path d={arc(200, 330)} fill="none" stroke={MINT} strokeWidth="14" strokeLinecap="round" markerEnd="url(#head)" />
          </g>
        </svg>
        {pill('Job', 100, '#2A2D2A', 12)}
        {pill('Experience', 500, '#2A2D2A', 20)}
        <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', fontSize: 28, fontWeight: 600, color: '#77776F', letterSpacing: '0.1em', textTransform: 'uppercase', opacity: t(f, 30, 45) }}>
          The loop
        </div>
      </div>
    </div>
  )
}

function Loop() {
  const f = useCurrentFrame()
  const v = useV()
  return (
    <AbsoluteFill style={{ background: INK, color: '#fff' }}>
      <Camera from={1.03} to={1.08} dur={150}>
        <AbsoluteFill style={{ flexDirection: v ? 'column' : 'row', alignItems: 'center', justifyContent: 'center', gap: v ? 70 : 110, padding: v ? '0 70px' : '0 150px' }}>
          <div style={{ flex: v ? '0 0 auto' : '0 0 600px', order: v ? 0 : 1 }}>
            <LoopRing size={v ? 620 : 600} />
          </div>
          <div style={{ flex: v ? '0 0 auto' : 1, display: 'flex', flexDirection: 'column', gap: 30, textAlign: v ? 'center' : 'left' }}>
            <div style={{ fontSize: v ? 78 : 76, fontWeight: 700, letterSpacing: '-0.035em', lineHeight: 1.05 }}>
              <Words text="Huwezi pata job bila experience…" start={10} gap={5} style={{ justifyContent: v ? 'center' : 'flex-start' }} />
            </div>
            <div style={{ fontSize: v ? 78 : 76, fontWeight: 700, letterSpacing: '-0.035em', lineHeight: 1.05, color: MINT }}>
              <Words text="…na huwezi pata experience bila job." start={52} gap={5} style={{ justifyContent: v ? 'center' : 'flex-start' }} />
            </div>
            <div style={{ fontSize: v ? 32 : 30, color: '#9A9A92', ...rise(f, 96, 20) }}>
              No job without experience. No experience without a job.
            </div>
          </div>
        </AbsoluteFill>
      </Camera>
    </AbsoluteFill>
  )
}

// ─── 2. The numbers ────────────────────────────────────────────────────────
function Bar({ label, value, share, color, start }: { label: string; value: number; share: number; color: string; start: number }) {
  const f = useCurrentFrame()
  const v = useV()
  const full = v ? 900 : 1400
  const p = t(f, start, start + 50, 0, 1, Easing.out(Easing.cubic))
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, ...rise(f, start - 6, 30) }}>
      <div style={{ display: 'flex', flexDirection: v ? 'column' : 'row', alignItems: v ? 'flex-start' : 'baseline', gap: v ? 0 : 24 }}>
        <span style={{ fontSize: v ? 150 : 110, fontWeight: 700, letterSpacing: '-0.04em', fontVariantNumeric: 'tabular-nums', color, lineHeight: 1.05 }}>{Math.round(value * p).toLocaleString('en-KE')}</span>
        <span style={{ fontSize: v ? 40 : 36, color: '#45453F' }}>{label}</span>
      </div>
      <div style={{ height: 30, width: full, borderRadius: 15, background: '#E6E6E0', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: full * share * p, borderRadius: 15, background: color }} />
      </div>
    </div>
  )
}
function Stats() {
  const f = useCurrentFrame()
  const v = useV()
  return (
    <AbsoluteFill style={{ background: GROUND, color: INK }}>
      <Camera from={1.04} to={1} dur={180}>
        <AbsoluteFill style={{ justifyContent: 'center', paddingLeft: v ? 90 : 260, paddingRight: v ? 90 : 0, gap: v ? 70 : 56 }}>
          <div style={rise(f, 4)}><Label>Kenya, 2024</Label></div>
          <Bar label="graduates entered the job market" value={286695} share={1} color={INK} start={12} />
          <Bar label="formal jobs were created" value={75000} share={75000 / 286695} color={CORAL} start={40} />
          <div style={{ fontSize: v ? 64 : 54, fontWeight: 600, letterSpacing: '-0.025em', lineHeight: 1.15, maxWidth: v ? 900 : 1300, ...rise(f, 105) }}>
            Most never get a chance to <span style={{ color: GREEN }}>show what they can do.</span>
          </div>
          <div style={{ fontSize: 22, color: MUTED, ...rise(f, 120, 10) }}>Source: Business Daily, 22 April 2026, reporting KNBS and ILO figures</div>
        </AbsoluteFill>
      </Camera>
    </AbsoluteFill>
  )
}

// ─── 3. Logo ───────────────────────────────────────────────────────────────
function Logo() {
  const f = useCurrentFrame()
  const v = useV()
  const wipe = t(f, 0, 16, 0, 1, Easing.out(Easing.cubic))
  return (
    <AbsoluteFill style={{ background: GROUND }}>
      <AbsoluteFill style={{ background: INK, clipPath: `circle(${wipe * 120}% at 50% 50%)` }}>
        <Camera from={1.12} to={1} dur={120}>
          {/* green squares drifting out from the mark */}
          {Array.from({ length: 14 }, (_, i) => {
            const a = (i / 14) * Math.PI * 2
            const d = t(f, 30, 120, 0, 1, Easing.out(Easing.quad)) * (420 + (i % 4) * 90)
            return <div key={i} style={{ position: 'absolute', left: '50%', top: '46%', width: 14 + (i % 3) * 6, height: 14 + (i % 3) * 6, background: i % 3 ? GREEN : MINT, opacity: t(f, 30, 40) * (1 - t(f, 90, 120)), transform: `translate(${Math.cos(a) * d}px, ${Math.sin(a) * d * 0.6}px) rotate(${d / 6}deg)` }} />
          })}
          <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 40 }}>
            <Wordmark size={v ? 160 : 200} start={10} light />
            <div style={{ fontSize: v ? 60 : 56, fontWeight: 600, color: '#fff', letterSpacing: '-0.02em', padding: v ? '0 80px' : 0 }}>
              <Words text="Show your work. Get hired." start={52} gap={5} color={(w) => (w === 'hired.' ? MINT : undefined)} />
            </div>
          </AbsoluteFill>
        </Camera>
      </AbsoluteFill>
    </AbsoluteFill>
  )
}

// ─── Step layout ───────────────────────────────────────────────────────────
function Step({ n, title, sub, children }: { n: string; title: ReactNode; sub: string; children: ReactNode }) {
  const f = useCurrentFrame()
  const v = useV()
  return (
    <AbsoluteFill style={{ background: GROUND, color: INK }}>
      <Camera from={1.05} to={1} dur={170}>
        <AbsoluteFill style={{ flexDirection: v ? 'column' : 'row', alignItems: v ? 'stretch' : 'center', justifyContent: v ? 'center' : undefined, padding: v ? '0 80px' : '0 140px', gap: v ? 70 : 100 }}>
          <div style={{ flex: v ? '0 0 auto' : '0 0 680px', display: 'flex', flexDirection: 'column', gap: 26 }}>
            <div style={{ fontSize: v ? 34 : 30, fontWeight: 700, color: GREEN, ...rise(f, 2) }}>Step {n}</div>
            <div style={{ fontSize: v ? 96 : 86, fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 1.02, ...rise(f, 8, 50, 26) }}>{title}</div>
            <div style={{ fontSize: v ? 40 : 34, color: '#45453F', lineHeight: 1.35, ...rise(f, 20) }}>{sub}</div>
          </div>
          <div style={{ flex: v ? '0 0 auto' : 1, position: 'relative', height: v ? 820 : 760, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{children}</div>
        </AbsoluteFill>
      </Camera>
    </AbsoluteFill>
  )
}

const card: CSSProperties = { background: '#fff', borderRadius: 28, border: '2px solid #E3E3DE', boxShadow: '0 30px 80px rgba(20,20,20,0.10)' }

function Cursor({ x, y, click }: { x: number; y: number; click: number }) {
  return (
    <div style={{ position: 'absolute', left: x, top: y, transform: `scale(${1 - click * 0.15})` }}>
      <svg width="44" height="44" viewBox="0 0 24 24"><path d="M4 2l16 9-7 2-3 7z" fill={INK} stroke="#fff" strokeWidth="1.4" strokeLinejoin="round" /></svg>
    </div>
  )
}

// ─── 4. Pick a task ────────────────────────────────────────────────────────
const TASKS = [
  ['SACCO loan arrears report', 'Data Analyst', '3½ hours', 'Umoja SACCO'],
  ['Back-to-school sale plan', 'Digital Marketer', '2½ hours', 'Soma Bookshop'],
  ['Stock tracker for a hardware shop', 'Software Developer', '4 hours', 'Practice task'],
]
function PickTask() {
  const f = useCurrentFrame()
  const { fps } = useVideoConfig()
  const v = useV()
  const cx = t(f, 70, 100, v ? 760 : 720, v ? 600 : 560)
  const cy = t(f, 70, 100, v ? 760 : 700, v ? 200 : 210)
  const click = t(f, 102, 106) * (1 - t(f, 106, 112))
  const chosen = t(f, 104, 116)
  return (
    <Step n="1" title={<>Pick a short task from a <span style={{ color: GREEN }}>real company.</span></>} sub="Real work for real roles, done in a few hours.">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 28, width: 820 }}>
        {TASKS.map(([title, role, time, co], i) => {
          const p = spring({ frame: f - 22 - i * 9, fps, config: { damping: 15, stiffness: 120 } })
          const on = i === 0
          return (
            <div key={i} style={{
              ...card, padding: '30px 36px', display: 'flex', flexDirection: 'column', gap: 10,
              transform: `translateX(${(1 - p) * 300}px) scale(${on ? 1 + chosen * 0.04 : 1 - chosen * 0.02})`,
              opacity: Math.min(1, p) * (on ? 1 : 1 - chosen * 0.45),
              borderColor: on && chosen > 0 ? GREEN : '#E3E3DE', borderWidth: on ? 2 + chosen * 2 : 2,
            }}>
              <span style={{ alignSelf: 'flex-start', padding: '6px 16px', borderRadius: 99, background: on ? SOFT : '#F1F1EC', color: on ? GREEN : '#45453F', fontSize: 22, fontWeight: 600 }}>{role}</span>
              <span style={{ fontSize: 40, fontWeight: 700, letterSpacing: '-0.02em' }}>{title}</span>
              <span style={{ fontSize: 24, color: MUTED }}>{co} · {time}</span>
              {on && <span style={{ position: 'absolute', right: 32, top: 32, width: 54, height: 54, borderRadius: 27, background: GREEN, color: '#fff', fontSize: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${spring({ frame: f - 106, fps, config: { damping: 9 } })})` }}>✓</span>}
            </div>
          )
        })}
      </div>
      <Cursor x={cx} y={cy} click={click} />
    </Step>
  )
}

// ─── 5. Do it, explain it ──────────────────────────────────────────────────
function DoIt() {
  const f = useCurrentFrame()
  const { fps } = useVideoConfig()
  const enter = spring({ frame: f - 14, fps, config: { damping: 16, stiffness: 110 } })
  const bars = [42, 68, 36, 90, 58, 76]
  const words = Math.round(t(f, 60, 150, 0, 268, Easing.inOut(Easing.quad)))
  const rec = Math.floor(f / 15) % 2
  return (
    <Step n="2" title={<>Do it. Then <span style={{ color: GREEN }}>explain it</span> on video.</>} sub="Show your thinking in your own words, 2–3 minutes.">
      <div style={{ ...card, width: 900, padding: 26, background: '#1C1F1D', border: 'none', transform: `translateY(${(1 - enter) * 160}px) rotate(${(1 - enter) * 3}deg)`, opacity: Math.min(1, enter) }}>
        <div style={{ background: '#fff', borderRadius: 16, height: 430, padding: 26, display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ display: 'flex', gap: 16 }}>
            {[['Sales', 'KSh 4.2M', GREEN], ['Margin', '18%', GOLD], ['Duplicates removed', '312', CORAL]].map(([k, v, c], i) => (
              <div key={k} style={{ flex: 1, background: '#F4F4F1', borderRadius: 12, padding: '14px 18px', ...rise(f, 26 + i * 6, 20) }}>
                <div style={{ fontSize: 18, color: MUTED }}>{k}</div>
                <div style={{ fontSize: 34, fontWeight: 700, color: c }}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{ flex: 1, display: 'flex', gap: 16 }}>
            <div style={{ flex: 3, background: '#F4F4F1', borderRadius: 12, padding: 18, display: 'flex', alignItems: 'flex-end', gap: 14 }}>
              {bars.map((h, i) => (
                <div key={i} style={{ flex: 1, height: `${h}%`, borderRadius: 6, background: i === 3 ? GREEN : '#7FAE9B', transformOrigin: 'bottom', transform: `scaleY(${spring({ frame: f - 40 - i * 5, fps, config: { damping: 13 } })})` }} />
              ))}
            </div>
            <svg viewBox="0 0 60 40" style={{ flex: 2, background: '#F4F4F1', borderRadius: 12 }} preserveAspectRatio="none">
              <polyline points="4,34 14,27 24,29 34,16 44,18 56,7" fill="none" stroke={GOLD} strokeWidth="2" strokeLinejoin="round" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - t(f, 60, 110)} />
            </svg>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginTop: 20, color: '#E8E8E3', fontSize: 24 }}>
          <span style={{ width: 16, height: 16, borderRadius: 8, background: rec ? CORAL : '#7a3a2c' }} />
          <span style={{ fontWeight: 600 }}>REC</span>
          <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.18)' }}>
            <div style={{ height: '100%', width: `${t(f, 20, 175, 5, 92, Easing.linear)}%`, borderRadius: 3, background: '#fff' }} />
          </div>
          <span style={{ fontVariantNumeric: 'tabular-nums' }}>{`0:${String(Math.floor(t(f, 20, 175, 3, 58, Easing.linear))).padStart(2, '0')}`}</span>
        </div>
        <div style={{ position: 'absolute', right: -40, bottom: 70, width: 130, height: 130, borderRadius: 65, background: GREEN, border: '6px solid #fff', boxShadow: '0 20px 50px rgba(0,0,0,0.3)', color: '#fff', fontSize: 46, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          WK
          <div style={{ position: 'absolute', inset: -16, borderRadius: 99, border: `4px solid ${MINT}`, opacity: 0.6 - 0.5 * Math.abs(Math.sin(f / 9)), transform: `scale(${1 + 0.08 * Math.abs(Math.sin(f / 9))})` }} />
        </div>
      </div>
      <div style={{ position: 'absolute', left: 40, bottom: 20, ...card, borderRadius: 99, padding: '16px 30px', fontSize: 30, fontWeight: 700, color: words >= 250 ? GREEN : INK, background: words >= 250 ? SOFT : '#fff', ...rise(f, 56, 30) }}>
        {words >= 250 ? '✓ ' : ''}{words} words written
      </div>
    </Step>
  )
}

// ─── 6. Recruiters watch ───────────────────────────────────────────────────
function GetSeen() {
  const f = useCurrentFrame()
  const { fps } = useVideoConfig()
  const enter = spring({ frame: f - 12, fps, config: { damping: 15 } })
  const thumbs = Math.min(6, Math.max(0, Math.floor((f - 40) / 8)))
  const invited = spring({ frame: f - 100, fps, config: { damping: 10, stiffness: 150 } })
  return (
    <Step n="3" title={<>Recruiters watch <span style={{ color: GREEN }}>the work,</span> not the CV.</>} sub="The best get invited to interview.">
      <div style={{ ...card, width: 820, padding: 40, display: 'flex', flexDirection: 'column', gap: 22, transform: `scale(${0.9 + enter * 0.1})`, opacity: Math.min(1, enter) }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
          <div style={{ width: 92, height: 92, borderRadius: 46, background: SOFT, color: GREEN, fontSize: 36, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>WK</div>
          <div>
            <div style={{ fontSize: 42, fontWeight: 700 }}>Wanjiru K.</div>
            <div style={{ fontSize: 24, color: MUTED }}>BSc Statistics · fresh graduate</div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10, fontSize: 36, fontWeight: 700, color: thumbs ? GREEN : MUTED }}>
            <span style={{ display: 'inline-block', transform: `scale(${1 + 0.25 * Math.max(0, 1 - ((f - 40) % 8) / 8) * (thumbs > 0 && thumbs < 6 ? 1 : 0)})` }}>👍</span>
            <span style={{ fontVariantNumeric: 'tabular-nums' }}>{thumbs}</span>
          </div>
        </div>
        <div style={{ background: '#F4F4F1', borderRadius: 18, padding: '20px 24px', fontSize: 28, lineHeight: 1.4, ...rise(f, 55, 24) }}>
          <div style={{ fontSize: 20, fontWeight: 600, color: MUTED, marginBottom: 6 }}>Recruiter comment</div>
          “Caught the duplicate receipts most people miss. Clear thinking.”
        </div>
        <div style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 14, padding: '16px 28px', borderRadius: 99, background: GREEN, color: '#fff', fontSize: 32, fontWeight: 700, transform: `scale(${invited})`, transformOrigin: 'left center' }}>
          ✓ Invited to interview
        </div>
      </div>
      {Array.from({ length: 16 }, (_, i) => {
        const a = (i / 16) * Math.PI * 2
        const d = t(f, 102, 150, 0, 1, Easing.out(Easing.cubic)) * (180 + (i % 3) * 70)
        return <div key={i} style={{ position: 'absolute', left: '30%', top: '76%', width: 16, height: 16, background: [GREEN, GOLD, MINT, CORAL][i % 4], opacity: t(f, 102, 108) * (1 - t(f, 135, 150)), transform: `translate(${Math.cos(a) * d}px, ${Math.sin(a) * d}px) rotate(${d}deg)` }} />
      })}
    </Step>
  )
}

// ─── 7. For recruiters ─────────────────────────────────────────────────────
function Hiring() {
  const f = useCurrentFrame()
  const v = useV()
  const { fps } = useVideoConfig()
  const fall = t(f, 40, 75, 0, 1, Easing.in(Easing.quad))
  const hero = spring({ frame: f - 62, fps, config: { damping: 12 } })
  return (
    <AbsoluteFill style={{ background: INK, color: '#fff' }}>
      <Camera from={1.06} to={1} dur={120}>
        <AbsoluteFill style={{ flexDirection: v ? 'column' : 'row', alignItems: v ? 'stretch' : 'center', justifyContent: 'center', padding: v ? '0 80px' : '0 160px', gap: v ? 40 : 80 }}>
          <div style={{ flex: v ? '0 0 auto' : '0 0 760px', display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={rise(f, 2)}><Label color={MINT}>Hiring?</Label></div>
            <div style={{ fontSize: 96, fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 1.02 }}>
              <Words text="Skip the 500 CVs." start={8} gap={5} style={{ justifyContent: 'flex-start' }} />
            </div>
            <div style={{ fontSize: 96, fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 1.02, color: MINT }}>
              <Words text="Watch the work." start={50} gap={5} style={{ justifyContent: 'flex-start' }} />
            </div>
            <div style={{ fontSize: 32, color: '#B8B8B0', ...rise(f, 70) }}>Post a task for free. Invite the people you want to meet.</div>
          </div>
          <div style={{ flex: v ? '0 0 auto' : 1, position: 'relative', height: 700, marginLeft: v ? 60 : 0 }}>
            {Array.from({ length: 12 }, (_, i) => (
              <div key={i} style={{
                position: 'absolute', left: 120 + (i % 4) * 40, top: 120 + i * 12, width: 380, height: 480, borderRadius: 14, background: '#2A2D2A', border: '2px solid #3A3D3A',
                transform: `rotate(${(i % 5) * 3 - 6}deg) translateY(${fall * (500 + i * 40)}px) rotate(${fall * (i % 2 ? 30 : -30)}deg)`, opacity: t(f, i * 2, i * 2 + 10) * (1 - fall),
                padding: 30, display: 'flex', flexDirection: 'column', gap: 14,
              }}>
                <div style={{ height: 22, width: '60%', borderRadius: 11, background: '#45484A' }} />
                {[90, 75, 85, 60, 80].map((w, k) => <div key={k} style={{ height: 12, width: `${w}%`, borderRadius: 6, background: '#3A3D3A' }} />)}
                <div style={{ marginTop: 'auto', fontSize: 22, color: '#77776F' }}>CV_final_v3.pdf</div>
              </div>
            ))}
            <div style={{ position: 'absolute', left: 120, top: 150, width: 520, ...card, border: `4px solid ${MINT}`, padding: 26, transform: `scale(${hero}) rotate(${(1 - hero) * -8}deg)`, opacity: Math.min(1, hero), color: INK }}>
              <div style={{ height: 250, borderRadius: 14, background: '#1C1F1D', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 84, height: 84, borderRadius: 42, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="34" height="34" viewBox="0 0 24 24" fill={INK}><path d="M8 5v14l11-7z" /></svg>
                </div>
              </div>
              <div style={{ fontSize: 34, fontWeight: 700, marginTop: 20 }}>Grocery sales dashboard</div>
              <div style={{ fontSize: 22, color: MUTED }}>Video · preview · 268-word write-up</div>
            </div>
          </div>
        </AbsoluteFill>
      </Camera>
    </AbsoluteFill>
  )
}

// ─── 8. Free, and the end card ─────────────────────────────────────────────
function Free() {
  const v = useV()
  return (
    <AbsoluteFill style={{ background: GROUND, color: INK, alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 10 }}>
      <Camera from={1.08} to={1} dur={60}>
        <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: v ? 132 : 150, fontWeight: 700, letterSpacing: '-0.05em' }}>
            <Words text="Free. Always." start={0} gap={8} color={(w) => (w === 'Always.' ? GREEN : undefined)} />
          </div>
          <div style={{ fontSize: 44, color: '#45453F' }}>
            <Words text="For every fresh graduate in Kenya." start={18} gap={3} />
          </div>
        </AbsoluteFill>
      </Camera>
    </AbsoluteFill>
  )
}
function End() {
  const f = useCurrentFrame()
  const v = useV()
  return (
    <AbsoluteFill style={{ background: INK, alignItems: 'center', justifyContent: 'center' }}>
      <AbsoluteFill style={{ background: GREEN, clipPath: `circle(${t(f, 0, 18) * 120}% at 50% 50%)` }} />
      <AbsoluteFill style={{ background: INK, clipPath: `circle(${t(f, 6, 26) * 120}% at 50% 50%)`, alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 46 }}>
        <Wordmark size={v ? 135 : 170} start={12} light />
        <div style={{ fontSize: 46, color: '#fff', fontWeight: 600, ...rise(f, 48) }}>Show your work. Get hired.</div>
        <div style={{ marginTop: 10, padding: '22px 46px', borderRadius: 18, background: '#fff', color: INK, fontSize: 48, fontWeight: 700, letterSpacing: '-0.02em', ...rise(f, 60) }}>
          tafutakazi<span style={{ color: GREEN }}>.co.ke</span>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  )
}

// ─── Timeline ──────────────────────────────────────────────────────────────
const scenes: [number, number, () => JSX.Element][] = [
  [S.hook, S.loop, Hook],
  [S.loop, S.stats, Loop],
  [S.stats, S.logo, Stats],
  [S.logo, S.step1, Logo],
  [S.step1, S.step2, PickTask],
  [S.step2, S.step3, DoIt],
  [S.step3, S.hiring, GetSeen],
  [S.hiring, S.free, Hiring],
  [S.free, S.end, Free],
  [S.end, TOTAL, End],
]

export const Intro = () => (
  <AbsoluteFill style={{ fontFamily, background: INK }}>
    {scenes.map(([from, to, Scene], i) => (
      <Sequence key={i} from={from} durationInFrames={to - from} premountFor={10}>
        {i < scenes.length - 1 && Scene !== Stats ? <Exit at={to - from}><Scene /></Exit> : <Scene />}
      </Sequence>
    ))}
    <Audio src={staticFile('music.wav')} />
  </AbsoluteFill>
)
