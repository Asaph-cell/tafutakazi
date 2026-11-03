// What search engines see before the app's code runs: each public page's own title, description
// and a short summary. Keep in step with the <Seo> props in src/pages.
// Plain JSON import: Cloudflare's bundler reads it; the newer "with { type: 'json' }" form breaks its build.
import posts from '../src/blog/posts.json'
import tracks from '../src/tracks/tracks.json'

const HOME_DESC = 'Fresh graduates in Kenya do short tasks set by real companies, explain their work on video, and get seen by people who are hiring. Free.'

export const PAGES = {
  '/': { title: "Tafutakazi · Breaking Kenya's unemployment loop", h1: "Breaking Kenya's unemployment loop.", description: HOME_DESC },
  '/about': {
    title: 'Why Tafutakazi exists · Tafutakazi',
    h1: 'Why Tafutakazi exists',
    description: 'Tafutakazi brings skills-based hiring to Kenya: fresh graduates prove what they can do through short tasks from real companies, so hiring rests on skills, not connections or CVs.',
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
    title: 'Skills-based hiring for fresh graduates in Kenya · Tafutakazi',
    h1: 'Skills-based hiring for fresh graduates in Kenya',
    description: 'Skills-based hiring in Kenya: post a short task for the role and watch graduates explain work they actually did. Hire from real work, not CVs. Free for employers.',
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
  '/skills': {
    title: 'Free skill tracks for jobs in Kenya · Tafutakazi',
    h1: 'Learn what the job needs, then prove it',
    description: 'Free skill tracks for 15 entry-level careers in Kenya: what each job needs, where to learn it for free, practice tasks to prove it, and interview questions.',
  },
  '/interview': {
    title: 'Interview practice for jobs in Kenya · Tafutakazi',
    h1: 'Practise before it counts',
    description: 'Free interview practice for Kenyan job seekers: the questions employers ask, how to answer them, and questions for each field.',
  },
  '/cv-builder': {
    title: 'Free CV builder for graduates in Kenya · Tafutakazi',
    h1: 'A CV that shows what you can do',
    description: 'Build a professional CV for free. Four templates, a live preview and a PDF download, made for graduates in Kenya, with your proven work included.',
  },
  '/terms': { title: 'Terms of Use · Tafutakazi', h1: 'Terms of Use', description: 'The terms for using Tafutakazi, the free site where fresh graduates in Kenya show their work to employers.' },
  '/privacy': { title: 'Privacy Policy · Tafutakazi', h1: 'Privacy Policy', description: 'What Tafutakazi collects, why, who can see it, and your rights under Kenya’s Data Protection Act.' },
}

for (const post of posts) {
  PAGES[`/blog/${post.slug}`] = { title: `${post.title} · Tafutakazi`, h1: post.title, description: post.description }
}

for (const t of tracks) {
  PAGES[`/skills/${t.slug}`] = {
    title: `${t.name} skills for jobs in Kenya · Tafutakazi`,
    h1: t.name,
    description: `${t.summary} What a ${t.role} job usually needs, free places to learn it, a task to prove it, and interview questions.`,
  }
}

const LINKS = [['/', 'Home'], ['/jobs', 'Jobs and internships'], ['/skills', 'Skill tracks'], ['/interview', 'Interview practice'], ['/cv-builder', 'Free CV builder'], ['/about', 'About'], ['/blog', 'Blog'], ['/hiring', 'For employers'], ['/join', 'Sign up as a graduate']]

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

// The page's full text, rendered at build time (scripts/prerender.mjs writes dist/_content).
export function fullHtml(html) {
  return `<main style="max-width:720px;margin:40px auto;padding:0 20px;font-family:system-ui,sans-serif;color:#141414;line-height:1.6">`
    + `<p style="font-weight:700">tafutakazi.</p>${html}`
    + `<nav><ul>${LINKS.map(([href, label]) => `<li><a href="${href}">${esc(label)}</a></li>`).join('')}</ul></nav></main>`
}

// File name of a page's build-time text: "/" is index, "/blog/x" is blog__x.
export const contentKey = (path) => (path === '/' ? 'index' : path.slice(1).split('/').join('__'))

export { esc }
