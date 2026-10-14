import type { ReactNode } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Logo } from './Logo'
import { useAuth } from '../lib/auth'

const links = [
  { to: '/admin', label: 'Tasks', end: true },
  { to: '/admin/new', label: 'New practice task', end: false },
  { to: '/admin/review', label: 'Review work', end: false },
  { to: '/admin/requests', label: 'Requests', end: false },
  { to: '/browse', label: 'Recruiter view', end: false },
]

export function AdminLayout({ children }: { children: ReactNode }) {
  const { signOut } = useAuth()
  return (
    <div className="min-h-screen">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-center gap-x-6 gap-y-2 px-5 py-4 sm:px-6">
          <Link to="/admin" className="text-xl no-underline"><Logo /></Link>
          <span className="rounded-full bg-ink px-2.5 py-0.5 text-xs font-semibold uppercase tracking-[0.06em] text-white">Admin</span>
          <nav className="order-last flex w-full gap-5 overflow-x-auto sm:order-none sm:w-auto sm:flex-1">
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.end}
                className={({ isActive }) => `flex min-h-11 shrink-0 items-center no-underline ${isActive ? 'font-semibold text-ink' : 'text-muted hover:text-ink'}`}>
                {l.label}
              </NavLink>
            ))}
          </nav>
          <button onClick={signOut} className="press ml-auto min-h-11 cursor-pointer border-0 bg-transparent text-sm text-muted sm:ml-0">Log out</button>
        </div>
      </header>
      <main className="mx-auto flex max-w-[1280px] flex-col gap-8 px-5 py-8 sm:px-6 sm:py-10">{children}</main>
    </div>
  )
}
