import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { REFERENCES } from '../data/references'
import type { Level } from '../engine/types'
import { LEVEL_UI } from '../ui/levels'

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-xl border border-slate-200 bg-white p-4 shadow-sm ${className}`}>{children}</section>
}

export function SectionTitle({ icon: Icon, title, aside }: { icon: LucideIcon; title: string; aside?: ReactNode }) {
  return (
    <div className="mb-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
      <h2 className="flex items-center gap-2 text-base font-bold text-navy">
        <Icon className="size-5 shrink-0" aria-hidden />
        {title}
      </h2>
      {aside && <div className="text-xs text-slate-500">{aside}</div>}
    </div>
  )
}

export function LevelChip({ level, label, className = '' }: { level: Level; label?: string; className?: string }) {
  const ui = LEVEL_UI[level]
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${ui.chip} ${className}`}>
      <span className={`size-2 rounded-full ${ui.dot}`} aria-hidden />
      {label ?? ui.label}
    </span>
  )
}

/** A value with its label, used in the tile rows of each panel. */
export function Tile({ label, value, unit, note, tone = 'slate' }: { label: string; value: ReactNode; unit?: string; note?: ReactNode; tone?: 'slate' | 'amber' | 'red' | 'emerald' }) {
  const tones = { slate: 'border-slate-200', amber: 'border-amber-300 bg-amber-50', red: 'border-red-300 bg-red-50', emerald: 'border-emerald-200' }
  return (
    <div className={`rounded-lg border p-3 ${tones[tone]}`}>
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-0.5 text-xl font-bold text-navy">
        {value}
        {unit && <span className="ml-1 text-sm font-medium text-slate-500">{unit}</span>}
      </div>
      {note && <div className="mt-0.5 text-xs text-slate-500">{note}</div>}
    </div>
  )
}

/** Source line: every number on screen can be traced back. */
export function Refs({ ids, className = '' }: { ids: string[]; className?: string }) {
  const refs = ids.map((id) => REFERENCES[id]).filter(Boolean)
  if (!refs.length) return null
  return (
    <p className={`text-xs text-slate-500 ${className}`}>
      <span className="font-semibold">Source: </span>
      {refs.map((r, i) => (
        <span key={r.short}>
          {i > 0 && '; '}
          <a href={r.url} target="_blank" rel="noreferrer" className="underline decoration-slate-300 underline-offset-2 hover:text-navy">
            {r.short}
          </a>
        </span>
      ))}
    </p>
  )
}

export function Seg<T extends string>({ value, options, onChange, label }: { value: T; options: { value: T; label: string; note?: string }[]; onChange: (v: T) => void; label: string }) {
  return (
    <div role="group" aria-label={label} className="inline-flex flex-wrap rounded-lg border border-slate-300 bg-white p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={o.value === value}
          onClick={() => onChange(o.value)}
          className={`rounded-md px-2.5 py-1.5 text-sm font-semibold transition-colors ${o.value === value ? 'bg-navy text-white' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          {o.label}
          {o.note && <span className={`ml-1 text-[10px] font-medium ${o.value === value ? 'text-sky-200' : 'text-slate-400'}`}>{o.note}</span>}
        </button>
      ))}
    </div>
  )
}

export function Button({ children, onClick, kind = 'primary', disabled, className = '', type = 'button' }: { children: ReactNode; onClick?: () => void; kind?: 'primary' | 'ghost' | 'teal'; disabled?: boolean; className?: string; type?: 'button' | 'submit' }) {
  const kinds = {
    primary: 'bg-navy text-white hover:bg-blue-900',
    teal: 'bg-teal-700 text-white hover:bg-teal-800',
    ghost: 'border border-slate-300 bg-white text-navy hover:bg-slate-50',
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40 ${kinds[kind]} ${className}`}>
      {children}
    </button>
  )
}
