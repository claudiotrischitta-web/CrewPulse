import { MessageSquare, Radio, Send } from 'lucide-react'
import { useState } from 'react'
import { DEMO_SPEEDUP, formatDelay } from '../engine/sync'
import type { Viewer } from '../engine/types'
import { makePacket, remainingSeconds, useNow, useStore, type Packet } from '../state/store'
import { Button, Card, SectionTitle } from './atoms'

const KIND = { checkin: 'Check-in data', assessment: 'CMO assessment', recommendation: 'Recommendation from the flight surgeon', conference: 'Private conference request' }

function PacketRow({ p, now }: { p: Packet; now: number }) {
  const arrived = now >= p.arrivesAt
  return (
    <li className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1 rounded-lg border border-slate-200 p-2.5 text-sm">
      <div className="min-w-0">
        <div className="text-xs font-semibold text-slate-500">{KIND[p.kind]} · day {p.day} · from {p.from}</div>
        <div className="text-slate-800">{p.text}</div>
      </div>
      <span className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-semibold ${arrived ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-sky-300 bg-sky-50 text-sky-900'}`}>
        {arrived ? 'Delivered' : `In flight · ${formatDelay(remainingSeconds(p, now))} to go`}
      </span>
    </li>
  )
}

function Compose({ label, placeholder, button, onSend }: { label: string; placeholder: string; button: string; onSend: (text: string) => void }) {
  const [text, setText] = useState('')
  return (
    <form
      className="space-y-2"
      onSubmit={(ev) => {
        ev.preventDefault()
        if (!text.trim()) return
        onSend(text.trim())
        setText('')
      }}
    >
      <label className="block text-sm font-semibold text-slate-700">
        {label}
        <textarea value={text} onChange={(ev) => setText(ev.target.value)} rows={2} placeholder={placeholder} className="mt-1 block w-full rounded-lg border border-slate-300 p-2 text-sm font-normal" />
      </label>
      <Button type="submit" kind="teal" disabled={!text.trim()}><Send className="size-4" aria-hidden />{button}</Button>
    </form>
  )
}

/**
 * Everything that crosses the distance to Earth. Messages travel at light speed:
 * the delay is the real one for the selected destination and date (JPL Horizons).
 */
export function CommPanel({ viewer, subjectId }: { viewer: Viewer; subjectId: string }) {
  const { state, dispatch } = useStore()
  const now = useNow()
  const mine = state.packets.filter((p) => p.subjectId === subjectId)
  const send = (p: Pick<Packet, 'dir' | 'kind' | 'from' | 'text'>) => dispatch({ type: 'packet', packet: makePacket(state, { ...p, subjectId }) })
  const clock = <span>Demo clock ×{DEMO_SPEEDUP}: one minute of delay takes one second here</span>

  if (viewer.role === 'astronaut') {
    const inbox = mine.filter((p) => p.dir === 'toCrew' && now >= p.arrivesAt)
    const sent = mine.filter((p) => p.dir === 'toGround' && p.from === subjectId)
    const shared = !!state.share[subjectId]
    return (
      <Card>
        <SectionTitle icon={MessageSquare} title="You and the ground" aside={clock} />
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-3">
            <Button kind="ghost" onClick={() => send({ dir: 'toGround', kind: 'conference', from: subjectId, text: `${subjectId} asks for a private conference with the ground medical team.` })}>
              <Radio className="size-4" aria-hidden />Request a private conference
            </Button>
            <label className="flex items-start gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={shared} onChange={(ev) => dispatch({ type: 'share', id: subjectId, value: ev.target.checked })} className="mt-0.5 size-4" />
              <span><span className="font-semibold">Share my wellbeing data with the CMO.</span> Off by default. The CMO is your crewmate; you decide.</span>
            </label>
          </div>
          <div className="space-y-3">
            <div>
              <h3 className="mb-1 text-sm font-semibold text-slate-700">Messages from the flight surgeon</h3>
              {inbox.length ? <ul className="space-y-2">{inbox.map((p) => <PacketRow key={p.id} p={p} now={now} />)}</ul> : <p className="text-sm text-slate-500">Nothing has arrived yet.</p>}
            </div>
            {sent.length > 0 && (
              <div>
                <h3 className="mb-1 text-sm font-semibold text-slate-700">Sent to Earth</h3>
                <ul className="space-y-2">{sent.map((p) => <PacketRow key={p.id} p={p} now={now} />)}</ul>
              </div>
            )}
          </div>
        </div>
      </Card>
    )
  }

  if (viewer.role === 'cmo') {
    const visible = mine.filter((p) => (p.kind === 'assessment') || (p.dir === 'toCrew' && now >= p.arrivesAt))
    return (
      <Card>
        <SectionTitle icon={MessageSquare} title={`Assessment of ${subjectId}`} aside={clock} />
        <div className="grid gap-4 md:grid-cols-2">
          <Compose
            label="Record your assessment"
            placeholder="What you found, what you agreed with the crew member, when you will look again."
            button="Save and send to Earth"
            onSend={(text) => send({ dir: 'toGround', kind: 'assessment', from: 'CMO', text })}
          />
          <div>
            <h3 className="mb-1 text-sm font-semibold text-slate-700">Log</h3>
            {visible.length ? <ul className="space-y-2">{visible.map((p) => <PacketRow key={p.id} p={p} now={now} />)}</ul> : <p className="text-sm text-slate-500">No assessment recorded yet.</p>}
          </div>
        </div>
      </Card>
    )
  }

  const downlink = mine.filter((p) => p.dir === 'toGround')
  const uplink = mine.filter((p) => p.dir === 'toCrew')
  return (
    <Card>
      <SectionTitle icon={MessageSquare} title={`Link with ${subjectId}`} aside={clock} />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-3">
          <Compose
            label="Send a recommendation to the crew"
            placeholder="It will reach the vehicle after the light-time delay."
            button="Send to the vehicle"
            onSend={(text) => send({ dir: 'toCrew', kind: 'recommendation', from: 'Flight surgeon', text })}
          />
          {uplink.length > 0 && <ul className="space-y-2">{uplink.map((p) => <PacketRow key={p.id} p={p} now={now} />)}</ul>}
        </div>
        <div>
          <h3 className="mb-1 text-sm font-semibold text-slate-700">From the vehicle</h3>
          {downlink.length ? <ul className="space-y-2">{downlink.map((p) => <PacketRow key={p.id} p={p} now={now} />)}</ul> : <p className="text-sm text-slate-500">No live message yet. Save a check-in or an assessment on board to see it travel.</p>}
          <p className="mt-1 text-xs text-slate-500">Messages still in flight are shown here for the demo; a real ground console learns of them only on arrival.</p>
        </div>
      </div>
    </Card>
  )
}
