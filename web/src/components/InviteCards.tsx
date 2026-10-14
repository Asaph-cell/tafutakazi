import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export type CompanyStatus = 'invited' | 'contacted' | 'interviewed' | 'hired' | 'not_moving_forward'
export type GradStatus = 'waiting' | 'contacted' | 'interviewed' | 'hired' | 'no_contact'

const NO_CONTACT_DAYS = 5
const daysSince = (iso: string) => (Date.now() - new Date(iso).getTime()) / 86400000

function Choice({ on, onClick, children, tone = 'plain' }: { on: boolean; onClick: () => void; children: string; tone?: 'plain' | 'good' | 'bad' }) {
  const active = tone === 'bad' ? 'border-danger bg-[#FBF1EE] text-danger' : 'border-brand bg-brand text-white'
  return (
    <button type="button" aria-pressed={on} onClick={onClick}
      className={`press min-h-10 cursor-pointer rounded-full border px-3.5 text-sm ${on ? active : 'border-line-strong bg-white text-ink'}`}>
      {on ? '✓ ' : ''}{children}
    </button>
  )
}

// The graduate's side of an invite, on My work.
export function GradInviteCard({ invite }: {
  invite: { id: string; created_at: string; company_status: CompanyStatus; grad_status: GradStatus; company: { name: string } | null }
}) {
  const queryClient = useQueryClient()
  const [error, setError] = useState('')
  const company = invite.company?.name ?? 'The company'
  const canReportNoContact = daysSince(invite.created_at) >= NO_CONTACT_DAYS
  const reportFrom = new Date(new Date(invite.created_at).getTime() + NO_CONTACT_DAYS * 86400000)

  async function set(grad_status: GradStatus) {
    setError('')
    const { error } = await supabase.from('invites').update({ grad_status }).eq('id', invite.id)
    if (error) setError(error.message)
    queryClient.invalidateQueries({ queryKey: ['my-activity'] })
  }

  if (invite.company_status === 'not_moving_forward') {
    return (
      <div className="flex flex-col gap-1 rounded-xl border border-line bg-white p-4">
        <span className="font-semibold">{company} isn't moving forward</span>
        <span className="text-sm text-ink-2">They invited you because of your work, and it stays on your profile for other recruiters. Keep going.</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl bg-brand-soft p-4">
      <div className="flex flex-col gap-0.5">
        <span className="font-semibold text-brand">{company} invited you to interview</span>
        <span className="text-sm text-ink-2">
          {invite.grad_status === 'hired'
            ? 'Congratulations on the job!'
            : invite.grad_status === 'waiting'
              ? 'Most companies get in touch within a few days. Keep doing tasks while you wait.'
              : 'Thanks for letting us know how it went.'}
        </span>
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-[13px] font-semibold text-ink-2">What happened?</span>
        <div className="flex flex-wrap gap-2">
          <Choice on={invite.grad_status === 'contacted'} onClick={() => set('contacted')}>They contacted me</Choice>
          <Choice on={invite.grad_status === 'interviewed'} onClick={() => set('interviewed')}>Interview done</Choice>
          <Choice on={invite.grad_status === 'hired'} onClick={() => set('hired')}>I got the job</Choice>
          {canReportNoContact && (
            <Choice tone="bad" on={invite.grad_status === 'no_contact'} onClick={() => set('no_contact')}>No contact yet</Choice>
          )}
        </div>
        {!canReportNoContact && invite.grad_status === 'waiting' && (
          <span className="text-[13px] text-muted">
            Haven't heard anything by {reportFrom.toLocaleDateString('en-KE', { weekday: 'long', day: 'numeric', month: 'short' })}? You can tell us here then.
          </span>
        )}
      </div>
      {error && <span className="text-sm text-danger">{error}</span>}
    </div>
  )
}

// The company's side of an invite, on the graduate's work page.
export function CompanyInviteCard({ invite, firstName, email, onChange }: {
  invite: { id: string; company_status: CompanyStatus; grad_status: GradStatus }
  firstName: string
  email: string | null
  onChange: () => void
}) {
  const [error, setError] = useState('')

  async function set(company_status: CompanyStatus) {
    setError('')
    if (company_status === 'not_moving_forward' && !window.confirm(`${firstName} will get a kind email saying you're not moving forward. Continue?`)) return
    const { error } = await supabase.from('invites').update({ company_status }).eq('id', invite.id)
    if (error) setError(error.message)
    onChange()
  }

  const gradSays: Record<GradStatus, string | null> = {
    waiting: null,
    contacted: `${firstName} says you've been in touch.`,
    interviewed: `${firstName} says the interview happened.`,
    hired: `${firstName} says they got the job.`,
    no_contact: `${firstName} says they haven't heard from you. Please get in touch.`,
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg bg-brand-soft p-3">
      <div className="flex flex-col gap-1 text-brand">
        <span className="font-semibold">You invited {firstName} to interview</span>
        {email && <a href={`mailto:${email}`} className="break-all text-[15px]">{email}</a>}
        <span className="text-[13px] text-ink-2">Contact them directly, then keep this up to date. Graduates see how many invited people each company contacts.</span>
      </div>
      {gradSays[invite.grad_status] && (
        <span className={`text-[13px] font-semibold ${invite.grad_status === 'no_contact' ? 'text-danger' : 'text-ink-2'}`}>{gradSays[invite.grad_status]}</span>
      )}
      <div className="flex flex-wrap gap-2">
        <Choice on={invite.company_status === 'contacted'} onClick={() => set('contacted')}>Contacted</Choice>
        <Choice on={invite.company_status === 'interviewed'} onClick={() => set('interviewed')}>Interviewed</Choice>
        <Choice on={invite.company_status === 'hired'} onClick={() => set('hired')}>Hired</Choice>
        <Choice tone="bad" on={invite.company_status === 'not_moving_forward'} onClick={() => set('not_moving_forward')}>Not moving forward</Choice>
      </div>
      {error && <span className="text-sm text-danger">{error}</span>}
    </div>
  )
}
