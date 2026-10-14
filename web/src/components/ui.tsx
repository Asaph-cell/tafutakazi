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

const base =
  'press inline-flex min-h-[52px] items-center justify-center rounded-xl px-6 font-semibold no-underline disabled:cursor-not-allowed disabled:bg-[#DADAD4] disabled:text-[#6B6B66]'

export function Button({
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button className={`${base} ${variants[variant]} cursor-pointer ${className}`} {...props} />
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
  const style = tone === 'error' ? 'border-[#E8C9BF] bg-[#FBF1EE] text-danger' : 'border-line bg-white text-ink-2'
  return (
    <p role={tone === 'error' ? 'alert' : 'status'} className={`m-0 rounded-[10px] border px-4 py-3 text-[15px] ${style}`}>
      {children}
    </p>
  )
}
