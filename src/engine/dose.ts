import { CAREER_LIMIT_MSV, ENVIRONMENTS, SEP_EVENT } from '../data/environments'
import type { CrewMember, DayContext, Env } from './types'

/** Dose for one scenario day, mSv: nominal environment rate plus the solar particle event if one is in progress. */
export const dayDose = (env: Env, ctx: DayContext) => ENVIRONMENTS[env].doseRate + (ctx.sep ? SEP_EVENT.dose_mSv[env] : 0)

export interface DoseSummary {
  today: number
  nominal: number
  /** today / nominal */
  ratio: number
  mission: number
  career: number
  careerPct: number
  series: { day: number; label: string; cum: number; eva: boolean; sep: boolean }[]
}

/**
 * Mission and career dose up to `day`.
 * Dose equivalent is treated as effective dose: a stated approximation for a prototype.
 */
export function doseSummary(env: Env, days: DayContext[], day: number, member: CrewMember): DoseSummary {
  const e = ENVIRONMENTS[env]
  let cum = e.doseBeforeWindow
  const series = days.slice(0, day).map((c) => {
    cum += dayDose(env, c)
    return { day: c.day, label: `D${c.day}`, cum: Math.round(cum * 100) / 100, eva: !c.sep && !!c.eva?.crew.includes(member.id), sep: c.sep }
  })
  const today = dayDose(env, days[day - 1])
  const career = member.priorCareerDose_mSv + cum
  return { today, nominal: e.doseRate, ratio: today / e.doseRate, mission: cum, career, careerPct: (career / CAREER_LIMIT_MSV) * 100, series }
}
