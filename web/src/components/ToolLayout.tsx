import type { ReactNode } from 'react'
import { useAuth } from '../lib/auth'
import { GradLayout } from './GradLayout'
import { PublicHeader } from './PublicHeader'
import { SiteFooter } from './SiteFooter'

// Page titles: the public size, or the graduate app's own size when shown inside it.
export function useTitleClass(publicSize = 'text-[36px] sm:text-[48px]') {
  const { profile } = useAuth()
  return profile?.role === 'grad'
    ? 'm-0 text-[28px] font-bold leading-tight tracking-[-0.03em] sm:text-[34px]'
    : `m-0 ${publicSize} font-semibold leading-tight`
}

// Skill tracks and interview practice are open to everyone. Signed-in graduates see them inside their own menu.
export function ToolLayout({ children }: { children: ReactNode }) {
  const { profile } = useAuth()
  if (profile?.role === 'grad') return <GradLayout>{children}</GradLayout>
  return (
    <div className="min-h-screen">
      <PublicHeader />
      <main className="mx-auto flex max-w-[1280px] flex-col gap-10 px-5 pb-6 pt-8 sm:px-6 sm:pt-12">{children}</main>
      <SiteFooter />
    </div>
  )
}
