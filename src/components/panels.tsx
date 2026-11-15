import { Activity, Brain, ClipboardList, Lock, Moon, Radiation, Wind } from 'lucide-react'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { CAREER_LIMIT_MSV, CO2_HEADACHE_7D_MMHG, CO2_LIMIT_1H_MMHG, ENVIRONMENTS, SEP_EVENT } from '../data/environments'
import { SYMPTOM_AREAS, SYMPTOMS, symptomLabel } from '../data/indicators'
import type { CrewDayState } from '../engine/crew'
import { co2SevenDayAvg } from '../engine/rules'
import { SCENARIO } from '../engine/crew'
import { formatDelay, oneWayDelaySeconds } from '../engine/sync'
import type { Env } from '../engine/types'
import { Card, Refs, SectionTitle, Tile } from './atoms'
import { BodyMap } from './BodyMap'
import { VitalCard } from './VitalCard'

export function VitalsPanel({ s }: { s: CrewDayState }) {
  return (
    <Card>
      <SectionTitle icon={Activity} title="Vital signs" aside="Ring overnight · cuff at check-in · grey band = your normal range" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <VitalCard id="hr" s={s} />
        <VitalCard id="hrv" s={s} />
        <VitalCard id="sbp" pair="dbp" s={s} />
        <VitalCard id="spo2" s={s} />
        <VitalCard id="skinTemp" s={s} />
        <VitalCard id="respRate" s={s} />
      </div>
    </Card>
  )
}

