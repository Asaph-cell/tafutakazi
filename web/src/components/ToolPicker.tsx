import { useState } from 'react'

// Tap the tools you used; type anything that isn't listed.
export function ToolPicker({ suggestions, value, onChange, max = 8 }: { suggestions: string[]; value: string[]; onChange: (tools: string[]) => void; max?: number }) {
  const [custom, setCustom] = useState('')
  const has = (t: string) => value.some((v) => v.toLowerCase() === t.toLowerCase())
  const toggle = (t: string) => onChange(has(t) ? value.filter((v) => v.toLowerCase() !== t.toLowerCase()) : value.length < max ? [...value, t] : value)
  const extras = value.filter((v) => !suggestions.some((s) => s.toLowerCase() === v.toLowerCase()))

  function addCustom() {
    const t = custom.trim()
    if (t && !has(t) && value.length < max) onChange([...value, t])
    setCustom('')
  }

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex flex-wrap gap-2">
        {[...suggestions, ...extras].map((t) => {
          const on = has(t)
          return (
            <button key={t} type="button" aria-pressed={on} onClick={() => toggle(t)}
              className={`press min-h-10 cursor-pointer rounded-full border px-3.5 text-sm ${on ? 'border-brand bg-brand text-white' : 'border-line-strong bg-white text-ink'}`}>
              {on ? '✓ ' : ''}{t}
            </button>
          )
        })}
      </div>
      <div className="flex gap-2">
        <label htmlFor="custom-tool" className="sr-only">Another tool</label>
        <input id="custom-tool" value={custom} onChange={(e) => setCustom(e.target.value)} maxLength={30}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustom() } }}
          placeholder="Another tool" className="min-h-10 min-w-0 flex-1 rounded-[10px] border border-line-strong bg-white px-3 text-[15px]" />
        <button type="button" onClick={addCustom} disabled={!custom.trim()}
          className="press min-h-10 cursor-pointer rounded-[10px] border border-line-strong bg-white px-3.5 text-sm font-semibold disabled:opacity-50">Add</button>
      </div>
    </div>
  )
}
