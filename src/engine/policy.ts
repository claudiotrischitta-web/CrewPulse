import type { Alert, Category, Viewer } from './types'

/**
 * Who may see which category of a crew member's data.
 *   astronaut: everything about themselves, nothing about the others
 *   CMO (a crewmate): everything except psychological data, unless the crew member shares it
 *   ground (flight surgeon + psychologist): everything, after the communication delay
 *
 * In this browser-only prototype the rule is applied in the UI layer: it demonstrates the
 * design. A flight system would enforce it server-side with encryption per role.
 */
export function canSee(viewer: Viewer, subjectId: string, category: Category, sharedPsych: boolean): boolean {
  if (viewer.role === 'ground') return true
  if (viewer.role === 'astronaut') return viewer.id === subjectId
  return category !== 'psych' || sharedPsych
}

/**
 * Alerts a viewer may read. One exception keeps the crew safe far from Earth:
 * an urgent psychological alert reaches the CMO as a bare "contact this crew member" flag.
 */
export function alertsFor(viewer: Viewer, subjectId: string, alerts: Alert[], sharedPsych: boolean): Alert[] {
  return alerts.flatMap((a): Alert[] => {
    if (canSee(viewer, subjectId, a.category, sharedPsych)) return [a]
    if (viewer.role === 'cmo' && a.category === 'psych' && a.level === 'urgent') {
      return [{
        id: 'P-FLAG', astronautId: subjectId, level: 'urgent', category: 'psych', redacted: true,
        title: `Contact ${subjectId} today — priority`,
        why: 'A private wellbeing alert reached the urgent level. The details stay private; the crew member knows you are notified.',
        data: [],
        actions: ['Check in with the crew member in person and in private.', 'The ground medical team has the full picture and will follow up.'],
        recheck: 'Today.',
        escalate: 'Ground flight surgeon and psychologist are notified with full details.',
        refs: ['hrp-behavior', 'std3001-care'],
      }]
    }
    return []
  })
}
