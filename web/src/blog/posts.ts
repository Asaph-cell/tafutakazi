import { lazy, type ComponentType, type LazyExoticComponent } from 'react'
import list from './posts.json'
import type { PhotoInfo } from './ui'

// Post details live in posts.json so the sitemap and the server's 404 check can read them too.
export type Post = { slug: string; title: string; description: string; audience: string; date: string; readMinutes: number; cover?: PhotoInfo }

export const POSTS = (list as Post[]).slice().sort((a, b) => b.date.localeCompare(a.date))

export const BODIES: Record<string, LazyExoticComponent<ComponentType>> = {
  'kenya-graduate-jobs-gap-2026': lazy(() => import('./kenya-graduate-jobs-gap-2026')),
}

export const postDate = (iso: string) => new Date(iso).toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' })
