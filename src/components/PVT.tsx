import { useCallback, useEffect, useRef, useState } from 'react'
import { Button, Seg } from './atoms'

export interface PvtResult {
  mode: 'pvtb' | 'quick'
  /** Mean reaction time of valid responses, ms. */
  meanRt: number
  /** Responses of 355 ms or slower, timeouts included. */
  lapses: number
  falseStarts: number
  n: number
}

/** PVT-B: 3 minutes, 1-4 s between stimuli, lapse threshold 355 ms (Basner, Mollicone & Dinges 2011). */
const LAPSE_MS = 355
const TIMEOUT_MS = 3000
const DURATION_MS = { pvtb: 180_000, quick: 30_000 }
type Phase = 'idle' | 'wait' | 'go' | 'feedback' | 'done'

export const count = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`

export function PVT({ onDone }: { onDone: (r: PvtResult) => void }) {
  const [mode, setMode] = useState<'pvtb' | 'quick'>('quick')
  const [phase, setPhaseState] = useState<Phase>('idle')
  const [counter, setCounter] = useState(0)
  const [feedback, setFeedback] = useState('')
  const [left, setLeft] = useState(0)
  const [result, setResult] = useState<PvtResult | null>(null)
  const r = useRef({ phase: 'idle' as Phase, end: 0, shownAt: 0, rts: [] as number[], falseStarts: 0, timer: 0, raf: 0, mode: 'quick' as 'pvtb' | 'quick' })

  const setPhase = (p: Phase) => {
    r.current.phase = p
    setPhaseState(p)
  }
  const clear = () => {
    window.clearTimeout(r.current.timer)
    cancelAnimationFrame(r.current.raf)
  }

  const finish = useCallback(() => {
    clear()
    const { rts, falseStarts, mode: m } = r.current
    const valid = rts.filter((x) => x >= 100)
    const res: PvtResult = {
      mode: m,
      meanRt: valid.length ? Math.round(valid.reduce((a, b) => a + b, 0) / valid.length) : 0,
      lapses: valid.filter((x) => x >= LAPSE_MS).length,
      falseStarts: falseStarts + rts.filter((x) => x < 100).length,
      n: valid.length,
    }
    setResult(res)
    setPhase('done')
    onDone(res)
  }, [onDone])

  const next = useCallback(() => {
    clear()
    if (performance.now() >= r.current.end) return finish()
    setPhase('wait')
    r.current.timer = window.setTimeout(() => {
      r.current.shownAt = performance.now()
      setCounter(0)
      setPhase('go')
      const tick = () => {
        const elapsed = performance.now() - r.current.shownAt
        if (elapsed >= TIMEOUT_MS) {
          r.current.rts.push(TIMEOUT_MS)
          setFeedback('No response')
          setPhase('feedback')
          r.current.timer = window.setTimeout(next, 800)
          return
        }
        setCounter(Math.round(elapsed))
        r.current.raf = requestAnimationFrame(tick)
      }
      r.current.raf = requestAnimationFrame(tick)
    }, 1000 + Math.random() * 3000)
  }, [finish])

  const respond = useCallback(() => {
    const st = r.current
    if (st.phase === 'wait') {
      st.falseStarts++
      setFeedback('Too early — wait for the counter')
      next()
    } else if (st.phase === 'go') {
      clear()
      const rt = Math.round(performance.now() - st.shownAt)
      st.rts.push(rt)
      setCounter(rt)
      setFeedback(`${rt} ms`)
      setPhase('feedback')
      st.timer = window.setTimeout(next, 700)
    }
  }, [next])

  const start = () => {
    r.current = { ...r.current, mode, end: performance.now() + DURATION_MS[mode], rts: [], falseStarts: 0 }
    setResult(null)
    setFeedback('')
    setLeft(DURATION_MS[mode] / 1000)
    next()
  }

  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      if (ev.code !== 'Space' || r.current.phase === 'idle' || r.current.phase === 'done') return
      ev.preventDefault()
      respond()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      clear()
    }
  }, [respond])

  const running = phase === 'wait' || phase === 'go' || phase === 'feedback'
  useEffect(() => {
    if (!running) return
    const t = setInterval(() => setLeft(Math.max(0, Math.ceil((r.current.end - performance.now()) / 1000))), 250)
    return () => clearInterval(t)
  }, [running])

  return (
    <div className="space-y-3">
      {!running && (
        <div className="flex flex-wrap items-center gap-3">
          <Seg
            label="Test length"
            value={mode}
            onChange={setMode}
            options={[{ value: 'quick', label: '30-second check' }, { value: 'pvtb', label: '3-minute PVT-B' }]}
          />
          <Button onClick={start}>{result ? 'Run again' : 'Start'}</Button>
        </div>
      )}
      <p className="text-sm text-slate-600">
        {mode === 'pvtb'
          ? 'The validated test: 3 minutes. A response of 355 ms or slower counts as a lapse.'
          : 'A quick look at your alertness. It is not validated, so it never raises an alert on its own.'}
        {' '}Tap the panel, or press the space bar, as soon as the counter appears.
      </p>
      <div
        role="button"
        tabIndex={running ? 0 : -1}
        aria-label="Reaction test: tap as soon as the counter appears"
        onPointerDown={(ev) => {
          if (!running) return
          ev.preventDefault()
          respond()
        }}
        className={`grid h-56 touch-none select-none place-items-center rounded-xl border-2 text-center ${phase === 'go' ? 'border-red-500 bg-slate-900' : 'border-slate-300 bg-slate-800'}`}
      >
        {phase === 'idle' && <span className="text-slate-300">Choose a length and press Start</span>}
        {phase === 'wait' && <span className="text-slate-400">{feedback || 'Wait…'}</span>}
        {phase === 'go' && <span className="font-mono text-6xl font-bold text-red-400">{counter}</span>}
        {phase === 'feedback' && <span className="font-mono text-4xl font-bold text-amber-300">{feedback}</span>}
        {phase === 'done' && result && (
          <span className="text-slate-100">
            <span className="block text-sm text-slate-300">Mean reaction time</span>
            <span className="block font-mono text-5xl font-bold">{result.meanRt} ms</span>
            <span className="mt-1 block text-sm text-slate-300">
              {count(result.n, 'response')} · {count(result.lapses, 'lapse')} · {count(result.falseStarts, 'false start')}
            </span>
          </span>
        )}
      </div>
      {running && <p className="text-sm font-semibold text-slate-600" aria-live="polite">{left} s left</p>}
    </div>
  )
}
