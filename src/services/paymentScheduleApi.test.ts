import { afterEach, expect, it, vi } from 'vitest'
import { getPaymentTerms } from './salesforceApi'
import { getPaymentSummary } from '../utils/paymentSummary'

afterEach(() => vi.unstubAllGlobals())
it('preserves API paid snapshots, adjusted pending amounts and the canonical budget', async () => {
  const raw = [
    { id: '1', label: 'First', percentage: 20, paymentReceived: true, amount: 17000, paidAmount: 17000, totalAmount: 95000 },
    { id: '2', label: 'Second', percentage: 30, paymentReceived: true, amount: 25500, paidAmount: 25500, totalAmount: 95000 },
    { id: '3', label: 'Third', percentage: 25, paymentReceived: false, amount: 26250, paidAmount: null, totalAmount: 95000 },
    { id: '4', label: 'Fourth', percentage: 25, paymentReceived: false, amount: 26250, paidAmount: null, totalAmount: 95000 },
  ]
  const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify(raw)))
  vi.stubGlobal('fetch', fetcher)
  const terms = (await getPaymentTerms('Home A'))!
  expect(terms.map(term => term.amount)).toEqual([17000, 25500, 26250, 26250])
  expect(terms[0].paidAmount).toBe(17000)
  expect(getPaymentSummary(terms, 85000)).toMatchObject({ total: 95000, paid: 42500, balance: 52500 })
  expect(fetcher.mock.calls[0][0]).toContain('projectName=Home%20A')
})
it('preserves zero amounts and does not invent amounts for old responses', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify([
    { label: 'Zero', percentage: 0, amount: 0, totalAmount: 0 },
    { label: 'Legacy', percentage: 20, paymentReceived: true },
  ]))))
  const terms = (await getPaymentTerms('Home'))!
  expect(terms[0]).toMatchObject({ percentage: 0, amount: 0, totalAmount: 0 })
  expect(terms[1].amount).toBeUndefined()
  expect(getPaymentSummary(terms, 95000).paid).toBeUndefined()
})
