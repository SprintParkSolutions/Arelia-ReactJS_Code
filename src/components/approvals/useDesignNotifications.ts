import { useEffect, useMemo, useSyncExternalStore } from 'react'
import type { DesignsResult } from '../../services/designApprovalsApi'
type Entry = { id: string; type: 'approvals'; designId: string; message: string; timestamp: number; read: boolean; dismissed: boolean }
const memory = new Map<string, string>()
const event = 'design-notifications-updated'
function read(key: string) { try { return localStorage.getItem(key) || memory.get(key) || '[]' } catch { return memory.get(key) || '[]' } }
function parse(raw: string): Entry[] {
  try { const value = JSON.parse(raw); return Array.isArray(value) ? value.filter(v => v && typeof v.id === 'string' && typeof v.designId === 'string' && v.type === 'approvals' && typeof v.message === 'string' && typeof v.timestamp === 'number' && typeof v.read === 'boolean' && typeof v.dismissed === 'boolean') : [] } catch { return [] }
}
function write(key: string, items: Entry[]) {
  const raw = JSON.stringify(items); memory.set(key, raw)
  try { localStorage.setItem(key, raw) } catch { /* Use session history if storage is unavailable. */ }
  window.dispatchEvent(new Event(event))
}
function subscribe(fn: () => void) {
  window.addEventListener(event, fn); window.addEventListener('storage', fn)
  return () => { window.removeEventListener(event, fn); window.removeEventListener('storage', fn) }
}
export function useDesignNotifications(contactId: string, result: DesignsResult | null) {
  const key = contactId ? 'designNotifications:' + contactId : ''
  const raw = useSyncExternalStore(subscribe, () => key ? read(key) : '[]', () => '[]')
  const entries = useMemo(() => parse(raw), [raw])
  useEffect(() => {
    if (!key || !result?.success) return
    const saved = parse(read(key))
    const additions: Entry[] = result.designs.filter(d => d.status === 'Sent' && !saved.some(n => n.id === 'design-approval:' + d.designId)).map(d => ({
      id: 'design-approval:' + d.designId, type: 'approvals', designId: d.designId,
      message: `3D design for ${d.opportunityName} is ready for review and approval.`,
      timestamp: Date.now(), read: false, dismissed: false,
    }))
    const managerApprovals: Entry[] = result.designs.filter(d => d.managerApproval === true && !saved.some(n => n.id === 'design-approval:manager:' + d.designId)).map(d => ({
      id: 'design-approval:manager:' + d.designId, type: 'approvals', designId: d.designId,
      message: `${d.designName} 3D Design for ${d.opportunityName} has received final internal approval and is ready to proceed to the next stage.`,
      timestamp: Date.now(), read: false, dismissed: false,
    }))
    const refreshed = saved.map(notification => {
      const design = result.designs.find(d => d.designId === notification.designId)
      if (!design) return notification
      const message = notification.id.startsWith('design-approval:manager:')
        ? `${design.designName} 3D Design for ${design.opportunityName} has received final internal approval and is ready to proceed to the next stage.`
        : `3D design for ${design.opportunityName} is ready for review and approval.`
      return notification.message === message ? notification : { ...notification, message }
    })
    if (managerApprovals.length || additions.length || refreshed.some((notification, index) => notification !== saved[index])) {
      write(key, [...managerApprovals, ...additions, ...refreshed])
    }
  }, [key, result])
  function update(id?: string, dismiss = false) {
    if (key) write(key, parse(read(key)).map(n => !id || n.id === id ? { ...n, read: true, dismissed: n.dismissed || dismiss } : n))
  }
  return { notifications: entries.filter(n => !n.dismissed), markRead: (id: string) => update(id), markAllRead: () => update(), dismiss: (id: string) => update(id, true) }
}
