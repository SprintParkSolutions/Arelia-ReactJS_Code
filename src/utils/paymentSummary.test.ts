import { expect, it } from 'vitest'
import { getPaymentSummary, getTermAmount } from './paymentSummary'
import { formatCurrency } from './format'
import type { PaymentTerm } from '../services/salesforceApi'

const received: PaymentTerm[] = [
  { percentage: 20, paymentReceived: true, paidAmount: 17000, amount: 17000 },
  { percentage: 30, paymentReceived: true, paidAmount: 25500, amount: 25500 },
]
it('keeps historical payments fixed when the budget increases', () => {
  expect(getPaymentSummary(received, 85000)).toMatchObject({ paid: 42500, balance: 42500, paidPercentage: 50 })
  const summary = getPaymentSummary(received, 95000)
  expect(summary).toMatchObject({ paid: 42500, balance: 52500, paidCount: 2 })
  expect(summary.paidPercentage).toBeCloseTo(44.736842)
  expect(received.map(getTermAmount)).toEqual([17000, 25500])
})
it('uses authoritative pending amounts and never multiplies the revised budget', () => {
  expect(getTermAmount({ percentage: 25, amount: 26250 })).toBe(26250)
  expect(getTermAmount({ percentage: 25 })).toBeUndefined()
  expect(getTermAmount({ percentage: 20, paymentReceived: true })).toBeUndefined()
  expect(getTermAmount({ paymentReceived: true, paidAmount: 17000, amount: 19000 })).toBe(17000)
})
it('uses the schedule budget when the dashboard summary is stale', () => {
  expect(getPaymentSummary(received.map(term => ({ ...term, totalAmount: 95000 })), 85000))
    .toMatchObject({ total: 95000, paid: 42500, balance: 52500 })
})
it('does not invent paid totals or remaining balances when historical data is missing', () => {
  expect(getPaymentSummary([{ paymentReceived: true, percentage: 20 }], 95000))
    .toMatchObject({ paid: undefined, balance: undefined, paidPercentage: undefined })
  expect(getPaymentSummary([], undefined).balance).toBeUndefined()
  expect(getPaymentSummary([], 0)).toMatchObject({ total: 0, paid: 0, balance: 0, paidPercentage: 0 })
})
it('preserves paise and handles a decreased or fully paid budget', () => {
  expect(getPaymentSummary([{ paymentReceived: true, paidAmount: 33.67 }, { paymentReceived: true, paidAmount: 33.67 }], 101))
    .toMatchObject({ paid: 67.34, balance: 33.66 })
  expect(getPaymentSummary(received, 75000)).toMatchObject({ paid: 42500, balance: 32500 })
  expect(getPaymentSummary(received, 40000)).toMatchObject({ paid: 42500, balance: 0, paidPercentage: 100 })
})
it('rejects invalid amounts and inconsistent project totals', () => {
  expect(getTermAmount({ amount: NaN })).toBeUndefined()
  expect(getTermAmount({ amount: -1 })).toBeUndefined()
  expect(getTermAmount({ amount: Infinity })).toBeUndefined()
  expect(getPaymentSummary([{ totalAmount: 85000 }, { totalAmount: 95000 }]).total).toBeUndefined()
})

it('shows paise without rounding an actual payment to a different amount', () => {
  expect(formatCurrency(26250.51)).toContain('26,250.51')
})
