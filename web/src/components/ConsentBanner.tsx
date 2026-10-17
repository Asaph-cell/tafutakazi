import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { saveChoice, savedChoice, startIfAllowed, trackPage, type Choice } from '../lib/analytics'

// Opens the banner again from anywhere (the footer's "Cookie settings").
export const OPEN_COOKIE_SETTINGS = 'tafutakazi:cookie-settings'

// A quiet bar asking once whether we may use optional (analytics) cookies, and a page-view on every route change.
export function ConsentBanner() {
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    startIfAllowed()
    if (savedChoice() === null) setOpen(true)
    const reopen = () => setOpen(true)
    window.addEventListener(OPEN_COOKIE_SETTINGS, reopen)
    return () => window.removeEventListener(OPEN_COOKIE_SETTINGS, reopen)
  }, [])

  // Wait a moment so the page has set its title.
  useEffect(() => {
    const t = setTimeout(() => trackPage(pathname), 300)
    return () => clearTimeout(t)
  }, [pathname])

  function choose(choice: Choice) {
    saveChoice(choice)
    setOpen(false)
    if (choice === 'granted') setTimeout(() => trackPage(pathname), 300)
  }

  if (!open) return null
  return (
    <div role="region" aria-label="Cookies"
      className="fixed inset-x-3 bottom-3 z-50 mx-auto flex max-w-[640px] flex-wrap items-center gap-x-4 gap-y-3 rounded-2xl border border-line bg-white px-5 py-4 text-[15px] shadow-[0_10px_40px_rgba(20,20,20,0.12)] sm:bottom-5 max-sm:bottom-[84px]">
      <span className="min-w-0 flex-[1_1_300px] text-ink-2">
        We use essential cookies to keep the site working, and optional ones to see how it is used so we can improve it.{' '}
        <Link to="/privacy">Learn more</Link>
      </span>
      <div className="flex gap-2">
        <button onClick={() => choose('denied')} className="press min-h-10 cursor-pointer rounded-lg border border-line-strong bg-white px-4 font-semibold text-ink">Essential only</button>
        <button onClick={() => choose('granted')} className="press min-h-10 cursor-pointer rounded-lg border-0 bg-brand px-4 font-semibold text-white">Accept all</button>
      </div>
    </div>
  )
}
