import { useQuery } from '@tanstack/react-query'
import { supabase } from './supabase'
import { useAuth } from './auth'
import type { Kind } from './opportunity'

export type CompanyRecord = { received: number; viewed: number; feedback: number; invited?: number; contacted?: number }

export type TaskCard = {
  id: string
  title: string
  role: string
  instructions: string
  minutes_estimate: number
  openings: number | null
  location: string | null
  start_note: string | null
  salary_range: string | null
  status: 'checking' | 'live' | 'flagged' | 'off'
  created_at: string
  is_practice: boolean
  company_name: string | null
  company_website: string | null
  company_linkedin: string | null
  company_social: string | null
  record: CompanyRecord | null
  submitted: boolean
  kind: Kind
  stipend: string | null
  duration_months: number | null
  hours_per_week: number | null
  questions: string[]
}

export type GradRow = {
  id: string
  course: string
  institution: string | null
  grad_year: number | null
  track: string
  slug: string
  digest_enabled: boolean
}

export type MySubmission = {
  id: string
  task_id: string
  summary: string
  tools: string[]
  created_at: string
  task: { id: string; title: string; role: string; industry: string | null } | null
  verdict: { strengths: string; improve: string } | null
}

export function useGrad() {
  const { session } = useAuth()
  return useQuery({
    queryKey: ['grad', session?.user.id],
    enabled: Boolean(session),
    queryFn: async () => {
      const { data, error } = await supabase.from('grads').select('*').eq('id', session!.user.id).single()
      if (error) throw error
      return data as GradRow
    },
  })
}

export function useTaskFeed() {
  return useQuery({
    queryKey: ['task-feed'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('task_feed')
      if (error) throw error
      return (data ?? []) as TaskCard[]
    },
  })
}

export function useTask(id: string) {
  return useQuery({
    queryKey: ['task', id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('task_feed', { only_task: id })
      if (error) throw error
      return ((data ?? []) as TaskCard[])[0] ?? null
    },
  })
}

export function useMySubmissions() {
  const { session } = useAuth()
  return useQuery({
    queryKey: ['my-submissions', session?.user.id],
    enabled: Boolean(session),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('submissions')
        .select('id, task_id, summary, tools, created_at, task:tasks(id, title, role, industry), verdict:verdicts(strengths, improve)')
        .eq('grad_id', session!.user.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as unknown as MySubmission[]
    },
  })
}

export type Activity = {
  views: { submission_id: string; created_at: string }[]
  thumbs: { submission_id: string }[]
  comments: { id: string; submission_id: string; body: string; created_at: string; company: { name: string } | null }[]
  invites: { id: string; submission_id: string; created_at: string; company_status: 'invited' | 'contacted' | 'interviewed' | 'hired' | 'not_moving_forward'; grad_status: 'waiting' | 'contacted' | 'interviewed' | 'hired' | 'no_contact'; company: { name: string } | null }[]
}

// Everything recruiters did with my work. Row-level security limits each table to my own submissions.
export function useMyActivity() {
  const { session } = useAuth()
  return useQuery({
    queryKey: ['my-activity', session?.user.id],
    enabled: Boolean(session),
    queryFn: async (): Promise<Activity> => {
      const [views, thumbs, comments, invites] = await Promise.all([
        supabase.from('views').select('submission_id, created_at').eq('kind', 'work'),
        supabase.from('reactions').select('submission_id'),
        supabase.from('comments').select('id, submission_id, body, created_at, company:companies(name)').order('created_at', { ascending: false }),
        supabase.from('invites').select('id, submission_id, created_at, company_status, grad_status, company:companies(name)').order('created_at', { ascending: false }),
      ])
      for (const r of [views, thumbs, comments, invites]) if (r.error) throw r.error
      return {
        views: views.data ?? [],
        thumbs: thumbs.data ?? [],
        comments: (comments.data ?? []) as unknown as Activity['comments'],
        invites: (invites.data ?? []) as unknown as Activity['invites'],
      }
    },
  })
}

export function minutesLabel(m: number) {
  if (m < 60) return `About ${m} minutes`
  const h = Math.round(m / 30) / 2
  return `About ${h} ${h === 1 ? 'hour' : 'hours'}`
}

export function recordLine(r: CompanyRecord | null) {
  if (!r) return null
  if (r.received === 0) return 'New on Tafutakazi · no record yet'
  const contact = r.invited ? ` · contacted ${r.contacted ?? 0} of ${r.invited} invited` : ''
  return `Viewed ${r.viewed} of ${r.received} submissions · feedback on ${r.feedback}${contact}`
}

export function wordCount(text: string) {
  const t = text.trim()
  return t ? t.split(/\s+/).length : 0
}

export function plural(n: number, one: string, many = one + 's') {
  return `${n} ${n === 1 ? one : many}`
}
