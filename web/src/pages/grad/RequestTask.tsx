import { useEffect, useState, type FormEvent } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { GradLayout, SectionTitle } from '../../components/GradLayout'
import { ToolPicker } from '../../components/ToolPicker'
import { Button, Notice, Select } from '../../components/ui'
import { useAuth } from '../../lib/auth'
import { useGrad } from '../../lib/grad'
import { ROLES, toolsFor } from '../../lib/lists'
import { supabase } from '../../lib/supabase'

type Request = {
  id: string
  role: string
  tools: string[]
  details: string
  status: 'open' | 'done' | 'declined'
  task_id: string | null
  admin_note: string | null
  created_at: string
}

export function useMyRequests() {
  const { session } = useAuth()
  return useQuery({
    queryKey: ['my-requests', session?.user.id],
    enabled: Boolean(session),
    queryFn: async () => {
      const { data, error } = await supabase.from('task_requests').select('*').order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as Request[]
    },
  })
}

export default function RequestTask() {
  const { session } = useAuth()
  const queryClient = useQueryClient()
  const { data: grad } = useGrad()
  const { data: requests } = useMyRequests()
  const [role, setRole] = useState('')
  const [tools, setTools] = useState<string[]>([])
  const [details, setDetails] = useState('')
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (grad && !role) setRole(grad.track)
  }, [grad, role])

  const open = (requests ?? []).filter((r) => r.status === 'open').length

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setBusy(true)
    const { error } = await supabase.from('task_requests').insert({ grad_id: session!.user.id, role, tools, details: details.trim() })
    setBusy(false)
    if (error) return setError(error.message.includes('up to 3') ? error.message : "Couldn't send your request. Try again.")
    setDetails('')
    setTools([])
    setSent(true)
    queryClient.invalidateQueries({ queryKey: ['my-requests'] })
  }

  async function remove(id: string) {
    await supabase.from('task_requests').delete().eq('id', id)
    queryClient.invalidateQueries({ queryKey: ['my-requests'] })
  }

  return (
    <GradLayout narrow>
      <Link to="/tasks" className="flex min-h-11 items-center self-start text-[15px] no-underline">← Tasks</Link>
      <div className="-mt-4 flex flex-col gap-2">
        <h1 className="m-0 text-[28px] font-bold leading-tight tracking-[-0.03em] sm:text-[34px]">Request a task</h1>
        <p className="m-0 text-ink-2">
          Want to show a skill there's no task for yet? Tell us. Tafutakazi writes practice tasks from the best
          requests, and everyone can then do them.
        </p>
      </div>

      {sent && <Notice tone="info">Request sent. We'll show it here when it's answered, and on My work when your task is live.</Notice>}

      {open >= 3 ? (
        <Notice tone="info">You have 3 open requests. Wait for one to be answered, or remove one below to ask for something else.</Notice>
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col gap-5 rounded-2xl border border-line bg-white p-5">
          <Select id="role" label="Which role is it for?" value={role} onChange={(e) => { setRole(e.target.value); setTools([]) }} required>
            {ROLES.map((r) => <option key={r}>{r}</option>)}
          </Select>

          <div className="flex flex-col gap-2">
            <span className="font-semibold">Tools you want to show <span className="font-normal text-muted">(optional)</span></span>
            <ToolPicker suggestions={toolsFor(role)} value={tools} onChange={setTools} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="details" className="font-semibold">What kind of task?</label>
            <textarea id="details" rows={5} required minLength={10} maxLength={600} value={details} onChange={(e) => setDetails(e.target.value)}
              placeholder="e.g. A Power BI dashboard with sales targets vs actuals, like a regional sales manager would use. I want to show I can build measures and drill-downs."
              className="w-full resize-y rounded-[10px] border border-line-strong p-3 text-base leading-relaxed" />
            <span className="text-[13px] text-muted">Say what you want to prove and for what kind of job. The more specific, the better the task.</span>
          </div>

          {error && <Notice>{error}</Notice>}
          <Button type="submit" disabled={busy || details.trim().length < 10} className="self-start">{busy ? 'Sending…' : 'Send request'}</Button>
        </form>
      )}

      {(requests?.length ?? 0) > 0 && (
        <section className="flex flex-col gap-2.5">
          <SectionTitle>Your requests</SectionTitle>
          {requests!.map((r) => (
            <div key={r.id} className="flex flex-col gap-1.5 rounded-xl border border-line bg-white p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="font-semibold">{r.role}{r.tools.length ? ` · ${r.tools.join(', ')}` : ''}</span>
                <span className={`text-sm font-semibold ${r.status === 'done' ? 'text-brand' : r.status === 'declined' ? 'text-muted' : 'text-ink-2'}`}>
                  {r.status === 'done' ? 'Task is live' : r.status === 'declined' ? 'Not this time' : 'Waiting'}
                </span>
              </div>
              <span className="text-[15px] text-ink-2">{r.details}</span>
              {r.admin_note && <span className="text-sm text-muted">Tafutakazi: {r.admin_note}</span>}
              <div className="flex gap-4">
                {r.status === 'done' && r.task_id && <Link to={`/tasks/${r.task_id}`} className="text-[15px] font-semibold">Start the task →</Link>}
                {r.status === 'open' && (
                  <button onClick={() => remove(r.id)} className="press min-h-10 cursor-pointer border-0 bg-transparent p-0 text-sm text-muted underline">Remove</button>
                )}
              </div>
            </div>
          ))}
        </section>
      )}
    </GradLayout>
  )
}
