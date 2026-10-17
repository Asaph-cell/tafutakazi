import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AdminLayout } from '../../components/AdminLayout'
import { Card, SectionTitle, Stat } from '../../components/GradLayout'
import { Button, Notice, Skeleton } from '../../components/ui'
import { supabase } from '../../lib/supabase'
import { toast } from '../../lib/toast'

type Month = { month: string; graduates: number; submissions: number; invites: number; hires: number }
type Named = { name: string; n: number }
type Impact = {
  graduates: number
  graduates_with_work: number
  submissions: number
  company_submissions: number
  practice_submissions: number
  institutions: number
  companies: number
  companies_posting: number
  opportunities: number
  opportunities_live: number
  opportunities_by_type: Record<string, number>
  invites: number
  graduates_invited: number
  graduates_interviewed: number
  graduates_hired: number
  median_days_to_invite: number | null
  median_days_to_hire: number | null
  monthly: Month[]
  top_roles: Named[]
  top_institutions: Named[]
}

const SERIES = [
  { key: 'graduates', label: 'Graduates joined' },
  { key: 'submissions', label: 'Tasks done' },
  { key: 'invites', label: 'Interview invites' },
  { key: 'hires', label: 'Hires' },
] as const

const TYPE_LABEL: Record<string, string> = { job: 'Jobs', internship: 'Internships', graduate_trainee: 'Graduate trainee', volunteer: 'Volunteer' }

