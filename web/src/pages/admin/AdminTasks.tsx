import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { AdminLayout } from '../../components/AdminLayout'
import { SectionTitle } from '../../components/GradLayout'
import { LinkButton } from '../../components/ui'
import { supabase } from '../../lib/supabase'

type Row = {
  id: string
  title: string
  role: string
  status: 'checking' | 'live' | 'flagged' | 'off'
  check_notes: string | null
  created_at: string
  company_id: string | null
  company: { name: string; website: string | null; linkedin: string | null; social: string | null; email_domain: string | null } | null
  submissions: { id: string }[]
  ai_checks: { status: 'sent' | 'done' | 'failed'; verdict: 'pass' | 'review' | null; reason: string | null; sent_at: string }[]
}

const groups: { status: Row['status']; title: string; empty: string }[] = [
  { status: 'checking', title: 'Waiting for a check', empty: 'Nothing waiting.' },
  { status: 'flagged', title: 'Paused', empty: 'Nothing paused.' },
  { status: 'live', title: 'Live', empty: 'No live tasks.' },
  { status: 'off', title: 'Off', empty: 'None.' },
]

function Action({ onClick, children, tone = 'plain' }: { onClick: () => void; children: string; tone?: 'plain' | 'go' | 'stop' }) {
  const style = tone === 'go' ? 'bg-brand text-white border-brand' : tone === 'stop' ? 'border-[#E8C9BF] text-danger bg-white' : 'border-line-strong bg-white text-ink'
  return <button onClick={onClick} className={`press min-h-10 cursor-pointer rounded-lg border px-3 text-sm font-semibold ${style}`}>{children}</button>
}

