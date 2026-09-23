import { afterEach, describe, expect, it, vi } from 'vitest'
import { getPaymentReview, submitPaymentDecision, type PaymentReview } from './paymentTermsApi'
afterEach(() => vi.unstubAllGlobals())
const term = { termId: 'term1', label: 'Booking', percentage: 25, dueDate: '2026-10-01' }
const raw = { opportunityId: 'opp1', opportunityName: 'Home', status: 'Sent for Client Approval', clientRemarks: '', canRespond: true, terms: [term] }
const payment: PaymentReview = { ...raw, terms: [{ ...term, id: term.termId }] }
function mock(data: unknown, status = 200) {
  const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify(data), { status }))
  vi.stubGlobal('fetch', fetcher)
  return fetcher
}
describe('Payment Terms API', () => {
  it('loads the term, percentage and date and preserves zero percentage', async () => {
    mock({ success: true, paymentTermsAvailable: true, paymentTerms: { ...raw, terms: [term, { ...term, termId: 'term2', percentage: 0 }] } })
    const result = await getPaymentReview('lead1')
    expect(result.payment?.terms).toEqual([{ id: 'term1', label: 'Booking', percentage: 25, dueDate: '2026-10-01' }, { id: 'term2', label: 'Booking', percentage: 0, dueDate: '2026-10-01' }])
    expect(result.payment?.canRespond).toBe(true)
  })
  it.each(['Not Sent', 'Sent for Manager Approval', 'Manager Approved', 'Manager Requested Changes'])('hides internal status %s', async status => {
    mock({ success: true, paymentTerms: { ...raw, status } })
    expect((await getPaymentReview('lead1')).payment).toBeNull()
  })
  it('keeps completed terms read-only even if the server flag is true', async () => {
    mock({ success: true, paymentTerms: { ...raw, status: 'Client Approved' } })
    expect((await getPaymentReview('lead1')).payment?.canRespond).toBe(false)
  })
  it('requires comments and sends the change request to the Opportunity', async () => {
    const fetcher = mock({ success: true, opportunityId: 'opp1', status: 'Client Requested Changes', message: 'Saved' })
    expect((await submitPaymentDecision('lead1', payment, 'Client Requested Changes', ' ')).success).toBe(false)
    expect(fetcher).not.toHaveBeenCalled()
    expect((await submitPaymentDecision('lead1', payment, 'Client Requested Changes', ' Change due date ')).success).toBe(true)
    expect(JSON.parse(fetcher.mock.calls[0][1].body)).toEqual({ leadId: 'lead1', opportunityId: 'opp1', action: 'REQUEST_CHANGES', comments: 'Change due date' })
  })
  it('rejects mismatched success and reports duplicate responses', async () => {
    mock({ success: true, opportunityId: 'other', status: 'Client Approved' })
    expect((await submitPaymentDecision('lead1', payment, 'Client Approved', '')).success).toBe(false)
    mock({ success: false, message: 'Already responded' }, 409)
    expect((await submitPaymentDecision('lead1', payment, 'Client Approved', '')).conflict).toBe(true)
  })
  it('does not convert permission errors to an empty schedule', async () => {
    mock({ success: false, message: 'Denied' }, 403)
    expect(await getPaymentReview('lead1')).toMatchObject({ success: false, message: 'Denied' })
  })
})
