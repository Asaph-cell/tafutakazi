// What search engines see before the app's code runs: each public page's own title, description
// and a short summary. Keep in step with the <Seo> props in src/pages.
// Plain JSON import: Cloudflare's bundler reads it; the newer "with { type: 'json' }" form breaks its build.
import posts from '../src/blog/posts.json'

const HOME_DESC = 'Fresh graduates in Kenya do short tasks set by real companies, explain their work on video, and get seen by people who are hiring. Free.'

export const PAGES = {
  '/': { title: "Tafutakazi · Breaking Kenya's unemployment loop", h1: "Breaking Kenya's unemployment loop.", description: HOME_DESC },
  '/about': {
    title: 'Why Tafutakazi exists · Tafutakazi',
    h1: 'Why Tafutakazi exists',
    description: "Kenyan employers ask for experience that fresh graduates can't get without a job. Tafutakazi breaks that loop: graduates prove what they can do through short tasks from real companies.",
  },
  '/jobs': {
    title: 'Jobs and internships for fresh graduates in Kenya · Tafutakazi',
    h1: 'Jobs and internships for fresh graduates in Kenya',
    description: 'Open roles at Kenyan companies that hire fresh graduates with no work experience. Do a short task from the job to show the company what you can do.',
  },
  '/join': {
    title: 'Sign up as a fresh graduate · Tafutakazi',
    h1: 'Sign up as a fresh graduate',
    description: 'Just graduated with no work experience? Join free, do short tasks from Kenyan companies and get seen by people who are hiring.',
  },
  '/hiring': {
    title: 'Hire fresh graduates in Kenya · Tafutakazi',
    h1: 'Hire fresh graduates in Kenya',
    description: 'Post a short task for the role and watch graduates explain work they actually did. Hire from real work, not CVs. Free for employers.',
  },
  '/partners': {
    title: 'Partner with Tafutakazi · Tafutakazi',
    h1: 'Partner with us to reduce youth unemployment',
    description: 'Partner with Tafutakazi to reduce youth unemployment in Kenya. Companies, universities, NGOs and government programmes help fresh graduates into their first job.',
  },
  '/blog': {
    title: 'Blog · Tafutakazi',
    h1: 'Blog',
    description: 'Data and ideas on graduate hiring and youth employment in Kenya, from Tafutakazi.',
  },
  '/terms': { title: 'Terms of Use · Tafutakazi', h1: 'Terms of Use', description: 'The terms for using Tafutakazi, the free site where fresh graduates in Kenya show their work to employers.' },
  '/privacy': { title: 'Privacy Policy · Tafutakazi', h1: 'Privacy Policy', description: 'What Tafutakazi collects, why, who can see it, and your rights under Kenya’s Data Protection Act.' },
}

for (const post of posts) {
  PAGES[`/blog/${post.slug}`] = { title: `${post.title} · Tafutakazi`, h1: post.title, description: post.description }
}

const LINKS = [['/', 'Home'], ['/jobs', 'Jobs and internships'], ['/about', 'About'], ['/blog', 'Blog'], ['/hiring', 'For employers'], ['/join', 'Sign up as a graduate']]

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

export function pageFor(pathname) {
  const p = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname
  return PAGES[p] ? { path: p, ...PAGES[p] } : null
}

// Readable content for crawlers and people without JavaScript. The app replaces it when it starts.
export function summaryHtml(page) {
  return `<main style="max-width:720px;margin:40px auto;padding:0 20px;font-family:system-ui,sans-serif;color:#141414">`
    + `<p style="font-weight:700">tafutakazi.</p><h1>${esc(page.h1)}</h1><p>${esc(page.description)}</p>`
    + `<nav><ul>${LINKS.map(([href, label]) => `<li><a href="${href}">${esc(label)}</a></li>`).join('')}</ul></nav></main>`
}

export { esc }
