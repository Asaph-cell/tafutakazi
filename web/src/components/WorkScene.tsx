import type { CSSProperties, ReactElement } from 'react'

// Drawn stand-ins for a graduate's screen recording on the homepage cards: the work itself, not a face.
// When a card is at the front it "plays": the work builds up and a pointer goes to the key part.
export type SceneKind = 'dashboard' | 'campaign' | 'poster' | 'spreadsheet' | 'code'

const G = '#0E5C45'
const G2 = '#7FAE9B'
const GOLD = '#E9B949'
const CORAL = '#E07A5F'
const SOFT = '#E7EFEB'
const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)'

// Grow in when playing; settle back when not. Staggered by index.
const grow = (on: boolean, k: number, ms = 900): CSSProperties => ({
  transition: `transform ${ms}ms ${EASE} ${on ? 300 + k * 140 : 0}ms, opacity ${ms}ms ${EASE} ${on ? 300 + k * 140 : 0}ms`,
})

function Dashboard({ on }: { on: boolean }) {
  const bars = [45, 70, 38, 92, 60, 76]
  return (
    <div className="flex h-full flex-col gap-1.5 p-2">
      <div className="grid grid-cols-3 gap-1.5">
        {[['Sales', 'KSh 4.2M', G], ['Margin', '18%', GOLD], ['Duplicates', '312', CORAL]].map(([k, v, c], i) => (
          <div key={k} className="rounded bg-[#F4F4F1] px-1.5 py-1" style={{ ...grow(on, i, 700), opacity: on ? 1 : 0.4 }}>
            <div className="text-[7px] leading-none text-[#77776F]">{k}</div>
            <div className="mt-0.5 text-[10px] font-bold leading-none" style={{ color: c }}>{v}</div>
          </div>
        ))}
      </div>
      <div className="flex min-h-0 flex-1 gap-1.5">
        <div className="flex flex-[3] items-end gap-1 rounded bg-[#F4F4F1] p-1.5">
          {bars.map((h, k) => (
            <div key={k} className="flex-1 origin-bottom rounded-sm"
              style={{ height: `${h}%`, background: k === 3 ? G : G2, transform: `scaleY(${on ? 1 : 0.15})`, ...grow(on, k) }} />
          ))}
        </div>
        <svg viewBox="0 0 60 40" className="flex-[2] rounded bg-[#F4F4F1]" preserveAspectRatio="none">
          <polyline points="4,32 14,26 24,28 34,16 44,18 56,8" fill="none" stroke={GOLD} strokeWidth="2.2" strokeLinejoin="round"
            pathLength={1} strokeDasharray="1" style={{ strokeDashoffset: on ? 0 : 1, transition: `stroke-dashoffset 1800ms ${EASE} ${on ? 900 : 0}ms` }} />
        </svg>
      </div>
    </div>
  )
}

