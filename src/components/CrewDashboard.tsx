import { CalendarDays, ChevronRight, Globe, UserRound, Users } from 'lucide-react'
import { useMemo } from 'react'
import { ENVIRONMENTS } from '../data/environments'
import { SCENARIO, levelFor, weekGrid } from '../engine/crew'
import { LIGHTTIME_SOURCE, formatDelay, oneWayDelaySeconds } from '../engine/sync'
import type { Viewer } from '../engine/types'
import { useCrew, useStore } from '../state/store'
import { LEVEL_UI, fmtDate } from '../ui/levels'
import { Card, LevelChip, SectionTitle } from './atoms'
import { HealthDetail } from './HealthDetail'

function GroundBanner() {
  const { state } = useStore()
  const date = SCENARIO.days[state.day - 1].date
  const delay = oneWayDelaySeconds(state.env, date)
  const e = ENVIRONMENTS[state.env]
  return (
    <Card className="border-sky-300 bg-sky-50">
      <div className="flex flex-wrap items-center gap-3">
        <Globe className="size-7 shrink-0 text-sky-800" aria-hidden />
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-bold text-navy">
            Earth ↔ {e.label}: {delay < 0.5 ? 'near real time' : `${formatDelay(delay)} one way, at least ${formatDelay(delay * 2)} for a question and its answer`}
          </h2>
          <p className="text-sm text-slate-700">
            {delay < 0.5
              ? 'In low Earth orbit the flight surgeon can talk to the crew live.'
              : 'Everything on this screen is already that old. The crew acts first; the ground confirms and advises.'}
          </p>
          <p className="text-xs text-slate-500">Light-time on {fmtDate(date)}: {LIGHTTIME_SOURCE}</p>
        </div>
      </div>
    </Card>
  )
}

/** Crew overview for the onboard CMO and for the ground medical team. */
export function CrewDashboard({ viewer }: { viewer: Viewer }) {
  const { state, dispatch } = useStore()
  const crew = useCrew()
  const grid = useMemo(() => weekGrid(viewer, state.overrides, state.env, state.day, state.share), [viewer, state.overrides, state.env, state.day, state.share])
  const ground = viewer.role === 'ground'

  return (
    <div className="space-y-4">
      {ground && <GroundBanner />}
      <div className="grid items-start gap-4 lg:grid-cols-[19rem_1fr]">
        <div className="space-y-4 lg:sticky lg:top-4">
          <Card>
            <SectionTitle icon={Users} title="Crew" aside={ground ? 'Flight surgeon · Mission Control' : 'Crew Medical Officer'} />
            <ul className="space-y-2">
              {SCENARIO.crew.map((m) => {
                const level = levelFor(viewer, crew[m.id], !!state.share[m.id])
                const active = state.selected === m.id
                return (
                  <li key={m.id}>
                    <button
                      type="button"
                      onClick={() => dispatch({ type: 'select', id: m.id })}
                      aria-pressed={active}
                      className={`flex w-full items-center gap-3 rounded-lg border-2 p-2.5 text-left ${active ? 'border-navy bg-sky-50' : 'border-slate-200 hover:bg-slate-50'}`}
                    >
                      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-sky-100 text-navy"><UserRound className="size-6" aria-hidden /></span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-bold text-navy">{m.id}{m.isCMO && <span className="ml-1.5 text-xs font-semibold text-slate-500">CMO</span>}</span>
                        <LevelChip level={level} />
                      </span>
                      <ChevronRight className="size-5 shrink-0 text-slate-400" aria-hidden />
                    </button>
                  </li>
                )
              })}
            </ul>
            {!ground && <p className="mt-3 text-xs text-slate-500">Status here leaves out private wellbeing data. You are a crewmate: you see it only when a crew member shares it.</p>}
          </Card>

          <Card>
            <SectionTitle icon={CalendarDays} title={`Last ${grid.days.length} days`} />
            <table className="w-full text-center text-xs">
              <thead>
                <tr className="text-slate-500">
                  <th className="py-1 text-left font-semibold">Crew</th>
                  {grid.days.map((d) => <th key={d} className={`py-1 font-semibold ${d === state.day ? 'text-navy' : ''}`}>D{d}</th>)}
                </tr>
              </thead>
              <tbody>
                {grid.rows.map((row) => (
                  <tr key={row.id}>
                    <th className="py-1 text-left font-bold text-navy">{row.id}</th>
                    {row.levels.map((lv, i) => (
                      <td key={grid.days[i]} className="py-1">
                        <span title={`${row.id}, day ${grid.days[i]}: ${LEVEL_UI[lv].label}`} className={`inline-block size-4 rounded ${LEVEL_UI[lv].dot}`}>
                          <span className="sr-only">{LEVEL_UI[lv].label}</span>
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-600">
              {(['ok', 'monitor', 'assess', 'urgent', 'incomplete'] as const).map((lv) => (
                <li key={lv} className="flex items-center gap-1"><span className={`inline-block size-2.5 rounded-sm ${LEVEL_UI[lv].dot}`} aria-hidden />{LEVEL_UI[lv].label}</li>
              ))}
            </ul>
          </Card>
        </div>

        <HealthDetail subjectId={state.selected} viewer={viewer} />
      </div>
    </div>
  )
}
