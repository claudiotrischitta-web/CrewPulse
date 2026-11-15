export type Env = 'iss' | 'moon' | 'mars'

/** Data categories drive who may see what (see policy.ts). */
export type Category = 'physical' | 'performance' | 'psych' | 'environment'

/** incomplete = no check-in yet; monitor = self-manage; assess = CMO evaluation; urgent = CMO now + ground. */
export type Level = 'incomplete' | 'ok' | 'monitor' | 'assess' | 'urgent'

export const INDICATOR_IDS = [
  'hr', 'hrv', 'spo2', 'skinTemp', 'respRate', 'sbp', 'dbp',
  'sleepH', 'sleepQuality', 'fatigue', 'pvtRt', 'pvtLapses',
  'stress', 'mood',
] as const
export type IndicatorId = (typeof INDICATOR_IDS)[number]

export interface IndicatorDef {
  id: IndicatorId
  label: string
  unit: string
  category: Exclude<Category, 'environment'>
  /** Which direction counts as a deviation from the personal baseline. */
  worseWhen: 'high' | 'low' | 'both'
  decimals: number
  /** Floor for the personal standard deviation: keeps false alarms down when pre-flight data are very stable. */
  minSd: number
  device: 'ring' | 'cuff' | 'self' | 'pvt'
  /** Plain-language reason this indicator matters in spaceflight. */
  why: string
  /** How the crew member takes the measurement. */
  how: string
  ref: string
}

export interface Baseline { mean: number; sd: number }
export type Baselines = Record<IndicatorId, Baseline>
export type Values = Partial<Record<IndicatorId, number>>

export interface Symptom {
  id: string
  /** 0-10 */
  intensity: number
  onset: 'new' | 'ongoing'
  trend: 'worse' | 'same' | 'better'
}

export interface DayRecord {
  day: number
  complete: boolean
  values: Values
  symptoms: Symptom[]
  meds: string[]
  /** Entered live in the app (not part of the simulated scenario). */
  live?: boolean
  /** 'quick' = 30-second check, not validated: never used to trigger an alert. */
  pvtMode?: 'pvtb' | 'quick'
  /** Local time the live check-in was saved. */
  savedAt?: string
}

export interface DayContext {
  day: number
  date: string
  /** Cabin CO2 partial pressure, mmHg. */
  co2Avg24h: number
  co2Max1h: number
  /** Solar particle event in progress. */
  sep: boolean
  eva: { crew: string[]; hours: number } | null
}

export interface CrewMember {
  id: string
  title: string
  isCMO: boolean
  priorCareerDose_mSv: number
  /** Figure used by the symptom body map. */
  body: 'male' | 'female'
}

export interface Scenario {
  meta: { name: string; simulated: boolean; note: string; seed: number; startDate: string; days: number; preflightDays: number; generator: string }
  crew: CrewMember[]
  preflight: Record<string, Values[]>
  days: DayContext[]
  records: Record<string, DayRecord[]>
}

export interface Alert {
  id: string
  astronautId: string
  level: Exclude<Level, 'incomplete' | 'ok'>
  category: Category
  title: string
  /** Why the alert fired, in plain language. */
  why: string
  /** The data points the rule used. */
  data: string[]
  /** What the crew member can do now. */
  actions: string[]
  recheck: string
  /** When and to whom to escalate. */
  escalate: string
  /** Reference ids (see data/references.ts). */
  refs: string[]
  /** Details withheld from this viewer (privacy). */
  redacted?: boolean
}

export type Viewer = { role: 'astronaut'; id: string } | { role: 'cmo' } | { role: 'ground' }

export const LEVEL_RANK: Record<Level, number> = { incomplete: 0, ok: 1, monitor: 2, assess: 3, urgent: 4 }
