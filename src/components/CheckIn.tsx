import { ArrowLeft, ArrowRight, Check, Watch } from 'lucide-react'
import { useCallback, useState } from 'react'
import { INDICATORS, MEDS, RING_IDS, SYMPTOM_AREAS, SYMPTOMS, type SymptomArea } from '../data/indicators'
import { BASELINES, SCENARIO } from '../engine/crew'
import type { DayRecord, IndicatorId, Symptom, Values } from '../engine/types'
import { makePacket, useStore } from '../state/store'
import { Button, Card } from './atoms'
import { BodyMap } from './BodyMap'
import { PVT, count, type PvtResult } from './PVT'

const STEPS = ['Devices', 'How you feel', 'Symptoms', 'Medication', 'Reaction test', 'Review']
const SCALES: { id: IndicatorId; question: string; low: string; high: string }[] = [
  { id: 'sleepQuality', question: 'How well did you sleep?', low: 'Worst night', high: 'Fully rested' },
  { id: 'fatigue', question: 'How tired are you right now?', low: 'Fresh', high: 'Exhausted' },
  { id: 'stress', question: 'How stressed do you feel?', low: 'Calm', high: 'Overwhelmed' },
  { id: 'mood', question: 'How is your mood?', low: 'Very low', high: 'Very good' },
]

const areaAnchor = (area: string) => `symptoms-${area.toLowerCase().replace(/[^a-z]+/g, '-')}`

