import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { RecruiterLayout } from '../../components/RecruiterLayout'
import { ROLES } from '../../lib/lists'
import { useBrowse, useRecruiter, useRolesWithWork, useRoleTools, type BrowseRow } from '../../lib/recruiter'
import { SkeletonCards } from '../../components/ui'

const NEW_DAYS = 5
type Sort = 'recommended' | 'thumbs' | 'newest'

const isNew = (r: BrowseRow) => Date.now() - new Date(r.latest_at).getTime() < NEW_DAYS * 86400000

function sortRows(rows: BrowseRow[], sort: Sort) {
  const list = [...rows]
  if (sort === 'newest') return list.sort((a, b) => b.latest_at.localeCompare(a.latest_at))
  if (sort === 'thumbs') return list.sort((a, b) => b.thumbs - a.thumbs || b.tasks_done - a.tasks_done)
  // Recommended: fresh work gets a few days near the top, then thumbs up and effort.
  return list.sort((a, b) => Number(isNew(b)) - Number(isNew(a)) || b.thumbs - a.thumbs || b.tasks_done - a.tasks_done || b.latest_at.localeCompare(a.latest_at))
}

function Bars() {
  return (
    <div aria-hidden="true" className="hidden h-[88px] w-[150px] shrink-0 items-end gap-2 rounded-md bg-[#EEF1EE] px-4 py-3 sm:flex">
      {[30, 70, 50, 85, 40].map((h, k) => (
        <div key={k} className="w-4 rounded-sm" style={{ height: `${h}%`, background: k % 2 ? 'var(--color-brand)' : '#A9C2B7' }} />
      ))}
    </div>
  )
}

