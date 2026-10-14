import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Logo } from '../components/Logo'
import { SiteFooter } from '../components/SiteFooter'
import { Seo } from '../components/Seo'

const MPESA_NUMBER = '0790793213'

const partners = [
  ['Companies', 'Hire from Tafutakazi, write practice tasks from your industry, or sponsor a track like data or marketing.'],
  ['Universities and colleges', 'Bring your final-year students on early, and see how many of them get hired.'],
  ['NGOs and foundations', 'Fund a group of graduates, design tasks with us, or help us reach more counties.'],
]

export default function Support() {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(MPESA_NUMBER)
    } catch {
      // Clipboard can be blocked; the number is on screen anyway.
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen">
      <Seo title="Support Tafutakazi" description="Tafutakazi is free and exists to help reduce graduate unemployment in Kenya. Buy us a chai or partner with us." />
      <header className="mx-auto flex max-w-[1280px] items-center px-5 py-5 sm:px-6">
        <Link to="/" className="text-[22px] no-underline"><Logo /></Link>
      </header>
      <main className="mx-auto flex max-w-[720px] flex-col gap-12 px-5 pb-10 pt-8 sm:px-6">
        <div className="flex flex-col gap-3">
          <h1 className="m-0 text-[32px] font-bold leading-tight tracking-[-0.03em] sm:text-[40px]">
            Tafutakazi is free. For graduates and for recruiters.
          </h1>
          <p className="m-0 text-[18px] text-ink-2">
            It exists to help reduce graduate unemployment in Kenya. Employers ask for experience that fresh graduates
            can't get without a job, so Tafutakazi gives them a chance to prove what they can do. If it helped you, or
            you believe in it, here's how to keep it going.
          </p>
        </div>

        <section className="flex flex-col gap-3.5 border-t border-line pt-7">
          <h2 className="m-0 text-2xl font-semibold">Buy us a chai</h2>
          <p className="m-0 text-ink-2">Any amount helps pay for the website, emails and storage. Nothing changes on your account either way.</p>
          <div className="flex flex-wrap items-center gap-4 self-start rounded-xl border border-line bg-white px-5 py-4">
            <span className="flex flex-col">
              <span className="text-sm text-muted">Send money with M-Pesa to</span>
              <span className="text-[26px] font-bold tracking-[0.02em] tabular-nums">0790 793 213</span>
            </span>
            <button onClick={copy} className="press min-h-11 cursor-pointer rounded-lg border border-ink bg-white px-4 font-semibold text-ink">
              {copied ? 'Copied' : 'Copy number'}
            </button>
          </div>
        </section>

        <section className="flex flex-col gap-5 border-t border-line pt-7">
          <div className="flex flex-col gap-1.5">
            <h2 className="m-0 text-2xl font-semibold">Partner with us</h2>
            <p className="m-0 text-ink-2">We work with organisations that want more young Kenyans in work.</p>
          </div>
          {partners.map(([title, body]) => (
            <div key={title} className="flex flex-col gap-1">
              <span className="font-semibold">{title}</span>
              <span className="text-ink-2">{body}</span>
            </div>
          ))}
          <a href="mailto:partners@tafutakazi.co.ke" className="press inline-flex min-h-12 items-center self-start rounded-lg border border-ink px-5 font-semibold text-ink no-underline">
            Email partners@tafutakazi.co.ke
          </a>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
