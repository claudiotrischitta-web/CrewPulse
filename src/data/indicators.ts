import type { IndicatorDef, IndicatorId } from '../engine/types'

const RING = 'Measured overnight by the ring — nothing to do.'

export const INDICATORS: Record<IndicatorId, IndicatorDef> = {
  hr: {
    id: 'hr', label: 'Resting heart rate', unit: 'bpm', category: 'physical', worseWhen: 'both', decimals: 0, minSd: 2, device: 'ring',
    why: 'Weightlessness changes how the heart and blood vessels work. A resting rate drifting away from your own baseline can point to fatigue, dehydration, illness or stress.',
    how: RING, ref: 'hrp-cardio',
  },
  hrv: {
    id: 'hrv', label: 'Heart rate variability', unit: 'ms', category: 'physical', worseWhen: 'low', decimals: 0, minSd: 4, device: 'ring',
    why: 'Lower variability than your usual is an early sign that your body is not recovering: short sleep, heavy workload or stress.',
    how: RING, ref: 'hrp-cardio',
  },
  spo2: {
    id: 'spo2', label: 'Blood oxygen (SpO₂)', unit: '%', category: 'physical', worseWhen: 'low', decimals: 0, minSd: 0.8, device: 'ring',
    why: 'You live in a closed atmosphere. A drop below your usual saturation deserves a second measurement and a look at the cabin air.',
    how: RING, ref: 'hrp-hazards',
  },
  skinTemp: {
    id: 'skinTemp', label: 'Skin temperature change', unit: '°C', category: 'physical', worseWhen: 'both', decimals: 2, minSd: 0.15, device: 'ring',
    why: 'The ring tracks the change from your usual skin temperature, not core temperature. A sustained rise can precede an infection: spaceflight alters the immune system.',
    how: RING, ref: 'hrp-hazards',
  },
  respRate: {
    id: 'respRate', label: 'Breathing rate', unit: '/min', category: 'physical', worseWhen: 'both', decimals: 1, minSd: 0.6, device: 'ring',
    why: 'Breathing faster than your baseline at rest can reflect elevated cabin CO₂, illness or stress.',
    how: RING, ref: 'std3001-co2',
  },
  sbp: {
    id: 'sbp', label: 'Systolic pressure', unit: 'mmHg', category: 'physical', worseWhen: 'both', decimals: 0, minSd: 4, device: 'cuff',
    why: 'Fluids shift toward the head in weightlessness and the cardiovascular system adapts. Track your pressure against your own baseline.',
    how: 'Sit still for 2 minutes, cuff on the upper arm at heart level, then type both numbers.', ref: 'hrp-cardio',
  },
  dbp: {
    id: 'dbp', label: 'Diastolic pressure', unit: 'mmHg', category: 'physical', worseWhen: 'both', decimals: 0, minSd: 3, device: 'cuff',
    why: 'Fluids shift toward the head in weightlessness and the cardiovascular system adapts. Track your pressure against your own baseline.',
    how: 'Same cuff reading as the systolic value.', ref: 'hrp-cardio',
  },
  sleepH: {
    id: 'sleepH', label: 'Sleep duration', unit: 'h', category: 'performance', worseWhen: 'low', decimals: 1, minSd: 0.4, device: 'ring',
    why: 'Crews sleep less in space and schedules shift. Chronic sleep loss slows reactions and raises the risk of errors.',
    how: RING, ref: 'hrp-sleep',
  },
  sleepQuality: {
    id: 'sleepQuality', label: 'Sleep quality', unit: '/10', category: 'performance', worseWhen: 'low', decimals: 0, minSd: 1, device: 'self',
    why: 'How rested you feel adds what a sensor cannot see: noise, light, a full schedule.',
    how: '0 = worst night, 10 = fully rested.', ref: 'hrp-sleep',
  },
  fatigue: {
    id: 'fatigue', label: 'Fatigue', unit: '/10', category: 'performance', worseWhen: 'high', decimals: 0, minSd: 1, device: 'self',
    why: 'Fatigue builds up quietly. Rating it every morning shows the trend before it affects your work.',
    how: '0 = fully fresh, 10 = exhausted.', ref: 'hrp-sleep',
  },
  pvtRt: {
    id: 'pvtRt', label: 'Reaction time (PVT-B)', unit: 'ms', category: 'performance', worseWhen: 'high', decimals: 0, minSd: 10, device: 'pvt',
    why: 'The 3-minute reaction test is an objective measure of alertness, validated against sleep loss and used on the ISS.',
    how: 'Tap as soon as the counter appears. 3 minutes.', ref: 'pvtb',
  },
  pvtLapses: {
    id: 'pvtLapses', label: 'Lapses (≥ 355 ms)', unit: '', category: 'performance', worseWhen: 'high', decimals: 0, minSd: 1, device: 'pvt',
    why: 'A lapse is a slow response (355 ms or more). More lapses than your baseline means attention is slipping.',
    how: 'Counted automatically during the reaction test.', ref: 'pvtb',
  },
  stress: {
    id: 'stress', label: 'Stress', unit: '/10', category: 'psych', worseWhen: 'high', decimals: 0, minSd: 1, device: 'self',
    why: 'Isolation, confinement and distance from Earth weigh on everyone. Noticing the trend early is what lets you act on it.',
    how: '0 = calm, 10 = overwhelmed.', ref: 'hrp-behavior',
  },
  mood: {
    id: 'mood', label: 'Mood', unit: '/10', category: 'psych', worseWhen: 'low', decimals: 0, minSd: 1, device: 'self',
    why: 'Isolation, confinement and distance from Earth weigh on everyone. Noticing the trend early is what lets you act on it.',
    how: '0 = very low, 10 = very good.', ref: 'hrp-behavior',
  },
}

