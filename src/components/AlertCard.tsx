import { ChevronDown, CircleAlert, Lock, ShieldAlert, TriangleAlert } from 'lucide-react'
import { useState } from 'react'
import type { Alert } from '../engine/types'
import { LEVEL_UI } from '../ui/levels'
import { LevelChip, Refs } from './atoms'

const ICON = { monitor: CircleAlert, assess: TriangleAlert, urgent: ShieldAlert }

/**
 * An alert is only useful if it explains itself: why it fired, the data behind it,
 * what to do now, when to check again and when to call for help.
 */
export function AlertCard({ alert, defaultOpen = false }: { alert: Alert; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  const ui = LEVEL_UI[alert.level]
  const Icon = alert.redacted ? Lock : ICON[alert.level]
  return (
    <article className={`rounded-xl border-2 ${ui.card}`}>
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="flex w-full items-start gap-3 rounded-xl p-3.5 text-left">
        <Icon className={`mt-0.5 size-6 shrink-0 ${ui.text}`} aria-hidden />
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-base font-bold text-navy">{alert.title}</span>
            <LevelChip level={alert.level} />
          </span>
          <span className="mt-1 block text-sm text-slate-700">{alert.why}</span>
        </span>
        <ChevronDown className={`mt-1 size-5 shrink-0 text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden />
      </button>
      {open && (
        <div className="grid gap-4 border-t border-black/10 p-3.5 text-sm md:grid-cols-2">
          <div>
            <h4 className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-500">What to do now</h4>
            <ol className="list-decimal space-y-1 pl-5 text-slate-800">
              {alert.actions.map((a) => <li key={a}>{a}</li>)}
            </ol>
          </div>
          <div className="space-y-3">
            {alert.data.length > 0 && (
              <div>
                <h4 className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-500">Data used</h4>
                <ul className="list-disc space-y-0.5 pl-5 text-slate-700">
                  {alert.data.map((d) => <li key={d}>{d}</li>)}
                </ul>
              </div>
            )}
            <p><span className="font-semibold text-slate-600">Check again: </span>{alert.recheck}</p>
            <p><span className="font-semibold text-slate-600">Call for help: </span>{alert.escalate}</p>
          </div>
          <Refs ids={alert.refs} className="md:col-span-2" />
        </div>
      )}
    </article>
  )
}
