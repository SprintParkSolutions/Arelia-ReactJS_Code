import { BASE_URL, SITE_PATH, asRecord, asString, parseResponse } from './salesforceApi'
export const BUDGET_SENT = 'Sent for Client Approval'
export type BudgetReview = {
  opportunityId: string; opportunityName: string; status: string; customerBudget: number | null;
  supervisorBudget: number | null; estimatedDuration: string; clientRemarks: string; canRespond: boolean;
}
export type BudgetResult = { success: boolean; message: string; budget: BudgetReview | null }
export type BudgetDecision = 'Client Approved' | 'Client Requested Changes'
const root = () => `${BASE_URL}${SITE_PATH}/services/apexrest/registration/lead/budget-review/`
const amount = (value: unknown) => typeof value === 'number' && Number.isFinite(value) ? value : null
async function request(query: string, body?: object) {
  if (!BASE_URL) throw new Error('Missing configuration')
  const response = await fetch(root() + query, { method: body ? 'POST' : 'GET', cache: 'no-store',
    headers: { Accept: 'application/json', ...(body ? { 'Content-Type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(20000) })
  const raw = await parseResponse(response)
  const data = asRecord(raw)
  return { response, data, message: asString(data?.message) || asString(asRecord(Array.isArray(raw) ? raw[0] : null)?.message) || 'Unable to load Budget Review.' }
}
export async function getBudgetReview(leadId: string): Promise<BudgetResult> {
  if (!leadId) return { success: true, message: '', budget: null }
  try {
    const { response, data, message } = await request('?' + new URLSearchParams({ leadId }))
    if (!response.ok || data?.success !== true) return { success: false, message, budget: null }
    if (data.budgetAvailable === false) return { success: true, message: '', budget: null }
    const b = asRecord(data.budget)
    if (!asString(b?.opportunityId) || !asString(b?.status)) return { success: false, message: 'Invalid Budget Review response.', budget: null }
    if (b?.status === 'Not Sent') return { success: true, message: '', budget: null }
    return { success: true, message: '', budget: {
      opportunityId: asString(b?.opportunityId)!, opportunityName: asString(b?.opportunityName) || 'Project',
      status: asString(b?.status)!, customerBudget: amount(b?.customerBudget),
      supervisorBudget: amount(b?.finalBudget),
      estimatedDuration: b?.estimatedDuration == null ? '' : String(b.estimatedDuration),
      clientRemarks: asString(b?.clientRemarks) || '',
      canRespond: b?.status === BUDGET_SENT && b?.canRespond === true,
    } }
  } catch { return { success: false, message: 'Unable to connect. Please try again.', budget: null } }
}
export async function submitBudgetDecision(leadId: string, budget: BudgetReview, status: BudgetDecision, comments: string) {
  if (!leadId || !budget.opportunityId) return { success: false, message: 'Budget Review access is unavailable.' }
  if (status === 'Client Requested Changes' && !comments.trim()) return { success: false, message: 'Please describe the changes you need.' }
  try {
    const { response, data, message } = await request('', { leadId, opportunityId: budget.opportunityId,
      action: status === 'Client Approved' ? 'APPROVE' : 'REQUEST_CHANGES', comments: comments.trim() })
    return { success: response.ok && data?.success === true && data.opportunityId === budget.opportunityId && data.status === status,
      message, conflict: response.status === 409 }
  } catch { return { success: false, message: 'Unable to submit your response. Please try again.' } }
}
