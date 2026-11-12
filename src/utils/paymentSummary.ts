import type { PaymentTerm } from '../services/salesforceApi'

function isMoney(value: number | undefined): value is number {
  return value != null && Number.isFinite(value) && value >= 0
}

// Amounts are resolved by PaymentService for the entire project. In particular,
// paid installments must never be recalculated from the latest contract budget.
export function getTermAmount(term: PaymentTerm) {
  const amount = term.paymentReceived ? term.paidAmount ?? term.amount : term.amount
  return isMoney(amount) ? amount : undefined
}

export function getPaymentSummary(terms: PaymentTerm[], contractBudget?: number) {
  const suppliedTotals = terms.map(term => term.totalAmount).filter((value): value is number => value != null)
  const candidate = suppliedTotals.length ? suppliedTotals[0] : contractBudget
  const total = isMoney(candidate) && suppliedTotals.every(value => isMoney(value) && Math.abs(value - candidate) < .005)
    ? candidate : undefined
  const received = terms.filter(term => term.paymentReceived)
  const paid = received.some(term => getTermAmount(term) == null) ? undefined
    : Math.round(received.reduce((sum, term) => sum + getTermAmount(term)!, 0) * 100) / 100
  const balance = total == null || paid == null ? undefined : Math.round(Math.max(0, total - paid) * 100) / 100
  const paidPercentage = total == null || paid == null ? undefined
    : total === 0 ? 0 : Math.min(100, paid / total * 100)
  return { total, paid, balance, paidPercentage, paidCount: received.length }
}
