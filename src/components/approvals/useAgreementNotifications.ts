import { useEffect, useMemo, useSyncExternalStore } from 'react'
import { getAgreementNotice } from '../../services/clientAgreementApi'
type Entry = { leadId?: string; id: string; type: 'approvals'; opportunityId: string; message: string; timestamp: number; read: boolean; dismissed: boolean }
const memory = new Map<string, string>()
const event = 'agreement-notifications-updated'
function read(key: string) { try { return localStorage.getItem(key) || memory.get(key) || '[]' } catch { return memory.get(key) || '[]' } }
function parse(raw: string): Entry[] {
  try { const data = JSON.parse(raw); return Array.isArray(data) ? data.filter(n => n && typeof n.id === 'string' && n.type === 'approvals' && typeof n.opportunityId === 'string' && typeof n.message === 'string' && typeof n.timestamp === 'number' && typeof n.read === 'boolean' && typeof n.dismissed === 'boolean') : [] } catch { return [] }
}
function write(key: string, entries: Entry[]) {
  const raw = JSON.stringify(entries); memory.set(key, raw)
  try { localStorage.setItem(key, raw) } catch { /* Keep session history when storage is unavailable. */ }
  window.dispatchEvent(new Event(event))
}
function subscribe(fn: () => void) {
  window.addEventListener(event, fn); window.addEventListener('storage', fn)
  return () => { window.removeEventListener(event, fn); window.removeEventListener('storage', fn) }
}
export function useAgreementNotifications(leadId: string, projectLeadIds?: string[]) {
  const projectKey = JSON.stringify([...new Set(projectLeadIds?.length ? projectLeadIds : leadId ? [leadId] : [])])
  const key = leadId ? 'agreementNotifications:' + leadId : ''
  const raw = useSyncExternalStore(subscribe, () => key ? read(key) : '[]', () => '[]')
  const entries = useMemo(() => parse(raw), [raw])
  useEffect(() => {
    if (!key) return
    let active = true
    const ids: string[] = JSON.parse(projectKey)
    const pending = new Set<string>()
    async function check(projectLeadId: string) {
      if (!active || pending.has(projectLeadId) || document.visibilityState === 'hidden') return
      pending.add(projectLeadId)
      try {
        const notice = await getAgreementNotice(projectLeadId)
        if (!active || !notice) return
        const saved = parse(read(key))
        const id = 'client-agreement:' + notice.opportunityId
        if (saved.some(n => n.id === id)) return
        write(key, [{ id, leadId: projectLeadId, type: 'approvals', opportunityId: notice.opportunityId,
          message: notice.message, timestamp: Date.now(), read: false, dismissed: false }, ...saved])
      } finally { pending.delete(projectLeadId) }
    }
    const refresh = () => { ids.forEach(id => { void check(id) }) }
    refresh()
    const timer = window.setInterval(refresh, 30000)
    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', refresh)
    return () => {
      active = false
      window.clearInterval(timer)
      window.removeEventListener('focus', refresh)
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [key, projectKey])
  function update(id?: string, dismiss = false) {
    if (key) write(key, parse(read(key)).map(n => !id || n.id === id ? { ...n, read: true, dismissed: n.dismissed || dismiss } : n))
  }
  const ids: string[] = JSON.parse(projectKey)
  const notifications = entries.filter(n => !n.dismissed).map(entry => {
    const index = ids.indexOf(entry.leadId || leadId)
    return { ...entry, message: ids.length > 1 && index >= 0 ? `Project ${index + 1}: ${entry.message}` : entry.message }
  })
  return { notifications, markRead: (id: string) => update(id), markAllRead: () => update(), dismiss: (id: string) => update(id, true) }
}
