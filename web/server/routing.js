// Shared by the Cloudflare Pages Functions: which addresses are real pages, and the sitemap.
// Keep STATIC in step with the routes in src/App.tsx.

// Plain JSON import: Cloudflare's bundler reads it; the newer "with { type: 'json' }" form breaks its build.
import posts from '../src/blog/posts.json'

export const SITE = 'https://tafutakazi.co.ke'
const BLOG = new Set(posts.map((post) => post.slug))

const STATIC = new Set([
  '/', '/jobs', '/join', '/hiring', '/login', '/check-email', '/reset-password', '/partners', '/support', '/about',
  '/terms', '/privacy', '/blog', '/me', '/me/profile', '/tasks', '/tasks/request', '/browse', '/post', '/candidates',
  '/my-tasks', '/account', '/admin', '/admin/new', '/admin/requests', '/admin/review',
])

// Private pages with an id: signed-in only and never indexed, so no need to look them up.
const PRIVATE_WITH_ID = [/^\/tasks\/[^/]+(\/submit)?$/, /^\/browse\/[^/]+$/, /^\/admin\/tasks\/[^/]+$/, /^\/admin\/review\/[^/]+$/]

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/

// 'ok' | 'missing' | { job: id } | { slug: handle }
export function classify(pathname) {
  let p
  try { p = decodeURIComponent(pathname) } catch { return 'missing' }
  if (p.length > 1) p = p.replace(/\/+$/, '')
  if (STATIC.has(p)) return 'ok'
  if (PRIVATE_WITH_ID.some((r) => r.test(p))) return 'ok'
  const blog = p.match(/^\/blog\/([^/]+)$/)
  if (blog) return BLOG.has(blog[1]) ? 'ok' : 'missing'
  const job = p.match(/^\/jobs\/([^/]+)$/)
  if (job) return UUID.test(job[1]) ? { job: job[1] } : 'missing'
  const one = p.match(/^\/([^/]+)$/)
  if (one && SLUG.test(one[1]) && one[1].length <= 90) return { slug: one[1] }
  return 'missing'
}

async function rpc(env, fn, body) {
  const res = await fetch(`${env.VITE_SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: { apikey: env.VITE_SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`${fn}: ${res.status}`)
  return res.json()
}

// Does this job or profile exist? If the database can't be reached, assume yes rather than hide a real page.
export async function exists(target, env) {
  if (!env?.VITE_SUPABASE_URL || !env?.VITE_SUPABASE_ANON_KEY) return true
  try {
    if (target.job) return (await rpc(env, 'public_jobs', { p_job: target.job })).length > 0
    if (target.slug) return (await rpc(env, 'get_public_profile', { handle: target.slug })) != null
  } catch {
    return true
  }
  return true
}

export const PUBLIC_PAGES = [
  ['/', 'weekly', '1.0'], ['/jobs', 'daily', '0.9'], ['/about', 'monthly', '0.7'], ['/join', 'monthly', '0.8'],
  ['/hiring', 'monthly', '0.8'], ['/partners', 'monthly', '0.5'], ['/blog', 'weekly', '0.7'], ['/terms', 'yearly', '0.2'], ['/privacy', 'yearly', '0.2'],
]

const day = (iso) => String(iso).slice(0, 10)
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')

export function sitemapXml(jobs) {
  const urls = [
    ...PUBLIC_PAGES.map(([path, freq, prio]) => `  <url><loc>${SITE}${path}</loc><changefreq>${freq}</changefreq><priority>${prio}</priority></url>`),
    ...posts.map((post) => `  <url><loc>${SITE}/blog/${post.slug}</loc><lastmod>${post.date}</lastmod><changefreq>monthly</changefreq><priority>0.7</priority></url>`),
    ...jobs.map((j) => `  <url><loc>${SITE}/jobs/${esc(j.id)}</loc><lastmod>${day(j.updated_at ?? j.created_at)}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>`),
  ]
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`
}

export async function liveJobs(env) {
  if (!env?.VITE_SUPABASE_URL || !env?.VITE_SUPABASE_ANON_KEY) return []
  try {
    return await rpc(env, 'public_jobs', {})
  } catch {
    return []
  }
}