/** Morning check-in: about 7 minutes with the 3-minute reaction test, under 4 with the quick one. */
export function CheckIn({ id }: { id: string }) {
  const { state, dispatch } = useStore()
  const day = state.day
  const scenarioRec = SCENARIO.records[id][day - 1]
  const [step, setStep] = useState(0)
  const [ring, setRing] = useState<Values | null>(null)
  const [bp, setBp] = useState({ sbp: '', dbp: '' })
  const [scores, setScores] = useState<Record<string, number>>({ sleepQuality: 5, fatigue: 5, stress: 5, mood: 5 })
  const [symptoms, setSymptoms] = useState<Symptom[]>([])
  const [meds, setMeds] = useState<string[]>([])
  const [pvt, setPvt] = useState<PvtResult | null>(null)
  const onPvt = useCallback((r: PvtResult) => setPvt(r), [])

  const sbp = Number(bp.sbp), dbp = Number(bp.dbp)
  const bpOk = sbp >= 70 && sbp <= 230 && dbp >= 40 && dbp <= 140 && sbp > dbp
  const recentEva = SCENARIO.days.slice(Math.max(0, day - 2), day).find((d) => d.eva?.crew.includes(id) && !d.sep)

  // Simulated ring: the overnight values of the scenario stand in for a real wearable.
  const syncRing = () => setRing(Object.fromEntries(RING_IDS.map((k) => [k, scenarioRec.values[k] ?? Number(BASELINES[id][k].mean.toFixed(INDICATORS[k].decimals))])) as Values)

  const toggleSymptom = (sid: string) =>
    setSymptoms((cur) => (cur.some((s) => s.id === sid) ? cur.filter((s) => s.id !== sid) : [...cur, { id: sid, intensity: 3, onset: 'new', trend: 'same' }]))
  const patchSymptom = (sid: string, patch: Partial<Symptom>) => setSymptoms((cur) => cur.map((s) => (s.id === sid ? { ...s, ...patch } : s)))
  const [focus, setFocus] = useState<SymptomArea | null>(null)
  const jumpTo = (area: SymptomArea) => {
    setFocus(area)
    document.getElementById(areaAnchor(area))?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }

  const save = () => {
    const record: DayRecord = {
      day, complete: !!ring && bpOk, live: true, pvtMode: pvt?.mode,
      savedAt: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
      values: {
        ...(ring ?? {}),
        ...(bpOk ? { sbp, dbp } : {}),
        ...scores,
        ...(pvt && pvt.n > 0 ? { pvtRt: pvt.meanRt, ...(pvt.mode === 'pvtb' ? { pvtLapses: pvt.lapses } : {}) } : {}),
      },
      symptoms, meds,
    }
    dispatch({ type: 'checkin', id, record })
    dispatch({ type: 'packet', packet: makePacket(state, { dir: 'toGround', kind: 'checkin', from: id, subjectId: id, text: `Morning check-in of day ${day}.` }) })
    dispatch({ type: 'page', page: 'health' })
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <h1 className="text-2xl font-extrabold text-navy">Morning check-in · {id}</h1>
        <p className="text-sm text-slate-600">Day {day}. Your answers update your own picture first; they reach Earth after the signal delay.</p>
      </div>

      <ol className="flex flex-wrap gap-1.5" aria-label="Progress">
        {STEPS.map((name, i) => (
          <li key={name} aria-current={i === step ? 'step' : undefined} className={`rounded-full px-3 py-1 text-xs font-semibold ${i === step ? 'bg-navy text-white' : i < step ? 'bg-teal-100 text-teal-900' : 'bg-slate-200 text-slate-600'}`}>
            {i + 1}. {name}
          </li>
        ))}
      </ol>

      <Card className="space-y-4">
        {step === 0 && (
          <>
            <h2 className="text-lg font-bold text-navy">Ring and blood pressure</h2>
            <div className="rounded-lg border border-slate-200 p-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-slate-700"><span className="font-semibold">Ring.</span> Heart rate, variability, oxygen, skin temperature, breathing and sleep are read overnight.</p>
                <Button kind={ring ? 'ghost' : 'primary'} onClick={syncRing}><Watch className="size-4" aria-hidden />{ring ? 'Synced' : 'Sync ring'}</Button>
              </div>
              {ring && (
                <ul className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm sm:grid-cols-3">
                  {RING_IDS.map((k) => <li key={k} className="flex justify-between gap-2"><span className="text-slate-500">{INDICATORS[k].label}</span><span className="font-semibold text-navy">{ring[k]} {INDICATORS[k].unit}</span></li>)}
                </ul>
              )}
              <p className="mt-2 text-xs text-slate-500">Prototype: ring values are simulated.</p>
            </div>
            <div className="rounded-lg border border-slate-200 p-3">
              <p className="text-sm text-slate-700"><span className="font-semibold">Blood pressure cuff.</span> {INDICATORS.sbp.how}</p>
              <div className="mt-2 flex flex-wrap items-end gap-3">
                <label className="text-sm font-semibold text-slate-700">Systolic
                  <input inputMode="numeric" value={bp.sbp} onChange={(ev) => setBp({ ...bp, sbp: ev.target.value.replace(/\D/g, '').slice(0, 3) })} placeholder="118" className="mt-1 block w-24 rounded-lg border border-slate-300 p-2 text-lg" />
                </label>
                <span className="pb-2 text-2xl text-slate-400">/</span>
                <label className="text-sm font-semibold text-slate-700">Diastolic
                  <input inputMode="numeric" value={bp.dbp} onChange={(ev) => setBp({ ...bp, dbp: ev.target.value.replace(/\D/g, '').slice(0, 3) })} placeholder="76" className="mt-1 block w-24 rounded-lg border border-slate-300 p-2 text-lg" />
                </label>
                <span className="pb-2.5 text-sm text-slate-500">mmHg</span>
              </div>
              {(bp.sbp || bp.dbp) && !bpOk && <p className="mt-1 text-sm text-amber-800">Check the two numbers: systolic is the higher one.</p>}
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <h2 className="text-lg font-bold text-navy">How do you feel this morning?</h2>
            {SCALES.map((q) => (
              <div key={q.id}>
                <label htmlFor={`scale-${q.id}`} className="flex items-baseline justify-between gap-3 text-sm font-semibold text-slate-800">
                  {q.question}<span className="text-xl font-bold text-navy">{scores[q.id]}<span className="text-sm font-medium text-slate-500">/10</span></span>
                </label>
                <input id={`scale-${q.id}`} type="range" min={0} max={10} step={1} value={scores[q.id]} onChange={(ev) => setScores({ ...scores, [q.id]: Number(ev.target.value) })} className="w-full" />
                <div className="flex justify-between text-xs text-slate-500"><span>0 · {q.low}</span><span>10 · {q.high}</span></div>
              </div>
            ))}
            <p className="text-xs text-slate-500">Stress and mood are private: only you and the ground medical team see them, unless you decide to share them with your CMO.</p>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="text-lg font-bold text-navy">Any symptoms today?</h2>
            {recentEva && (
              <p className="rounded-lg border border-orange-300 bg-orange-50 p-2.5 text-sm text-orange-900">
                You did an EVA on day {recentEva.day}. Check joint pain, tingling and skin changes with care: they can be signs of decompression sickness.
              </p>
            )}
            <div className="grid items-start gap-4 sm:grid-cols-[14rem_1fr] lg:grid-cols-[16rem_1fr]">
              <div className="sm:sticky sm:top-4">
                <BodyMap symptoms={symptoms} body={SCENARIO.crew.find((m) => m.id === id)?.body} selected={focus} onSelect={jumpTo} className="mx-auto w-64 max-w-full sm:w-full" />
                <p className="mt-1 text-center text-xs text-slate-500">Tap an area to jump to its symptoms.</p>
              </div>
              <div className="space-y-3">
                {SYMPTOM_AREAS.map((area) => (
                  <section key={area} id={areaAnchor(area)} className={`scroll-mt-4 rounded-xl p-1.5 transition-shadow ${focus === area ? 'ring-2 ring-sky-400' : ''}`}>
                    <h3 className="mb-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">{area}</h3>
                    <ul className="space-y-2">
                      {SYMPTOMS.filter((def) => def.area === area).map((def) => {
                        const cur = symptoms.find((s) => s.id === def.id)
                        return (
                          <li key={def.id} className={`rounded-lg border p-2.5 ${cur ? 'border-amber-300 bg-amber-50' : def.postEva && recentEva ? 'border-orange-200' : 'border-slate-200'}`}>
                            <label className="flex items-center gap-2.5 text-sm font-medium text-slate-800">
                              <input type="checkbox" checked={!!cur} onChange={() => toggleSymptom(def.id)} className="size-5" />
                              {def.label}
                            </label>
                            {cur && (
                              <div className="mt-2 grid gap-3 pl-7 text-sm sm:grid-cols-3">
                                <label className="font-medium text-slate-700">Intensity {cur.intensity}/10
                                  <input type="range" min={1} max={10} value={cur.intensity} onChange={(ev) => patchSymptom(def.id, { intensity: Number(ev.target.value) })} className="block w-full" />
                                </label>
                                <label className="font-medium text-slate-700">Since
                                  <select value={cur.onset} onChange={(ev) => patchSymptom(def.id, { onset: ev.target.value as Symptom['onset'] })} className="mt-1 block w-full rounded-lg border border-slate-300 bg-white p-2">
                                    <option value="new">New today</option><option value="ongoing">Before today</option>
                                  </select>
                                </label>
                                <label className="font-medium text-slate-700">Course
                                  <select value={cur.trend} onChange={(ev) => patchSymptom(def.id, { trend: ev.target.value as Symptom['trend'] })} className="mt-1 block w-full rounded-lg border border-slate-300 bg-white p-2">
                                    <option value="worse">Getting worse</option><option value="same">Unchanged</option><option value="better">Improving</option>
                                  </select>
                                </label>
                              </div>
                            )}
                          </li>
                        )
                      })}
                    </ul>
                  </section>
                ))}
              </div>
            </div>
            <p className="text-sm text-slate-500">Nothing to report? Leave everything unticked and go on.</p>
          </>
        )}

        {step === 3 && (
          <>
            <h2 className="text-lg font-bold text-navy">Medication in the last 24 hours</h2>
            <div className="flex flex-wrap gap-2">
              {MEDS.map((m) => {
                const on = meds.includes(m)
                return (
                  <button key={m} type="button" aria-pressed={on} onClick={() => setMeds(on ? meds.filter((x) => x !== m) : [...meds, m])} className={`rounded-full border-2 px-4 py-2 text-sm font-semibold ${on ? 'border-navy bg-navy text-white' : 'border-slate-300 bg-white text-slate-700'}`}>
                    {m}
                  </button>
                )
              })}
            </div>
            <p className="text-sm text-slate-500">{meds.length ? `Logged: ${meds.join(', ')}.` : 'None selected: nothing will be logged.'}</p>
          </>
        )}

        {step === 4 && (
          <>
            <h2 className="text-lg font-bold text-navy">Reaction test</h2>
            <PVT onDone={onPvt} />
          </>
        )}

        {step === 5 && (
          <>
            <h2 className="text-lg font-bold text-navy">Review and save</h2>
            <dl className="grid grid-cols-1 gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
              <div className="flex justify-between gap-2"><dt className="text-slate-500">Ring</dt><dd className="font-semibold">{ring ? 'Synced' : 'Not synced'}</dd></div>
              <div className="flex justify-between gap-2"><dt className="text-slate-500">Blood pressure</dt><dd className="font-semibold">{bpOk ? `${sbp}/${dbp} mmHg` : 'Not measured'}</dd></div>
              {SCALES.map((q) => <div key={q.id} className="flex justify-between gap-2"><dt className="text-slate-500">{INDICATORS[q.id].label}</dt><dd className="font-semibold">{scores[q.id]}/10</dd></div>)}
              <div className="flex justify-between gap-2"><dt className="text-slate-500">Symptoms</dt><dd className="font-semibold">{symptoms.length ? symptoms.map((s) => SYMPTOMS.find((d) => d.id === s.id)?.label).join(', ') : 'None'}</dd></div>
              <div className="flex justify-between gap-2"><dt className="text-slate-500">Medication</dt><dd className="font-semibold">{meds.length ? meds.join(', ') : 'None'}</dd></div>
              <div className="flex justify-between gap-2"><dt className="text-slate-500">Reaction test</dt><dd className="font-semibold">{pvt && pvt.n > 0 ? `${pvt.meanRt} ms${pvt.mode === 'quick' ? ' (quick check)' : `, ${count(pvt.lapses, 'lapse')}`}` : 'Skipped'}</dd></div>
            </dl>
            {(!ring || !bpOk) && <p className="rounded-lg border border-amber-300 bg-amber-50 p-2.5 text-sm text-amber-900">Ring or blood pressure is missing: the check-in will be saved as incomplete.</p>}
          </>
        )}
      </Card>

      <div className="flex flex-wrap justify-between gap-3">
        <Button kind="ghost" onClick={() => (step === 0 ? dispatch({ type: 'page', page: 'health' }) : setStep(step - 1))}>
          <ArrowLeft className="size-4" aria-hidden />{step === 0 ? 'Cancel' : 'Back'}
        </Button>
        {step < STEPS.length - 1
          ? <Button onClick={() => setStep(step + 1)}>Next<ArrowRight className="size-4" aria-hidden /></Button>
          : <Button kind="teal" onClick={save}><Check className="size-4" aria-hidden />Save check-in</Button>}
      </div>
    </div>
  )
}
