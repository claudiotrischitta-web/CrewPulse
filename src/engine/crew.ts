import scenarioJson from '../data/scenario.json'
import { computeBaselines } from './baseline'
import { doseSummary, type DoseSummary } from './dose'
import { alertsFor } from './policy'
import { evaluateAlerts } from './rules'
import { indicatorState, type IndicatorState } from './status'
import { INDICATOR_IDS, LEVEL_RANK, type Alert, type Baselines, type CrewMember, type DayContext, type DayRecord, type Env, type IndicatorId, type Level, type Scenario, type Viewer } from './types'

export const SCENARIO = scenarioJson as unknown as Scenario

/** Personal baselines, derived once from each crew member's pre-flight days. */
export const BASELINES: Record<string, Baselines> = Object.fromEntries(
  SCENARIO.crew.map((m) => [m.id, computeBaselines(SCENARIO.preflight[m.id])]),
)

/** Live check-ins entered in the app override the simulated record of that day. Key: `${id}:${day}`. */
export type Overrides = Record<string, DayRecord>
export const overrideKey = (id: string, day: number) => `${id}:${day}`

export function recordsFor(id: string, overrides: Overrides): DayRecord[] {
  return SCENARIO.records[id].map((r) => overrides[overrideKey(id, r.day)] ?? r)
}

export interface CrewDayState {
  member: CrewMember
  ctx: DayContext
  record: DayRecord
  records: DayRecord[]
  baselines: Baselines
  states: Record<IndicatorId, IndicatorState>
  /** Every alert, before privacy filtering. */
  alerts: Alert[]
  dose: DoseSummary
}

export function buildMemberDay(member: CrewMember, overrides: Overrides, env: Env, day: number): CrewDayState {
  const records = recordsFor(member.id, overrides)
  const baselines = BASELINES[member.id]
  const states = Object.fromEntries(
    INDICATOR_IDS.map((id) => [id, indicatorState(id, records.slice(0, day).map((r) => r.values[id]), baselines[id])]),
  ) as Record<IndicatorId, IndicatorState>
  // The 30-second reaction check is indicative only: its value is shown but never coloured as a deviation.
  if (records[day - 1]?.pvtMode === 'quick') states.pvtRt = { ...states.pvtRt, level: 'ok' }
  return {
    member, ctx: SCENARIO.days[day - 1], record: records[day - 1], records, baselines, states,
    alerts: evaluateAlerts({ member, day, env, days: SCENARIO.days, records, baselines }),
    dose: doseSummary(env, SCENARIO.days, day, member),
  }
}

export function buildCrewDay(overrides: Overrides, env: Env, day: number): Record<string, CrewDayState> {
  return Object.fromEntries(SCENARIO.crew.map((m) => [m.id, buildMemberDay(m, overrides, env, day)]))
}

/** A cabin-wide advisory (e.g. CO2 slightly high) is shown to everyone but is not a personal health flag. */
export const isCabinAdvisory = (a: Alert) => a.category === 'environment' && a.level === 'monitor'

/**
 * Personal status: the worst alert the viewer may see, cabin advisories aside;
 * "incomplete" if nothing is flagged and the check-in is missing.
 */
export function overallLevel(visible: Alert[], record: DayRecord): Level {
  const worst = visible
    .filter((a) => !isCabinAdvisory(a))
    .reduce<Level>((acc, a) => (LEVEL_RANK[a.level] > LEVEL_RANK[acc] ? a.level : acc), 'ok')
  return worst === 'ok' && !record.complete ? 'incomplete' : worst
}

export function levelFor(viewer: Viewer, s: CrewDayState, sharedPsych: boolean): Level {
  return overallLevel(alertsFor(viewer, s.member.id, s.alerts, sharedPsych), s.record)
}

/** Status of every crew member on each of the last `span` days, as the viewer may see it. */
export function weekGrid(viewer: Viewer, overrides: Overrides, env: Env, day: number, share: Record<string, boolean>, span = 7) {
  const days = Array.from({ length: Math.min(span, day) }, (_, i) => day - Math.min(span, day) + 1 + i)
  return {
    days,
    rows: SCENARIO.crew.map((m) => ({
      id: m.id,
      levels: days.map((d) => levelFor(viewer, buildMemberDay(m, overrides, env, d), !!share[m.id])),
    })),
  }
}