function Campaign({ on }: { on: boolean }) {
  const tiles = [G, 0, GOLD, CORAL, 0, G, G2, 0, CORAL, G, 0, GOLD, G, 0]
  return (
    <div className="flex h-full flex-col gap-1.5 p-2">
      <div className="flex items-center justify-between">
        <span className="text-[8px] font-bold text-[#141414]">December plan · 4 weeks</span>
        <span className="rounded-full px-1.5 py-px text-[7px] font-semibold" style={{ background: SOFT, color: G }}>KSh 15,000</span>
      </div>
      <div className="grid flex-1 grid-cols-7 gap-1">
        {tiles.map((c, k) => (
          <div key={k} className="rounded-sm bg-[#F4F4F1]">
            {c !== 0 && <div className="h-full w-full rounded-sm" style={{ background: String(c), transform: `scale(${on ? 1 : 0.4})`, opacity: on ? 1 : 0, ...grow(on, k * 0.6, 700) }} />}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-1">
        {[['WhatsApp', 60, G], ['Instagram', 30, CORAL], ['Shop', 10, GOLD]].map(([t, w, c], i) => (
          <div key={t as string} className="flex flex-col gap-0.5" style={{ flex: w as number }}>
            <div className="h-[4px] origin-left rounded-full" style={{ background: c as string, transform: `scaleX(${on ? 1 : 0})`, ...grow(on, 6 + i) }} />
            <span className="text-[6px] text-[#55554F]">{t} {w}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function Poster({ on }: { on: boolean }) {
  return (
    <div className="flex h-full items-center justify-center gap-3 bg-[#EDEDE8] p-2">
      <div className="flex h-full aspect-[3/4] flex-col overflow-hidden rounded-sm bg-white shadow-sm"
        style={{ transform: `rotate(${on ? 0 : -3}deg) scale(${on ? 1 : 0.94})`, ...grow(on, 0, 1200) }}>
        <div className="flex flex-[2] flex-col justify-end p-1.5" style={{ background: G }}>
          <span className="text-[11px] font-black leading-none text-white" style={{ opacity: on ? 1 : 0, ...grow(on, 2) }}>OPEN DAY</span>
          <span className="text-[6px] text-white/80" style={{ opacity: on ? 1 : 0, ...grow(on, 3) }}>Free check-ups · Sat 9am</span>
        </div>
        <div className="flex flex-1 items-center gap-1 p-1.5">
          <span className="h-3.5 w-3.5 rounded-full" style={{ background: GOLD }} />
          <span className="flex flex-col gap-0.5">
            <span className="h-[3px] w-8 rounded-full bg-[#D5D5CF]" />
            <span className="h-[3px] w-5 rounded-full bg-[#D5D5CF]" />
          </span>
        </div>
      </div>
      <div className="flex flex-col gap-1">
        {[G, G2, GOLD, CORAL].map((c, k) => (
          <span key={c} className="h-3 w-3 rounded-full ring-1 ring-black/5" style={{ background: c, transform: `scale(${on ? 1 : 0.5})`, ...grow(on, 4 + k, 600) }} />
        ))}
      </div>
    </div>
  )
}

function Spreadsheet({ on }: { on: boolean }) {
  const rows = [['Route', 'Litres', 'KSh/trip'], ['Thika Rd', '412', '1,620'], ['Mombasa Rd', '388', '1,770'], ['Ngong Rd', '295', '1,610'], ['Total', '1,095', '186,150']]
  return (
    <div className="h-full p-2">
      <div className="grid h-full grid-cols-[1.4fr_1fr_1fr] overflow-hidden rounded border border-[#E3E3DE] text-[8px]">
        {rows.flatMap((r, i) =>
          r.map((c, j) => {
            const flag = i === 2 && j === 2
            const total = i === rows.length - 1
            return (
              <div key={`${i}-${j}`}
                className={`flex items-center border-b border-r border-[#EEEEE9] px-1 ${j > 0 ? 'justify-end' : ''} ${i === 0 ? 'bg-[#F4F4F1] font-semibold text-[#55554F]' : total ? 'font-bold' : 'text-[#33332F]'}`}
                style={{
                  background: total ? (on ? SOFT : '#fff') : flag && on ? '#FBE3DC' : undefined,
                  color: total ? G : flag && on ? CORAL : undefined,
                  fontWeight: flag && on ? 700 : undefined,
                  transition: `background 700ms ${EASE} ${on ? (total ? 1200 : 2000) : 0}ms, color 700ms ${EASE} ${on ? 2000 : 0}ms`,
                }}>
                {c}
              </div>
            )
          }),
        )}
      </div>
    </div>
  )
}

function Code({ on }: { on: boolean }) {
  const lines: [number, string, number][] = [[0, '#C792EA', 40], [1, '#82AAFF', 62], [2, '#C3E88D', 48], [2, '#E8E8E3', 30], [1, '#82AAFF', 54], [0, '#C792EA', 22], [0, GOLD, 44]]
  return (
    <div className="flex h-full flex-col justify-between bg-[#1E2421] p-2">
      <div className="flex flex-col gap-[5px]">
        {lines.map(([indent, c, w], k) => (
          <div key={k} className="flex items-center gap-1.5">
            <span className="w-2 text-right text-[6px] text-[#6B726E]">{k + 1}</span>
            <span className="h-[4px] origin-left rounded-full"
              style={{ marginLeft: indent * 8, width: `${w}%`, background: c, opacity: 0.9, transform: `scaleX(${on ? 1 : 0})`, ...grow(on, k, 500) }} />
          </div>
        ))}
      </div>
      <span className="self-start rounded-full px-1.5 py-px text-[7px] font-semibold"
        style={{ background: '#1F4D3C', color: '#9FE1CB', opacity: on ? 1 : 0, ...grow(on, 9) }}>✓ 12 tests passed</span>
    </div>
  )
}

const SCENES: Record<SceneKind, (p: { on: boolean }) => ReactElement> = { dashboard: Dashboard, campaign: Campaign, poster: Poster, spreadsheet: Spreadsheet, code: Code }
// Where the pointer goes in each scene, as % of the work area.
const TARGET: Record<SceneKind, [number, number]> = { dashboard: [44, 62], campaign: [30, 90], poster: [40, 42], spreadsheet: [86, 52], code: [22, 88] }

export function WorkScene({ kind, title, initials, progress, on, still }: {
  kind: SceneKind; title: string; initials: string; progress: number; on: boolean; still: boolean
}) {
  const Scene = SCENES[kind]
  const [tx, ty] = TARGET[kind]
  const play = on && !still
  return (
    <div className="relative flex aspect-video w-full flex-col gap-2 rounded-[10px] bg-[#1C1F1D] p-2.5">
      <div className="relative min-h-0 flex-1 overflow-hidden rounded-md bg-white">
        <div className="flex h-4 items-center gap-1 border-b border-[#EEEEE9] bg-[#FAFAF8] px-1.5">
          {['#E07A5F', '#E9B949', '#7FAE9B'].map((c) => <span key={c} className="h-1.5 w-1.5 rounded-full" style={{ background: c }} />)}
        </div>
        <div className="relative h-[calc(100%-1rem)]">
          <Scene on={on || still} />
          {/* Pointer that travels to the key part, then a soft ring where it clicks. */}
          <span className="pointer-events-none absolute left-0 top-0 h-full w-full">
            <span className="absolute h-5 w-5 rounded-full border-2"
              style={{ left: `${tx}%`, top: `${ty}%`, borderColor: GOLD, transform: `translate(-50%,-50%) scale(${play ? 1 : 0.4})`, opacity: play ? 0.9 : 0, transition: `transform 600ms ${EASE} ${play ? 2600 : 0}ms, opacity 600ms ${EASE} ${play ? 2600 : 0}ms` }} />
            <svg width="12" height="12" viewBox="0 0 24 24" className="absolute drop-shadow"
              style={{ left: `${play ? tx : 12}%`, top: `${play ? ty : 92}%`, opacity: play ? 1 : 0, transition: `left 1600ms ${EASE} ${play ? 900 : 0}ms, top 1600ms ${EASE} ${play ? 900 : 0}ms, opacity 400ms ease ${play ? 700 : 0}ms` }}>
              <path d="M4 2l16 9-7 2-3 7z" fill="#141414" stroke="#fff" strokeWidth="1.5" strokeLinejoin="round" />
            </svg>
          </span>
        </div>
      </div>
      <span className="absolute bottom-9 right-4 flex h-10 w-10 items-center justify-center rounded-full border-2 border-white text-[13px] font-semibold text-white shadow-md"
        style={{ background: G }}>
        {initials}
        {play && <span className="absolute -inset-1 rounded-full border-2 border-[#9FE1CB] animate-[talk_1.8s_ease-in-out_infinite]" />}
      </span>
      <div className="flex items-center gap-2">
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white">
          <svg width="9" height="9" viewBox="0 0 24 24" fill="#141414"><path d="M8 5v14l11-7z" /></svg>
        </span>
        <div className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/20">
          <div className="h-full rounded-full bg-white"
            style={{ width: `${play ? Math.min(progress + 22, 96) : progress}%`, transition: play ? 'width 6500ms linear' : 'none' }} />
        </div>
        <span className="shrink-0 text-[12px] text-[#E8E8E3]">{title}</span>
      </div>
    </div>
  )
}
