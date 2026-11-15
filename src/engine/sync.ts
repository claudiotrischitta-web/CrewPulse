import lighttimeJson from '../data/lighttime.json'
import type { Env } from './types'

const LIGHTTIME = lighttimeJson as unknown as { source: string; fetched: string; moon: Record<string, number>; mars: Record<string, number> }

export const LIGHTTIME_SOURCE = LIGHTTIME.source
export const LIGHTTIME_FETCHED = LIGHTTIME.fetched

/** The demo clock runs 60x faster than mission time: an 11-minute delay takes 11 seconds on screen. */
export const DEMO_SPEEDUP = 60

/**
 * One-way signal delay between the crew and the ground, in seconds.
 * Moon and Mars: light-time from NASA/JPL Horizons for that date.
 * ISS: relayed through geostationary satellites, a fraction of a second - shown as real time.
 */
export function oneWayDelaySeconds(env: Env, date: string): number {
  if (env === 'iss') return 0
  const table = LIGHTTIME[env]
  return table[date] ?? Object.values(table)[Object.values(table).length - 1] ?? 0
}

export function formatDelay(sec: number): string {
  if (sec < 0.5) return 'near real time'
  if (sec < 60) return `${sec.toFixed(1)} s`
  const m = Math.floor(sec / 60)
  const s = Math.round(sec - m * 60)
  return s === 60 ? `${m + 1} min 00 s` : `${m} min ${String(s).padStart(2, '0')} s`
}
