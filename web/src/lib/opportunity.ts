// Kinds of opportunity a task can lead to, and how their terms read on cards and pages.
export type Kind = 'job' | 'internship' | 'graduate_trainee' | 'volunteer'

export const KINDS: Kind[] = ['job', 'internship', 'graduate_trainee', 'volunteer']

export const KIND_LABEL: Record<Kind, string> = {
  job: 'Job',
  internship: 'Internship',
  graduate_trainee: 'Graduate trainee',
  volunteer: 'Volunteer',
}

export const KIND_PLURAL: Record<Kind, string> = {
  job: 'Jobs',
  internship: 'Internships',
  graduate_trainee: 'Graduate trainee',
  volunteer: 'Volunteer',
}

export type Terms = {
  kind?: Kind | null
  stipend?: string | null
  duration_months?: number | null
  hours_per_week?: number | null
}

// "Internship · KSh 20,000 a month · 6 months"
export function termsLine(t: Terms) {
  const kind = t.kind ?? 'job'
  if (kind === 'job') return ''
  return [
    KIND_LABEL[kind],
    t.stipend,
    t.duration_months ? `${t.duration_months} ${t.duration_months === 1 ? 'month' : 'months'}` : null,
    kind === 'volunteer' && t.hours_per_week ? `${t.hours_per_week} hrs a week` : null,
  ].filter(Boolean).join(' · ')
}

export type RubricPart = { name: string; weight: number }

export const STARTER_RUBRIC: RubricPart[] = [
  { name: 'Accuracy', weight: 40 },
  { name: 'Insight', weight: 30 },
  { name: 'Communication', weight: 30 },
]
