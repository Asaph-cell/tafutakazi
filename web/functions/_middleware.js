// Every address is answered with the app (it's a single-page site), so on its own a made-up address
// returns "200 OK" and search engines see a "soft 404". This sends a real 404 for addresses that
// aren't pages, and for jobs and graduate links that don't exist. The page itself still shows the
// app's own "not found" screen.
import { classify, exists } from '../server/routing.js'

export async function onRequest(ctx) {
  const res = await ctx.next()
  const method = ctx.request.method
  if (method !== 'GET' && method !== 'HEAD') return res
  if (!(res.headers.get('content-type') || '').includes('text/html')) return res
  if (res.status !== 200) return res

  const url = new URL(ctx.request.url)
  const kind = classify(url.pathname)
  const found = kind === 'ok' ? true : kind === 'missing' ? false : await exists(kind, ctx.env)
  if (found) return res

  const headers = new Headers(res.headers)
  headers.set('X-Robots-Tag', 'noindex')
  headers.set('Cache-Control', 'no-store')
  return new Response(res.body, { status: 404, statusText: 'Not Found', headers })
}
