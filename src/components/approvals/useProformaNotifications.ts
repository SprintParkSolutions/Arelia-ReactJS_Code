import { useEffect, useMemo, useSyncExternalStore } from 'react'
import type { InvoicesResult } from '../../services/proformaApi'
type Entry = { id: string; type: 'approvals'; invoiceId: string; message: string; timestamp: number; read: boolean; dismissed: boolean }
const memory = new Map<string, string>()
const event = 'proforma-notifications-updated'
function read(key: string) { try { return localStorage.getItem(key) || memory.get(key) || '[]' } catch { return memory.get(key) || '[]' } }
function parse(raw: string): Entry[] {
  try { const data = JSON.parse(raw); return Array.isArray(data) ? data.filter(n => n && typeof n.id === 'string' && n.type === 'approvals' && typeof n.invoiceId === 'string' && typeof n.message === 'string' && typeof n.timestamp === 'number' && typeof n.read === 'boolean' && typeof n.dismissed === 'boolean') : [] } catch { return [] }
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
export function useProformaNotifications(leadId: string, result: InvoicesResult | null) {
  const key = leadId ? 'proformaNotifications:' + leadId : ''
  const raw = useSyncExternalStore(subscribe, () => key ? read(key) : '[]', () => '[]')
  const entries = useMemo(() => parse(raw), [raw])
  useEffect(() => {
    if (!key || !result?.success) return
    const saved = parse(read(key))
    const additions: Entry[] = result.invoices.filter(invoice => invoice.status === 'Sent' && !saved.some(n => n.id === 'proforma-approval:' + invoice.invoiceId)).map(invoice => ({
      id: 'proforma-approval:' + invoice.invoiceId, type: 'approvals', invoiceId: invoice.invoiceId,
      message: `Proforma Invoice ${invoice.name} for ${invoice.opportunityName} is ready for review and approval.`,
      timestamp: Date.now(), read: false, dismissed: false,
    }))
    const managerApprovals: Entry[] = result.invoices.filter(invoice => invoice.managerApproval === true && !saved.some(n => n.id === 'proforma-approval:manager:' + invoice.invoiceId)).map(invoice => ({
      id: 'proforma-approval:manager:' + invoice.invoiceId, type: 'approvals', invoiceId: invoice.invoiceId,
      message: `Proforma Invoice ${invoice.name} for ${invoice.opportunityName} has received final internal approval and is ready to proceed to the next stage.`,
      timestamp: Date.now(), read: false, dismissed: false,
    }))
    if (additions.length || managerApprovals.length) write(key, [...managerApprovals, ...additions, ...saved])
  }, [key, result])
  function update(id?: string, dismiss = false) {
    if (key) write(key, parse(read(key)).map(n => !id || n.id === id ? { ...n, read: true, dismissed: n.dismissed || dismiss } : n))
  }
  return { notifications: entries.filter(n => !n.dismissed), markRead: (id: string) => update(id), markAllRead: () => update(), dismiss: (id: string) => update(id, true) }
}
