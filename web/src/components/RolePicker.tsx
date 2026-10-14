import { useState } from 'react'
import { ROLES } from '../lib/lists'

// Search box with popular suggestions; anything not listed can be added as typed.
export function RolePicker({ value, onChange }: { value: string[]; onChange: (roles: string[]) => void }) {
  const [q, setQ] = useState('')
  const low = q.trim().toLowerCase()
  const pool = ROLES.filter((r) => !value.includes(r))
  const matches = low ? pool.filter((r) => r.toLowerCase().includes(low)) : pool
  const exact = [...ROLES, ...value].some((r) => r.toLowerCase() === low)
  const add = (r: string) => {
    onChange([...value, r])
    setQ('')
  }

  return (
    <div className="flex flex-col gap-2.5">
      <label htmlFor="roles" className="font-semibold">Roles you hire for</label>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((r) => (
            <span key={r} className="inline-flex items-center gap-0.5 rounded-full bg-ink pl-3.5 text-sm text-white">
              {r}
              <button
                type="button"
                aria-label={`Remove ${r}`}
                onClick={() => onChange(value.filter((x) => x !== r))}
                className="press flex h-10 w-10 cursor-pointer items-center justify-center border-0 bg-transparent text-white"
              >
                <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18" /></svg>
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="relative">
        <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5C5C57" strokeWidth="2" strokeLinecap="round" className="absolute left-3.5 top-[15px]"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
        <input
          id="roles"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              if (matches[0]) add(matches[0])
              else if (low && !exact) add(q.trim())
            }
          }}
          placeholder="Type a role, e.g. accountant"
          autoComplete="off"
          className="min-h-[48px] w-full rounded-[10px] border border-line-strong bg-white pl-[42px] pr-3 text-base"
        />
      </div>

      <span className="text-[13px] text-muted">{low ? (matches.length ? 'Matching roles' : 'No match in our list') : 'Popular'}</span>
      <div className="flex flex-wrap gap-2">
        {matches.slice(0, 6).map((r) => (
          <button key={r} type="button" onClick={() => add(r)} className="press min-h-10 cursor-pointer rounded-full border border-line-strong bg-white px-3.5 text-sm text-ink">
            + {r}
          </button>
        ))}
        {low && !exact && (
          <button type="button" onClick={() => add(q.trim())} className="press min-h-10 cursor-pointer rounded-full border border-dashed border-brand bg-white px-3.5 text-sm font-semibold text-brand">
            + Add "{q.trim()}"
          </button>
        )}
      </div>
    </div>
  )
}
