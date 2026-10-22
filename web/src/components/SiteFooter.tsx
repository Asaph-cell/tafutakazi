import { Link } from 'react-router-dom'
import { OPEN_COOKIE_SETTINGS } from './ConsentBanner'
import { Logo } from './Logo'

const link = 'text-[#C5D6CE] no-underline hover:text-white'

export function SiteFooter() {
  return (
    <footer className="mt-16 bg-brand-dark text-[#C5D6CE]">
      <div className="mx-auto flex max-w-[1280px] flex-wrap items-start justify-between gap-8 px-5 py-12 sm:px-6">
        <div className="flex max-w-[34ch] flex-col gap-3">
          <Link to="/" className="text-[24px] no-underline"><Logo light /></Link>
          <span className="text-[15px]">Graduates show their work. Employers hire on what they see. Free for both.</span>
        </div>
        <nav aria-label="Footer" className="grid grid-cols-2 gap-x-12 gap-y-2.5 text-[15px] sm:grid-cols-3">
          <Link to="/about" className={link}>About</Link>
          <Link to="/jobs" className={link}>Jobs</Link>
          <Link to="/blog" className={link}>Blog</Link>
          <Link to="/hiring" className={link}>For employers</Link>
          <Link to="/join" className={link}>For graduates</Link>
          <Link to="/partners" className={link}>Partner with us</Link>
          <Link to="/terms" className={link}>Terms</Link>
          <Link to="/privacy" className={link}>Privacy</Link>
          <button onClick={() => window.dispatchEvent(new Event(OPEN_COOKIE_SETTINGS))} className={`cursor-pointer border-0 bg-transparent p-0 text-left text-[15px] ${link}`}>Cookie settings</button>
        </nav>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto max-w-[1280px] px-5 py-5 text-[13px] sm:px-6">tafutakazi.co.ke · Nairobi, Kenya</div>
      </div>
    </footer>
  )
}
