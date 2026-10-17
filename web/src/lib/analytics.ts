// Google Analytics, only with the visitor's consent (Kenya's Data Protection Act: non-essential cookies need it).
// Page addresses are cleaned before they are sent: ids and graduates' profile names never reach Google.

const GA_ID = 'G-61HWR8P71E'
const KEY = 'tafutakazi-analytics'

export type Choice = 'granted' | 'denied'

type Gtag = (...args: unknown[]) => void
declare global {
  interface Window { dataLayer?: unknown[]; gtag?: Gtag }
}

export function savedChoice(): Choice | null {
  try {
    const v = localStorage.getItem(KEY)
    return v === 'granted' || v === 'denied' ? v : null
  } catch {
    return null
  }
}

export function saveChoice(choice: Choice) {
  try { localStorage.setItem(KEY, choice) } catch { /* private mode: ask again next visit */ }
  if (choice === 'granted') load()
  else if (window.gtag) window.gtag('consent', 'update', { analytics_storage: 'denied' })
}

// The site's own public pages; anything else is sent as a placeholder.
const PUBLIC = new Set(['/', '/about', '/jobs', '/join', '/hiring', '/login', '/partners', '/blog', '/terms', '/privacy'])
const PRIVATE_PREFIXES = ['/me', '/tasks', '/browse', '/post', '/candidates', '/my-tasks', '/account', '/admin', '/check-email', '/reset-password']

export function cleanPath(pathname: string) {
  const p = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname
  if (PUBLIC.has(p)) return p
  if (/^\/blog\/[a-z0-9-]+$/.test(p)) return p
  if (/^\/jobs\/[^/]+$/.test(p)) return '/jobs/:id'
  if (PRIVATE_PREFIXES.some((x) => p === x || p.startsWith(`${x}/`))) {
    // Keep words like /tasks/request or /admin/review; replace ids with :id.
    return p.split('/').map((seg, i) => (i <= 1 || WORDS.has(seg) ? seg : ':id')).join('/')
  }
  if (/^\/[^/]+$/.test(p)) return '/:profile'
  return '/other'
}
const WORDS = new Set(['profile', 'request', 'submit', 'new', 'review', 'requests', 'tasks'])
const isPublic = (path: string) => PUBLIC.has(path) || path.startsWith('/blog/') || path === '/jobs/:id'

let loaded = false
function load() {
  if (loaded || typeof window === 'undefined') return
  // Only the live site counts; local testing and previews never send anything.
  if (location.hostname !== 'tafutakazi.co.ke') return
  loaded = true
  window.dataLayer = window.dataLayer || []
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments)
  }
  window.gtag('js', new Date())
  window.gtag('consent', 'default', { analytics_storage: 'granted', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' })
  // Page views are sent by hand (below) with cleaned addresses, never automatically.
  window.gtag('config', GA_ID, { send_page_view: false, allow_google_signals: false, allow_ad_personalization_signals: false })
  const s = document.createElement('script')
  s.async = true
  s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`
  document.head.appendChild(s)
}

export function startIfAllowed() {
  if (savedChoice() === 'granted') load()
}

export function trackPage(pathname: string) {
  if (!loaded || !window.gtag) return
  const path = cleanPath(pathname)
  // Titles only for public pages: a private page's title could carry a person's name.
  window.gtag('event', 'page_view', {
    page_path: path,
    page_location: `https://tafutakazi.co.ke${path}`,
    page_title: isPublic(path) ? document.title.split(' · ')[0] : path,
  })
}
