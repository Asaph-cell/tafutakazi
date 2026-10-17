import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { homeFor, useAuth, type Role } from '../lib/auth'
import { Seo } from './Seo'
import { SkeletonPage } from './ui'

export function RequireRole({ role, children }: { role: Role; children: ReactNode }) {
  const { session, profile, loading } = useAuth()
  const location = useLocation()

  if (loading) return <div className="mx-auto max-w-[1280px] px-5 py-10 sm:px-6"><SkeletonPage /></div>
  if (!session) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (!profile) return <div className="mx-auto max-w-[1280px] px-5 py-10 sm:px-6"><SkeletonPage /></div>
  if (profile.role !== role && profile.role !== 'admin') return <Navigate to={homeFor(profile.role)} replace />
  return <><Seo noindex />{children}</>
}
