// After the build: render each public page to plain HTML for crawlers that don't run JavaScript
// (ChatGPT, Claude, Perplexity and others), and write llms.txt.
//   dist/_content/<page>.json  { html, jsonLd }  read by functions/_middleware.js
//   dist/llms.txt, dist/llms-full.txt
// Keep STATIC in step with server/pages.js.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const SITE = 'https://tafutakazi.co.ke'
const posts = JSON.parse(fs.readFileSync(path.join(root, 'src/blog/posts.json'), 'utf8'))

const STATIC = ['/', '/about', '/jobs', '/join', '/hiring', '/partners', '/blog', '/terms', '/privacy']
const paths = [...STATIC, ...posts.map((p) => `/blog/${p.slug}`)]

const { render } = await import(pathToFileURL(path.join(root, 'dist-ssr/prerender.js')).href)

const keyFor = (p) => (p === '/' ? 'index' : p.slice(1).replace(/\//g, '__'))

// Keep the words and structure; drop styling, icons, images and controls.
function clean(html) {
  return html
    .replace(/<svg[\s\S]*?<\/svg>/g, '')
    .replace(/<button[\s\S]*?<\/button>/g, '')
    .replace(/<img[^>]*>/g, '')
    .replace(/<(input|select|textarea)[\s\S]*?(<\/\1>|\/?>)/g, '')
    .replace(/<(div|span|section|figure|article|aside|nav|ol|ul|li|p|h1|h2|h3|a|strong|em|table|tr|td|th|details|summary)\b([^>]*)>/g, (m, tag, attrs) => {
      const href = tag === 'a' ? (attrs.match(/href="([^"]*)"/) || [])[1] : null
      return href ? `<a href="${href.startsWith('/') ? SITE + href : href}">` : `<${tag}>`
    })
    .replace(/<(div|span|section|figure|article)>\s*<\/\1>/g, '')
    .replace(/<(div|span|section|figure|article)>/g, '')
    .replace(/<\/(div|span|section|figure|article)>/g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

const text = (html) => html.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim()

const outDir = path.join(root, 'dist/_content')
fs.mkdirSync(outDir, { recursive: true })
const full = []
for (const p of paths) {
  const html = await render(p)
  const jsonLd = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => m[1])
  // The page's own content: everything after the header and before the footer.
  const afterHeader = html.slice(html.indexOf('</header>') + '</header>'.length)
  const body = afterHeader.slice(0, afterHeader.indexOf('<footer'))
  const content = clean(body.replace(/<script[\s\S]*?<\/script>/g, ''))
  fs.writeFileSync(path.join(outDir, `${keyFor(p)}.json`), JSON.stringify({ html: content, jsonLd }))
  full.push(`# ${SITE}${p === '/' ? '' : p}\n\n${text(content)}\n`)
  console.log(`prerendered ${p}: ${text(content).split(' ').length} words, ${jsonLd.length} schema`)
}

// llms.txt: what the site is and which pages matter, for AI tools (llmstxt.org).
const llms = `# Tafutakazi

> Tafutakazi ("look for work" in Swahili) is a free Kenyan platform that breaks the unemployment loop for fresh graduates: you can't get a job without experience, and you can't get experience without a job. Graduates with no work experience do short tasks set by real Kenyan companies, explain their work in a 2–3 minute video and a write-up, and employers invite the ones they want to interview. Free for graduates and employers.

- For fresh graduates (degree or diploma) in Kenya with no or little work experience.
- Opportunities: jobs, internships, graduate trainee roles and volunteering.
- Employers judge real work instead of CVs; research (Sackett et al., 2022) finds work samples predict job performance far better than years of experience.
- Graduates' work is visible only to signed-in recruiters, never to other graduates. No one may ask a graduate for money.

## Main pages

- [Home](${SITE}/): what Tafutakazi is and how it works
- [About](${SITE}/about): why it exists, the evidence, and its principles
- [Jobs and internships](${SITE}/jobs): open roles at Kenyan companies that hire fresh graduates
- [For employers](${SITE}/hiring): how companies post a task and hire from real work, free
- [Sign up as a graduate](${SITE}/join)
- [Partner with us](${SITE}/partners): for companies, universities, NGOs and programmes reducing youth unemployment

## Blog

${posts.map((p) => `- [${p.title}](${SITE}/blog/${p.slug}): ${p.description}`).join('\n')}

## Optional

- [Full text of the public pages](${SITE}/llms-full.txt)
- [Terms of Use](${SITE}/terms)
- [Privacy Policy](${SITE}/privacy)
- Contact: hello@tafutakazi.co.ke
`
fs.writeFileSync(path.join(root, 'dist/llms.txt'), llms)
fs.writeFileSync(path.join(root, 'dist/llms-full.txt'), `# Tafutakazi: full text of the public pages\n\n${full.join('\n')}`)
console.log('wrote llms.txt and llms-full.txt')
