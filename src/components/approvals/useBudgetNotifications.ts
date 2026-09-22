import { useEffect, useMemo, useSyncExternalStore } from 'react'
import { BUDGET_SENT, type BudgetResult } from '../../services/budgetReviewApi'
type Entry = { id: string; type: 'approvals'; budgetOpportunityId: string; message: string; timestamp: number; read: boolean; dismissed: boolean }
const memory = new Map<string, string>()
const event = 'budget-notifications-updated'
function read(key: string) { try { return localStorage.getItem(key) || memory.get(key) || '[]' } catch { return memory.get(key) || '[]' } }
function parse(raw: string): Entry[] {
  try { const data = JSON.parse(raw); return Array.isArray(data) ? data.filter(n => n && typeof n.id === 'string' && n.type === 'approvals' && typeof n.budgetOpportunityId === 'string' && typeof n.message === 'string' && typeof n.timestamp === 'number' && typeof n.read === 'boolean' && typeof n.dismissed === 'boolean') : [] } catch { return [] }
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
export function useBudgetNotifications(leadId: string, result: BudgetResult | null) {
  const key = leadId ? 'budgetNotifications:' + leadId : ''
  const raw = useSyncExternalStore(subscribe, () => key ? read(key) : '[]', () => '[]')
  const entries = useMemo(() => parse(raw), [raw])
  useEffect(() => {
    if (!key || !result?.success) return
    const saved = parse(read(key))
    const budget = result.budget
    if (!budget) return
    const trackerKey = key + ':status:' + budget.opportunityId
    let previous: { status: string; id: string } | null = null
    try {
      const value = JSON.parse(read(trackerKey))
      if (typeof value.status === 'string' && typeof value.id === 'string') previous = value
    } catch { /* Initialize tracking for this browser. */ }
    const existing = saved.filter(n => n.budgetOpportunityId === budget.opportunityId && !n.id.startsWith('budget-approval:manager:'))
    const resent = previous !== null && previous.status !== BUDGET_SENT && budget.status === BUDGET_SENT
    const id = resent || !existing.length
      ? 'budget-approval:' + budget.opportunityId + ':local:' + (existing.length + 1)
      : previous?.id || existing[0].id
    const tracker = JSON.stringify({ status: budget.status, id })
    memory.set(trackerKey, tracker)
    try { localStorage.setItem(trackerKey, tracker) } catch { /* Keep session tracking. */ }
    if (budget.status === 'Manager Approved') {
      const managerId = 'budget-approval:manager:' + budget.opportunityId
      if (!saved.some(n => n.id === managerId)) write(key, [{
        id: managerId, type: 'approvals', budgetOpportunityId: budget.opportunityId,
        message: `Budget Review for ${budget.opportunityName} has received final internal approval and is ready to proceed to the next stage.`,
        timestamp: Date.now(), read: false, dismissed: false,
      }, ...saved])
      return
    }
    if (budget.status !== BUDGET_SENT) return
    if (saved.some(n => n.id === id)) return
    write(key, [{
      id, type: 'approvals', budgetOpportunityId: budget.opportunityId,
      message: `Budget Review for ${budget.opportunityName} is ready for your review and approval.`,
      timestamp: Date.now(), read: false, dismissed: false,
    }, ...saved])
  }, [key, result])
  function update(id?: string, dismiss = false) {
    if (key) write(key, parse(read(key)).map(n => !id || n.id === id ? { ...n, read: true, dismissed: n.dismissed || dismiss } : n))
  }
  return { notifications: entries.filter(n => !n.dismissed), markRead: (id: string) => update(id), markAllRead: () => update(), dismiss: (id: string) => update(id, true) }
}
