import { CAREER_LIMIT_MSV, CO2_HEADACHE_7D_MMHG, CO2_LIMIT_1H_MMHG, ENVIRONMENTS, SEP_EVENT } from '../data/environments'
import { INDICATORS } from '../data/indicators'
import { doseSummary } from './dose'
import { adverseZ, indicatorState } from './status'
import { INDICATOR_IDS, LEVEL_RANK, type Alert, type Baselines, type CrewMember, type DayContext, type DayRecord, type Env, type IndicatorId } from './types'

export interface RuleInput {
  member: CrewMember
  /** 1-based scenario day. */
  day: number
  env: Env
  days: DayContext[]
  /** This crew member's records, index = day - 1. */
  records: DayRecord[]
  baselines: Baselines
}

/** Average cabin CO2 over the last 7 days (mmHg). */
export function co2SevenDayAvg(days: DayContext[], day: number): number {
  const window = days.slice(Math.max(0, day - 7), day)
  return window.reduce((a, d) => a + d.co2Avg24h, 0) / window.length
}

const num = (id: IndicatorId, v: number) => `${v.toFixed(INDICATORS[id].decimals)}${INDICATORS[id].unit.startsWith('/') ? '' : ' '}${INDICATORS[id].unit}`.trim()

function vsBaseline(id: IndicatorId, v: number, b: Baselines): string {
  const d = Math.max(INDICATORS[id].decimals, 1)
  return `${INDICATORS[id].label}: ${num(id, v)} (your baseline ${b[id].mean.toFixed(d)} ± ${b[id].sd.toFixed(d)})`
}

/**
 * Explainable rules: every alert states why it fired, the data it used,
 * what to do now, when to re-check and when to escalate.
 * CrewPulse supports the crew's own judgement; it never decides fitness for duty.
 */
