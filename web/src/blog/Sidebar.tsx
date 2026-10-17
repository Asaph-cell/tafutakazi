import { useEffect, useState, type RefObject } from 'react'
import { Link } from 'react-router-dom'

// Sticky side column for blog posts on wide screens: the post's sections, with the current one
// highlighted, and a short call to action.
export function Sidebar({ articleRef, audience }: { articleRef: RefObject<HTMLElement | null>; audience: string }) {
  const [sections, setSections] = useState<{ id: string; text: string }[]>([])
  const [active, setActive] = useState('')

  // The post body loads separately, so watch the article until its headings appear.
  useEffect(() => {
    const el = articleRef.current
    if (!el) return
    const read = () => setSections([...el.querySelectorAll('h2[id]')].map((h) => ({ id: h.id, text: h.textContent ?? '' })))
    read()
    const mo = new MutationObserver(read)
    mo.observe(el, { childList: true, subtree: true })
    return () => mo.disconnect()
  }, [articleRef])

  useEffect(() => {
    if (!sections.length) return
    const onScroll = () => {
      let current = ''
      for (const s of sections) {
        const h = document.getElementById(s.id)
        if (h && h.getBoundingClientRect().top < 140) current = s.id
      }
      setActive(current)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [sections])

  const forEmployers = audience.toLowerCase().includes('employer')
  return (
    <div className="sticky top-8 flex flex-col gap-6">
      {sections.length > 0 && (
        <nav aria-label="In this article" className="flex flex-col gap-2">
          <span className="text-[13px] font-semibold uppercase tracking-[0.08em] text-muted">In this article</span>
          <ol className="m-0 flex list-none flex-col gap-0.5 border-l border-line p-0">
            {sections.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`}
                  className={`-ml-px block border-l-2 py-1.5 pl-3 text-[15px] leading-snug no-underline ${active === s.id ? 'border-brand font-semibold text-ink' : 'border-transparent text-muted hover:text-ink'}`}>
                  {s.text}
                </a>
              </li>
            ))}
          </ol>
        </nav>
      )}
      <div className="flex flex-col gap-3 rounded-2xl bg-ink p-5 text-white">
        {forEmployers ? (
          <>
            <span className="text-lg font-semibold leading-snug">Hiring? See the work before the interview.</span>
            <span className="text-[15px] text-[#C9C9C3]">Post a short task for the role. Graduates do it and explain it on video. Free.</span>
            <Link to="/hiring" className="press mt-1 flex min-h-11 items-center justify-center rounded-lg bg-white px-4 font-semibold text-ink no-underline hover:text-ink">Post a task, free</Link>
          </>
        ) : (
          <>
            <span className="text-lg font-semibold leading-snug">Just graduated? Show your work.</span>
            <span className="text-[15px] text-[#C9C9C3]">Do short tasks from real companies and get seen by people who are hiring. Free.</span>
            <Link to="/join" className="press mt-1 flex min-h-11 items-center justify-center rounded-lg bg-white px-4 font-semibold text-ink no-underline hover:text-ink">Join free</Link>
          </>
        )}
      </div>
    </div>
  )
}
