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
    <div data-clarity-mask="true" className="min-h-screen">
      <header className="bg-brand-deep text-white">
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-center gap-x-6 gap-y-1 px-5 py-3 sm:px-6">
          <Link to="/browse" className="text-xl no-underline"><Logo light /></Link>
          <nav className="order-last flex w-full gap-1 sm:order-none sm:w-auto sm:flex-1">
            {links.map((l) => (
              <NavLink key={l.to} to={l.to}
                className={({ isActive }) => `nav-link nav-link-light relative flex min-h-10 items-center px-3 no-underline transition-colors duration-200 ${isActive ? 'is-active font-semibold text-white hover:text-white' : 'text-white/75 hover:text-white'}`}>
                {l.label}
              </NavLink>
            ))}
            {profile?.role === 'admin' && (
              <Link to="/admin" className="flex min-h-10 items-center px-3 font-semibold text-accent no-underline hover:text-white">Admin</Link>
            )}
          </nav>
          <span className="ml-auto hidden text-sm text-white/70 sm:ml-0 sm:inline">{me?.company?.name}</span>
          <Link to="/post" className="btn btn-accent btn-shine relative ml-auto flex min-h-10 items-center overflow-hidden rounded-lg bg-accent px-4 text-sm font-semibold text-brand-deep no-underline hover:bg-[#F7C24E] hover:text-brand-deep sm:ml-0">
            Post a task
          </Link>
        </div>
      </header>
      <main className="mx-auto flex max-w-[1280px] flex-col gap-8 px-5 py-8 sm:px-6 sm:py-10">{children}</main>
    </div>
  )
}
