import { useEffect, useRef, useState } from 'react'

// Unfinished forms are kept on this device, so leaving halfway doesn't lose the work.
// Drafts belong to one account, last 30 days, and are wiped when that person logs out
// (important on shared and cyber café computers).

const PREFIX = 'tafutakazi-draft:'
const MAX_AGE = 30 * 24 * 60 * 60 * 1000

type Stored<T> = { at: number; value: T }

function read<T>(key: string): Stored<T> | null {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    if (!raw) return null
    const d = JSON.parse(raw) as Stored<T>
    if (Date.now() - d.at > MAX_AGE) {
      localStorage.removeItem(PREFIX + key)
      return null
    }
    return d
  } catch {
    return null
  }
}

export function clearDraft(key: string) {
  try { localStorage.removeItem(PREFIX + key) } catch { /* storage blocked */ }
}

// Called on log out.
export function clearAllDrafts() {
  try {
    Object.keys(localStorage).filter((k) => k.startsWith(PREFIX)).forEach((k) => localStorage.removeItem(k))
  } catch { /* storage blocked */ }
}

// key: null until we know whose draft it is. ready: true once the form has its starting values
// (for example an earlier submission loaded from the server), so the draft goes on top of them.
// isEmpty: drafts that are still blank aren't kept.
export function useDraft<T>({ key, value, ready, restore, isEmpty }: {
  key: string | null
  value: T
  ready: boolean
  restore: (v: T) => void
  isEmpty: (v: T) => boolean
}) {
  const [restoredAt, setRestoredAt] = useState<number | null>(null)
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const loaded = useRef<string | null>(null)
  const restoreRef = useRef(restore)
  restoreRef.current = restore

  // Bring the draft back once.
  useEffect(() => {
    if (!key || !ready || loaded.current === key) return
    loaded.current = key
    const d = read<T>(key)
    if (d) {
      restoreRef.current(d.value)
      setRestoredAt(d.at)
    }
  }, [key, ready])

  // Save shortly after each change.
  const json = JSON.stringify(value)
  useEffect(() => {
    if (!key || loaded.current !== key) return
    const t = setTimeout(() => {
      try {
        if (isEmpty(value)) localStorage.removeItem(PREFIX + key)
        else {
          localStorage.setItem(PREFIX + key, JSON.stringify({ at: Date.now(), value }))
          setSavedAt(Date.now())
        }
      } catch { /* storage full or blocked: the form still works */ }
    }, 600)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, json])

  return {
    restoredAt,
    savedAt,
    clear: () => {
      if (key) clearDraft(key)
      setRestoredAt(null)
      setSavedAt(null)
    },
  }
}
