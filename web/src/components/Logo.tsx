// The mark: two people whose bodies interlock. Turned 180 degrees it matches itself (public/brand/mark.svg).
export function Mark({ light = false, className = '' }: { light?: boolean; className?: string }) {
  const [l, r] = light ? ['#F2B632', '#FFFFFF'] : ['#0A6B4D', '#043D2C']
  return (
    <svg aria-hidden="true" viewBox="10 17 100 75" className={className}>
      <circle cx="34" cy="30" r="13" fill={l} />
      <circle cx="86" cy="30" r="13" fill={r} />
      <path d="M30 52 H44 C61 52 59 92 76 92 H30 A20 20 0 0 1 30 52 Z" fill={l} />
      <path d="M90 92 H76 C59 92 61 52 44 52 H90 A20 20 0 0 1 90 92 Z" fill={r} />
    </svg>
  )
}

// Mark and name side by side. `mark={false}` gives the name alone.
// The name: "tafutak" + accent "a" + "z" + a drawn "i" + a square full stop. The "i" is built from two
// shapes (stem and square dot of the same width) so the dot sits exactly over the stem; the font's own
// dotless i isn't centred in its box. Measurements are Instrument Sans Bold, in em: stem 0.172 wide,
// x-height 0.516, side bearings 0.047 and 0.051. On dark backgrounds (`light`) the letters are white
// and the accents gold.
export function Logo({ className = '', light = false, mark = true }: { className?: string; light?: boolean; mark?: boolean }) {
  const accent = light ? 'text-accent' : 'text-brand'
  const square = light ? 'bg-accent' : 'bg-brand'
  return (
    <span role="img" aria-label="tafutakazi" className={`inline-flex items-center gap-[0.28em] whitespace-nowrap font-bold tracking-[-0.02em] ${light ? 'text-white' : 'text-ink'} ${className}`}>
      {mark && <Mark light={light} className="h-[0.78em] w-auto flex-none" />}
      <span>
      tafutak<span className={accent}>a</span>z
      <span aria-hidden="true" className="inline-block align-baseline" style={{ marginLeft: '0.047em', marginRight: '0.031em' }}>
        <span className={`block ${square}`} style={{ width: '0.172em', height: '0.172em', marginBottom: '0.075em' }} />
        <span className="block bg-current" style={{ width: '0.172em', height: '0.516em' }} />
      </span>
      <span aria-hidden="true" className={`inline-block align-baseline ${square}`} style={{ width: '0.172em', height: '0.172em', marginLeft: '0.03em' }} />
      </span>
    </span>
  )
}
