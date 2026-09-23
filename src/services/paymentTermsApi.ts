import { BASE_URL, SITE_PATH, asRecord, asString, parseResponse } from './salesforceApi'
export const PAYMENT_SENT = 'Sent for Client Approval'
export type PaymentTerm = { id: string; label: string; percentage: number | null; dueDate: string }
export type PaymentReview = { opportunityId: string; opportunityName: string; status: string; clientRemarks: string; canRespond: boolean; terms: PaymentTerm[] }
export type PaymentResult = { success: boolean; message: string; payment: PaymentReview | null }
export type PaymentDecision = 'Client Approved' | 'Client Requested Changes'
const root = () => `${BASE_URL}${SITE_PATH}/services/apexrest/registration/lead/payment-terms/`
async function request(query: string, body?: object) {
  if (!BASE_URL) throw new Error('Missing configuration')
  const response = await fetch(root() + query, { method: body ? 'POST' : 'GET', cache: 'no-store',
    headers: { Accept: 'application/json', ...(body ? { 'Content-Type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(20000) })
  const raw = await parseResponse(response)
  const data = asRecord(raw)
  return { response, data, message: asString(data?.message) || asString(asRecord(Array.isArray(raw) ? raw[0] : null)?.message) || 'Unable to load Payment Terms.' }
}
export async function getPaymentReview(leadId: string): Promise<PaymentResult> {
  if (!leadId) return { success: true, message: '', payment: null }
  try {
    const { response, data, message } = await request('?' + new URLSearchParams({ leadId }))
    if (!response.ok || data?.success !== true) return { success: false, message, payment: null }
    if (data.paymentTermsAvailable === false) return { success: true, message: '', payment: null }
    const p = asRecord(data.paymentTerms)
    if (!asString(p?.opportunityId) || !asString(p?.status) || !Array.isArray(p?.terms))
      return { success: false, message: 'Invalid Payment Terms response.', payment: null }
    if (![PAYMENT_SENT, 'Client Approved', 'Client Requested Changes'].includes(String(p.status)))
      return { success: true, message: '', payment: null }
    const terms: PaymentTerm[] = []
    for (const item of p.terms) {
      const term = asRecord(item)
      const id = asString(term?.termId)
      if (!id) return { success: false, message: 'Invalid Payment Term. Please retry.', payment: null }
      terms.push({ id, label: asString(term?.label) || asString(term?.name) || 'Payment Term',
        percentage: typeof term?.percentage === 'number' && Number.isFinite(term.percentage) ? term.percentage : null,
        dueDate: asString(term?.dueDate) || '' })
    }
    return { success: true, message: '', payment: {
      opportunityId: asString(p.opportunityId)!, opportunityName: asString(p.opportunityName) || 'Project',
      status: asString(p.status)!, clientRemarks: asString(p.clientRemarks) || '', terms,
      canRespond: p.status === PAYMENT_SENT && p.canRespond === true && terms.length > 0,
    } }
  } catch { return { success: false, message: 'Unable to connect. Please try again.', payment: null } }
}
export async function submitPaymentDecision(leadId: string, payment: PaymentReview, status: PaymentDecision, comments: string) {
  if (!leadId || !payment.opportunityId) return { success: false, message: 'Payment Terms access is unavailable.' }
  if (status === 'Client Requested Changes' && !comments.trim()) return { success: false, message: 'Please describe the changes you need.' }
  try {
    const { response, data, message } = await request('', { leadId, opportunityId: payment.opportunityId,
      action: status === 'Client Approved' ? 'APPROVE' : 'REQUEST_CHANGES', comments: comments.trim() })
    return { success: response.ok && data?.success === true && data.opportunityId === payment.opportunityId && data.status === status,
      message, conflict: response.status === 409 }
  } catch { return { success: false, message: 'Unable to submit your response. Please try again.' } }
}
