import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react'
import { Link, type LinkProps } from 'react-router-dom'

type Variant = 'primary' | 'outline' | 'light' | 'outlineLight'

const variants: Record<Variant, string> = {
  primary: 'bg-brand text-white hover:bg-brand-dark hover:text-white',
  outline: 'border border-ink bg-white text-ink hover:bg-ground hover:text-ink',
  light: 'bg-ground text-ink hover:bg-white hover:text-ink',
  // For dark backgrounds: white outline and white text.
  outlineLight: 'border border-ground/70 bg-transparent text-ground hover:bg-white/10 hover:text-ground',
}

const shape = 'press relative inline-flex min-h-[52px] items-center justify-center overflow-hidden rounded-xl px-6 font-semibold no-underline'
const base = `${shape} disabled:cursor-not-allowed disabled:bg-[#DADAD4] disabled:text-[#6B6B66]`

// busy: a spinner (or, with `fill`, a bar filling the button, for uploads) and busyLabel.
// done: a tick and doneLabel, for forms that stay on the page after sending.
export function Button({
  variant = 'primary',
  className = '',
  busy = false,
  busyLabel,
  fill = false,
  done = false,
  doneLabel,
  children,
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  busy?: boolean
  busyLabel?: ReactNode
  fill?: boolean
  done?: boolean
  doneLabel?: ReactNode
}) {
  // While busy or done the button keeps its colour (not the grey disabled look) but can't be pressed again.
  const state = busy ? 'busy' : done ? 'done' : 'idle'
  return (
    <button
      className={`${busy ? `${shape} cursor-progress` : done ? `${shape} cursor-default` : `${base} cursor-pointer`} ${variants[variant]} ${className}`}
      disabled={disabled || busy || done}
      aria-busy={busy || undefined}
      {...props}
    >
      {busy && fill && <span aria-hidden="true" className="fill-bar" />}
      <span key={state} className={`relative inline-flex items-center gap-2 ${state === 'idle' ? '' : 'swap'}`}>
        {state === 'busy' && !fill && <span aria-hidden="true" className="spin" />}
        {state === 'done' && <span aria-hidden="true">✓</span>}
        {state === 'busy' ? (busyLabel ?? children) : state === 'done' ? (doneLabel ?? children) : children}
      </span>
    </button>
  )
}

export function LinkButton({
  variant = 'primary',
  className = '',
  ...props
}: LinkProps & { variant?: Variant }) {
  return <Link className={`${base} ${variants[variant]} ${className}`} {...props} />
}

const inputClass =
  'min-h-[48px] w-full rounded-[10px] border border-line-strong bg-white px-3.5 text-base text-ink placeholder:text-[#8A8A84]'

export function Field({
  label,
  hint,
  id,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: ReactNode; hint?: ReactNode; id: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="font-semibold">
        {label}
      </label>
      <input id={id} className={inputClass} {...props} />
      {hint && <span className="text-[13px] text-muted">{hint}</span>}
    </div>
  )
}

export function Select({
  label,
  id,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { label: ReactNode; id: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="font-semibold">
        {label}
      </label>
      <select id={id} className={`${inputClass} px-3`} {...props}>
        {children}
      </select>
    </div>
  )
}

export function Notice({ tone = 'error', children }: { tone?: 'error' | 'info'; children: ReactNode }) {
  // Errors shake once when they appear, and again when the message changes.
  const style = tone === 'error' ? 'shake border-[#E8C9BF] bg-[#FBF1EE] text-danger' : 'reveal border-line bg-white text-ink-2'
  return (
    <p key={typeof children === 'string' ? children : undefined} role={tone === 'error' ? 'alert' : 'status'} className={`m-0 rounded-[10px] border px-4 py-3 text-[15px] ${style}`}>
      {children}
    </p>
  )
}

// Loading placeholders in the shape of what's coming.
export function Skeleton({ className = '' }: { className?: string }) {
  return <div aria-hidden="true" className={`sk ${className}`} />
}

// A stack of card-shaped skeletons, for lists of tasks, jobs or people.
export function SkeletonCards({ count = 3, className = '' }: { count?: number; className?: string }) {
  return (
    <div role="status" aria-label="Loading" className={`flex flex-col gap-3 ${className}`}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="flex flex-col gap-2.5 rounded-2xl border border-line bg-white p-5">
          <Skeleton className="h-5 w-24 rounded-full" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-3.5 w-1/2" />
        </div>
      ))}
    </div>
  )
}

// A page-shaped skeleton: a heading, a line of text, then cards.
export function SkeletonPage({ cards = 3 }: { cards?: number }) {
  return (
    <div role="status" aria-label="Loading" className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-8 w-2/5 max-w-[320px]" />
        <Skeleton className="h-4 w-3/5 max-w-[480px]" />
      </div>
      <SkeletonCards count={cards} />
    </div>
  )
}
