// Runs in front of every page on Cloudflare.
// 1. Every address is answered with the app (it's a single-page site), so on its own a made-up address
//    returns "200 OK" and search engines see a "soft 404". This sends a real 404 for addresses that
//    aren't pages, and for jobs and graduate links that don't exist.
// 2. Before the app's code runs, every page has the homepage's title. For public pages this writes in
//    the page's own title, description and links, plus a short readable summary, so search engines
//    describe each page correctly.
import { classify, exists } from '../server/routing.js'
import { contentKey, fullHtml, pageFor, summaryHtml } from '../server/pages.js'

export async function onRequest(ctx) {
  const res = await ctx.next()
  const method = ctx.request.method
  if (method !== 'GET' && method !== 'HEAD') return res
  if (!(res.headers.get('content-type') || '').includes('text/html')) return res
  if (res.status !== 200) return res

  const url = new URL(ctx.request.url)
  const kind = classify(url.pathname)
  const found = kind === 'ok' ? true : kind === 'missing' ? false : await exists(kind, ctx.env)
  if (!found) {
    const headers = new Headers(res.headers)
    headers.set('X-Robots-Tag', 'noindex')
    headers.set('Cache-Control', 'no-store')
    return new Response(res.body, { status: 404, statusText: 'Not Found', headers })
  }

  const page = pageFor(url.pathname)
  if (!page || typeof HTMLRewriter === 'undefined') return res
  const href = `https://tafutakazi.co.ke${page.path === '/' ? '/' : page.path}`
  const set = (attr, value) => ({ element: (el) => el.setAttribute(attr, value) })

  // 3. The page's full text and structured data, rendered at build time, so crawlers that don't run
  //    JavaScript (most AI crawlers) can read the whole page. Falls back to the short summary.
  let built = null
  try {
    const r = await ctx.env.ASSETS.fetch(new URL(`/_content/${contentKey(page.path)}.json`, url))
    if (r.ok && (r.headers.get('content-type') || '').includes('json')) built = await r.json()
  } catch { /* the summary is enough */ }
  const schema = (built?.jsonLd || []).map((j) => `<script type="application/ld+json">${j}</script>`).join('')

  return new HTMLRewriter()
    .on('head', { element: (el) => { if (schema) el.append(schema, { html: true }) } })
    .on('title', { element: (el) => el.setInnerContent(page.title) })
    .on('meta[name="description"]', set('content', page.description))
    .on('meta[property="og:title"]', set('content', page.title))
    .on('meta[property="og:description"]', set('content', page.description))
    .on('meta[property="og:url"]', set('content', href))
    .on('meta[name="twitter:title"]', set('content', page.title))
    .on('meta[name="twitter:description"]', set('content', page.description))
    .on('link[rel="canonical"]', set('href', href))
    .on('noscript', { element: (el) => el.setInnerContent(built?.html ? fullHtml(built.html) : summaryHtml(page), { html: true }) })
    .transform(res)
}

