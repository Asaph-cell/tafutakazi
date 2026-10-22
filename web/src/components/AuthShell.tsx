import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Logo } from './Logo'

// A calm single-column frame for sign-up, login and similar pages.
export function AuthShell({ title, intro, children, aside }: { title: string; intro?: ReactNode; children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="bg-brand-deep">
        <div className="mx-auto flex min-h-16 max-w-[1280px] items-center px-5 py-3 sm:px-6">
          <Link to="/" className="text-[22px] no-underline"><Logo light /></Link>
        </div>
      </header>
      <main className={`mx-auto flex flex-wrap items-start justify-center gap-12 px-5 pb-20 pt-4 sm:px-6 sm:pt-10 ${aside ? 'max-w-[1080px]' : 'max-w-[520px]'}`}>
        <div className={`flex min-w-0 flex-col gap-7 ${aside ? 'flex-[1_1_440px]' : 'w-full'}`}>
          <div className="flex flex-col gap-2">
            <h1 className="m-0 text-[32px] font-bold leading-tight tracking-[-0.03em] sm:text-[40px]">{title}</h1>
            {intro && <p className="m-0 text-[17px] text-ink-2">{intro}</p>}
          </div>
          {children}
        </div>
        {aside && <aside className="hidden min-w-0 flex-[1_1_300px] lg:block">{aside}</aside>}
      </main>
    </div>
  )
}
