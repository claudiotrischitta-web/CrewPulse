import { describe, expect, it } from 'vitest'
import { CAREER_LIMIT_MSV } from '../src/data/environments'
import { computeBaselines } from '../src/engine/baseline'
import { BASELINES, SCENARIO, buildMemberDay, levelFor, overrideKey, type Overrides } from '../src/engine/crew'
import { doseSummary } from '../src/engine/dose'
import { alertsFor, canSee } from '../src/engine/policy'
import { co2SevenDayAvg } from '../src/engine/rules'
import { indicatorState } from '../src/engine/status'
import { formatDelay, oneWayDelaySeconds } from '../src/engine/sync'
import type { DayRecord, Viewer } from '../src/engine/types'

const member = (id: string) => SCENARIO.crew.find((m) => m.id === id)!
const day = (id: string, d: number, overrides: Overrides = {}, env: 'iss' | 'moon' | 'mars' = 'mars') => buildMemberDay(member(id), overrides, env, d)
const ids = (id: string, d: number, overrides: Overrides = {}) => day(id, d, overrides).alerts.map((a) => a.id)

const CMO: Viewer = { role: 'cmo' }
const GROUND: Viewer = { role: 'ground' }

describe('personal baseline', () => {
  it('uses the pre-flight mean and floors the standard deviation', () => {
    const flat = Array.from({ length: 14 }, () => ({ hr: 60 }))
    const b = computeBaselines(flat)
    expect(b.hr.mean).toBe(60)
    expect(b.hr.sd).toBe(2) // identical readings would give sd = 0 and alarm on everything
  })

  it('gives each crew member a different baseline', () => {
    expect(BASELINES.A01.hr.mean).not.toBeCloseTo(BASELINES.A03.hr.mean, 0)
  })
})

describe('indicator status', () => {
  const base = { mean: 60, sd: 2 }
  it('ignores a single odd reading', () => {
    expect(indicatorState('hr', [60, 60, 65], base).level).toBe('ok')
  })
  it('flags a deviation that persists two days', () => {
    expect(indicatorState('hr', [60, 65, 65], base).level).toBe('monitor')
    expect(indicatorState('hr', [60, 67, 67], base).level).toBe('assess')
  })
  it('respects the direction that matters', () => {
    const sleep = { mean: 7.5, sd: 0.5 }
    expect(indicatorState('sleepH', [9, 9], sleep).level).toBe('ok') // more sleep is not a problem
    expect(indicatorState('sleepH', [6, 6], sleep).level).toBe('assess')
  })
  it('reports a missing value as incomplete', () => {
    expect(indicatorState('hr', [60, undefined], base).level).toBe('incomplete')
  })
})

describe('A1 sleep debt', () => {
  it('is silent while A01 sleeps normally', () => {
    for (const d of [1, 2, 3, 4, 5]) expect(ids('A01', d)).not.toContain('A1-SLEEP')
  })
  it('asks for a CMO assessment on day 11, the day before the EVA', () => {
    const a1 = day('A01', 11).alerts.find((a) => a.id === 'A1-SLEEP')
    expect(a1?.level).toBe('assess')
    expect(a1?.data.join(' ')).toContain('EVA planned within 24 hours')
  })
  it('clears once A01 recovers', () => {
    expect(ids('A01', 14)).not.toContain('A1-SLEEP')
  })
  it('never fires from the unvalidated 30-second test alone', () => {
    const base = SCENARIO.records.A02[10]
    const rec: DayRecord = { ...base, pvtMode: 'quick', values: { ...base.values, pvtRt: 480, pvtLapses: 20 } }
    expect(ids('A02', 11, { [overrideKey('A02', 11)]: rec })).not.toContain('A1-SLEEP')
  })
  it('keeps the 30-second test out of the generic baseline alert and the card colour too', () => {
    const base = SCENARIO.records.A02[10]
    const rec: DayRecord = { ...base, pvtMode: 'quick', values: { ...base.values, pvtRt: 480 } }
    const s = day('A02', 11, { [overrideKey('A02', 11)]: rec })
    expect(s.alerts.map((a) => a.id)).not.toContain('V1-BASELINE')
    expect(s.states.pvtRt.value).toBe(480)
    expect(s.states.pvtRt.level).toBe('ok')
  })
})

