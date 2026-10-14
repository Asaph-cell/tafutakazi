import type { ReactNode } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Logo } from './Logo'
import { useRecruiter } from '../lib/recruiter'
import { useAuth } from '../lib/auth'

const links = [
  { to: '/browse', label: 'Browse' },
  { to: '/candidates', label: 'Candidates' },
  { to: '/my-tasks', label: 'My tasks' },
  { to: '/account', label: 'Account' },
]

// Recruiter pages are laptop-first, but the menu wraps cleanly on a phone.
export function RecruiterLayout({ children }: { children: ReactNode }) {
  const { data: me } = useRecruiter()
  const { profile } = useAuth()
  return (
    <div className="min-h-screen">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-[1120px] flex-wrap items-center gap-x-6 gap-y-1 px-5 py-3 sm:px-6 sm:py-4">
          <Link to="/browse" className="text-xl no-underline"><Logo /></Link>
          <nav className="order-last flex w-full gap-5 sm:order-none sm:w-auto sm:flex-1">
            {links.map((l) => (
              <NavLink key={l.to} to={l.to}
                className={({ isActive }) => `flex min-h-11 items-center no-underline ${isActive ? 'font-semibold text-ink' : 'text-muted hover:text-ink'}`}>
                {l.label}
              </NavLink>
            ))}
            {profile?.role === 'admin' && (
              <Link to="/admin" className="flex min-h-11 items-center font-semibold text-brand no-underline">Admin</Link>
            )}
          </nav>
          <span className="ml-auto hidden text-sm text-muted sm:ml-0 sm:inline">{me?.company?.name}</span>
          <Link to="/post" className="press ml-auto flex min-h-10 items-center rounded-lg bg-brand px-4 text-sm font-semibold text-white no-underline hover:text-white sm:ml-0">
            Post a task
          </Link>
        </div>
      </header>
      <main className="mx-auto flex max-w-[1120px] flex-col gap-8 px-5 py-8 sm:px-6 sm:py-10">{children}</main>
    </div>
  )
}
