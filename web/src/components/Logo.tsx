// The wordmark: black, with the "a" in kazi, the square i dot and the full stop in green.
export function Logo({ className = '' }: { className?: string }) {
  return (
    <span role="img" aria-label="tafutakazi" className={`font-bold tracking-[-0.02em] text-ink ${className}`}>
      tafutak<span className="text-brand">a</span>z
      <span className="relative inline-block leading-none">
        ı
        <span
          aria-hidden="true"
          className="absolute left-1/2 top-[0.1em] h-[0.165em] w-[0.165em] -translate-x-1/2 bg-brand"
        />
      </span>
      <span className="text-brand">.</span>
    </span>
  )
}
