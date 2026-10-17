import { useEffect, useState, type FormEvent } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { AdminLayout } from '../../components/AdminLayout'
import { SectionTitle } from '../../components/GradLayout'
import { Button, Field, Notice, Select, SkeletonPage } from '../../components/ui'
import { normRole } from '../../lib/lists'
import { RoleInput } from '../../components/RoleInput'
import { supabase } from '../../lib/supabase'

type TaskRow = { id: string; title: string; role: string; instructions: string; minutes_estimate: number; status: string; company_id: string | null }
type FileRow = { id: string; variant: string; storage_path: string | null; public_url: string | null; file_name: string }

const VARIANTS = ['A', 'B', 'C'] as const
const MINUTES = [30, 60, 90, 120, 150, 180, 210, 240]

// Create or edit a Tafutakazi practice task. Company tasks open read-only.
export default function AdminTaskForm() {
  const { id } = useParams()
  const requestId = useSearchParams()[0].get('request')
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [files, setFiles] = useState<Partial<Record<(typeof VARIANTS)[number], File>>>({})
  const [instructions, setInstructions] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['admin-task', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const [t, f] = await Promise.all([
        supabase.from('tasks').select('id, title, role, instructions, minutes_estimate, status, company_id').eq('id', id!).single(),
        supabase.from('task_files').select('id, variant, storage_path, public_url, file_name').eq('task_id', id!).order('variant'),
      ])
      if (t.error) throw t.error
      return { task: t.data as TaskRow, files: (f.data ?? []) as FileRow[] }
    },
  })

  // Creating a task from a graduate's request: show it and pre-fill the role.
  const { data: request } = useQuery({
    queryKey: ['admin-request', requestId],
    enabled: Boolean(requestId) && !id,
    queryFn: async () => {
      const { data } = await supabase.from('task_requests').select('id, role, tools, details').eq('id', requestId!).single()
      return data as { id: string; role: string; tools: string[]; details: string } | null
    },
  })

  useEffect(() => {
    if (data) setInstructions(data.task.instructions)
  }, [data])

  const task = data?.task
  const readOnly = Boolean(task?.company_id)

  async function removeFile(f: FileRow) {
    if (f.storage_path) await supabase.storage.from('task-files').remove([f.storage_path])
    await supabase.from('task_files').delete().eq('id', f.id)
    queryClient.invalidateQueries({ queryKey: ['admin-task', id] })
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    const f = new FormData(e.currentTarget)
    const fields = {
      title: String(f.get('title')).trim(),
      role: normRole(String(f.get('role'))),
      instructions: instructions.trim(),
      minutes_estimate: Number(f.get('minutes')),
      status: String(f.get('status')),
    }
    if (fields.instructions.length < 20) return setError('Write the instructions out in full (at least a few sentences).')
    setBusy(true)
    const saved = id
      ? await supabase.from('tasks').update(fields).eq('id', id).select('id').single()
      : await supabase.from('tasks').insert(fields).select('id').single()
    if (saved.error) {
      setBusy(false)
      return setError(saved.error.message)
    }
    const taskId = saved.data.id as string
    if (request) {
      await supabase.from('task_requests').update({ status: 'done', task_id: taskId, answered_at: new Date().toISOString() }).eq('id', request.id)
    }

    for (const v of VARIANTS) {
      const file = files[v]
      if (!file) continue
      const path = `practice/${taskId}/${v}-${file.name.replace(/[^\w.-]+/g, '-')}`
      const up = await supabase.storage.from('task-files').upload(path, file, { upsert: true, contentType: file.type || undefined })
      if (up.error) {
        setBusy(false)
        return setError(`Saved the task, but version ${v} didn't upload: ${up.error.message}`)
      }
      const old = data?.files.filter((x) => x.variant === v) ?? []
      for (const o of old) await removeFile(o)
      await supabase.from('task_files').insert({ task_id: taskId, variant: v, storage_path: path, file_name: file.name, size_bytes: file.size })
    }
    setBusy(false)
    await queryClient.invalidateQueries()
    navigate('/admin')
  }

  if (id && isLoading) return <AdminLayout><SkeletonPage cards={2} /></AdminLayout>

  return (
    <AdminLayout>
      <Link to="/admin" className="flex min-h-11 items-center self-start no-underline">← Tasks</Link>
      <h1 className="-mt-4 m-0 text-[32px] font-bold tracking-[-0.03em]">
        {readOnly ? task!.title : id ? 'Edit practice task' : 'New practice task'}
      </h1>

      {readOnly ? (
        <>
          <Notice tone="info">This is a company task. You can approve, pause or turn it off from the task list; companies edit their own tasks.</Notice>
          <div className="whitespace-pre-line rounded-xl border border-line bg-white p-5 leading-relaxed">{task!.instructions}</div>
        </>
      ) : (
        <form onSubmit={onSubmit} className="flex max-w-[760px] flex-col gap-5">
          {request && (
            <div className="flex flex-col gap-1 rounded-xl border border-brand bg-brand-soft p-4">
              <span className="text-sm font-semibold text-brand">Answering a graduate's request · {request.role}{request.tools.length ? ` · ${request.tools.join(', ')}` : ''}</span>
              <span className="text-ink-2">"{request.details}"</span>
              <span className="text-[13px] text-muted">When you publish, the request is marked answered and the graduate sees the new task.</span>
            </div>
          )}
          <Field id="title" name="title" label="Title" defaultValue={task?.title} required minLength={3} maxLength={120}
            placeholder="e.g. SACCO loan arrears report" />
          <div className="flex flex-wrap gap-4">
            <div className="flex-[2_1_240px]">
              <RoleInput id="role" name="role" label="Role it's for" defaultValue={task?.role ?? request?.role ?? ''} key={request?.id ?? 'role'} required />
            </div>
            <div className="flex-[1_1_160px]">
              <Select id="minutes" name="minutes" label="Time it should take" defaultValue={String(task?.minutes_estimate ?? 180)}>
                {MINUTES.map((m) => <option key={m} value={m}>{m < 60 ? `${m} minutes` : `${m / 60} hours`}</option>)}
              </Select>
            </div>
            <div className="flex-[1_1_160px]">
              <Select id="status" name="status" label="Show to graduates?" defaultValue={task?.status === 'off' ? 'off' : 'live'}>
                <option value="live">Yes, live</option>
                <option value="off">No, keep it off</option>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="instructions" className="font-semibold">Instructions</label>
            <textarea id="instructions" rows={14} value={instructions} onChange={(e) => setInstructions(e.target.value)} required
              placeholder={'The situation: who the business is and what they need.\n\n1. First thing to do\n2. Second thing\n3. What to hand in\n\nTools they can use, and "share it as a view-only link".'}
              className="w-full resize-y rounded-[10px] border border-line-strong bg-white p-3 text-base leading-relaxed" />
            <span className="text-[13px] text-muted">Blank lines become paragraph breaks. Numbered steps work well.</span>
          </div>

          <section className="flex flex-col gap-3">
            <SectionTitle>Data files (optional)</SectionTitle>
            <span className="text-sm text-ink-2">
              Upload up to three versions of the data. Each graduate gets one version, so copied answers won't match.
              One version is fine if the task doesn't need data to differ.
            </span>
            {VARIANTS.map((v) => {
              const current = data?.files.filter((x) => x.variant === v) ?? []
              return (
                <div key={v} className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-white p-3">
                  <span className="w-20 font-semibold">Version {v}</span>
                  <span className="min-w-0 flex-1 truncate text-sm text-muted">
                    {files[v]?.name ?? (current.length ? current.map((c) => c.file_name).join(', ') : 'No file')}
                    {current.some((c) => c.public_url) && ' (built-in)'}
                  </span>
                  <label className="press flex min-h-10 cursor-pointer items-center rounded-lg border border-line-strong px-3 text-sm font-semibold">
                    <input type="file" className="sr-only" accept=".csv,.xlsx,.xls,.pdf,.zip,.json,.txt"
                      onChange={(e) => setFiles((prev) => ({ ...prev, [v]: e.target.files?.[0] }))} />
                    {current.length || files[v] ? 'Replace' : 'Upload'}
                  </label>
                  {current.map((c) => (
                    <button key={c.id} type="button" onClick={() => removeFile(c)} className="press min-h-10 cursor-pointer border-0 bg-transparent text-sm text-danger">Remove</button>
                  ))}
                </div>
              )
            })}
            <span className="text-[13px] text-muted">CSV, Excel, PDF, ZIP, JSON or text, up to 20 MB each. Never upload real customer data.</span>
          </section>

          {error && <Notice>{error}</Notice>}
          <Button type="submit" busy={busy} busyLabel="Saving…" className="self-start">{id ? 'Save changes' : 'Publish task'}</Button>
        </form>
      )}
    </AdminLayout>
  )
}
