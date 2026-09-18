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
export function useSiteVisitNotifications(leadId: string | undefined, appointment: Appointment | null, report?: VisitReport | null) {
  const key = leadId ? 'siteVisitNotifications:' + leadId : ''
  const raw = useSyncExternalStore(subscribe, () => key ? read(key) : '[]', () => '[]')
  const entries = useMemo(() => parse(raw), [raw])
  useEffect(() => {
    if (!key || !appointment?.success || !appointment.appointmentAvailable || !appointment.actionRequired || !appointment.appointmentDate || !appointment.appointmentTimeSlot) return
    const id = 'site-visit:' + [appointment.appointmentSentDate, appointment.appointmentDate, appointment.appointmentTimeSlot, appointment.appointmentStatus].join(':')
    const saved = parse(read(key))
    if (!saved.some(v => v.id === id)) write(key, [{ id, type: 'siteVisit', message: `Arelia has requested a site visit on ${appointment.appointmentDate}, ${appointment.appointmentTimeSlot}. Please approve or request a new date and time.`, timestamp: Date.now(), read: false, dismissed: false }, ...saved])
  }, [key, appointment])
  useEffect(() => {
    const details = report?.report
    if (!key || !report?.success || !report.reportAvailable || details?.managementApproval !== true || details.finalSubmitted !== true || details.leadId !== leadId || typeof details.reportId !== 'string' || !details.reportId) return
    const id = 'site-visit:report:' + details.reportId
    const saved = parse(read(key))
    if (!saved.some(value => value.id === id)) write(key, [{
      id, type: 'siteVisit',
      message: 'Your site visit report has been approved by the Arelia Team and is ready to view.',
      timestamp: Date.now(), read: false, dismissed: false,
    }, ...saved])
  }, [key, leadId, report])
  function update(id?: string, dismissed = false) {
    if (key) write(key, parse(read(key)).map(v => !id || v.id === id ? { ...v, read: true, dismissed: dismissed || v.dismissed } : v))
  }
  return { notifications: entries.filter(v => !v.dismissed), markRead: (id: string) => update(id), markAllRead: () => update(), dismiss: (id: string) => update(id, true) }
}
