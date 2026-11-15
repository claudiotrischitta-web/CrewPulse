import { HeartPulse, Info, Play, RotateCcw, Satellite, Square } from 'lucide-react'
import { ENVIRONMENTS } from '../data/environments'
import { SCENARIO } from '../engine/crew'
import { formatDelay, oneWayDelaySeconds } from '../engine/sync'
import type { Env, Viewer } from '../engine/types'
import { useStore } from '../state/store'
import { fmtDate } from '../ui/levels'
import { Seg } from './atoms'

const viewKey = (v: Viewer) => (v.role === 'astronaut' ? v.id : v.role)

export function TopBar({ demo, onDemo, onAbout }: { demo: boolean; onDemo: () => void; onAbout: () => void }) {
  const { state, dispatch } = useStore()
  const ctx = SCENARIO.days[state.day - 1]
  const e = ENVIRONMENTS[state.env]
  const delay = oneWayDelaySeconds(state.env, ctx.date)
  const views = [
    ...SCENARIO.crew.map((m) => ({ value: m.id, label: m.id, note: m.isCMO ? 'self' : undefined })),
    { value: 'cmo', label: 'CMO' },
    { value: 'ground', label: 'Flight surgeon' },
  ]
  const setView = (v: string) => dispatch({ type: 'view', viewer: v === 'cmo' || v === 'ground' ? { role: v } : { role: 'astronaut', id: v } })

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="bg-sky-100 px-3 py-1 text-center text-[11px] font-bold uppercase tracking-widest text-navy sm:px-5">Prototype · simulated data · NASA Space Apps Challenge 2026</div>
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-5 gap-y-3 px-3 py-3 sm:px-5">
        <div className="flex items-center gap-2">
          <span className="grid size-9 place-items-center rounded-lg bg-navy text-sky-300"><HeartPulse className="size-6" aria-hidden /></span>
          <div className="leading-tight">
            <div className="text-xl font-extrabold text-navy">CrewPulse</div>
            <div className="text-xs text-slate-500">Crew health · {e.place}</div>
          </div>
        </div>

        <div className="flex flex-col gap-0.5">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">View as</span>
          <Seg label="View as" value={viewKey(state.viewer)} options={views} onChange={setView} />
        </div>

        <div className="flex flex-col gap-0.5">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Mission</span>
          <Seg<Env> label="Mission environment" value={state.env} onChange={(env) => dispatch({ type: 'env', env })} options={[{ value: 'iss', label: 'ISS' }, { value: 'moon', label: 'Moon' }, { value: 'mars', label: 'Mars' }]} />
        </div>

        <label className="flex min-w-48 flex-1 flex-col gap-0.5">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Day {state.day} of {SCENARIO.meta.days} · {fmtDate(ctx.date)}</span>
          <input type="range" min={1} max={SCENARIO.meta.days} step={1} value={state.day} onChange={(ev) => dispatch({ type: 'day', day: Number(ev.target.value) })} aria-label="Scenario day" />
        </label>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-sky-300 bg-sky-50 px-2.5 py-1.5 text-sm font-semibold text-navy" title="One-way signal delay to Earth (NASA/JPL Horizons)">
            <Satellite className="size-4" aria-hidden />Earth {formatDelay(delay)}
          </span>
          <button type="button" onClick={onDemo} className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold ${demo ? 'bg-red-600 text-white' : 'bg-teal-700 text-white hover:bg-teal-800'}`}>
            {demo ? <Square className="size-4" aria-hidden /> : <Play className="size-4" aria-hidden />}{demo ? 'Stop' : '30-s tour'}
          </button>
          <button type="button" onClick={onAbout} title="What is CrewPulse? How to use this demo" aria-label="About this demo" className="rounded-lg border border-slate-300 p-2 text-slate-600 hover:bg-slate-50">
            <Info className="size-4" aria-hidden />
          </button>
          <button type="button" onClick={() => dispatch({ type: 'reset' })} title="Clear live check-ins and messages" aria-label="Reset demo data" className="rounded-lg border border-slate-300 p-2 text-slate-600 hover:bg-slate-50">
            <RotateCcw className="size-4" aria-hidden />
          </button>
        </div>
      </div>
    </header>
  )
}
