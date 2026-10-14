import { Link } from 'react-router-dom'
import { Logo } from './Logo'
import { homeFor, useAuth } from '../lib/auth'

export function PublicHeader() {
  const { session, profile } = useAuth()
  return (
    <header className="mx-auto flex max-w-[1120px] flex-wrap items-center gap-x-6 gap-y-1 px-5 py-5 sm:px-6">
      <Link to="/" className="flex-1 text-[22px] no-underline"><Logo /></Link>
      <Link to="/about" className="hidden min-h-11 items-center text-ink no-underline sm:flex">About</Link>
      <Link to="/jobs" className="flex min-h-11 items-center text-ink no-underline">Jobs</Link>
      {session && profile ? (
        <Link to={homeFor(profile.role)} className="flex min-h-11 items-center font-semibold text-ink no-underline">{profile.role === 'admin' ? 'Admin' : 'My account'}</Link>
      ) : (
        <>
          <Link to="/hiring" className="hidden min-h-11 items-center text-ink no-underline sm:flex">Hiring?</Link>
          <Link to="/login" className="flex min-h-11 items-center font-semibold text-ink no-underline">Log in</Link>
        </>
      )}
    </header>
  )
}