export const VITALS: IndicatorId[] = ['hr', 'hrv', 'sbp', 'spo2', 'skinTemp', 'respRate']
export const PERFORMANCE: IndicatorId[] = ['sleepH', 'sleepQuality', 'fatigue', 'pvtRt', 'pvtLapses']
export const PSYCH: IndicatorId[] = ['stress', 'mood']
export const RING_IDS: IndicatorId[] = ['hr', 'hrv', 'spo2', 'skinTemp', 'respRate', 'sleepH']

/** Body areas, head to toe: the order of the check-in and of the body map. */
export const SYMPTOM_AREAS = ['Head', 'Vision', 'Mouth', 'Heart & breathing', 'Digestion', 'Urinary', 'Back', 'Muscles & joints', 'Skin'] as const
export type SymptomArea = (typeof SYMPTOM_AREAS)[number]
export interface SymptomDef { id: string; label: string; area: SymptomArea; postEva?: boolean }

/** Headache and vision changes come first: they are the most common symptoms reported in flight (NASA OCHMO-TB-004). */
export const SYMPTOMS: SymptomDef[] = [
  { id: 'headache', label: 'Headache', area: 'Head' },
  { id: 'vision', label: 'Vision changes (blurred or dimmed)', area: 'Vision' },
  { id: 'congestion', label: 'Head congestion or puffy face', area: 'Head' },
  { id: 'nausea', label: 'Nausea or motion sickness', area: 'Digestion' },
  { id: 'breath', label: 'Shortness of breath', area: 'Heart & breathing' },
  { id: 'cough', label: 'Cough or sore throat', area: 'Heart & breathing' },
  { id: 'backPain', label: 'Back pain', area: 'Back' },
  { id: 'jointPain', label: 'Joint pain', area: 'Muscles & joints', postEva: true },
  { id: 'tingling', label: 'Numbness or tingling', area: 'Muscles & joints', postEva: true },
  { id: 'skin', label: 'Skin rash, itching or mottling', area: 'Skin', postEva: true },
  { id: 'urinary', label: 'Flank pain or urinary discomfort', area: 'Urinary' },
  { id: 'dental', label: 'Tooth or gum pain', area: 'Mouth' },
]
export const symptomLabel = (id: string) => SYMPTOMS.find((s) => s.id === id)?.label ?? id

export const MEDS = ['Analgesic', 'Sleep aid', 'Anti-nausea', 'Decongestant']
