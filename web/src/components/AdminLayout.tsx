import type { ReactNode } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Logo } from './Logo'
import { useAuth } from '../lib/auth'

const links = [
  { to: '/admin', label: 'Tasks', end: true },
  { to: '/admin/new', label: 'New practice task', end: false },
  { to: '/admin/review', label: 'Review work', end: false },
  { to: '/admin/requests', label: 'Requests', end: false },
  { to: '/admin/impact', label: 'Impact', end: false },
  { to: '/browse', label: 'Recruiter view', end: false },
]

export function AdminLayout({ children }: { children: ReactNode }) {
  const { signOut } = useAuth()
  return (
    <div data-clarity-mask="true" className="min-h-screen">
      <header className="bg-brand-deep text-white">
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-center gap-x-6 gap-y-2 px-5 py-3 sm:px-6">
          <Link to="/admin" className="text-xl no-underline"><Logo light /></Link>
          <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-semibold uppercase tracking-[0.06em] text-brand-deep">Admin</span>
          <nav className="order-last flex w-full gap-1 overflow-x-auto sm:order-none sm:w-auto sm:flex-1">
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.end}
                className={({ isActive }) => `nav-link nav-link-light relative flex min-h-10 shrink-0 items-center px-3 no-underline transition-colors duration-200 ${isActive ? 'is-active font-semibold text-white hover:text-white' : 'text-white/75 hover:text-white'}`}>
                {l.label}
              </NavLink>
            ))}
          </nav>
          <button onClick={signOut} className="press ml-auto min-h-11 cursor-pointer border-0 bg-transparent text-sm text-white/75 hover:text-white sm:ml-0">Log out</button>
        </div>
      </header>
      <main className="mx-auto flex max-w-[1280px] flex-col gap-8 px-5 py-8 sm:px-6 sm:py-10">{children}</main>
    </div>
  )
}
