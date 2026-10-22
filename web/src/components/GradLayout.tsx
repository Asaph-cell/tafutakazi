import type { ReactNode } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Logo } from './Logo'
import { useAuth } from '../lib/auth'

const tabs = [
  { to: '/me', label: 'My work', end: true, icon: <path d="M4 11 12 4l8 7v9H4z" /> },
  { to: '/tasks', label: 'Tasks', end: false, icon: <><rect x="4" y="6" width="16" height="14" rx="2" /><path d="M9 6V4h6v2" /></> },
  { to: '/me/profile', label: 'Profile', end: false, icon: <><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" /></> },
]

export function initials(name: string | undefined) {
  return (name ?? '').split(/\s+/).filter(Boolean).map((p) => p[0]).slice(0, 2).join('').toUpperCase()
}

// Graduate pages: top navigation on wide screens, a thumb-friendly tab bar on phones.
// Content lines up with the menu. Reading pages (a task, the submit form) pass `narrow`.
export function GradLayout({ children, narrow = false }: { children: ReactNode; narrow?: boolean }) {
  const { profile } = useAuth()
  return (
    <div data-clarity-mask="true" className="min-h-screen pb-24 sm:pb-0">
      <header className="bg-brand-deep text-white">
        <div className="mx-auto flex min-h-16 max-w-[1280px] items-center gap-8 px-5 py-3 sm:px-6">
          <Link to="/me" className="flex-1 text-xl no-underline sm:flex-none"><Logo light /></Link>
          <nav className="hidden flex-1 gap-1 sm:flex">
            {tabs.map((t) => (
              <NavLink key={t.to} to={t.to} end={t.end}
                className={({ isActive }) => `nav-link nav-link-light relative flex min-h-10 items-center px-3 no-underline transition-colors duration-200 ${isActive ? 'is-active font-semibold text-white hover:text-white' : 'text-white/75 hover:text-white'}`}>
                {t.label}
              </NavLink>
            ))}
          </nav>
          {profile?.role === 'admin' && (
            <Link to="/admin" className="flex min-h-11 items-center text-sm font-semibold text-accent no-underline hover:text-white">Admin</Link>
          )}
          <Link to="/me/profile" className="flex items-center gap-2.5 text-sm text-white/85 no-underline hover:text-white">
            <span className="hidden sm:inline">{profile?.full_name}</span>
            <span aria-hidden="true" className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-[13px] font-semibold text-brand-deep">
              {initials(profile?.full_name)}
            </span>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-[1280px] px-5 py-7 sm:px-6 sm:py-10">
        <div className={`flex flex-col gap-8 ${narrow ? 'max-w-[760px]' : ''}`}>{children}</div>
      </main>

      <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-10 flex h-[72px] border-t border-line bg-white sm:hidden">
        {tabs.map((t) => (
          <NavLink key={t.to} to={t.to} end={t.end}
            className={({ isActive }) =>
              `press relative flex flex-1 flex-col items-center justify-center gap-0.5 text-xs no-underline ${isActive ? 'font-semibold text-brand before:absolute before:inset-x-6 before:top-0 before:h-[3px] before:rounded-b before:bg-accent' : 'text-muted'}`}>
            <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{t.icon}</svg>
            {t.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="m-0 font-sans text-[13px] font-semibold uppercase tracking-[0.06em] text-muted">{children}</h2>
}

// A white card with an optional heading row, the basic building block of the grad pages.
export function Card({ title, action, children, className = '' }: { title?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`flex flex-col gap-4 rounded-2xl border border-line bg-white p-5 sm:p-6 ${className}`}>
      {(title || action) && (
        <div className="flex items-baseline justify-between gap-3">
          {title && <SectionTitle>{title}</SectionTitle>}
          {action}
        </div>
      )}
      {children}
    </section>
  )
}

export function Stat({ value, label, accent = false }: { value: number | string; label: string; accent?: boolean }) {
  return (
    <div className={`flex flex-col gap-1 rounded-2xl border p-4 sm:p-5 ${accent ? 'border-brand bg-brand-soft' : 'border-line bg-white'}`}>
      <span className={`text-[32px] font-bold leading-none tracking-[-0.03em] tabular-nums ${accent ? 'text-brand' : ''}`}>{value}</span>
      <span className="text-sm text-muted">{label}</span>
    </div>
  )
}
