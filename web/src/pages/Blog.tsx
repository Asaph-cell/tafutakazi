import { Suspense, useRef } from 'react'
import { Link, useParams } from 'react-router-dom'
import { PublicHeader } from '../components/PublicHeader'
import { Seo, SITE_URL } from '../components/Seo'
import { SiteFooter } from '../components/SiteFooter'
import { BODIES, POSTS, postDate } from '../blog/posts'
import { Photo, unsplash } from '../blog/ui'
import { Sidebar } from '../blog/Sidebar'
import { NotFound } from './SmallPages'
import { Skeleton } from '../components/ui'

export function BlogIndex() {
  return (
    <div className="min-h-screen">
      <Seo title="Blog" description="Data and ideas on graduate hiring and youth employment in Kenya, from Tafutakazi." />
      <PublicHeader />
      <main className="mx-auto max-w-[1280px] px-5 pb-6 pt-4 sm:px-6 sm:pt-10">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-2">
            <h1 className="m-0 text-[34px] font-bold leading-tight tracking-[-0.03em] sm:text-[44px]">Blog</h1>
            <p className="m-0 text-[18px] text-ink-2">Data and ideas on hiring fresh graduates in Kenya.</p>
          </div>
          <div className="flex flex-col gap-4">
            {POSTS.map((p) => (
              <Link key={p.slug} to={`/blog/${p.slug}`}
                className="press grid overflow-hidden rounded-2xl border border-line bg-white text-ink no-underline hover:border-line-strong hover:text-ink md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
                {p.cover && (
                  <img src={unsplash(p.cover.id, 1000, 16 / 9)} alt={p.cover.alt} loading="lazy" className="block h-full w-full bg-[#E6E6E0] object-cover" style={{ aspectRatio: '16 / 9' }} />
                )}
                <div className="flex flex-col justify-center gap-2 p-6 md:p-8">
                <span className="text-[13px] font-semibold uppercase tracking-[0.08em] text-brand">{p.audience}</span>
                <span className="text-[22px] font-semibold leading-snug tracking-[-0.02em] md:text-[26px]">{p.title}</span>
                <span className="text-ink-2">{p.description}</span>
                <span className="text-sm text-muted">{postDate(p.date)} · {p.readMinutes} min read</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}

export function BlogPost() {
  const { slug = '' } = useParams()
  const articleRef = useRef<HTMLElement>(null)
  const post = POSTS.find((p) => p.slug === slug)
  const Body = BODIES[slug]
  if (!post || !Body) return <NotFound />

  const url = `${SITE_URL}/blog/${post.slug}`
  return (
    <div className="min-h-screen">
      <Seo
        title={post.title}
        description={post.description}
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: post.title,
          description: post.description,
          datePublished: post.date,
          dateModified: post.date,
          mainEntityOfPage: url,
          url,
          image: post.cover ? unsplash(post.cover.id, 1200, 16 / 9) : `${SITE_URL}/og-image.png`,
          author: { '@type': 'Organization', name: 'Tafutakazi', url: SITE_URL },
          publisher: { '@id': `${SITE_URL}/#organization` },
        }}
      />
      <PublicHeader />
      <main className="mx-auto max-w-[1280px] px-5 pb-6 pt-4 sm:px-6 sm:pt-10">
        <div className="mx-auto grid max-w-[1160px] gap-14 lg:grid-cols-[minmax(0,1fr)_280px]">
        <article ref={articleRef} className="flex min-w-0 flex-col gap-5 text-[18px] leading-[1.7] text-ink-2">
          <Link to="/blog" className="text-[15px] no-underline">← Blog</Link>
          <span className="text-[13px] font-semibold uppercase tracking-[0.08em] text-brand">{post.audience}</span>
          <h1 className="m-0 text-[32px] font-bold leading-[1.1] tracking-[-0.03em] text-ink sm:text-[46px]">{post.title}</h1>
          <span className="text-[15px] text-muted">By the Tafutakazi team · {postDate(post.date)} · {post.readMinutes} min read</span>
          {post.cover && <Photo photo={post.cover} ratio={16 / 9} priority />}
          <Suspense fallback={<div className="flex flex-col gap-3"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-11/12" /><Skeleton className="h-4 w-4/5" /></div>}>
            <Body />
          </Suspense>
        </article>
        <aside className="hidden lg:block">
          <Sidebar articleRef={articleRef} audience={post.audience} />
        </aside>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
