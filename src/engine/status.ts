import { INDICATORS } from '../data/indicators'
import type { Baseline, IndicatorDef, IndicatorId, Level } from './types'

export const signedZ = (value: number, base: Baseline) => (value - base.mean) / base.sd

/** Deviation from the personal baseline in the direction that matters for this indicator (in SD). */
export function adverseZ(def: IndicatorDef, value: number, base: Baseline): number {
  const z = signedZ(value, base)
  return def.worseWhen === 'high' ? z : def.worseWhen === 'low' ? -z : Math.abs(z)
}

export interface IndicatorState {
  id: IndicatorId
  value: number | undefined
  /** Signed deviation in SD; null when there is no value today. */
  z: number | null
  adverse: number | null
  level: Level
}

/**
 * Status of one indicator from its series (day 1 .. today).
 * A deviation must persist two days before it is flagged (or be extreme):
 * a single odd reading is not an alarm.
 *   monitor: >= 2 SD on two consecutive days, or >= 4 SD today
 *   assess:  >= 3 SD on two consecutive days
 */
export function indicatorState(id: IndicatorId, series: (number | undefined)[], base: Baseline): IndicatorState {
  const def = INDICATORS[id]
  const today = series[series.length - 1]
  if (today === undefined) return { id, value: undefined, z: null, adverse: null, level: 'incomplete' }
  const prev = series[series.length - 2]
  const a = adverseZ(def, today, base)
  const p = prev === undefined ? 0 : adverseZ(def, prev, base)
  let level: Level = 'ok'
  if (a >= 3 && p >= 3) level = 'assess'
  else if ((a >= 2 && p >= 2) || a >= 4) level = 'monitor'
  return { id, value: today, z: signedZ(today, base), adverse: a, level }
}
