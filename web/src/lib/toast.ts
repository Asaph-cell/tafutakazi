// Small "saved" messages that pop up at the bottom of the screen.
export type Toast = { id: number; text: string }

const listeners = new Set<(t: Toast) => void>()
let next = 1

export function toast(text: string) {
  const t = { id: next++, text }
  listeners.forEach((l) => l(t))
}

export function onToast(l: (t: Toast) => void) {
  listeners.add(l)
  return () => { listeners.delete(l) }
}
