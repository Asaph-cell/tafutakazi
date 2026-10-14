// The sitemap, built on each request: the public pages plus every live job.
import { liveJobs, sitemapXml } from '../server/routing.js'

export async function onRequestGet({ env }) {
  const jobs = await liveJobs(env)
  return new Response(sitemapXml(jobs), {
    headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' },
  })
}
