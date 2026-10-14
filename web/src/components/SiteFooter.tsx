import { Link } from 'react-router-dom'

export function SiteFooter() {
  return (
    <footer className="mx-auto mt-12 flex max-w-[1280px] flex-wrap gap-5 border-t border-line px-6 pb-10 pt-7 text-sm text-muted">
      <span className="flex-1">tafutakazi.co.ke</span>
      <Link to="/about" className="text-muted">About</Link>
      <Link to="/jobs" className="text-muted">Jobs</Link>
      <Link to="/hiring" className="text-muted">For employers</Link>
      <Link to="/support" className="text-muted">Support us</Link>
      <Link to="/support" className="text-muted">Partner with us</Link>
      <Link to="/terms" className="text-muted">Terms</Link>
      <Link to="/privacy" className="text-muted">Privacy</Link>
    </footer>
  )
}
