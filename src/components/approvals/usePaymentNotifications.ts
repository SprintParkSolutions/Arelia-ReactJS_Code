import { useEffect, useMemo, useSyncExternalStore } from 'react'
import { PAYMENT_SENT, type PaymentResult } from '../../services/paymentTermsApi'
type Entry = { id: string; type: 'approvals'; paymentOpportunityId: string; message: string; timestamp: number; read: boolean; dismissed: boolean }
const memory = new Map<string, string>()
const event = 'payment-notifications-updated'
function read(key: string) { try { return localStorage.getItem(key) || memory.get(key) || '[]' } catch { return memory.get(key) || '[]' } }
function parse(raw: string): Entry[] {
  try { const data = JSON.parse(raw); return Array.isArray(data) ? data.filter(n => n && typeof n.id === 'string' && n.type === 'approvals' && typeof n.paymentOpportunityId === 'string' && typeof n.message === 'string' && typeof n.timestamp === 'number' && typeof n.read === 'boolean' && typeof n.dismissed === 'boolean') : [] } catch { return [] }
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
export function usePaymentNotifications(leadId: string, result: PaymentResult | null) {
  const key = leadId ? 'paymentNotifications:' + leadId : ''
  const raw = useSyncExternalStore(subscribe, () => key ? read(key) : '[]', () => '[]')
  const entries = useMemo(() => parse(raw), [raw])
  useEffect(() => {
    if (!key || !result?.success) return
    const saved = parse(read(key))
    const payment = result.payment
    if (!payment) return
    const trackerKey = key + ':status:' + payment.opportunityId
    let previous: { status: string; id: string } | null = null
    try {
      const value = JSON.parse(read(trackerKey))
      if (typeof value.status === 'string' && typeof value.id === 'string') previous = value
    } catch { /* Initialize tracking for this browser. */ }
    const existing = saved.filter(n => n.paymentOpportunityId === payment.opportunityId && !n.id.startsWith('payment-approval:manager:'))
    const resent = previous !== null && previous.status !== PAYMENT_SENT && payment.status === PAYMENT_SENT
    const id = resent || !existing.length
      ? 'payment-approval:' + payment.opportunityId + ':local:' + (existing.length + 1)
      : previous?.id || existing[0].id
    const tracker = JSON.stringify({ status: payment.status, id })
    memory.set(trackerKey, tracker)
    try { localStorage.setItem(trackerKey, tracker) } catch { /* Keep session tracking. */ }
    if (payment.status !== PAYMENT_SENT) return
    if (saved.some(n => n.id === id)) return
    write(key, [{
      id, type: 'approvals', paymentOpportunityId: payment.opportunityId,
      message: `Payment Terms for ${payment.opportunityName} are ready for your review and approval.`,
      timestamp: Date.now(), read: false, dismissed: false,
    }, ...saved])
  }, [key, result])
  function update(id?: string, dismiss = false) {
    if (key) write(key, parse(read(key)).map(n => !id || n.id === id ? { ...n, read: true, dismissed: n.dismissed || dismiss } : n))
  }
  return { notifications: entries.filter(n => !n.dismissed), markRead: (id: string) => update(id), markAllRead: () => update(), dismiss: (id: string) => update(id, true) }
}
