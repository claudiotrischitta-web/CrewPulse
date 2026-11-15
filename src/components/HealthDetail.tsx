import { CircleCheck, ClipboardList, Info, UserRound } from 'lucide-react'
import { isCabinAdvisory, overallLevel } from '../engine/crew'
import { alertsFor, canSee } from '../engine/policy'
import { formatDelay, oneWayDelaySeconds } from '../engine/sync'
import type { Viewer } from '../engine/types'
import { useCrew, useStore } from '../state/store'
import { LEVEL_UI } from '../ui/levels'
import { AlertCard } from './AlertCard'
import { Button, Card, LevelChip } from './atoms'
import { CommPanel } from './CommPanel'
import { EnvironmentPanel, RadiationPanel, SleepPanel, SymptomPanel, VitalsPanel, WellbeingPanel } from './panels'

/**
 * One crew member's health picture. The same component serves the three roles:
 * what it shows is decided by policy.ts, not by separate screens.
 */
export function HealthDetail({ subjectId, viewer }: { subjectId: string; viewer: Viewer }) {
  const { state, dispatch } = useStore()
  const s = useCrew()[subjectId]
  const self = viewer.role === 'astronaut'
  const shared = !!state.share[subjectId]
  const alerts = alertsFor(viewer, subjectId, s.alerts, shared)
  const level = overallLevel(alerts, s.record)
  const ui = LEVEL_UI[level]
  const seePsych = canSee(viewer, subjectId, 'psych', shared)
  const delay = oneWayDelaySeconds(state.env, s.ctx.date)
  const personal = alerts.filter((a) => !isCabinAdvisory(a))

  const checkin = s.record.live
    ? `Live check-in saved at ${s.record.savedAt}`
    : s.record.complete ? 'Morning check-in 07:15' : 'Ring data synced overnight · check-in not done yet'
  const headline = level === 'ok'
    ? self ? 'You are within your own normal range today.' : 'Within personal baseline today.'
    : level === 'incomplete'
      ? self ? 'Do your morning check-in to complete today’s picture.' : 'Waiting for the morning check-in.'
      : personal.map((a) => a.title).slice(0, 2).join(' · ')

  return (
    <div className="space-y-4">
      <Card className={`border-2 ${ui.card}`}>
        <div className="flex flex-wrap items-center gap-4">
          <div className="hidden size-16 shrink-0 place-items-center rounded-full bg-sky-100 text-navy sm:grid"><UserRound className="size-9" aria-hidden /></div>
          <div className="min-w-0 flex-1 basis-64">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <h1 className="text-2xl font-extrabold text-navy">{self ? `My health · ${subjectId}` : `Astronaut ${subjectId}`}</h1>
              <LevelChip level={level} className="text-sm" />
            </div>
            <p className="text-sm text-slate-600">{s.member.title} · {checkin}</p>
            <p className="mt-1 font-medium text-slate-800">{headline}</p>
            {viewer.role === 'ground' && delay >= 0.5 && (
              <p className="mt-1 text-sm font-semibold text-sky-800">What you see left the vehicle at least {formatDelay(delay)} ago.</p>
            )}
          </div>
          {self && (
            <Button onClick={() => dispatch({ type: 'page', page: 'checkin' })} kind={s.record.complete ? 'ghost' : 'primary'}>
              <ClipboardList className="size-4" aria-hidden />{s.record.complete ? 'Redo check-in' : 'Start morning check-in'}
            </Button>
          )}
        </div>
      </Card>

      {alerts.length > 0 ? (
        <div className="space-y-3" aria-label="Alerts">
          {alerts.map((a, i) => <AlertCard key={`${subjectId}:${s.ctx.day}:${a.id}`} alert={a} defaultOpen={i === 0} />)}
        </div>
      ) : (
        <Card className="flex items-center gap-3 border-emerald-200 bg-emerald-50">
          <CircleCheck className="size-6 shrink-0 text-emerald-700" aria-hidden />
          <p className="text-sm font-medium text-emerald-900">{self ? 'Nothing flagged today. Keep your routine: exercise, meals, sleep.' : 'Nothing flagged today.'}</p>
        </Card>
      )}

      <VitalsPanel s={s} />
      <SleepPanel s={s} />
      <WellbeingPanel s={s} visible={seePsych} shared={shared} self={self} />
      <div className="grid gap-4 xl:grid-cols-2">
        <RadiationPanel s={s} env={state.env} />
        <div className="space-y-4">
          <EnvironmentPanel s={s} env={state.env} />
          <SymptomPanel s={s} />
        </div>
      </div>
      <CommPanel viewer={viewer} subjectId={subjectId} />

      <p className="flex items-start gap-2 text-xs text-slate-500">
        <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
        CrewPulse supports the crew’s own assessment. It does not diagnose and it makes no automatic fitness-for-duty decision. Prototype with simulated data.
      </p>
    </div>
  )
}