const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)}%` : '–')
const monthName = (m: string) => new Date(`${m}-01T00:00:00`).toLocaleDateString('en-KE', { month: 'short' })
const fullMonth = (m: string) => new Date(`${m}-01T00:00:00`).toLocaleDateString('en-KE', { month: 'long', year: 'numeric' })
const plural = (n: number, one: string, many = `${one}s`) => `${n.toLocaleString('en-KE')} ${n === 1 ? one : many}`

// A short paragraph to paste into grant applications and partner emails.
function summary(d: Impact) {
  const today = new Date().toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' })
  const parts = [
    `As of ${today}, ${plural(d.graduates, 'fresh graduate')} from ${plural(d.institutions, 'institution')} have joined Tafutakazi.`,
    `${plural(d.graduates_with_work, 'graduate')} have shown their skills by completing ${plural(d.submissions, 'work task')}, ${d.company_submissions.toLocaleString('en-KE')} of them set by employers.`,
    `${plural(d.companies, 'employer')} have signed up and ${plural(d.opportunities, 'opportunity', 'opportunities')} have been posted.`,
  ]
  if (d.graduates_invited) parts.push(`${plural(d.graduates_invited, 'graduate')} have been invited to interview on the strength of their work${d.median_days_to_invite != null ? `, a median of ${d.median_days_to_invite} days after joining` : ''}.`)
  if (d.graduates_hired) parts.push(`${plural(d.graduates_hired, 'graduate')} have been hired${d.median_days_to_hire != null ? `, a median of ${d.median_days_to_hire} days after joining` : ''}.`)
  return parts.join(' ')
}

function csv(d: Impact) {
  const rows = [['Month', ...SERIES.map((s) => s.label)], ...d.monthly.map((m) => [m.month, ...SERIES.map((s) => String(m[s.key]))])]
  return rows.map((r) => r.join(',')).join('\n')
}

export default function AdminImpact() {
  const [series, setSeries] = useState<(typeof SERIES)[number]['key']>('graduates')
  const { data: d, isLoading, error } = useQuery({
    queryKey: ['impact'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('impact_stats')
      if (error) throw error
      return data as Impact
    },
  })

  async function copySummary() {
    if (!d) return
    try {
      await navigator.clipboard.writeText(summary(d))
      toast('Summary copied')
    } catch {
      window.prompt('Copy this:', summary(d))
    }
  }

  function download() {
    if (!d) return
    const url = URL.createObjectURL(new Blob([csv(d)], { type: 'text/csv' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `tafutakazi-impact-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <AdminLayout>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex max-w-[640px] flex-col gap-1">
          <h1 className="m-0 text-[32px] font-bold tracking-[-0.03em]">Impact</h1>
          <p className="m-0 text-ink-2">The numbers funders and partners ask for. Counts only, no names. Admin and test accounts are left out.</p>
        </div>
        {d && (
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={download} className="min-h-11 px-4 text-sm">Download monthly CSV</Button>
            <Button onClick={copySummary} className="min-h-11 px-4 text-sm">Copy summary for applications</Button>
          </div>
        )}
      </div>

      {error && <Notice>Couldn't load the numbers. Run the impact migration in Supabase, then refresh.</Notice>}

      {isLoading && (
        <div role="status" aria-label="Loading" className="flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-[92px] rounded-2xl" />)}</div>
          <Skeleton className="h-[260px] rounded-2xl" />
        </div>
      )}

      {d && (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat value={d.graduates.toLocaleString('en-KE')} label="graduates joined" />
            <Stat value={d.submissions.toLocaleString('en-KE')} label="work tasks done" />
            <Stat value={d.graduates_invited.toLocaleString('en-KE')} label="graduates invited to interview" />
            <Stat value={d.graduates_hired.toLocaleString('en-KE')} label="graduates hired" accent />
          </div>

          <Card title="From joining to hired">
            <div className="flex flex-col gap-3">
              {[
                { label: 'Joined', n: d.graduates, note: '' },
                { label: 'Did at least one task', n: d.graduates_with_work, note: pct(d.graduates_with_work, d.graduates) + ' of those who joined' },
                { label: 'Invited to interview', n: d.graduates_invited, note: pct(d.graduates_invited, d.graduates_with_work) + ' of those with work' },
                { label: 'Interviewed', n: d.graduates_interviewed, note: pct(d.graduates_interviewed, d.graduates_invited) + ' of those invited' },
                { label: 'Hired', n: d.graduates_hired, note: pct(d.graduates_hired, d.graduates_invited) + ' of those invited' },
              ].map((step) => (
                <div key={step.label} className="grid grid-cols-[150px_minmax(0,1fr)] items-center gap-3 sm:grid-cols-[200px_minmax(0,1fr)_200px]">
                  <span className="text-sm font-semibold">{step.label}</span>
                  <div className="h-8 overflow-hidden rounded-lg bg-ground">
                    <div className="flex h-full items-center rounded-lg bg-brand px-2.5 text-sm font-semibold text-white transition-[width] duration-700"
                      style={{ width: `${Math.max(d.graduates ? (step.n / d.graduates) * 100 : 0, step.n ? 6 : 0)}%` }}>
                      {step.n > 0 && step.n.toLocaleString('en-KE')}
                    </div>
                  </div>
                  <span className="col-span-2 text-sm text-muted sm:col-span-1">{step.n === 0 ? '0' : step.note}</span>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-x-8 gap-y-1 border-t border-line pt-4 text-sm text-ink-2">
              <span>Median time to first invite: <strong>{d.median_days_to_invite != null ? `${d.median_days_to_invite} days` : 'not yet'}</strong></span>
              <span>Median time to hire: <strong>{d.median_days_to_hire != null ? `${d.median_days_to_hire} days` : 'not yet'}</strong></span>
            </div>
          </Card>

          <Card title="Last 12 months"
            action={
              <div className="flex flex-wrap gap-1" role="group" aria-label="What to show">
                {SERIES.map((s) => (
                  <button key={s.key} aria-pressed={series === s.key} onClick={() => setSeries(s.key)}
                    className={`press min-h-9 cursor-pointer rounded-lg border-0 px-3 text-sm ${series === s.key ? 'bg-brand-soft font-semibold text-brand' : 'bg-transparent text-muted hover:bg-ground'}`}>
                    {s.label}
                  </button>
                ))}
              </div>
            }>
            {(() => {
              const max = Math.max(1, ...d.monthly.map((m) => m[series]))
              return (
                <div className="flex h-[200px] items-end gap-1.5 sm:gap-3">
                  {d.monthly.map((m) => (
                    <div key={m.month} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1.5" title={`${fullMonth(m.month)}: ${m[series]}`}>
                      <span className="text-xs font-semibold tabular-nums text-ink-2">{m[series] || ''}</span>
                      <div className="w-full rounded-t-md bg-brand transition-[height] duration-500"
                        style={{ height: `${(m[series] / max) * 150}px`, minHeight: m[series] ? 4 : 1, opacity: m[series] ? 1 : 0.15 }} />
                      <span className="text-[11px] text-muted">{monthName(m.month)}</span>
                    </div>
                  ))}
                </div>
              )
            })()}
          </Card>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card title="Employers">
              <div className="flex flex-col gap-2 text-ink-2">
                <span><strong className="text-ink">{d.companies}</strong> signed up</span>
                <span><strong className="text-ink">{d.companies_posting}</strong> have posted an opportunity</span>
                <span><strong className="text-ink">{d.opportunities}</strong> opportunities posted, <strong className="text-ink">{d.opportunities_live}</strong> open now</span>
                {Object.keys(d.opportunities_by_type).length > 0 && (
                  <span className="text-sm text-muted">
                    {Object.entries(d.opportunities_by_type).map(([k, n]) => `${TYPE_LABEL[k] ?? k}: ${n}`).join(' · ')}
                  </span>
                )}
                <span className="text-sm text-muted">{d.practice_submissions} practice tasks and {d.company_submissions} employer tasks done</span>
              </div>
            </Card>
            <TopList title="Most-done roles" rows={d.top_roles} empty="No tasks done yet." />
            <TopList title={`Institutions (${d.institutions})`} rows={d.top_institutions} empty="No graduates yet." caps />
          </div>

          <div className="flex flex-col gap-2">
            <SectionTitle>Summary for applications</SectionTitle>
            <p className="m-0 max-w-[80ch] rounded-2xl border border-line bg-white p-5 leading-relaxed text-ink-2">{summary(d)}</p>
          </div>
        </>
      )}
    </AdminLayout>
  )
}

function TopList({ title, rows, empty, caps = false }: { title: string; rows: Named[]; empty: string; caps?: boolean }) {
  const max = Math.max(1, ...rows.map((r) => r.n))
  return (
    <Card title={title}>
      {rows.length === 0 && <p className="m-0 text-sm text-muted">{empty}</p>}
      <div className="flex flex-col gap-2">
        {rows.map((r) => (
          <div key={r.name} className="flex flex-col gap-1">
            <div className="flex justify-between gap-3 text-sm">
              <span className={`truncate ${caps ? 'uppercase' : ''}`}>{r.name}</span>
              <span className="tabular-nums text-muted">{r.n}</span>
            </div>
            <div className="h-1.5 rounded-full bg-ground">
              <div className="h-full rounded-full bg-brand" style={{ width: `${(r.n / max) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
