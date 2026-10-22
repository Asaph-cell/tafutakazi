import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

export const SITE_URL = 'https://tafutakazi.co.ke'
const DEFAULT_DESCRIPTION =
  'Fresh graduates in Kenya do short tasks set by real companies, explain their work on video, and get seen by people who are hiring. Free.'

function setMeta(attr: 'name' | 'property', key: string, value: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.content = value
}

function setCanonical(href: string) {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!el) {
    el = document.createElement('link')
    el.rel = 'canonical'
    document.head.appendChild(el)
  }
  el.href = href
}

// Page title, description, sharing preview and search-engine rules for one page.
// Signed-in and private pages pass noindex so search engines skip them.
export function Seo({
  title,
  description = DEFAULT_DESCRIPTION,
  noindex = false,
  jsonLd,
}: {
  title?: string
  description?: string
  noindex?: boolean
  jsonLd?: object
}) {
  const { pathname } = useLocation()
  const fullTitle = title ? `${title} · Tafutakazi` : "Tafutakazi · Breaking Kenya's unemployment loop"
  const url = SITE_URL + pathname

  useEffect(() => {
    document.title = fullTitle
    setMeta('name', 'description', description)
    setMeta('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow')
    setMeta('property', 'og:title', fullTitle)
    setMeta('property', 'og:description', description)
    setMeta('property', 'og:url', url)
    setMeta('name', 'twitter:title', fullTitle)
    setMeta('name', 'twitter:description', description)
    setCanonical(url)
  }, [fullTitle, description, noindex, url])

  useEffect(() => {
    if (!jsonLd) return
    const el = document.createElement('script')
    el.type = 'application/ld+json'
    el.dataset.page = 'true'
    el.textContent = JSON.stringify(jsonLd)
    document.head.appendChild(el)
    return () => el.remove()
  }, [JSON.stringify(jsonLd)])

  return null
}
