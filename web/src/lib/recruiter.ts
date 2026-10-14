import { useQuery } from '@tanstack/react-query'
import { supabase } from './supabase'
import { useAuth } from './auth'

export type Company = {
  id: string
  name: string
  size: string | null
  industry: string
  website: string | null
  linkedin: string | null
  social: string | null
  email_domain: string | null
}
export type RecruiterRow = { id: string; job_title: string | null; roles: string[]; digest_enabled: boolean; company: Company | null }

export function useRecruiter() {
  const { session } = useAuth()
  return useQuery({
    queryKey: ['recruiter', session?.user.id],
    enabled: Boolean(session),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recruiters')
        .select('id, job_title, roles, digest_enabled, company:companies(id, name, size, industry, website, linkedin, social, email_domain)')
        .eq('id', session!.user.id)
        .maybeSingle()
      if (error) throw error
      return data as unknown as RecruiterRow | null
    },
  })
}

export type BrowseRow = {
  grad_id: string
  full_name: string
  course: string
  institution: string | null
  grad_year: number | null
  tasks_done: number
  latest_title: string
  latest_summary: string
  latest_at: string
  latest_strengths: string | null
  views: number
  thumbs: number
  tools: string[]
}

export function useBrowse(role: string, tools: string[] = []) {
  return useQuery({
    queryKey: ['browse', role, tools],
    enabled: Boolean(role),
    queryFn: async () => {
      const { data, error } = await supabase.rpc('browse_grads', { p_role: role, p_tools: tools })
      if (error) throw error
      return (data ?? []) as BrowseRow[]
    },
  })
}

export type WorkItem = {
  id: string
  summary: string
  writeup: string
  word_count: number
  video_url: string
  preview_path: string | null
  tools: string[]
  created_at: string
  task_id: string
  task_title: string
  task_role: string
  task_instructions: string
  task_minutes: number
  industry: string | null
  is_practice: boolean
  is_mine: boolean
  my_company_name: string | null
  strengths: string | null
  improve: string | null
  views: number
  thumbs: number
  my_thumb: boolean
  invited: boolean
  invite: { id: string; company_status: 'invited' | 'contacted' | 'interviewed' | 'hired' | 'not_moving_forward'; grad_status: 'waiting' | 'contacted' | 'interviewed' | 'hired' | 'no_contact'; created_at: string } | null
  my_comments: { id: string; body: string; created_at: string }[]
}
export type GradWork = {
  grad_id: string
  full_name: string
  course: string
  institution: string | null
  grad_year: number | null
  track: string
  email: string | null
  company_paused: boolean
  submissions: WorkItem[]
}

export function useGradWork(gradId: string) {
  return useQuery({
    queryKey: ['grad-work', gradId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('grad_work', { p_grad: gradId })
      if (error) throw error
      return data as GradWork | null
    },
  })
}

export function useRoleTools(role: string) {
  return useQuery({
    queryKey: ['role-tools', role],
    enabled: Boolean(role),
    queryFn: async () => {
      const { data, error } = await supabase.rpc('role_tools', { p_role: role })
      if (error) throw error
      return (data ?? []) as { tool: string; grads: number }[]
    },
  })
}

export type MyTask = {
  id: string
  title: string
  role: string
  status: 'checking' | 'live' | 'flagged' | 'off'
  check_notes: string | null
  openings: number | null
  created_at: string
  received: number
  answered: number
}

export function useMyTasks() {
  return useQuery({
    queryKey: ['my-tasks'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('my_tasks')
      if (error) throw error
      return (data ?? []) as MyTask[]
    },
  })
}

export type Allowance = { open: number; limit: number; can_post: boolean }

export function useAllowance() {
  return useQuery({
    queryKey: ['allowance'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('my_task_allowance')
      if (error) throw error
      return data as Allowance
    },
  })
}

// Where a task's work came from, as another company sees it.
export function taskSource(w: Pick<WorkItem, 'is_practice' | 'is_mine' | 'my_company_name' | 'industry'>) {
  if (w.is_practice) return 'Tafutakazi practice task'
  if (w.is_mine) return `Your task · ${w.my_company_name}`
  return `A task from a company in ${(w.industry ?? 'business').toLowerCase()}`
}

// Turn a share link into something we can play on the page.
export function videoEmbed(url: string): string | null {
  try {
    const u = new URL(url)
    const host = u.hostname.replace(/^www\./, '')
    if (host === 'youtu.be') return `https://www.youtube-nocookie.com/embed/${u.pathname.slice(1)}`
    if (host.endsWith('youtube.com')) {
      const id = u.searchParams.get('v') ?? u.pathname.split('/').filter(Boolean).pop()
      return id ? `https://www.youtube-nocookie.com/embed/${id}` : null
    }
    if (host.endsWith('loom.com')) {
      const id = u.pathname.split('/').filter(Boolean).pop()
      return id ? `https://www.loom.com/embed/${id}` : null
    }
    if (host === 'drive.google.com') {
      const m = u.pathname.match(/\/file\/d\/([^/]+)/)
      return m ? `https://drive.google.com/file/d/${m[1]}/preview` : null
    }
  } catch {
    return null
  }
  return null
}

export type Candidate = {
  kind: 'invited' | 'liked'
  grad_id: string
  full_name: string
  course: string
  institution: string | null
  task_title: string
  task_role: string
  submission_id: string
  invite_id: string | null
  company_status: 'invited' | 'contacted' | 'interviewed' | 'hired' | 'not_moving_forward' | null
  grad_status: 'waiting' | 'contacted' | 'interviewed' | 'hired' | 'no_contact' | null
  at: string
  email: string | null
}

export function useCandidates() {
  return useQuery({
    queryKey: ['candidates'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('my_candidates')
      if (error) throw error
      return (data ?? []) as Candidate[]
    },
  })
}

export function useRolesWithWork() {
  return useQuery({
    queryKey: ['roles-with-work'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('roles_with_work')
      if (error) throw error
      return (data ?? []) as { role: string; grads: number }[]
    },
  })
}