export function SleepPanel({ s }: { s: CrewDayState }) {
  const base = s.baselines.sleepH
  const data = s.records.slice(Math.max(0, s.ctx.day - 7), s.ctx.day).map((r) => ({ label: `D${r.day}`, hours: r.values.sleepH ?? 0 }))
  const quick = s.record.pvtMode === 'quick'
  return (
    <Card>
      <SectionTitle icon={Moon} title="Sleep and alertness" aside={quick ? '30-second reaction check: indicative only' : 'Reaction test: 3-minute PVT-B'} />
      <div className="grid gap-3 lg:grid-cols-2">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <VitalCard id="sleepH" s={s} />
          <VitalCard id="sleepQuality" s={s} />
          <VitalCard id="fatigue" s={s} />
          <VitalCard id="pvtRt" s={s} />
          {!quick && <VitalCard id="pvtLapses" s={s} />}
        </div>
        <div>
          <h3 className="mb-1 text-sm font-semibold text-slate-700">Sleep, last {data.length} nights (hours)</h3>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 16, right: 8, bottom: 0, left: -18 }}>
                <CartesianGrid vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} tickLine={false} />
                <YAxis domain={[0, 10]} ticks={[0, 2, 4, 6, 8, 10]} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: '#f1f5f9' }} />
                <ReferenceLine y={base.mean} stroke="#0b2a5b" strokeDasharray="5 4" label={{ value: `your normal ${base.mean.toFixed(1)} h`, position: 'insideTopRight', fontSize: 11, fill: '#0b2a5b' }} />
                <Bar dataKey="hours" radius={[4, 4, 0, 0]} label={{ position: 'top', fontSize: 11, fill: '#334155' }}>
                  {data.map((d) => <Cell key={d.label} fill={d.hours < base.mean - base.sd ? '#d97706' : '#38bdf8'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-slate-500">Orange = more than 1 SD below your own normal.</p>
        </div>
      </div>
    </Card>
  )
}

export function WellbeingPanel({ s, visible, shared, self }: { s: CrewDayState; visible: boolean; shared: boolean; self: boolean }) {
  if (!visible) {
    return (
      <Card className="border-dashed bg-slate-50">
        <SectionTitle icon={Lock} title="Wellbeing — private" />
        <p className="text-sm text-slate-600">
          Stress, mood and private conference requests are visible to the crew member and to the ground medical team only.
          You are a crewmate: you see them only if {s.member.id} chooses to share. An urgent wellbeing alert still reaches you as a request to make contact, without details.
        </p>
      </Card>
    )
  }
  return (
    <Card>
      <SectionTitle
        icon={Brain}
        title="Wellbeing"
        aside={self ? (shared ? 'Shared with your CMO by your choice' : 'Private: only you and the ground medical team') : shared ? `Shared by ${s.member.id}` : 'Confidential: ground medical team'}
      />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <VitalCard id="stress" s={s} />
        <VitalCard id="mood" s={s} />
      </div>
    </Card>
  )
}

export function RadiationPanel({ s, env }: { s: CrewDayState; env: Env }) {
  const e = ENVIRONMENTS[env]
  const { dose } = s
  const sep = s.ctx.sep
  const pct = Math.min(100, dose.careerPct)
  return (
    <Card>
      <SectionTitle icon={Radiation} title="Radiation exposure" aside={`Personal dosimeter · ${e.label}`} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Tile label="Today" value={dose.today.toFixed(2)} unit="mSv" tone={sep ? 'red' : 'slate'} note={sep ? `${Math.round(dose.ratio)}× normal` : `normal ${dose.nominal.toFixed(2)} mSv/day`} />
        <Tile label="This mission" value={dose.mission.toFixed(1)} unit="mSv" note={`mission day ${e.missionDayStart + s.ctx.day - 1}`} />
        <Tile label="Career" value={dose.career.toFixed(0)} unit="mSv" tone={dose.careerPct >= 100 ? 'red' : dose.careerPct >= 80 ? 'amber' : 'slate'} note={`${dose.careerPct.toFixed(0)} % of the ${CAREER_LIMIT_MSV} mSv limit`} />
      </div>
      <div className="mt-3" role="img" aria-label={`Career dose ${dose.careerPct.toFixed(0)} percent of the NASA limit`}>
        <div className="h-2.5 overflow-hidden rounded-full bg-slate-200">
          <div className={`h-full rounded-full ${dose.careerPct >= 80 ? 'bg-amber-500' : 'bg-teal-600'}`} style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-0.5 flex justify-between text-[11px] text-slate-500"><span>0</span><span>NASA career limit {CAREER_LIMIT_MSV} mSv</span></div>
      </div>
      <h3 className="mb-1 mt-3 text-sm font-semibold text-slate-700">Mission dose, cumulative (mSv)</h3>
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={dose.series} margin={{ top: 14, right: 12, bottom: 0, left: -8 }}>
            <CartesianGrid vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="label" tick={{ fontSize: 12 }} tickLine={false} />
            <YAxis domain={['dataMin', 'dataMax']} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} tickFormatter={(v: number) => v.toFixed(0)} />
            <Tooltip />
            {dose.series.filter((p) => p.eva).map((p) => (
              <ReferenceLine key={p.label} x={p.label} stroke="#ea580c" strokeDasharray="4 3" label={{ value: 'EVA', position: 'top', fontSize: 11, fill: '#c2410c' }} />
            ))}
            {dose.series.filter((p) => p.sep).map((p) => (
              <ReferenceLine key={p.label} x={p.label} stroke="#dc2626" label={{ value: 'Solar event', position: 'top', fontSize: 11, fill: '#b91c1c' }} />
            ))}
            <Area type="monotone" dataKey="cum" name="mSv" stroke="#0f766e" fill="#99f6e4" fillOpacity={0.5} strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 space-y-1 text-xs text-slate-500">
        <p>Rate: {e.doseSource}. Before this 14-day window: {e.doseBeforeWindow.toFixed(1)} mSv ({e.doseBeforeNote}). Dose equivalent is treated as effective dose (approximation).</p>
        {dose.series.some((p) => p.sep) && <p>{SEP_EVENT.name}, {SEP_EVENT.donki}. {SEP_EVENT.note[env]}</p>}
        <Refs ids={['std3001-rad', 'rad-msl']} />
      </div>
    </Card>
  )
}

