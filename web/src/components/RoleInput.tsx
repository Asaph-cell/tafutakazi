import type { InputHTMLAttributes } from 'react'
import { ROLES } from '../lib/lists'
import { Field } from './ui'

// Any role can be typed; common ones are suggested as you type.
export function RoleInput({ id, label, extra = [], hint = 'Pick a suggestion or type any role.', ...props }:
  InputHTMLAttributes<HTMLInputElement> & { id: string; label: string; extra?: string[]; hint?: string }) {
  return (
    <>
      <Field id={id} label={label} list={`${id}-options`} autoComplete="off" minLength={2} maxLength={60}
        placeholder="Start typing, e.g. Data Analyst" hint={hint} {...props} />
      <datalist id={`${id}-options`}>
        {[...new Set([...extra, ...ROLES])].map((r) => <option key={r} value={r} />)}
      </datalist>
    </>
  )
}