export function evaluateAlerts(inp: RuleInput): Alert[] {
  const { member, day, env, days, records, baselines } = inp
  const ctx = days[day - 1]
  const rec = records[day - 1]
  const e = ENVIRONMENTS[env]
  const alerts: Alert[] = []
  const covered = new Set<IndicatorId>()

  const val = (id: IndicatorId, d = day) => records[d - 1]?.values[id]
  const az = (id: IndicatorId, d = day) => {
    const v = val(id, d)
    return v === undefined ? null : adverseZ(INDICATORS[id], v, baselines[id])
  }
  const evaTomorrow = days[day]?.eva?.crew.includes(member.id) ?? false
  const evaToday = ctx.eva?.crew.includes(member.id) ?? false

  // A3 - solar particle event: applies to the whole crew, check-in or not.
  if (ctx.sep) {
    const dose = doseSummary(env, days, day, member)
    alerts.push({
      id: 'A3-SEP', astronautId: member.id, level: 'urgent', category: 'environment',
      title: 'Solar particle event — take shelter now',
      why: `Radiation is about ${Math.round(dose.ratio)}× the normal level for ${e.label}. Shielding is effective against solar particles, so where you are for the next hours matters.`,
      data: [
        `Dose today: ${dose.today.toFixed(1)} mSv (normal ${dose.nominal.toFixed(2)} mSv/day)`,
        `Career dose: ${dose.career.toFixed(0)} of ${CAREER_LIMIT_MSV} mSv (${dose.careerPct.toFixed(0)} %)`,
        `${SEP_EVENT.name}. ${SEP_EVENT.note[env]}`,
      ],
      actions: [
        `Move to ${e.shelter} and stay there until the all-clear.`,
        evaToday ? 'Your EVA today is postponed. An EVA in progress ends within 2 hours.' : 'All EVAs are postponed. An EVA in progress ends within 2 hours.',
        'Keep your personal dosimeter on you.',
      ],
      recheck: 'Next dosimeter reading in 1 hour.',
      escalate: 'The whole crew and the ground are alerted automatically.',
      refs: ['std3001-rad', 'rad-msl', 'donki'],
    })
  }

  // A1 - sleep debt affecting alertness.
  const nights = [day - 3, day - 2, day - 1, day].filter((d) => d >= 1)
  const lowNights = nights.filter((d) => (az('sleepH', d) ?? 0) >= 1).length
  const fatigue = val('fatigue')
  const pvtValid = rec.pvtMode !== 'quick'
  // The 30-second check is not validated: it never feeds an alert, here or in V1 below.
  if (!pvtValid) for (const id of ['pvtRt', 'pvtLapses'] as IndicatorId[]) covered.add(id)
  const pvtDegraded = pvtValid && ((az('pvtRt') ?? 0) >= 2 || (az('pvtLapses') ?? 0) >= 2)
  if (lowNights >= 3 && ((fatigue ?? 0) >= 7 || pvtDegraded)) {
    const data: string[] = [`Sleep below your baseline on ${lowNights} of the last ${nights.length} nights`]
    const sleep = val('sleepH'), rt = val('pvtRt'), lapses = val('pvtLapses')
    if (sleep !== undefined) data.push(vsBaseline('sleepH', sleep, baselines))
    if (fatigue !== undefined) data.push(`Fatigue: ${fatigue}/10`)
    if (pvtValid && rt !== undefined) data.push(vsBaseline('pvtRt', rt, baselines))
    if (pvtValid && lapses !== undefined) data.push(vsBaseline('pvtLapses', lapses, baselines))
    if (evaTomorrow) data.push('EVA planned within 24 hours')
    alerts.push({
      id: 'A1-SLEEP', astronautId: member.id, level: evaTomorrow ? 'assess' : 'monitor', category: 'performance',
      title: evaTomorrow ? 'Sleep debt before tomorrow’s EVA' : 'Sleep debt is affecting your alertness',
      why: `You have slept less than your own normal for ${lowNights} nights and ${pvtDegraded ? 'your reaction test is slower than your baseline' : 'you rate your fatigue high'}. Sleep loss slows reactions and raises the chance of errors.`,
      data,
      actions: [
        'Protect an 8-hour sleep window tonight; dim lights and screens one hour before.',
        'No caffeine in the 6 hours before sleep.',
        'If the timeline allows, take a 20–30 minute nap before demanding tasks.',
        'Repeat the 3-minute reaction test before any safety-critical task.',
      ],
      recheck: 'Tomorrow at the morning check-in.',
      escalate: evaTomorrow
        ? 'See the CMO today, before the EVA. The decision stays with you, the CMO and the flight surgeon.'
        : 'Talk to the CMO if this lasts two more days, or sooner if an EVA or critical task is coming.',
      refs: ['hrp-sleep', 'pvtb'],
    })
    for (const id of ['sleepH', 'sleepQuality', 'fatigue', 'pvtRt', 'pvtLapses'] as IndicatorId[]) covered.add(id)
  }

  // A2 - headache crossed with cabin CO2.
  const co2High1h = ctx.co2Max1h > CO2_LIMIT_1H_MMHG
  const co2Avg7 = co2SevenDayAvg(days, day)
  const co2Elevated = co2High1h || co2Avg7 > CO2_HEADACHE_7D_MMHG
  const co2Data = [
    `Cabin CO₂ 1-hour peak: ${ctx.co2Max1h.toFixed(1)} mmHg (NASA limit ${CO2_LIMIT_1H_MMHG} mmHg)`,
    `Cabin CO₂ 7-day average: ${co2Avg7.toFixed(1)} mmHg (headache risk rises above ${CO2_HEADACHE_7D_MMHG} mmHg)`,
  ]
  const headache = rec.symptoms.find((s) => s.id === 'headache')
  const vision = rec.symptoms.find((s) => s.id === 'vision')
  if (headache) {
    const onset = headache.onset === 'new' ? 'new today' : `ongoing, ${headache.trend === 'better' ? 'improving' : headache.trend === 'worse' ? 'getting worse' : 'unchanged'}`
    alerts.push({
      id: 'A2-HEADACHE', astronautId: member.id, level: vision ? 'assess' : 'monitor', category: 'physical',
      title: vision ? 'Headache with vision changes' : co2Elevated ? 'Headache — cabin CO₂ is a likely factor' : 'Headache — fluid shift is a possible factor',
      why: vision
        ? 'Headache together with a vision change needs a closer look: fluid shifting toward the head can affect the eyes in spaceflight (SANS).'
        : co2Elevated
          ? 'Your headache comes while cabin CO₂ is elevated. On the ISS, reported headaches rise with the CO₂ level.'
          : 'Cabin CO₂ is within limits. In weightlessness, fluid shifting toward the head is a common cause of headache.',
      data: [`Headache ${headache.intensity}/10, ${onset}`, ...(vision ? [`Vision changes ${vision.intensity}/10`] : []), ...co2Data],
      actions: [
        co2Elevated ? 'Move to a well-ventilated module; avoid corners with little airflow, where CO₂ pockets form.' : 'Rest for a short while and avoid heavy exertion.',
        'Drink water. If you take an analgesic from the medical kit, log it in your check-in.',
        vision ? 'Run the vision check with the CMO today.' : 'Watch your vision: blurred or dimmed sight changes the picture.',
      ],
      recheck: 'Rate the headache again in 2 hours.',
      escalate: vision
        ? 'See the CMO today; the flight surgeon is informed.'
        : 'See the CMO if it reaches 6/10, lasts more than 24 hours, or if your vision changes.',
      refs: vision ? ['hrp-sans', 'std3001-co2'] : ['std3001-co2', 'law2014'],
    })
  } else if (co2High1h) {
    alerts.push({
      id: 'A2-CABIN', astronautId: member.id, level: 'monitor', category: 'environment',
      title: 'Cabin CO₂ above the NASA limit',
      why: 'The 1-hour CO₂ level is above the limit set to keep headaches rare. You may feel nothing yet; this is the moment to prevent symptoms.',
      data: co2Data,
      actions: [
        'Prefer well-ventilated modules; avoid corners with little airflow.',
        'Check the CO₂ scrubber status with the CMO and the ground.',
        'Log any headache, fatigue or poor sleep in your next check-in.',
      ],
      recheck: 'CO₂ is re-read every hour.',
      escalate: 'The CMO and the ground see the same reading.',
      refs: ['std3001-co2', 'law2014'],
    })
  }

  // P1 - sustained stress with low mood. Private by default (see policy.ts).
  const strained = (d: number) => (az('stress', d) ?? 0) >= 1.5 && (az('mood', d) ?? 0) >= 1.5
  let streak = 0
  for (let d = day; d >= 1 && strained(d); d--) streak++
  const stress = val('stress'), mood = val('mood')
  const acute = stress !== undefined && mood !== undefined && stress >= 9 && mood <= 2
  if (streak >= 3 || acute) {
    const urgent = acute || streak >= 6
    alerts.push({
      id: 'P1-MOOD', astronautId: member.id, level: urgent ? 'urgent' : 'monitor', category: 'psych',
      title: urgent ? 'You are under heavy strain — do not carry it alone' : `Stress up and mood down for ${streak} days`,
      why: `Your own ratings show more stress and lower mood than your baseline${streak > 1 ? ` for ${streak} days in a row` : ' today'}. Isolation, confinement and distance from home do this to everyone; acting early works.`,
      data: [
        ...(stress !== undefined ? [vsBaseline('stress', stress, baselines)] : []),
        ...(mood !== undefined ? [vsBaseline('mood', mood, baselines)] : []),
      ],
      actions: [
        'Request a private conference with the ground psychologist (button below).',
        'Protect personal time today and a call or message with family.',
        'Keep your exercise and sleep routine: both protect mood.',
      ],
      recheck: 'Tomorrow at the morning check-in.',
      escalate: urgent
        ? 'Your CMO is asked to check in with you today. They are told only that you need support, not what you wrote.'
        : 'Private by default: only you and the ground medical team see this. You can share it with your CMO whenever you choose.',
      refs: ['hrp-behavior', 'std3001-care'],
    })
    covered.add('stress'); covered.add('mood')
  }

  // V1 / V2 - anything else that stays outside the personal baseline.
  const drifting = INDICATOR_IDS
    .filter((id) => !covered.has(id))
    .map((id) => indicatorState(id, records.slice(0, day).map((r) => r.values[id]), baselines[id]))
    .filter((s) => LEVEL_RANK[s.level] >= LEVEL_RANK.monitor)
  const worst = (xs: typeof drifting) => (xs.some((s) => s.level === 'assess') ? 'assess' : 'monitor')
  const body = drifting.filter((s) => INDICATORS[s.id].category !== 'psych')
  if (body.length) {
    alerts.push({
      id: 'V1-BASELINE', astronautId: member.id, level: worst(body), category: 'physical',
      title: body.length === 1 ? `${INDICATORS[body[0].id].label} outside your baseline` : `${body.length} measurements outside your baseline`,
      why: body.length === 1 ? INDICATORS[body[0].id].why : 'These values have stayed away from your own normal for at least two days. One of them alone is rarely a problem; together they say your body is under load.',
      data: body.map((s) => vsBaseline(s.id, s.value as number, baselines)),
      actions: [
        'Repeat the measurement at rest in 2 hours.',
        'Check the basics: water, food, sleep, workload.',
      ],
      recheck: 'Tomorrow at the morning check-in.',
      escalate: 'See the CMO if it continues for 3 days or if you feel unwell.',
      refs: [...new Set(body.map((s) => INDICATORS[s.id].ref))],
    })
  }
  const mind = drifting.filter((s) => INDICATORS[s.id].category === 'psych')
  if (mind.length) {
    alerts.push({
      id: 'V2-WELLBEING', astronautId: member.id, level: 'monitor', category: 'psych',
      title: `${mind.map((s) => INDICATORS[s.id].label).join(' and ')} outside your baseline`,
      why: INDICATORS[mind[0].id].why,
      data: mind.map((s) => vsBaseline(s.id, s.value as number, baselines)),
      actions: ['Protect personal time today.', 'A private conference with the ground is always available.'],
      recheck: 'Tomorrow at the morning check-in.',
      escalate: 'Private by default: only you and the ground medical team see this.',
      refs: ['hrp-behavior'],
    })
  }

  return alerts.sort((a, b) => LEVEL_RANK[b.level] - LEVEL_RANK[a.level])
}
