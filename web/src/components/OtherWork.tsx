import { useState, type FormEvent } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { Button, Field } from './ui'

export type GradLink = { id: string; title: string; url: string; note: string | null }
const MAX = 5

export function useGradLinks(gradId: string | undefined) {
  return useQuery({
    queryKey: ['grad-links', gradId],
    enabled: Boolean(gradId),
    queryFn: async () => {
      const { data, error } = await supabase.from('grad_links').select('id, title, url, note').eq('grad_id', gradId!).order('created_at')
      if (error) throw error
      return (data ?? []) as GradLink[]
    },
  })
}

const host = (url: string) => {
  try { return new URL(url).hostname.replace(/^www\./, '') } catch { return url }
}

function LinkRow({ l, onRemove }: { l: GradLink; onRemove?: () => void }) {
  return (
    <div className="flex items-start justify-between gap-3 border-t border-[#EEEEE9] pt-3 first:border-0 first:pt-0">
      <a href={l.url} target="_blank" rel="noopener noreferrer nofollow" className="flex min-w-0 flex-col gap-0.5 text-ink no-underline hover:text-ink">
        <span className="font-semibold">{l.title} <span aria-hidden="true" className="text-muted">↗</span></span>
        <span className="break-all text-sm text-brand">{host(l.url)}</span>
        {l.note && <span className="text-sm text-ink-2">{l.note}</span>}
      </a>
      {onRemove && (
        <button onClick={onRemove} className="press min-h-9 shrink-0 cursor-pointer border-0 bg-transparent p-0 text-sm text-muted hover:text-danger">Remove</button>
      )}
    </div>
  )
}

// Read-only list, for recruiters.
export function OtherWorkList({ links }: { links: GradLink[] }) {
  return <div className="flex flex-col gap-3">{links.map((l) => <LinkRow key={l.id} l={l} />)}</div>
}

// The graduate's own editable list, on their profile.
export function OtherWorkEditor({ gradId }: { gradId: string }) {
  const queryClient = useQueryClient()
  const { data: links = [] } = useGradLinks(gradId)
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState('')
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['grad-links', gradId] })

  async function add(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    const f = new FormData(e.currentTarget)
    let url = String(f.get('url')).trim()
    if (!/^https?:\/\//i.test(url)) url = `https://${url}`
    if (!/^https?:\/\/[^\s.]+\.[^\s]+$/i.test(url)) return setError('That link doesn’t look right. Copy it from your browser’s address bar.')
    const { error } = await supabase.from('grad_links').insert({
      grad_id: gradId,
      title: String(f.get('title')).trim(),
      url,
      note: String(f.get('note')).trim() || null,
    })
    if (error) return setError(error.message.includes('up to 5') ? 'You can add up to 5 links. Remove one first.' : 'Couldn’t save that link. Try again.')
    setAdding(false)
    refresh()
  }

  async function remove(id: string) {
    await supabase.from('grad_links').delete().eq('id', id)
    refresh()
  }

  return (
    <div className="flex flex-col gap-4">
      {links.length === 0 && !adding && (
        <p className="m-0 text-ink-2">Done something before? A website you built, a page you ran, a project, an internship. Add a link so recruiters can see it.</p>
      )}
      {links.length > 0 && <div className="flex flex-col gap-3">{links.map((l) => <LinkRow key={l.id} l={l} onRemove={() => remove(l.id)} />)}</div>}

      {adding ? (
        <form onSubmit={add} className="flex flex-col gap-4 rounded-xl bg-ground p-4">
          <Field id="link-title" name="title" label="What is it?" placeholder="e.g. Website for my church" required minLength={3} maxLength={80} />
          <Field id="link-url" name="url" label="Link" placeholder="e.g. github.com/you/project" required maxLength={500} inputMode="url" />
          <Field id="link-note" name="note" label="What did you do? (optional)" placeholder="e.g. Designed and built it, 300 visitors a month" maxLength={160} />
          {error && <span className="text-sm text-danger">{error}</span>}
          <div className="flex gap-2">
            <Button type="submit" className="min-h-11">Add</Button>
            <Button type="button" variant="outline" onClick={() => { setAdding(false); setError('') }} className="min-h-11">Cancel</Button>
          </div>
        </form>
      ) : links.length < MAX && (
        <button onClick={() => setAdding(true)} className="press min-h-11 cursor-pointer self-start border-0 bg-transparent p-0 font-semibold text-brand">+ Add a link</button>
      )}
      <span className="text-[13px] text-muted">Only signed-in recruiters see these. Don’t link to anything private.</span>
    </div>
  )
}