export function EnvironmentPanel({ s, env }: { s: CrewDayState; env: Env }) {
  const e = ENVIRONMENTS[env]
  const avg7 = co2SevenDayAvg(SCENARIO.days, s.ctx.day)
  const delay = oneWayDelaySeconds(env, s.ctx.date)
  const tomorrow = SCENARIO.days[s.ctx.day]
  const evaNote = s.ctx.eva?.crew.includes(s.member.id)
    ? s.ctx.sep ? 'EVA today: postponed (solar event)' : `EVA today, ${s.ctx.eva.hours} h`
    : tomorrow?.eva?.crew.includes(s.member.id) ? 'EVA planned tomorrow' : 'No EVA today or tomorrow'
  return (
    <Card>
      <SectionTitle icon={Wind} title="Cabin and mission" aside={`${e.place} · ${e.gravity}`} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Tile label="CO₂, 1-hour peak" value={s.ctx.co2Max1h.toFixed(1)} unit="mmHg" tone={s.ctx.co2Max1h > CO2_LIMIT_1H_MMHG ? 'amber' : 'slate'} note={`NASA limit ${CO2_LIMIT_1H_MMHG.toFixed(1)}`} />
        <Tile label="CO₂, 24-hour average" value={s.ctx.co2Avg24h.toFixed(1)} unit="mmHg" />
        <Tile label="CO₂, 7-day average" value={avg7.toFixed(1)} unit="mmHg" tone={avg7 > CO2_HEADACHE_7D_MMHG ? 'amber' : 'slate'} note={`headaches rise above ${CO2_HEADACHE_7D_MMHG.toFixed(1)}`} />
      </div>
      <dl className="mt-3 grid grid-cols-1 gap-x-4 gap-y-1 text-sm sm:grid-cols-2">
        <div className="flex justify-between gap-2"><dt className="text-slate-500">Signal to Earth, one way</dt><dd className="font-semibold text-navy">{formatDelay(delay)}</dd></div>
        <div className="flex justify-between gap-2"><dt className="text-slate-500">Question and answer</dt><dd className="font-semibold text-navy">{delay < 0.5 ? 'near real time' : `at least ${formatDelay(delay * 2)}`}</dd></div>
        <div className="flex justify-between gap-2 sm:col-span-2"><dt className="text-slate-500">Activity</dt><dd className="font-semibold text-navy">{evaNote}</dd></div>
      </dl>
      <Refs ids={['std3001-co2', 'horizons']} className="mt-2" />
    </Card>
  )
}

export function SymptomPanel({ s }: { s: CrewDayState }) {
  const { record } = s
  const reported = record.symptoms
  const areasHit = new Set(reported.map((r) => SYMPTOMS.find((d) => d.id === r.id)?.area))
  const trend = { worse: 'Getting worse', same: 'Unchanged', better: 'Improving' }
  return (
    <Card>
      <SectionTitle icon={ClipboardList} title="Symptoms" aside={record.complete ? `${reported.length} reported` : 'Questionnaire not done yet'} />
      <div className="grid items-start gap-4 sm:grid-cols-[14rem_1fr]">
        <BodyMap symptoms={reported} body={s.member.body} dim={!record.complete} className="mx-auto w-56 max-w-full sm:w-full" />
        <div className="min-w-0">
          {!record.complete ? (
            <p className="text-sm text-slate-600">The symptom questionnaire is part of the morning check-in, which has not been completed today.</p>
          ) : (
            <>
              {reported.length > 0 ? (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
                      <th className="py-1.5 font-semibold">Symptom</th><th className="py-1.5 font-semibold">Intensity</th><th className="py-1.5 font-semibold">Course</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reported.map((r) => (
                      <tr key={r.id} className="border-b border-slate-100">
                        <td className="py-1.5 font-medium text-slate-800">{symptomLabel(r.id)}</td>
                        <td className="py-1.5">{r.intensity}/10</td>
                        <td className="py-1.5">{r.onset === 'new' ? 'New today' : trend[r.trend]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-sm text-slate-600">No symptoms reported today.</p>
              )}
              <h3 className="mb-1.5 mt-3 text-xs font-semibold text-slate-500">Areas checked with nothing to report</h3>
              <ul className="flex flex-wrap gap-1.5">
                {SYMPTOM_AREAS.filter((a) => !areasHit.has(a)).map((a) => (
                  <li key={a} className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-800">✓ {a}</li>
                ))}
              </ul>
              <p className="mt-3 text-sm text-slate-600"><span className="font-semibold">Medication today: </span>{record.meds.length ? record.meds.join(', ') : 'none'}</p>
            </>
          )}
        </div>
      </div>
    </Card>
  )
}