describe('A2 headache and cabin CO2', () => {
  it('computes the 7-day CO2 average', () => {
    expect(co2SevenDayAvg(SCENARIO.days, 11)).toBeCloseTo(2.6, 1)
  })
  it('links A01 headache to elevated CO2 on day 11', () => {
    const a2 = day('A01', 11).alerts.find((a) => a.id === 'A2-HEADACHE')
    expect(a2?.level).toBe('monitor')
    expect(a2?.title).toContain('CO₂')
  })
  it('warns the rest of the crew when the 1-hour limit is exceeded', () => {
    expect(ids('A02', 11)).toContain('A2-CABIN')
    expect(ids('A02', 9)).not.toContain('A2-CABIN')
  })
  it('escalates a headache with vision changes', () => {
    const base = SCENARIO.records.A02[4]
    const rec: DayRecord = { ...base, symptoms: [
      { id: 'headache', intensity: 3, onset: 'new', trend: 'same' },
      { id: 'vision', intensity: 2, onset: 'new', trend: 'same' },
    ] }
    const a2 = day('A02', 5, { [overrideKey('A02', 5)]: rec }).alerts.find((a) => a.id === 'A2-HEADACHE')
    expect(a2?.level).toBe('assess')
    expect(a2?.refs).toContain('hrp-sans')
  })
})

describe('A3 solar particle event', () => {
  it('is urgent for the whole crew on day 12 only', () => {
    for (const m of SCENARIO.crew) {
      expect(day(m.id, 12).alerts[0].id).toBe('A3-SEP')
      expect(ids(m.id, 11)).not.toContain('A3-SEP')
      expect(ids(m.id, 13)).not.toContain('A3-SEP')
    }
  })
  it('adds the measured 8.1 mSv to the Mars dose and stays under the career limit', () => {
    const before = doseSummary('mars', SCENARIO.days, 11, member('A01'))
    const after = doseSummary('mars', SCENARIO.days, 12, member('A01'))
    expect(after.mission - before.mission).toBeCloseTo(0.67 + 8.1, 2)
    expect(after.career).toBeLessThan(CAREER_LIMIT_MSV)
  })
})

describe('P1 stress and mood', () => {
  it('fires for A01 after three strained days', () => {
    expect(ids('A01', 11)).toContain('P1-MOOD')
    expect(ids('A01', 8)).not.toContain('P1-MOOD')
  })
  it('becomes urgent on acute distress', () => {
    const base = SCENARIO.records.A02[4]
    const rec: DayRecord = { ...base, values: { ...base.values, stress: 9, mood: 2 } }
    const p1 = day('A02', 5, { [overrideKey('A02', 5)]: rec }).alerts.find((a) => a.id === 'P1-MOOD')
    expect(p1?.level).toBe('urgent')
  })
})

describe('false alarms', () => {
  const cabinWide = new Set(['A3-SEP', 'A2-CABIN'])
  it('keeps the healthy crew quiet apart from cabin-wide events', () => {
    for (let d = 1; d <= 14; d++) {
      expect(ids('A04', d).filter((a) => !cabinWide.has(a)), `A04 day ${d}`).toEqual([])
    }
  })
  it('raises nothing physical for A02, whose story is only about wellbeing', () => {
    for (let d = 1; d <= 14; d++) {
      const own = day('A02', d).alerts.filter((a) => !cabinWide.has(a.id))
      expect(own.filter((a) => a.category !== 'psych'), `A02 day ${d}`).toEqual([])
    }
  })
  it('marks A03 as incomplete on day 11 until the check-in is done', () => {
    const me: Viewer = { role: 'astronaut', id: 'A03' }
    expect(levelFor(me, day('A03', 11), false)).toBe('incomplete')
    const done: DayRecord = { ...SCENARIO.records.A03[9], day: 11, complete: true, live: true }
    expect(levelFor(me, day('A03', 11, { [overrideKey('A03', 11)]: done }), false)).toBe('ok')
  })
  it('does not turn a cabin advisory into a personal flag', () => {
    expect(ids('A04', 11)).toContain('A2-CABIN')
    expect(levelFor({ role: 'astronaut', id: 'A04' }, day('A04', 11), false)).toBe('ok')
  })
})

