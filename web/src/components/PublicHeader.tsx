import { Link, NavLink } from 'react-router-dom'
import { Logo } from './Logo'
import { homeFor, useAuth } from '../lib/auth'

// The same deep green bar on every page, so the logo is always the gold-and-white version.
// `overlay`: transparent, laid over the homepage photo instead of sitting on its own bar.
export function PublicHeader({ overlay = false }: { overlay?: boolean }) {
  const { session, profile } = useAuth()
  // A gold line grows under the link on hover and stays under the current page (styles in index.css).
  const nav = ({ isActive }: { isActive: boolean }) =>
    `nav-link nav-link-light relative min-h-10 items-center px-3 no-underline transition-colors duration-200 ${
      isActive ? 'is-active font-semibold text-white hover:text-white' : 'text-white/80 hover:text-white'
    }`
  // Log in: a small outlined button that fills gold on hover.
  const loginClass =
    'btn btn-accent ml-2 flex min-h-10 items-center rounded-lg border border-white/60 px-4 font-semibold text-white no-underline hover:border-accent hover:bg-accent hover:text-brand-deep'
  return (
    <header className={overlay ? 'absolute inset-x-0 top-0 z-20' : 'bg-brand-deep'}>
      <div className={`mx-auto flex max-w-[1280px] flex-wrap items-center gap-x-1 gap-y-1 px-5 sm:px-6 ${overlay ? 'py-4' : 'py-3'}`}>
        <Link to="/" className="mr-4 flex-1 text-[22px] no-underline"><Logo light /></Link>
        <NavLink to="/about" className={(a) => `hidden sm:flex ${nav(a)}`}>About</NavLink>
        <NavLink to="/blog" className={(a) => `hidden sm:flex ${nav(a)}`}>Blog</NavLink>
        <NavLink to="/jobs" className={(a) => `flex ${nav(a)}`}>Jobs</NavLink>
        {session && profile ? (
          <Link to={homeFor(profile.role)} className={loginClass}>
            {profile.role === 'admin' ? 'Admin' : 'My account'}
          </Link>
        ) : (
          <>
            <NavLink to="/hiring" className={(a) => `hidden sm:flex ${nav(a)}`}>Hiring?</NavLink>
            <NavLink to="/login" className={loginClass}>Log in</NavLink>
          </>
        )}
      </div>
    </header>
  )
}
