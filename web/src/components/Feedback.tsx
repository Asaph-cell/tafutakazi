import { useEffect, useState } from 'react'
import { onToast, type Toast } from '../lib/toast'

// Site-wide feedback: a ripple on every button and link-button, a shake on fields the browser
// says are wrong, and the toast messages.
export function Feedback() {
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    function ripple(e: PointerEvent) {
      if (e.button !== 0) return
      const el = (e.target as Element | null)?.closest<HTMLElement>('button, a.press, [role="button"]')
      if (!el || (el as HTMLButtonElement).disabled || el.dataset.noRipple !== undefined) return
      const r = el.getBoundingClientRect()
      const cs = getComputedStyle(el)
      if (cs.position === 'static') el.style.position = 'relative'
      if (cs.overflow === 'visible') el.style.overflow = 'hidden'
      const size = Math.max(r.width, r.height)
      const dot = document.createElement('span')
      dot.className = 'ripple'
      dot.setAttribute('aria-hidden', 'true')
      dot.style.width = dot.style.height = `${size}px`
      dot.style.left = `${e.clientX - r.left - size / 2}px`
      dot.style.top = `${e.clientY - r.top - size / 2}px`
      el.appendChild(dot)
      setTimeout(() => dot.remove(), 600)
    }
    function shake(e: Event) {
      const el = e.target as HTMLElement
      el.classList.remove('shake')
      void el.offsetWidth
      el.classList.add('shake')
      setTimeout(() => el.classList.remove('shake'), 400)
    }
    document.addEventListener('pointerdown', ripple)
    document.addEventListener('invalid', shake, true)
    const off = onToast((t) => {
      setToasts((x) => [...x.slice(-2), t])
      setTimeout(() => setToasts((x) => x.filter((y) => y.id !== t.id)), 3200)
    })
    return () => {
      document.removeEventListener('pointerdown', ripple)
      document.removeEventListener('invalid', shake, true)
      off()
    }
  }, [])

  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-5 z-[60] flex flex-col items-center gap-2 px-4 max-sm:bottom-[88px]">
      {toasts.map((t) => (
        <div key={t.id} className="toast flex items-center gap-2.5 rounded-xl bg-ink px-4 py-3 text-[15px] font-semibold text-white shadow-[0_10px_30px_rgba(20,20,20,0.18)]">
          <span aria-hidden="true" className="grid h-5 w-5 flex-none place-items-center rounded-full bg-brand text-xs">✓</span>
          {t.text}
        </div>
      ))}
    </div>
  )
}