export default function AdminTasks() {
  const queryClient = useQueryClient()
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-tasks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('id, title, role, status, check_notes, created_at, company_id, company:companies(name, website, linkedin, social, email_domain), submissions(id), ai_checks(status, verdict, reason, sent_at)')
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as unknown as Row[]
    },
  })

  const { data: overview } = useQuery({
    queryKey: ['admin-overview'],
    queryFn: async () => {
      const [hires, paused] = await Promise.all([
        supabase.rpc('hire_count'),
        supabase.from('companies').select('id, name, paused_reason').eq('paused', true),
      ])
      return { hires: (hires.data as number | null) ?? 0, paused: (paused.data ?? []) as { id: string; name: string; paused_reason: string | null }[] }
    },
  })

  async function unpause(id: string) {
    if (!window.confirm('Unpause this company? Its paused tasks stay paused until you approve them.')) return
    await supabase.from('companies').update({ paused: false, paused_reason: null }).eq('id', id)
    queryClient.invalidateQueries({ queryKey: ['admin-overview'] })
  }

  async function setStatus(id: string, status: Row['status'], note?: string) {
    await supabase.from('tasks').update({ status, check_notes: note ?? null }).eq('id', id)
    queryClient.invalidateQueries({ queryKey: ['admin-tasks'] })
  }

  async function reject(t: Row) {
    const ai = latestCheck(t.ai_checks)
    const reason = window.prompt('Why is this task rejected? The recruiter gets this by email.', ai?.status === 'done' ? ai.reason ?? '' : '')
    if (!reason?.trim()) return
    const { error } = await supabase.rpc('reject_task', { p_task: t.id, p_reason: reason.trim() })
    if (error) window.alert(`Couldn't reject it: ${error.message}`)
    queryClient.invalidateQueries({ queryKey: ['admin-tasks'] })
  }

  function pause(id: string) {
    const note = window.prompt('Why is this task paused? The recruiter will see this.', 'Uses what looks like real customer data')
    if (note !== null) setStatus(id, 'flagged', note)
  }

  return (
    <AdminLayout>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="m-0 text-[32px] font-bold tracking-[-0.03em]">Tasks</h1>
        <LinkButton to="/admin/new">New practice task</LinkButton>
      </div>
      {overview && (
        <div className="flex flex-wrap gap-3">
          <div className="flex flex-col rounded-xl border border-line bg-white px-5 py-3">
            <span className="text-[28px] font-bold leading-tight tabular-nums">{overview.hires}</span>
            <span className="text-sm text-muted">graduates hired through Tafutakazi</span>
          </div>
        </div>
      )}

      {overview && overview.paused.length > 0 && (
        <section className="flex flex-col gap-2.5">
          <SectionTitle>Paused companies · {overview.paused.length}</SectionTitle>
          {overview.paused.map((c) => (
            <div key={c.id} className="flex flex-wrap items-center gap-4 rounded-xl border border-[#E8C9BF] bg-[#FBF1EE] p-4">
              <div className="flex min-w-0 flex-[999_1_300px] flex-col">
                <span className="font-semibold">{c.name}</span>
                <span className="text-sm text-danger">{c.paused_reason}</span>
                <span className="text-[13px] text-muted">Check with the company and the graduates before unpausing.</span>
              </div>
              <button onClick={() => unpause(c.id)} className="press min-h-10 cursor-pointer rounded-lg border border-line-strong bg-white px-3 text-sm font-semibold">Unpause</button>
            </div>
          ))}
        </section>
      )}

      {isLoading && <p className="text-muted">Loading…</p>}
      {error && <p className="text-danger">Couldn't load tasks: {(error as { message?: string }).message ?? 'unknown error'}</p>}

      {data && groups.map((g) => {
        const rows = data.filter((t) => t.status === g.status)
        return (
          <section key={g.status} className="flex flex-col gap-2.5">
            <SectionTitle>{g.title} · {rows.length}</SectionTitle>
            {rows.length === 0 && <p className="m-0 text-sm text-muted">{g.empty}</p>}
            {rows.map((t) => {
              const links = t.company ? [t.company.email_domain && `@${t.company.email_domain}`, t.company.website, t.company.linkedin, t.company.social].filter(Boolean) : []
              return (
                <div key={t.id} className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-xl border border-line bg-white p-4">
                  <div className="flex min-w-0 flex-[999_1_360px] flex-col gap-0.5">
                    <span className="font-semibold">{t.title}</span>
                    <span className="text-sm text-muted">
                      {t.company ? t.company.name : 'Practice task'} · {t.role} · {t.submissions.length} submissions
                    </span>
                    {links.length > 0 && <span className="break-all text-[13px] text-muted">Proof: {links.join(' · ')}</span>}
                    {t.check_notes && <span className="text-[13px] text-danger">{t.check_notes}</span>}
                    {t.status === 'checking' && <AiNote checks={t.ai_checks} />}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {!t.company_id && <Link to={`/admin/tasks/${t.id}`} className="press flex min-h-10 items-center rounded-lg border border-line-strong px-3 text-sm font-semibold text-ink no-underline">Edit</Link>}
                    {t.company_id && <Link to={`/admin/tasks/${t.id}`} className="press flex min-h-10 items-center rounded-lg border border-line-strong px-3 text-sm font-semibold text-ink no-underline">Read</Link>}
                    {(t.status === 'checking' || t.status === 'flagged' || t.status === 'off') && <Action tone="go" onClick={() => setStatus(t.id, 'live')}>{t.status === 'off' ? 'Turn on' : 'Approve'}</Action>}
                    {t.status === 'checking' && t.company_id && <Action tone="stop" onClick={() => reject(t)}>Reject</Action>}
                    {t.status === 'live' && t.company_id && <Action tone="stop" onClick={() => pause(t.id)}>Pause</Action>}
                    {t.status !== 'off' && !(t.status === 'checking' && t.company_id) && <Action onClick={() => setStatus(t.id, 'off')}>Turn off</Action>}
                  </div>
                </div>
              )
            })}
          </section>
        )
      })}
    </AdminLayout>
  )
}

// What the automatic check said about a task waiting for approval.
const latestCheck = (checks: Row['ai_checks']) => [...(checks ?? [])].sort((a, b) => b.sent_at.localeCompare(a.sent_at))[0]

function AiNote({ checks }: { checks: Row['ai_checks'] }) {
  const last = latestCheck(checks)
  if (!last) return null
  if (last.status === 'sent') return <span className="text-[13px] text-muted">AI check in progress…</span>
  if (last.status === 'failed') return <span className="text-[13px] text-muted">AI check didn't work, so check it yourself.</span>
  return <span className="text-[13px] text-ink-2"><strong>AI:</strong> {last.reason}</span>
}
