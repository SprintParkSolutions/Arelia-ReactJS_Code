import { canRespondToSiteVisit } from './siteVisitRequest'
import { useEffect, useMemo, useSyncExternalStore } from 'react'
import type { Appointment, VisitReport } from '../../services/siteVisitApi'
type Entry = { id: string; type: 'siteVisit'; message: string; timestamp: number; read: boolean; dismissed: boolean }
const event = 'site-visit-notifications-updated'
const memory = new Map<string, string>()
function read(key: string) { try { return localStorage.getItem(key) || memory.get(key) || '[]' } catch { return memory.get(key) || '[]' } }
function subscribe(callback: () => void) {
  window.addEventListener(event, callback); window.addEventListener('storage', callback)
  return () => { window.removeEventListener(event, callback); window.removeEventListener('storage', callback) }
}
function parse(raw: string): Entry[] {
  try { const data: unknown = JSON.parse(raw); return Array.isArray(data) ? data.filter(v => v && typeof v.id === 'string' && v.type === 'siteVisit' && typeof v.message === 'string' && typeof v.timestamp === 'number' && typeof v.read === 'boolean' && typeof v.dismissed === 'boolean') : [] } catch { return [] }
}
function write(key: string, entries: Entry[]) {
  const raw = JSON.stringify(entries); memory.set(key, raw)
  try { localStorage.setItem(key, raw) } catch { /* Keep history in memory when storage is unavailable. */ }
  window.dispatchEvent(new Event(event))
}
type ProjectVisit = { leadId?: string; appointment: Appointment | null; report?: VisitReport | null }
export function useSiteVisitNotifications(leadId: string | undefined, appointment: Appointment | null, report?: VisitReport | null) {
  return useProjectSiteVisitNotifications(leadId ? [{ leadId, appointment, report }] : [])
}
export function useProjectSiteVisitNotifications(visits: ProjectVisit[]) {
  const raw = useSyncExternalStore(subscribe, () => JSON.stringify(visits.map(visit => read('siteVisitNotifications:' + visit.leadId))), () => '[]')
  const histories = useMemo<Entry[][]>(() => JSON.parse(raw).map((value: string) => parse(value)), [raw])
  useEffect(() => {
    visits.forEach(({ leadId, appointment, report }) => {
      if (!leadId) return
      const key = 'siteVisitNotifications:' + leadId
      const saved = parse(read(key))
      let changed = false
      function add(id: string, message: string) {
        if (saved.some(value => value.id === id)) return
        saved.unshift({ id, type: 'siteVisit', message, timestamp: Date.now(), read: false, dismissed: false })
        changed = true
      }
      if (appointment && canRespondToSiteVisit(appointment)) {
        add('site-visit:' + [appointment.appointmentSentDate, appointment.appointmentDate, appointment.appointmentTimeSlot, appointment.appointmentStatus].join(':'),
          `Arelia has requested a site visit on ${appointment.appointmentDate}, ${appointment.appointmentTimeSlot}. Please approve or request a new date and time.`)
      }
      const details = report?.report
      if (report?.success && report.reportAvailable && details?.managementApproval === true && details.finalSubmitted === true && details.leadId === leadId && typeof details.reportId === 'string' && details.reportId) {
        add('site-visit:report:' + details.reportId, 'Your site visit report has been approved by the Arelia Team and is ready to view.')
      }
      if (changed) write(key, saved)
    })
  }, [visits])
  // Keep stored IDs unchanged for existing history; scope UI IDs by Lead to avoid collisions.
  const entries = visits.flatMap((visit, index) => (histories[index] || []).map(entry => ({
    ...entry, id: `site-visit:project:${visit.leadId}:${entry.id}`, storedId: entry.id, siteVisitLeadId: visit.leadId,
    message: `${visits.length > 1 ? `Project ${index + 1}: ` : ''}${entry.message}`,
  })))
  function update(id?: string, dismissed = false) {
    visits.forEach(visit => {
      const entry = entries.find(value => value.id === id && value.siteVisitLeadId === visit.leadId)
      if (id && !entry) return
      const key = 'siteVisitNotifications:' + visit.leadId
      write(key, parse(read(key)).map(value => !id || value.id === entry?.storedId ? { ...value, read: true, dismissed: value.dismissed || dismissed } : value))
    })
  }
  return { notifications: entries.filter(entry => !entry.dismissed), markRead: (id: string) => update(id), markAllRead: () => update(), dismiss: (id: string) => update(id, true) }
}
