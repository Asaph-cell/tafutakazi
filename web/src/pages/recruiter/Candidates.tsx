import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { RecruiterLayout } from '../../components/RecruiterLayout'
import { useCandidates, type Candidate } from '../../lib/recruiter'

const stage: Record<NonNullable<Candidate['company_status']>, string> = {
  invited: 'Invited',
  contacted: 'Contacted',
  interviewed: 'Interviewed',
  hired: 'Hired',
  not_moving_forward: 'Not moving forward',
}

const gradSays: Partial<Record<NonNullable<Candidate['grad_status']>, string>> = {
  contacted: 'says you contacted them',
  interviewed: 'says the interview is done',
  hired: 'says they got the job',
  no_contact: 'says no one has contacted them',
}

const ago = (at: string) => {
  const d = Math.floor((Date.now() - new Date(at).getTime()) / 86400000)
  return d === 0 ? 'today' : d === 1 ? 'yesterday' : `${d} days ago`
}

function Row({ c }: { c: Candidate }) {
  const first = c.full_name.split(' ')[0]
  const waiting = c.company_status === 'invited'
  const says = c.grad_status ? gradSays[c.grad_status] : undefined
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border border-line bg-white p-4 sm:p-5">
      <Link to={`/browse/${c.grad_id}?role=${encodeURIComponent(c.task_role)}`} className="flex min-w-0 flex-[999_1_300px] flex-col gap-0.5 text-ink no-underline hover:text-ink">
        <span className="font-semibold">{c.full_name}</span>
        <span className="text-sm text-muted">{[c.course, c.institution].filter(Boolean).join(' · ')}</span>
        <span className="text-sm text-ink-2">{c.task_title} · {c.task_role}</span>
        {says && <span className={`text-[13px] font-semibold ${c.grad_status === 'no_contact' ? 'text-danger' : 'text-ink-2'}`}>{first} {says}</span>}
      </Link>
      <div className="flex shrink-0 flex-col items-start gap-1 sm:items-end">
        {c.company_status ? (
          <span className={`rounded-full px-2.5 py-0.5 text-[13px] font-semibold ${waiting ? 'bg-ground text-ink-2' : c.company_status === 'hired' ? 'bg-brand text-white' : 'bg-brand-soft text-brand'}`}>
            {stage[c.company_status]}
          </span>
        ) : (
          <span className="text-[13px] text-muted">You liked this {ago(c.at)}</span>
        )}
        {c.email && <a href={`mailto:${c.email}`} className="break-all text-sm">{c.email}</a>}
        {c.kind === 'invited' && <span className="text-[13px] text-muted">Invited {ago(c.at)}</span>}
      </div>
    </div>
  )
}

export default function Candidates() {
  const { data, isLoading, error } = useCandidates()
  const invited = (data ?? []).filter((c) => c.kind === 'invited')
  const liked = (data ?? []).filter((c) => c.kind === 'liked')
  const toUpdate = invited.filter((c) => c.company_status === 'invited').length

  useEffect(() => {
    document.title = 'Candidates · Tafutakazi'
  }, [])

  return (
    <RecruiterLayout>
      <div className="flex flex-col gap-1">
        <h1 className="m-0 text-[30px] font-bold tracking-[-0.03em] sm:text-[34px]">Candidates</h1>
        <span className="text-ink-2">Everyone you invited or gave a thumbs up. Open a name to update where things stand.</span>
      </div>

      {isLoading && <p className="text-muted">Loading…</p>}
      {error && <p className="text-danger">Couldn't load your candidates. Try again.</p>}

      {!isLoading && !error && (
        <section className="flex flex-col gap-3">
          <h2 className="m-0 text-sm font-semibold uppercase tracking-[0.06em] text-muted">Invited · {invited.length}</h2>
          {toUpdate > 0 && (
            <span className="text-sm text-ink-2">
              {toUpdate} still marked "Invited". Once you've reached out, mark them Contacted: graduates see how many invited people each company contacts.
            </span>
          )}
          {invited.length === 0 ? (
            <p className="m-0 text-ink-2">No invites yet. <Link to="/browse">Browse work</Link> and invite someone to interview.</p>
          ) : (
            <div className="flex flex-col gap-2">{invited.map((c) => <Row key={c.invite_id} c={c} />)}</div>
          )}
        </section>
      )}

      {!isLoading && liked.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="m-0 text-sm font-semibold uppercase tracking-[0.06em] text-muted">Thumbs up · {liked.length}</h2>
          <div className="flex flex-col gap-2">{liked.map((c) => <Row key={c.submission_id} c={c} />)}</div>
        </section>
      )}
    </RecruiterLayout>
  )
}
