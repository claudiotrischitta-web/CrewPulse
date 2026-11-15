import { INDICATORS } from '../data/indicators'
import { INDICATOR_IDS, type Baselines, type Values } from './types'

/**
 * Personal baseline = mean and standard deviation of the pre-flight days.
 * The SD is floored per indicator: with a realistic minimum variability a normal
 * day-to-day wobble does not become an alarm.
 */
export function computeBaselines(preflight: Values[]): Baselines {
  const out = {} as Baselines
  for (const id of INDICATOR_IDS) {
    const xs = preflight.map((v) => v[id]).filter((x): x is number => typeof x === 'number')
    const mean = xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0
    const variance = xs.length > 1 ? xs.reduce((a, b) => a + (b - mean) ** 2, 0) / (xs.length - 1) : 0
    out[id] = { mean, sd: Math.max(Math.sqrt(variance), INDICATORS[id].minSd) }
  }
  return out
}
