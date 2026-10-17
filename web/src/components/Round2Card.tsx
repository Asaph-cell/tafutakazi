import { useState, type FormEvent } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { Button } from './ui'

export type MyRound2 = {
  id: string; task_id: string; task_title: string; company_name: string; brief: string; questions: string[]
  due_at: string; status: 'invited' | 'submitted'; video_url: string | null; link: string | null; note: string | null
}

export function useMyRound2() {
  return useQuery({
    queryKey: ['my-round2'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('my_round2')
      if (error) throw error
      return (data ?? []) as MyRound2[]
    },
  })
}

const inputClass = 'w-full rounded-[10px] border border-line-strong bg-white p-3 text-base'
const day = (iso: string) => new Date(iso).toLocaleDateString('en-KE', { weekday: 'long', day: 'numeric', month: 'short' })

// A company moved the graduate forward: what they asked, and the answer form.
export function Round2Card({ r }: { r: MyRound2 }) {
  const queryClient = useQueryClient()
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const closed = Date.now() > new Date(r.due_at).getTime() + 86400000

  async function send(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    const f = new FormData(e.currentTarget)
    const video = String(f.get('video')).trim()
    if (!/^https?:\/\/\S+$/i.test(video)) return setError('Paste your video link, starting with https://')
    setBusy(true)
    const { error } = await supabase.rpc('respond_round2', {
      p_id: r.id, p_video: video, p_link: String(f.get('link')).trim() || null, p_note: String(f.get('note')).trim() || null,
    })
    setBusy(false)
    if (error) return setError(error.message)
    queryClient.invalidateQueries({ queryKey: ['my-round2'] })
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border-2 border-brand bg-brand-soft/40 p-4">
      <div className="flex flex-col gap-0.5">
        <span className="font-semibold text-brand">{r.company_name} moved you to round 2</span>
        <span className="text-sm text-ink-2">For your work on {r.task_title}</span>
      </div>
      <p className="m-0 whitespace-pre-line text-[15px]">{r.brief}</p>
      {r.questions?.length > 0 && (
        <div className="flex flex-col gap-1">
          <span className="text-sm font-semibold">Answer these in your video:</span>
          {r.questions.map((q) => <span key={q} className="text-[15px]">• {q}</span>)}
        </div>
      )}

      {r.status === 'submitted' ? (
        <span className="font-semibold text-brand">✓ Sent. {r.company_name} has been told.</span>
      ) : closed ? (
        <span className="text-sm text-muted">This round closed on {day(r.due_at)}.</span>
      ) : (
        <form onSubmit={send} className="flex flex-col gap-3">
          <span className="text-sm text-muted">Due {day(r.due_at)}. Keep it short: under 2 hours of work.</span>
          <label className="flex flex-col gap-1.5 text-sm font-semibold">
            Your video link
            <input name="video" type="url" inputMode="url" required placeholder="YouTube (unlisted), Loom or Google Drive" className={inputClass} />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-semibold">
            A file or link <span className="font-normal text-muted">(optional)</span>
            <input name="link" type="url" inputMode="url" placeholder="e.g. your slides" className={inputClass} />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-semibold">
            A note <span className="font-normal text-muted">(optional)</span>
            <textarea name="note" rows={2} maxLength={1000} className={inputClass} />
          </label>
          {error && <span className="text-sm text-danger">{error}</span>}
          <Button type="submit" busy={busy} busyLabel="Sending…" className="self-start">Send my answer</Button>
        </form>
      )}
    </div>
  )
}
