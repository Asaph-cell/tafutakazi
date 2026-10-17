import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { RecruiterLayout } from '../../components/RecruiterLayout'
import { SectionTitle } from '../../components/GradLayout'
import { Button, Notice, SkeletonPage } from '../../components/ui'
import { CompanyInviteCard } from '../../components/InviteCards'
import { OtherWorkList, useGradLinks } from '../../components/OtherWork'
import { useAuth } from '../../lib/auth'
import { minutesLabel } from '../../lib/grad'
import { taskSource, useGradWork, useRecruiter, videoEmbed, type WorkItem } from '../../lib/recruiter'
import { supabase } from '../../lib/supabase'

// The viewer's name and the date across the preview, so a leaked screenshot can be traced.
function Watermark({ text }: { text: string }) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden select-none">
      <div className="absolute -inset-1/2 flex rotate-[-24deg] flex-wrap content-start gap-x-16 gap-y-14 opacity-[0.13]">
        {Array.from({ length: 60 }, (_, k) => (
          <span key={k} className="whitespace-nowrap text-sm font-semibold text-ink">{text}</span>
        ))}
      </div>
    </div>
  )
}

function Preview({ path, stamp }: { path: string; stamp: string }) {
  const { data: url } = useQuery({
    queryKey: ['preview-url', path],
    queryFn: async () => (await supabase.storage.from('previews').createSignedUrl(path, 900)).data?.signedUrl ?? null,
    staleTime: 600_000,
  })
  if (!url) return <div className="aspect-[4/3] w-full animate-pulse rounded-xl bg-[#EEEEE9]" />
  const isPdf = path.toLowerCase().endsWith('.pdf')
  return (
    <div className="relative overflow-hidden rounded-xl border border-line bg-white" onContextMenu={(e) => e.preventDefault()}>
      {isPdf
        ? <iframe title="Preview of the work" src={`${url}#toolbar=0&navpanes=0`} className="block h-[560px] w-full border-0" />
        : <img src={url} alt="Preview of the work" draggable={false} className="block w-full" />}
      <Watermark text={stamp} />
    </div>
  )
}

function Video({ url }: { url: string }) {
  const embed = videoEmbed(url)
  if (!embed) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer"
        className="press flex aspect-video w-full items-center justify-center rounded-xl bg-[#1C1F1D] font-semibold text-white no-underline hover:text-white">
        Watch the video ↗
      </a>
    )
  }
  return (
    <iframe title="Video explaining the work" src={embed} allow="fullscreen; picture-in-picture" allowFullScreen
      className="aspect-video w-full rounded-xl border-0 bg-[#1C1F1D]" />
  )
}

function ThumbIcon() {
  return <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M7 10v11H4V10h3zm0 0 4-8a2 2 0 0 1 3 2l-1 5h6a2 2 0 0 1 2 2.3l-1.4 8A2 2 0 0 1 17.6 21H7" /></svg>
}

