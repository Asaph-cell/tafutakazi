import { useQuery } from '@tanstack/react-query'
import { useAuth } from './auth'
import { supabase } from './supabase'

export type CvData = {
  phone: string
  town: string
  linkedin: string
  summary: string
  skills: string
  competencies: string
  languages: string
  jobs: { title: string; place: string; dates: string; details: string }[]
  education: { years: string; school: string; course: string }[]
  referees: { name: string; title: string; phone: string; email: string }[]
  template: string
  accent: string
}

export const EMPTY_CV: CvData = { phone: '', town: '', linkedin: '', summary: '', skills: '', competencies: '', languages: '', jobs: [], education: [], referees: [], template: 'modern', accent: '#16395C' }

// Private to the graduate: recruiters and other graduates can't read this table.
export function useMyCv() {
  const { session } = useAuth()
  return useQuery({
    queryKey: ['my-cv', session?.user.id],
    enabled: Boolean(session),
    queryFn: async () => {
      const { data, error } = await supabase.from('cvs').select('data').eq('grad_id', session!.user.id).maybeSingle()
      if (error) throw error
      return data ? { ...EMPTY_CV, ...(data.data as Partial<CvData>) } : null
    },
  })
}
