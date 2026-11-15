import { useCallback, useEffect, useState } from 'react'
import { CheckIn } from './components/CheckIn'
import { CrewDashboard } from './components/CrewDashboard'
import { HealthDetail } from './components/HealthDetail'
import { Intro } from './components/Intro'
import { TopBar } from './components/TopBar'
import type { Env, Viewer } from './engine/types'
import { useStore } from './state/store'

/** The 30-second tour used for the submission video: one day seen from three seats, the storm, the break-glass flag, the recovery. */
const TOUR: { viewer: Viewer; env: Env; day: number; selected: string; caption: string }[] = [
  { viewer: { role: 'astronaut', id: 'A01' }, env: 'mars', day: 11, selected: 'A01', caption: 'Day 11 on Mars. A01 sees why they are flagged and what to do now.' },
  { viewer: { role: 'cmo' }, env: 'mars', day: 11, selected: 'A01', caption: 'The medical officer on board sees the physical picture. Stress and mood stay private.' },
  { viewer: { role: 'ground' }, env: 'mars', day: 11, selected: 'A02', caption: 'The flight surgeon on Earth sees everything, 11 minutes late, A02’s private strain included.' },
  { viewer: { role: 'astronaut', id: 'A01' }, env: 'mars', day: 12, selected: 'A01', caption: 'Day 12. A solar particle event: shelter now, the EVA is postponed.' },
  { viewer: { role: 'cmo' }, env: 'mars', day: 13, selected: 'A02', caption: 'Day 13. A02’s private alert turns urgent. The officer learns only: contact A02 today.' },
  { viewer: { role: 'astronaut', id: 'A01' }, env: 'mars', day: 14, selected: 'A01', caption: 'Day 14. After acting on the advice, A01 is back within their own baseline.' },
]
const STEP_MS = 5000
const INTRO_KEY = 'crewpulse:intro-seen'

function introSeen() {
  try {
    return localStorage.getItem(INTRO_KEY) === '1'
  } catch {
    return false
  }
}

export default function App() {
  const { state, dispatch } = useStore()
  const [tour, setTour] = useState<number | null>(null)
  const [intro, setIntro] = useState(() => !introSeen())

  useEffect(() => {
    if (tour === null) return
    const step = TOUR[tour]
    dispatch({ type: 'env', env: step.env })
    dispatch({ type: 'day', day: step.day })
    dispatch({ type: 'view', viewer: step.viewer, selected: step.selected })
    window.scrollTo({ top: 0 })
    const t = setTimeout(() => setTour(tour + 1 < TOUR.length ? tour + 1 : null), STEP_MS)
    return () => clearTimeout(t)
  }, [tour, dispatch])

  const closeIntro = useCallback(() => {
    setIntro(false)
    try {
      localStorage.setItem(INTRO_KEY, '1')
    } catch {
      /* storage unavailable: the intro will simply show again next time */
    }
  }, [])

  const v = state.viewer
  return (
    <div className="min-h-screen">
      <TopBar demo={tour !== null} onDemo={() => setTour(tour === null ? 0 : null)} onAbout={() => { setTour(null); setIntro(true) }} />
      <main className="mx-auto max-w-7xl px-3 pb-28 pt-4 sm:px-5">
        {v.role !== 'astronaut'
          ? <CrewDashboard viewer={v} />
          : state.page === 'checkin'
            ? <CheckIn key={`${v.id}:${state.day}`} id={v.id} />
            : <HealthDetail subjectId={v.id} viewer={v} />}
      </main>
      {tour !== null && (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 p-3" aria-live="polite">
          <div className="mx-auto max-w-3xl rounded-xl bg-navy/95 px-5 py-3.5 text-center text-lg font-semibold text-white shadow-xl">
            {TOUR[tour].caption}
            <div className="mt-2 flex justify-center gap-1.5">
              {TOUR.map((_, i) => <span key={i} className={`h-1.5 w-8 rounded-full ${i <= tour ? 'bg-sky-300' : 'bg-white/25'}`} />)}
            </div>
          </div>
        </div>
      )}
      {intro && <Intro onClose={closeIntro} onTour={() => { closeIntro(); setTour(0) }} />}
    </div>
  )
}
