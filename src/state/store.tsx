import { useContext, useEffect, useMemo, useReducer, useState, type ReactNode } from 'react'
import { SCENARIO, buildCrewDay, overrideKey, type Overrides } from '../engine/crew'
import { StoreContext as Ctx } from './context'
import { DEMO_SPEEDUP, oneWayDelaySeconds } from '../engine/sync'
import type { DayRecord, Env, Viewer } from '../engine/types'

export type Page = 'health' | 'checkin'

/** A message travelling between the vehicle and Earth at the speed of light. */
export interface Packet {
  id: string
  /** toGround = downlink from the vehicle; toCrew = uplink from Earth. */
  dir: 'toGround' | 'toCrew'
  kind: 'checkin' | 'assessment' | 'recommendation' | 'conference'
  from: string
  subjectId: string
  text: string
  day: number
  env: Env
  delaySec: number
  sentAt: number
  arrivesAt: number
}

export interface State {
  viewer: Viewer
  env: Env
  day: number
  /** Crew member open in the CMO and ground dashboards. */
  selected: string
  page: Page
  overrides: Overrides
  packets: Packet[]
  /** Crew members who chose to share their wellbeing data with the CMO. */
  share: Record<string, boolean>
}

export type Action =
  | { type: 'view'; viewer: Viewer; selected?: string }
  | { type: 'env'; env: Env }
  | { type: 'day'; day: number }
  | { type: 'select'; id: string }
  | { type: 'page'; page: Page }
  | { type: 'checkin'; id: string; record: DayRecord }
  | { type: 'packet'; packet: Packet }
  | { type: 'share'; id: string; value: boolean }
  | { type: 'reset' }

const KEY = 'crewpulse:v1'
const INITIAL: State = {
  viewer: { role: 'astronaut', id: 'A01' }, env: 'mars', day: 11, selected: 'A01', page: 'health',
  overrides: {}, packets: [], share: {},
}

function load(): State {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? { ...INITIAL, ...(JSON.parse(raw) as Partial<State>), page: 'health' } : INITIAL
  } catch {
    return INITIAL
  }
}

function reducer(state: State, a: Action): State {
  switch (a.type) {
    case 'view':
      return { ...state, viewer: a.viewer, page: 'health', selected: a.selected ?? (a.viewer.role === 'astronaut' ? a.viewer.id : state.selected) }
    case 'env':
      return { ...state, env: a.env }
    case 'day':
      return { ...state, day: Math.min(SCENARIO.meta.days, Math.max(1, a.day)), page: 'health' }
    case 'select':
      return { ...state, selected: a.id }
    case 'page':
      return { ...state, page: a.page }
    case 'checkin':
      return { ...state, overrides: { ...state.overrides, [overrideKey(a.id, a.record.day)]: a.record } }
    case 'packet':
      return { ...state, packets: [...state.packets, a.packet] }
    case 'share':
      return { ...state, share: { ...state.share, [a.id]: a.value } }
    case 'reset':
      return { ...INITIAL, viewer: state.viewer, selected: state.selected }
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, load)
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state))
    } catch {
      /* storage unavailable (private window): the app still works for this session */
    }
  }, [state])
  const value = useMemo(() => ({ state, dispatch }), [state])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useStore() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useStore must be used inside StoreProvider')
  return c
}

/** Engine output for every crew member on the selected day and environment. */
export function useCrew() {
  const { state } = useStore()
  return useMemo(() => buildCrewDay(state.overrides, state.env, state.day), [state.overrides, state.env, state.day])
}

/** Wall-clock tick, used to animate messages in flight. */
export function useNow(ms = 500) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), ms)
    return () => clearInterval(t)
  }, [ms])
  return now
}

export function makePacket(state: State, p: Pick<Packet, 'dir' | 'kind' | 'from' | 'subjectId' | 'text'>): Packet {
  const delaySec = oneWayDelaySeconds(state.env, SCENARIO.days[state.day - 1].date)
  const sentAt = Date.now()
  return {
    ...p, id: `${sentAt}-${Math.random().toString(36).slice(2, 8)}`, day: state.day, env: state.env, delaySec, sentAt,
    arrivesAt: sentAt + (delaySec * 1000) / DEMO_SPEEDUP,
  }
}

/** Mission seconds left before a packet arrives. */
export const remainingSeconds = (p: Packet, now: number) => Math.max(0, ((p.arrivesAt - now) / 1000) * DEMO_SPEEDUP)
