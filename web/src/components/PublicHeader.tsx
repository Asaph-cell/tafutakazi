import { Link, NavLink } from 'react-router-dom'
import { Logo } from './Logo'
import { homeFor, useAuth } from '../lib/auth'

const nav = ({ isActive }: { isActive: boolean }) =>
  `press min-h-10 items-center rounded-lg px-3 no-underline transition-colors ${isActive ? 'bg-brand-soft font-semibold text-brand hover:text-brand' : 'text-ink hover:bg-white hover:text-ink'}`

export function PublicHeader() {
  const { session, profile } = useAuth()
  return (
    <header className="mx-auto flex max-w-[1280px] flex-wrap items-center gap-x-1 gap-y-1 px-5 py-5 sm:px-6">
      <Link to="/" className="mr-4 flex-1 text-[22px] no-underline"><Logo /></Link>
      <NavLink to="/about" className={(a) => `hidden sm:flex ${nav(a)}`}>About</NavLink>
      <NavLink to="/blog" className={(a) => `hidden sm:flex ${nav(a)}`}>Blog</NavLink>
      <NavLink to="/jobs" className={(a) => `flex ${nav(a)}`}>Jobs</NavLink>
      {session && profile ? (
        <Link to={homeFor(profile.role)} className="press flex min-h-10 items-center rounded-lg px-3 font-semibold text-ink no-underline hover:bg-white hover:text-ink">{profile.role === 'admin' ? 'Admin' : 'My account'}</Link>
      ) : (
        <>
          <NavLink to="/hiring" className={(a) => `hidden sm:flex ${nav(a)}`}>Hiring?</NavLink>
          <NavLink to="/login" className={(a) => `flex font-semibold ${nav(a)}`}>Log in</NavLink>
        </>
      )}
    </header>
  )
}
