import { Activity, BedDouble, Brain, Heart, Info, Moon, Smile, Stethoscope, Thermometer, Timer, Wind, Zap, type LucideIcon } from 'lucide-react'
import { useState } from 'react'
import { INDICATORS } from '../data/indicators'
import type { CrewDayState } from '../engine/crew'
import { LEVEL_RANK, type Baseline, type IndicatorId, type Level } from '../engine/types'

const ICONS: Record<IndicatorId, LucideIcon> = {
  hr: Heart, hrv: Activity, spo2: Wind, skinTemp: Thermometer, respRate: Wind, sbp: Stethoscope, dbp: Stethoscope,
  sleepH: BedDouble, sleepQuality: Moon, fatigue: Zap, pvtRt: Timer, pvtLapses: Timer, stress: Brain, mood: Smile,
}

const TONE: Record<Level, { box: string; dev: string; line: string }> = {
  ok: { box: 'border-slate-200 bg-white', dev: 'text-slate-500', line: 'stroke-sky-600' },
  incomplete: { box: 'border-dashed border-slate-300 bg-slate-50', dev: 'text-slate-400', line: 'stroke-slate-400' },
  monitor: { box: 'border-amber-300 bg-amber-50', dev: 'text-amber-800', line: 'stroke-amber-600' },
  assess: { box: 'border-orange-400 bg-orange-50', dev: 'text-orange-800', line: 'stroke-orange-600' },
  urgent: { box: 'border-red-400 bg-red-50', dev: 'text-red-800', line: 'stroke-red-600' },
}

/** Last days against the personal baseline band (mean ± 1 SD). */
function Sparkline({ values, base, line }: { values: (number | undefined)[]; base: Baseline; line: string }) {
  const w = 104, h = 30, pad = 3
  const xs = values.filter((v): v is number => v !== undefined)
  if (xs.length < 2) return <svg width={w} height={h} aria-hidden />
  const lo = Math.min(...xs, base.mean - 2 * base.sd)
  const hi = Math.max(...xs, base.mean + 2 * base.sd)
  const y = (v: number) => pad + (h - 2 * pad) * (1 - (v - lo) / (hi - lo || 1))
  const x = (i: number) => pad + ((w - 2 * pad) * i) / Math.max(values.length - 1, 1)
  const pts = values.flatMap((v, i) => (v === undefined ? [] : [`${x(i).toFixed(1)},${y(v).toFixed(1)}`]))
  const last = values[values.length - 1]
  return (
    <svg width={w} height={h} role="img" aria-label="Trend of the last days against your baseline band">
      <rect x={0} y={y(base.mean + base.sd)} width={w} height={Math.max(1, y(base.mean - base.sd) - y(base.mean + base.sd))} rx={2} className="fill-slate-200/70" />
      <polyline points={pts.join(' ')} fill="none" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={line} />
      {last !== undefined && <circle cx={x(values.length - 1)} cy={y(last)} r={3} className={`fill-white ${line}`} strokeWidth={2} />}
    </svg>
  )
}

/**
 * One measurement against the crew member's own baseline. `pair` shows a second
 * value in the same card (systolic / diastolic).
 */
export function VitalCard({ id, s, pair }: { id: IndicatorId; s: CrewDayState; pair?: IndicatorId }) {
  const [info, setInfo] = useState(false)
  const def = INDICATORS[id]
  const st = s.states[id]
  const st2 = pair ? s.states[pair] : undefined
  const base = s.baselines[id]
  const level = st2 && LEVEL_RANK[st2.level] > LEVEL_RANK[st.level] ? st2.level : st.level
  const tone = TONE[level]
  const Icon = ICONS[id]
  const d = def.decimals
  const sign = id === 'skinTemp' && st.value !== undefined && st.value > 0 ? '+' : ''

  let value = '—'
  if (st.value !== undefined) value = pair && st2?.value !== undefined ? `${st.value.toFixed(0)}/${st2.value.toFixed(0)}` : `${sign}${st.value.toFixed(d)}`
  const baseline = pair
    ? `${base.mean.toFixed(0)}/${s.baselines[pair].mean.toFixed(0)}`
    : `${base.mean.toFixed(Math.max(d, 1))} ± ${base.sd.toFixed(Math.max(d, 1))}`
  const z = st.z
  const series = s.records.slice(Math.max(0, s.ctx.day - 7), s.ctx.day).map((r) => r.values[id])

  return (
    <div className={`rounded-lg border p-3 ${tone.box}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5 text-xs font-medium text-slate-600">
          <Icon className="size-4 shrink-0" aria-hidden />
          <span className="truncate">{pair ? 'Blood pressure' : def.label}</span>
        </div>
        <button type="button" onClick={() => setInfo(!info)} aria-expanded={info} aria-label={`About ${pair ? 'blood pressure' : def.label}`} className="-m-1 rounded p-1 text-slate-400 hover:text-navy">
          <Info className="size-4" aria-hidden />
        </button>
      </div>
      <div className="mt-1 flex items-end justify-between gap-2">
        <div>
          <span className="text-2xl font-bold text-navy">{value}</span>
          {def.unit && <span className="ml-1 text-xs text-slate-500">{def.unit}</span>}
        </div>
        <Sparkline values={series} base={base} line={tone.line} />
      </div>
      <div className="mt-1 flex flex-wrap items-center justify-between gap-x-2 text-xs">
        <span className="text-slate-500">Your baseline {baseline}</span>
        {z !== null && <span className={`font-semibold ${tone.dev}`}>{z >= 0 ? '+' : '−'}{Math.abs(z).toFixed(1)} SD</span>}
        {st.value === undefined && <span className="font-semibold text-slate-500">Not measured</span>}
      </div>
      {info && (
        <div className="mt-2 space-y-1 border-t border-black/10 pt-2 text-xs text-slate-700">
          <p><span className="font-semibold">Why it matters: </span>{def.why}</p>
          <p><span className="font-semibold">How to measure: </span>{def.how}</p>
        </div>
      )}
    </div>
  )
}