export default function Browse() {
  const { data: me } = useRecruiter()
  const [params, setParams] = useSearchParams()
  const myRoles = me?.roles?.length ? me.roles : ['Data Analyst']
  const role = params.get('role') ?? myRoles[0]
  const tools = params.getAll('tool')
  const [sort, setSort] = useState<Sort>('recommended')
  const { data, isLoading, error } = useBrowse(role, tools)
  const { data: roleTools } = useRoleTools(role)
  const toggleTool = (t: string) => {
    const next = tools.includes(t) ? tools.filter((x) => x !== t) : [...tools, t]
    setParams({ role, tool: next })
  }
  const rows = useMemo(() => sortRows(data ?? [], sort), [data, sort])
  const { data: withWork } = useRolesWithWork()
  const count = (r: string) => withWork?.find((w) => w.role === r)?.grads ?? 0
  // Roles with work first, then the rest, so recruiters can see where the graduates are.
  const others = [...new Set([...(withWork ?? []).map((w) => w.role), ...ROLES])].filter((r) => !myRoles.includes(r))
  const elsewhere = (withWork ?? []).filter((w) => w.role !== role)

  useEffect(() => {
    document.title = `${role} · Tafutakazi`
  }, [role])

  return (
    <RecruiterLayout>
      <div className="flex flex-col gap-4">
        <h1 className="m-0 text-[30px] font-bold tracking-[-0.03em] sm:text-[34px]">Who are you hiring?</h1>
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Role">
          {myRoles.map((r) => (
            <button key={r} aria-pressed={r === role} onClick={() => setParams({ role: r })}
              className={`press min-h-11 cursor-pointer rounded-full border px-4 text-sm ${r === role ? 'border-ink bg-ink text-white' : 'border-line-strong bg-white text-ink'}`}>
              {r} <span className={r === role ? 'text-white/70' : 'text-muted'}>· {count(r)}</span>
            </button>
          ))}
          <label className="sr-only" htmlFor="other-role">Another role</label>
          <select id="other-role" value={myRoles.includes(role) ? '' : role} onChange={(e) => e.target.value && setParams({ role: e.target.value })}
            className={`min-h-11 rounded-full border px-3 text-sm ${myRoles.includes(role) ? 'border-line-strong bg-white text-muted' : 'border-ink bg-ink text-white'}`}>
            <option value="">Another role…</option>
            {others.map((r) => <option key={r} value={r}>{r}{count(r) ? ` · ${count(r)}` : ''}</option>)}
          </select>
        </div>
        {roleTools && roleTools.length > 0 && (
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Must know">
            <span className="mr-1 text-sm text-muted">Must know</span>
            {roleTools.map((t) => {
              const on = tools.includes(t.tool)
              return (
                <button key={t.tool} aria-pressed={on} onClick={() => toggleTool(t.tool)}
                  className={`press min-h-10 cursor-pointer rounded-full border px-3.5 text-sm ${on ? 'border-brand bg-brand text-white' : 'border-line-strong bg-white text-ink'}`}>
                  {on ? '✓ ' : ''}{t.tool} <span className={on ? 'text-white/80' : 'text-muted'}>· {t.grads}</span>
                </button>
              )
            })}
            {tools.length > 0 && (
              <button onClick={() => setParams({ role })} className="press min-h-10 cursor-pointer border-0 bg-transparent px-1 text-sm text-brand underline">Clear</button>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-line pb-3">
        <span className="text-muted">
          {isLoading ? 'Finding graduates…' : `${rows.length} ${rows.length === 1 ? 'graduate' : 'graduates'} with ${role.toLowerCase()} work${tools.length ? ` using ${tools.join(' + ')}` : ''}`}
        </span>
        <label className="flex items-center gap-2 text-sm text-muted">
          Sort
          <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="min-h-10 rounded-md border border-line-strong bg-white px-2 text-ink">
            <option value="recommended">Recommended</option>
            <option value="thumbs">Most thumbs up</option>
            <option value="newest">Newest work</option>
          </select>
        </label>
      </div>

      {error && <p className="text-danger">Couldn't load graduates. Try again.</p>}
      {isLoading && <SkeletonCards count={4} />}
      {!isLoading && rows.length === 0 && (
        <div className="flex flex-col gap-3">
          <p className="m-0 max-w-[60ch] text-ink-2">
            {tools.length
              ? 'No one matches all of those tools. Try fewer.'
              : <>No one has finished a {role.toLowerCase()} task yet. <Link to="/post">Post your own task</Link> and graduates will do it to show what they can do.</>}
          </p>
          {!tools.length && elsewhere.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="mr-1 text-sm text-muted">Work in other roles</span>
              {elsewhere.map((w) => (
                <button key={w.role} onClick={() => setParams({ role: w.role })}
                  className="press min-h-10 cursor-pointer rounded-full border border-line-strong bg-white px-3.5 text-sm text-ink">
                  {w.role} <span className="text-muted">· {w.grads}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col gap-3">
        {rows.map((r) => (
          <Link key={r.grad_id} to={`/browse/${r.grad_id}?role=${encodeURIComponent(role)}`}
            className="press flex flex-wrap items-center gap-6 rounded-xl border border-line bg-white p-5 text-ink no-underline hover:border-line-strong hover:text-ink">
            <Bars />
            <div className="flex min-w-0 flex-[999_1_320px] flex-col gap-1">
              <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                <span className="text-lg font-semibold">{r.full_name}</span>
                {isNew(r) && <span className="rounded-full bg-brand-soft px-2 py-0.5 text-xs font-semibold uppercase tracking-[0.04em] text-brand">New work</span>}
                <span className="text-sm text-muted">{[r.course, r.institution, r.grad_year].filter(Boolean).join(' · ')}</span>
              </div>
              <span className="text-ink-2">{r.latest_title} · {r.tasks_done} {r.tasks_done === 1 ? 'task' : 'tasks'} done</span>
              <span className="text-sm text-muted">{r.latest_strengths ?? r.latest_summary}</span>
              {r.tools.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {r.tools.map((x) => (
                    <span key={x} className={`rounded-full px-2.5 py-0.5 text-[13px] ${tools.some((t) => t.toLowerCase() === x.toLowerCase()) ? 'bg-brand-soft font-semibold text-brand' : 'bg-ground text-ink-2'}`}>{x}</span>
                  ))}
                </div>
              )}
            </div>
            <div className="flex shrink-0 gap-5 text-sm text-muted">
              <span>{r.views} views</span>
              <span className="flex items-center gap-1.5">
                <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M7 10v11H4V10h3zm0 0 4-8a2 2 0 0 1 3 2l-1 5h6a2 2 0 0 1 2 2.3l-1.4 8A2 2 0 0 1 17.6 21H7" /></svg>
                {r.thumbs}
                <span className="sr-only">thumbs up</span>
              </span>
            </div>
          </Link>
        ))}
      </div>
    </RecruiterLayout>
  )
}
