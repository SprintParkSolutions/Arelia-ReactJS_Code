import { afterEach, describe, expect, it, vi } from 'vitest'
import { getBudgetReview, submitBudgetDecision, type BudgetReview } from './budgetReviewApi'
afterEach(() => vi.unstubAllGlobals())
const raw = { opportunityId: 'opp1', opportunityName: 'Home', status: 'Sent for Client Approval', customerBudget: 100000, supervisorEstimatedBudget: 120000, revisitSupervisorEstimatedBudget: null, estimatedDuration: 3, clientRemarks: '', canRespond: true }
const budget: BudgetReview = { ...raw, supervisorBudget: 120000, estimatedDuration: '3' }
function mock(data: unknown, status = 200) {
  const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify(data), { status }))
  vi.stubGlobal('fetch', fetcher)
  return fetcher
}
describe('Budget Review API', () => {
  it.each([[150000, 4], [0, 0], [120000, 3]])('uses the API-selected budget %s and duration together', async (expected, duration) => {
    mock({ success: true, budgetAvailable: true, budget: { ...raw, revisitSupervisorEstimatedBudget: 999999, finalBudget: expected, estimatedDuration: duration } })
    expect((await getBudgetReview('lead1')).budget).toMatchObject({ customerBudget: 100000, supervisorBudget: expected, estimatedDuration: String(duration), canRespond: true })
  })
  it('does not expose unsent reviews or enable completed responses', async () => {
    mock({ success: true, budget: { ...raw, status: 'Not Sent' } })
    expect((await getBudgetReview('lead1')).budget).toBeNull()
    mock({ success: true, budget: { ...raw, status: 'Manager Approved' } })
    expect((await getBudgetReview('lead1')).budget?.canRespond).toBe(false)
  })
  it('requires comments and posts the Opportunity decision', async () => {
    const fetcher = mock({ success: true, opportunityId: 'opp1', status: 'Client Requested Changes', message: 'Saved' })
    expect((await submitBudgetDecision('lead1', budget, 'Client Requested Changes', ' ')).success).toBe(false)
    expect(fetcher).not.toHaveBeenCalled()
    expect((await submitBudgetDecision('lead1', budget, 'Client Requested Changes', ' Reduce estimate ')).success).toBe(true)
    expect(JSON.parse(fetcher.mock.calls[0][1].body)).toEqual({ leadId: 'lead1', opportunityId: 'opp1', action: 'REQUEST_CHANGES', comments: 'Reduce estimate' })
  })
  it('reports duplicate conflicts and never treats permission errors as empty', async () => {
    mock({ success: false, message: 'Already responded' }, 409)
    expect((await submitBudgetDecision('lead1', budget, 'Client Approved', '')).conflict).toBe(true)
    mock({ success: false, message: 'Denied' }, 403)
    expect(await getBudgetReview('lead1')).toMatchObject({ success: false, message: 'Denied' })
  })
})

it('submits a second project budget using its Lead ID', async () => {
  const fetcher = mock({ success: true, opportunityId: 'opp1', status: 'Client Approved', message: 'Saved' })
  await submitBudgetDecision('lead1', { ...budget, leadId: 'lead2' }, 'Client Approved', '')
  expect(JSON.parse(fetcher.mock.calls[0][1].body).leadId).toBe('lead2')
})
