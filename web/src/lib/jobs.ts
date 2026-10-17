import { useQuery } from '@tanstack/react-query'
import { supabase } from './supabase'
import { SITE_URL } from '../components/Seo'
import { KIND_LABEL, termsLine, type Kind } from './opportunity'

// Google's employment types for each kind of opportunity.
const EMPLOYMENT: Record<Kind, string | string[]> = { job: 'FULL_TIME', internship: 'INTERN', graduate_trainee: ['FULL_TIME', 'TEMPORARY'], volunteer: 'VOLUNTEER' }

export type Job = {
  id: string
  title: string
  role: string
  instructions: string
  minutes_estimate: number
  openings: number | null
  location: string | null
  start_note: string | null
  salary_range: string | null
  created_at: string
  updated_at: string
  company_name: string
  company_website: string | null
  company_linkedin: string | null
  company_social: string | null
  industry: string
  kind: Kind
  stipend: string | null
  duration_months: number | null
  hours_per_week: number | null
}

export function useJobs(id?: string) {
  return useQuery({
    queryKey: ['public-jobs', id ?? 'all'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('public_jobs', id ? { p_job: id } : {})
      if (error) throw error
      return (data ?? []) as Job[]
    },
  })
}

const withProtocol = (u: string) => (u.startsWith('http') ? u : `https://${u}`)

function salary(range: string | null) {
  if (!range) return undefined
  const nums = (range.replace(/,/g, '').match(/\d{4,}/g) ?? []).map(Number)
  if (!nums.length) return undefined
  return {
    '@type': 'MonetaryAmount',
    currency: 'KES',
    value: { '@type': 'QuantitativeValue', minValue: Math.min(...nums), maxValue: Math.max(...nums), unitText: 'MONTH' },
  }
}

// Google for Jobs markup (schema.org JobPosting) for one job.
export function jobPostingLd(job: Job) {
  const posted = new Date(job.created_at)
  const validThrough = new Date(posted.getTime() + 60 * 86400000)
  const sameAs = [job.company_website, job.company_linkedin, job.company_social].filter(Boolean).map((u) => withProtocol(u!))
  const remote = job.location === 'Remote'
  const paragraphs = job.instructions.split(/\n{2,}/).map((p) => `<p>${p.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/\n/g, '<br>')}</p>`).join('')
  return {
    '@context': 'https://schema.org/',
    '@type': 'JobPosting',
    title: job.kind === 'job' ? `${job.role}: ${job.title}` : `${job.role} ${KIND_LABEL[job.kind].toLowerCase()}: ${job.title}`,
    description:
      `<p>${job.company_name} ${job.kind === 'job' ? `is hiring a ${job.role}` : `is offering a ${job.role} ${KIND_LABEL[job.kind].toLowerCase()} role`} and is open to fresh graduates with no work experience. ` +
      (termsLine(job) ? `${termsLine(job)}. ` : '') +
      `Do this short task on Tafutakazi (about ${Math.round(job.minutes_estimate / 60)} hours) to show what you can do. ` +
      `The company sees your work and invites the people it wants to interview.</p>` +
      paragraphs,
    identifier: { '@type': 'PropertyValue', name: 'Tafutakazi', value: job.id },
    datePosted: posted.toISOString().slice(0, 10),
    validThrough: validThrough.toISOString(),
    hiringOrganization: { '@type': 'Organization', name: job.company_name, ...(sameAs.length ? { sameAs } : {}) },
    ...(remote
      ? { jobLocationType: 'TELECOMMUTE', applicantLocationRequirements: { '@type': 'Country', name: 'Kenya' } }
      : { jobLocation: { '@type': 'Place', address: { '@type': 'PostalAddress', addressCountry: 'KE' } } }),
    ...(job.openings ? { totalJobOpenings: job.openings } : {}),
    ...(salary(job.salary_range) ? { baseSalary: salary(job.salary_range) } : {}),
    employmentType: EMPLOYMENT[job.kind] ?? 'FULL_TIME',
    experienceRequirements: { '@type': 'OccupationalExperienceRequirements', monthsOfExperience: 0 },
    directApply: false,
    url: `${SITE_URL}/jobs/${job.id}`,
  }
}

export function postedAgo(iso: string) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
  if (days <= 0) return 'Posted today'
  if (days === 1) return 'Posted yesterday'
  if (days < 30) return `Posted ${days} days ago`
  return `Posted ${new Date(iso).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })}`
}