export default function GradWorkPage() {
  const { gradId = '' } = useParams()
  const [params] = useSearchParams()
  const backRole = params.get('role')
  const { session } = useAuth()
  const { data: me } = useRecruiter()
  const queryClient = useQueryClient()
  const { data: work, isLoading } = useGradWork(gradId)
  const { data: links } = useGradLinks(gradId)
  const [selected, setSelected] = useState<string | null>(null)
  const [comment, setComment] = useState('')
  const [workLink, setWorkLink] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [readAll, setReadAll] = useState(false)
  const logged = useRef(new Set<string>())

  const subs = work?.submissions ?? []
  const s: WorkItem | undefined = subs.find((x) => x.id === selected) ?? subs.find((x) => x.task_role === backRole) ?? subs[0]

  useEffect(() => {
    if (s && !logged.current.has(s.id)) {
      logged.current.add(s.id)
      supabase.rpc('log_view', { sub: s.id, what: 'work' })
    }
    setWorkLink(null)
    setReadAll(false)
  }, [s?.id])

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['grad-work', gradId] })
    queryClient.invalidateQueries({ queryKey: ['candidates'] })
  }

  async function toggleThumb() {
    if (!s || !session) return
    const r = s.my_thumb
      ? await supabase.from('reactions').delete().eq('submission_id', s.id).eq('recruiter_id', session.user.id)
      : await supabase.from('reactions').insert({ submission_id: s.id, recruiter_id: session.user.id })
    if (r.error) setError("Couldn't save that. Try again.")
    refresh()
  }

  async function invite() {
    if (!s || !session || !me?.company) return
    const { error } = await supabase.from('invites').insert({ submission_id: s.id, company_id: me.company.id, recruiter_id: session.user.id })
    if (error && !error.message.includes('duplicate')) return setError("Couldn't send the invite. Try again.")
    refresh()
  }

  async function openFullWork() {
    if (!s) return
    const { data } = await supabase.rpc('get_work_link', { sub: s.id })
    if (typeof data === 'string') {
      setWorkLink(data)
      window.open(data, '_blank', 'noopener')
    }
  }

  async function postComment(e: FormEvent) {
    e.preventDefault()
    if (!s || !session || !comment.trim()) return
    const { error } = await supabase.from('comments').insert({ submission_id: s.id, recruiter_id: session.user.id, body: comment.trim() })
    if (error) return setError("Couldn't post the comment. Try again.")
    setComment('')
    refresh()
  }

  if (isLoading) return <RecruiterLayout><SkeletonPage cards={2} /></RecruiterLayout>
  if (!work || !s) return <RecruiterLayout><p>This graduate's work isn't available.</p><Link to="/browse">Back to browse</Link></RecruiterLayout>

  const first = work.full_name.split(' ')[0]
  const stamp = `${session?.user.email ?? ''} · ${new Date().toLocaleDateString('en-KE')}`
  const words = s.writeup.split(/\s+/)
  const excerpt = words.length > 70 && !readAll ? words.slice(0, 70).join(' ') + '…' : s.writeup

  const actions = (
    <>
      {s.invite ? (
        <CompanyInviteCard invite={s.invite} firstName={first} email={work.email} onChange={refresh} />
      ) : work.company_paused ? (
        <Notice>Your company is paused while we look into reports from graduates, so you can't send invites. Email hello@tafutakazi.co.ke.</Notice>
      ) : (
        <Button onClick={invite}>Invite to interview</Button>
      )}
      <button onClick={toggleThumb} aria-pressed={s.my_thumb}
        className={`press flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-lg border px-4 ${s.my_thumb ? 'border-brand bg-brand-soft font-semibold text-brand' : 'border-line-strong bg-white text-ink'}`}>
        <ThumbIcon />
        {s.my_thumb ? `You gave a thumbs up · ${s.thumbs}` : `Thumbs up · ${s.thumbs}`}
      </button>
    </>
  )

  return (
    <RecruiterLayout>
      <Link to={backRole ? `/browse?role=${encodeURIComponent(backRole)}` : '/browse'} className="flex min-h-11 items-center self-start text-[15px] no-underline">
        ← {backRole ?? 'Browse'}
      </Link>

      <div className="-mt-4 flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="m-0 text-[30px] font-bold leading-tight tracking-[-0.03em] sm:text-[36px]">{work.full_name}</h1>
          <span className="text-muted">Fresh graduate · {[work.course, work.institution, work.grad_year].filter(Boolean).join(', ')}</span>
        </div>
        <span className="text-sm text-muted">{s.views} views of this work</span>
      </div>

      {subs.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Their tasks">
          {subs.map((x) => (
            <button key={x.id} aria-pressed={x.id === s.id} onClick={() => setSelected(x.id)}
              className={`press min-h-11 shrink-0 cursor-pointer whitespace-nowrap rounded-full border px-4 text-sm ${x.id === s.id ? 'border-ink bg-ink text-white' : 'border-line-strong bg-white text-ink'}`}>
              {x.task_title}
            </button>
          ))}
        </div>
      )}

      {error && <Notice>{error}</Notice>}

      <div className="flex flex-wrap items-start gap-8">
        <div className="flex min-w-0 flex-[999_1_560px] flex-col gap-7">
          <Video url={s.video_url} />

          <section className="flex flex-col gap-2">
            <SectionTitle>The task</SectionTitle>
            <p className="m-0 text-[17px] font-semibold">{s.task_title}</p>
            <span className="text-sm text-muted">{taskSource(s)} · {minutesLabel(s.task_minutes)}</span>
            <details>
              <summary className="cursor-pointer text-[15px] text-brand">Read the full task</summary>
              <div className="mt-2 whitespace-pre-line leading-relaxed text-ink-2">{s.task_instructions}</div>
            </details>
          </section>

          <section className="flex flex-col gap-3">
            <SectionTitle>The work</SectionTitle>
            <p className="m-0">{s.summary}</p>
            {s.tools?.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {s.tools.map((x) => <span key={x} className="rounded-full border border-line bg-white px-2.5 py-0.5 text-[13px] text-ink-2">{x}</span>)}
              </div>
            )}
            {s.preview_path ? <Preview path={s.preview_path} stamp={stamp} /> : <p className="m-0 text-muted">No preview.</p>}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-white px-4 py-3">
              <span>Full work</span>
              {s.invited
                ? <button onClick={openFullWork} className="press min-h-10 cursor-pointer border-0 bg-transparent font-semibold text-brand underline">Open</button>
                : <span className="text-sm text-muted">Link appears when you invite {first} to interview</span>}
            </div>
            {workLink && <span className="break-all text-sm text-muted">{workLink}</span>}
          </section>

          <section className="flex flex-col gap-2">
            <SectionTitle>How {first} did it · {s.word_count} words</SectionTitle>
            <p className="m-0 whitespace-pre-line leading-relaxed">{excerpt}</p>
            {words.length > 70 && (
              <button onClick={() => setReadAll(!readAll)} className="press min-h-11 cursor-pointer self-start border-0 bg-transparent p-0 text-[15px] text-brand">
                {readAll ? 'Show less' : `Read all ${s.word_count} words`}
              </button>
            )}
          </section>

          {s.strengths && (
            <section className="flex flex-col gap-3 rounded-xl border border-line bg-white p-5">
              <SectionTitle>Honest verdict</SectionTitle>
              <div className="flex flex-wrap gap-5">
                <div className="flex flex-[1_1_240px] flex-col gap-1"><span className="font-semibold">Strong</span><span>{s.strengths}</span></div>
                <div className="flex flex-[1_1_240px] flex-col gap-1"><span className="font-semibold">Could improve</span><span>{s.improve}</span></div>
              </div>
            </section>
          )}

          {links && links.length > 0 && (
            <section className="flex flex-col gap-3">
              <SectionTitle>Other work by {first}</SectionTitle>
              <OtherWorkList links={links} />
              <span className="text-[13px] text-muted">Added by {first}, not checked by Tafutakazi.</span>
            </section>
          )}
        </div>

        <aside className="flex min-w-0 flex-[1_1_280px] flex-col gap-4 rounded-xl border border-line bg-white p-5 lg:sticky lg:top-6">
          {actions}
          <form onSubmit={postComment} className="flex flex-col gap-2 border-t border-[#EEEEE9] pt-4">
            <label htmlFor="comment" className="font-semibold">Leave a comment</label>
            <textarea id="comment" rows={4} maxLength={1000} value={comment} onChange={(e) => setComment(e.target.value)}
              placeholder="What stood out, or what to improve" className="w-full resize-y rounded-lg border border-line-strong p-3 text-base" />
            <Button type="submit" variant="outline" disabled={!comment.trim()} className="min-h-11 self-start">Post</Button>
            <span className="text-[13px] text-muted">{first} sees your comment and company name.</span>
          </form>
          {s.my_comments.map((c) => (
            <div key={c.id} className="flex flex-col gap-1 rounded-lg bg-ground p-3">
              <span className="text-[13px] text-muted">You · {new Date(c.created_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })}</span>
              <span>{c.body}</span>
            </div>
          ))}
        </aside>
      </div>
    </RecruiterLayout>
  )
}
