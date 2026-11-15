import type { Level } from '../engine/types'

/** One visual language for status everywhere: colour, plus a label so colour is never the only cue. */
export const LEVEL_UI: Record<Level, { label: string; hint: string; chip: string; card: string; dot: string; text: string }> = {
  ok: {
    label: 'No flags', hint: 'Within your baseline',
    chip: 'bg-emerald-50 text-emerald-800 border-emerald-200', card: 'border-slate-200 bg-white', dot: 'bg-emerald-500', text: 'text-emerald-700',
  },
  monitor: {
    label: 'Monitor', hint: 'You can manage this yourself',
    chip: 'bg-amber-50 text-amber-900 border-amber-300', card: 'border-amber-300 bg-amber-50', dot: 'bg-amber-500', text: 'text-amber-700',
  },
  assess: {
    label: 'Assessment requested', hint: 'See the CMO',
    chip: 'bg-orange-100 text-orange-900 border-orange-300', card: 'border-orange-400 bg-orange-50', dot: 'bg-orange-500', text: 'text-orange-700',
  },
  urgent: {
    label: 'Urgent', hint: 'Act now',
    chip: 'bg-red-100 text-red-900 border-red-300', card: 'border-red-400 bg-red-50', dot: 'bg-red-600', text: 'text-red-700',
  },
  incomplete: {
    label: 'Check-in incomplete', hint: 'No check-in yet today',
    chip: 'bg-slate-100 text-slate-700 border-slate-300', card: 'border-slate-200 bg-white', dot: 'bg-slate-400', text: 'text-slate-500',
  },
}

export const fmtDate = (iso: string, opts: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', { ...opts, timeZone: 'UTC' })
