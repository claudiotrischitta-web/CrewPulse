import { Code2, Globe2, HeartPulse, Play, Stethoscope, UserRound, X } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { Button } from './atoms'

/** On GitHub Pages (user.github.io/repo/) the source repository can be derived from the address. */
function repoUrl(): string | null {
  const { hostname, pathname } = window.location
  if (!hostname.endsWith('.github.io')) return null
  const repo = pathname.split('/').filter(Boolean)[0]
  return repo ? `https://github.com/${hostname.split('.')[0]}/${repo}` : null
}

const SEATS = [
  { icon: UserRound, title: 'Astronaut', who: 'A01 – A04', text: 'Sees only their own data, private stress and mood included.' },
  { icon: Stethoscope, title: 'Crew Medical Officer', who: 'CMO, on board', text: 'Sees the crew’s physical picture. Stress and mood stay private unless shared; an urgent case still arrives as “contact them today”.' },
  { icon: Globe2, title: 'Flight surgeon', who: 'Mission Control, on Earth', text: 'Sees everything, delayed by the real light-time from NASA/JPL Horizons: about 11 minutes from Mars.' },
]

const LOOK_FOR: [string, string][] = [
  ['Day 11 · A01', 'Sleep debt the day before an EVA, and a headache while cabin CO₂ is above the NASA limit.'],
  ['Day 11 · A03', 'Has not done the check-in yet. View as A03 and do it yourself, reaction test included.'],
  ['Day 12 · all', 'Replay of the real 20 May 2024 solar particle event: shelter now, EVA postponed.'],
  ['Day 13 · CMO', 'A02’s private alert turns urgent. The CMO learns only that A02 needs contact today.'],
  ['ISS · Moon · Mars', 'Switch the mission: communication delay and radiation change with NASA data.'],
]

export function Intro({ onClose, onTour }: { onClose: () => void; onTour: () => void }) {
  const dialog = useRef<HTMLDivElement>(null)
  const repo = repoUrl()

  useEffect(() => {
    dialog.current?.focus({ preventScroll: true })
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-[60] flex overflow-y-auto bg-navy/60 p-3 sm:p-6" onClick={onClose}>
      {/* m-auto centres the dialog when it fits and lets it scroll from the top when it does not */}
      <div ref={dialog} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="intro-title" onClick={(e) => e.stopPropagation()} className="relative m-auto w-full max-w-3xl rounded-2xl bg-white p-5 shadow-2xl outline-none sm:p-7">
        <button type="button" onClick={onClose} aria-label="Close" className="absolute right-3 top-3 rounded-lg p-2 text-slate-500 hover:bg-slate-100">
          <X className="size-5" aria-hidden />
        </button>

        <div className="flex items-center gap-3 pr-8">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-navy text-sky-300"><HeartPulse className="size-7" aria-hidden /></span>
          <div>
            <h1 id="intro-title" className="text-2xl font-extrabold text-navy">CrewPulse</h1>
            <p className="text-sm text-slate-600">Daily health monitoring for astronauts on the ISS, the Moon and Mars</p>
          </div>
        </div>

        <p className="mt-4 text-[15px] leading-relaxed text-slate-700">
          Every morning each crew member does a short check-in: a smart ring and a blood-pressure cuff, four questions, symptoms and a reaction test.
          CrewPulse compares the result with <strong>that person’s own pre-flight baseline</strong> and explains every alert: why, what to do now,
          when to check again, who to call, and the NASA source. Far from Earth the crew must act first, so the advice is written for them.
        </p>

        <h2 className="mt-5 text-xs font-bold uppercase tracking-wide text-slate-500">One app, three seats — switch with “View as”</h2>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          {SEATS.map(({ icon: Icon, title, who, text }) => (
            <div key={title} className="rounded-xl border border-slate-200 p-3">
              <div className="flex items-center gap-2 font-bold text-navy"><Icon className="size-4.5 shrink-0" aria-hidden />{title}</div>
              <div className="text-xs font-semibold text-slate-500">{who}</div>
              <p className="mt-1 text-sm text-slate-700">{text}</p>
            </div>
          ))}
        </div>

        <h2 className="mt-5 text-xs font-bold uppercase tracking-wide text-slate-500">What to look for · 14 simulated days, 1–14 Nov 2026</h2>
        <ul className="mt-2 divide-y divide-slate-100 rounded-xl border border-slate-200">
          {LOOK_FOR.map(([when, what]) => (
            <li key={when} className="flex flex-col gap-0.5 px-3 py-2 text-sm sm:flex-row sm:gap-3">
              <span className="shrink-0 font-bold text-navy sm:w-32">{when}</span>
              <span className="text-slate-700">{what}</span>
            </li>
          ))}
        </ul>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <Button kind="teal" onClick={onTour} className="sm:flex-1"><Play className="size-4" aria-hidden />Watch the 30-second tour</Button>
          <Button kind="ghost" onClick={onClose} className="sm:flex-1">Explore on my own</Button>
        </div>

        <p className="mt-4 text-xs leading-relaxed text-slate-500">
          Prototype with simulated data, built for the NASA Space Apps Challenge 2026 by Daniele Carlomusto, Federico Fazi, Tommaso Mearelli and Claudio Trischitta. Not a medical device: it does not diagnose and makes no fitness-for-duty decision.
          Every number on screen links to its source.
          {repo && (
            <> <a href={repo} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-navy underline underline-offset-2"><Code2 className="size-3.5" aria-hidden />Source code and references</a></>
          )}
        </p>
      </div>
    </div>
  )
}
