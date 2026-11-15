import type { Env } from '../engine/types'

/** NASA-STD-3001 Vol. 1 [V1 4030]: career effective dose shall be less than 600 mSv, all ages and sexes. */
export const CAREER_LIMIT_MSV = 600
/** NASA-STD-3001 Vol. 1 [V1 4031]: design-reference solar particle event below 250 mSv effective dose. */
export const SEP_EVENT_LIMIT_MSV = 250
/** NASA-STD-3001 Vol. 2 [V2 6004]: average 1-hour ppCO2 no more than 3 mmHg. */
export const CO2_LIMIT_1H_MMHG = 3.0
/** OCHMO-TB-004: keep the 7-day average below 2.5 mmHg to hold headache risk under 1 %. */
export const CO2_HEADACHE_7D_MMHG = 2.5

export interface EnvDef {
  id: Env
  label: string
  place: string
  gravity: string
  /** Nominal dose, mSv per day. */
  doseRate: number
  doseSource: string
  /** The 14-day scenario is a window inside a longer mission: mission day of scenario day 1. */
  missionDayStart: number
  /** Estimated mission dose accumulated before the window, mSv. */
  doseBeforeWindow: number
  doseBeforeNote: string
  shelter: string
}

export const ENVIRONMENTS: Record<Env, EnvDef> = {
  iss: {
    id: 'iss', label: 'ISS', place: 'Low Earth orbit', gravity: 'Microgravity',
    doseRate: 0.45,
    doseSource: 'NASA OCHMO-TB-020: 77–86 mSv per 180-day ISS mission (≈ 0.45 mSv/day)',
    missionDayStart: 60,
    doseBeforeWindow: 26.6,
    doseBeforeNote: '59 days × 0.45 mSv/day',
    shelter: 'the most shielded module (crew quarters)',
  },
  moon: {
    id: 'moon', label: 'Moon', place: 'Lunar surface base', gravity: '0.17 g',
    doseRate: 0.93,
    doseSource: 'NASA OCHMO-TB-020: 167 mSv per 180-day lunar surface mission at solar minimum (≈ 0.93 mSv/day)',
    missionDayStart: 20,
    doseBeforeWindow: 17.7,
    doseBeforeNote: '19 days × 0.93 mSv/day (transit approximated at the surface rate)',
    shelter: 'the habitat storm shelter',
  },
  mars: {
    id: 'mars', label: 'Mars', place: 'Mars surface base', gravity: '0.38 g',
    doseRate: 0.67,
    doseSource: 'MSL/RAD on the Mars surface: 0.67 mSv/day (Hassler et al. 2014)',
    missionDayStart: 250,
    doseBeforeWindow: 404.1,
    doseBeforeNote: '210-day cruise × 1.8 mSv/day (MSL/RAD, Zeitlin et al. 2013) + 39 sols × 0.67 mSv/day',
    shelter: 'the habitat storm shelter',
  },
}

/**
 * The scenario replays one real solar particle event on day 12.
 * Only the Mars value is a measurement; Moon and ISS values are illustrative.
 */
export const SEP_EVENT = {
  name: 'Solar particle event of 20 May 2024 (replayed)',
  // DONKI lists the eruption as a CME; it has no near-Earth SEP entry because the event pointed away from Earth.
  donki: 'NASA DONKI activity 2024-05-20T05:36:00-CME-001',
  measured: 'MSL/RAD measured about 8.1 mGy on the Mars surface: the largest surge since Curiosity landed (NASA/JPL PIA26302).',
  /** Extra dose on the event day, mSv. Protons are low-LET: quality factor taken as 1 (approximation). */
  dose_mSv: { mars: 8.1, moon: 20, iss: 1.5 } as Record<Env, number>,
  note: {
    mars: 'Measured by MSL/RAD (8.1 mGy; quality factor ≈ 1 assumed).',
    moon: 'Illustrative scaling of the same event — not a measurement.',
    iss: 'Illustrative scaling of the same event — not a measurement.',
  } as Record<Env, string>,
}