describe('privacy by role', () => {
  it('lets an astronaut see only their own data', () => {
    expect(canSee({ role: 'astronaut', id: 'A01' }, 'A01', 'psych', false)).toBe(true)
    expect(canSee({ role: 'astronaut', id: 'A01' }, 'A02', 'physical', false)).toBe(false)
  })
  it('hides psychological data from the CMO unless shared', () => {
    expect(canSee(CMO, 'A01', 'physical', false)).toBe(true)
    expect(canSee(CMO, 'A01', 'performance', false)).toBe(true)
    expect(canSee(CMO, 'A01', 'psych', false)).toBe(false)
    expect(canSee(CMO, 'A01', 'psych', true)).toBe(true)
    expect(canSee(GROUND, 'A01', 'psych', false)).toBe(true)
  })
  it('removes the private alert from the CMO view of A01', () => {
    const all = day('A01', 11).alerts
    expect(alertsFor(CMO, 'A01', all, false).map((a) => a.id)).not.toContain('P1-MOOD')
    expect(alertsFor(GROUND, 'A01', all, false).map((a) => a.id)).toContain('P1-MOOD')
    expect(alertsFor(CMO, 'A01', all, true).map((a) => a.id)).toContain('P1-MOOD')
  })
  it('turns an urgent private alert into a bare contact flag for the CMO', () => {
    const base = SCENARIO.records.A02[4]
    const rec: DayRecord = { ...base, values: { ...base.values, stress: 10, mood: 1 } }
    const seen = alertsFor(CMO, 'A02', day('A02', 5, { [overrideKey('A02', 5)]: rec }).alerts, false)
    const flag = seen.find((a) => a.id === 'P-FLAG')
    expect(flag?.redacted).toBe(true)
    expect(flag?.data).toEqual([])
    expect(JSON.stringify(flag)).not.toMatch(/stress|mood/i)
  })
})

describe('A02 scenario: private strain, then break-glass', () => {
  const A02: Viewer = { role: 'astronaut', id: 'A02' }
  it('keeps A02 private while the alert is only a monitor (days 9-12)', () => {
    for (const d of [9, 10, 11]) {
      expect(levelFor(A02, day('A02', d), false), `day ${d}`).toBe('monitor')
      expect(levelFor(GROUND, day('A02', d), false), `day ${d}`).toBe('monitor')
      expect(levelFor(CMO, day('A02', d), false), `day ${d}`).toBe('ok')
    }
    expect(ids('A02', 11)).toContain('P1-MOOD')
  })
  it('sends the CMO only a contact flag on day 13', () => {
    const s = day('A02', 13)
    expect(s.alerts.find((a) => a.id === 'P1-MOOD')?.level).toBe('urgent')
    const seen = alertsFor(CMO, 'A02', s.alerts, false)
    expect(seen.map((a) => a.id)).toEqual(['P-FLAG'])
    expect(levelFor(CMO, s, false)).toBe('urgent')
  })
  it('is back within baseline on day 14', () => {
    expect(levelFor(A02, day('A02', 14), false)).toBe('ok')
  })
})

describe('communication delay (JPL Horizons)', () => {
  it('is about 11 minutes to Mars on 14 Nov 2026', () => {
    expect(oneWayDelaySeconds('mars', '2026-11-14') / 60).toBeCloseTo(11.0, 1)
  })
  it('is about 1.3 seconds to the Moon and real time on the ISS', () => {
    expect(oneWayDelaySeconds('moon', '2026-11-14')).toBeGreaterThan(1.1)
    expect(oneWayDelaySeconds('moon', '2026-11-14')).toBeLessThan(1.4)
    expect(oneWayDelaySeconds('iss', '2026-11-14')).toBe(0)
  })
  it('formats delays for people', () => {
    expect(formatDelay(0)).toBe('near real time')
    expect(formatDelay(1.35)).toBe('1.4 s')
    expect(formatDelay(660.86)).toBe('11 min 01 s')
  })
})
