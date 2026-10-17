import type { ReactNode } from 'react'

// Building blocks for blog posts, so every post reads the same.

export function H2({ children }: { children: ReactNode }) {
  return <h2 className="m-0 mt-8 text-[24px] font-semibold leading-tight tracking-[-0.02em] text-ink sm:text-[28px]">{children}</h2>
}

export function P({ children }: { children: ReactNode }) {
  return <p className="m-0">{children}</p>
}

// A source marker that links to the numbered list at the end.
export function Ref({ n }: { n: number }) {
  return <sup className="ml-0.5 text-[12px]"><a href={`#source-${n}`} className="no-underline">[{n}]</a></sup>
}

export function Stat({ value, label }: { value: string; label: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5 rounded-2xl border border-line bg-white p-5">
      <span className="text-[34px] font-bold leading-none tracking-[-0.03em] text-ink tabular-nums">{value}</span>
      <span className="text-[15px] leading-snug">{label}</span>
    </div>
  )
}

export function Stats({ children }: { children: ReactNode }) {
  return <div className="my-2 grid gap-3 sm:grid-cols-3">{children}</div>
}

// Horizontal bars with values; max sets the full width.
export function Bars({ rows, max, note }: { rows: [string, number, boolean?][]; max: number; note?: ReactNode }) {
  return (
    <figure className="m-0 my-2 flex flex-col gap-3.5 rounded-2xl border border-line bg-white p-5">
      {rows.map(([label, value, strong]) => (
        <div key={label} className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between gap-4 text-[15px]">
            <span className={strong ? 'font-semibold text-ink' : ''}>{label}</span>
            <span className={`tabular-nums ${strong ? 'font-semibold text-brand' : ''}`}>{value.toLocaleString('en-KE')}</span>
          </div>
          <div className="h-2.5 rounded-full bg-[#EEEEE9]">
            <div className="h-full rounded-full" style={{ width: `${Math.max(1, (value / max) * 100)}%`, background: strong ? '#0E5C45' : '#A9A9A2' }} />
          </div>
        </div>
      ))}
      {note && <figcaption className="text-[13px] text-muted">{note}</figcaption>}
    </figure>
  )
}

// A photo from Unsplash (free under the Unsplash License), loaded from Unsplash's servers. by/user record who took it.
export type PhotoInfo = { id: string; alt: string; by: string; user: string; caption?: string }

export const unsplash = (id: string, w: number, ratio: number) =>
  `https://images.unsplash.com/${id}?w=${w}&h=${Math.round(w / ratio)}&fit=crop&crop=faces,entropy&auto=format&q=72`

export function Photo({ photo, ratio = 3 / 2, priority = false }: { photo: PhotoInfo; ratio?: number; priority?: boolean }) {
  return (
    <figure className="m-0 my-3 flex flex-col gap-2">
      <img
        src={unsplash(photo.id, 1200, ratio)}
        srcSet={`${unsplash(photo.id, 700, ratio)} 700w, ${unsplash(photo.id, 1200, ratio)} 1200w, ${unsplash(photo.id, 1800, ratio)} 1800w`}
        sizes="(max-width: 760px) 100vw, 70ch"
        alt={photo.alt}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        className="block w-full rounded-2xl bg-[#E6E6E0] object-cover"
        style={{ aspectRatio: String(ratio) }}
      />
      {photo.caption && <figcaption className="text-[13px] leading-snug text-muted">{photo.caption}</figcaption>}
    </figure>
  )
}

export function Callout({ children }: { children: ReactNode }) {
  return <div className="my-2 border-l-4 border-brand bg-white px-5 py-4 text-[18px] font-semibold leading-snug text-ink">{children}</div>
}

export function Sources({ items }: { items: ReactNode[] }) {
  return (
    <section className="mt-10 flex flex-col gap-2 border-t border-line pt-6 text-[14px] leading-relaxed text-muted">
      <span className="font-semibold text-ink">Sources</span>
      <ol className="m-0 flex flex-col gap-1.5 pl-5">
        {items.map((item, i) => <li key={i} id={`source-${i + 1}`}>{item}</li>)}
      </ol>
    </section>
  )
}
