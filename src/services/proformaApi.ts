import { BASE_URL, SITE_PATH, asRecord, asString, parseResponse } from './salesforceApi'
export type InvoiceFile = { fileVersionId: string; title: string; fileType: string }
export type Invoice = { invoiceId: string; name: string; opportunityId: string; opportunityName: string; status: string; managerApproval?: boolean; comments: string; secureToken: string; createdDate: string; canApprove: boolean; canRequestChanges: boolean; files: InvoiceFile[] }
export type InvoicesResult = { success: boolean; message: string; invoices: Invoice[] }
const root = () => `${BASE_URL}${SITE_PATH}/services/apexrest/registration/lead/proforma-invoice/`
async function request(path: string, init?: RequestInit) {
  if (!BASE_URL) throw new Error('Missing configuration')
  const response = await fetch(root() + path, { ...init, cache: 'no-store', headers: { Accept: 'application/json', ...(init?.body ? { 'Content-Type': 'application/json' } : {}) }, signal: AbortSignal.timeout(20000) })
  const payload = await parseResponse(response)
  const data = asRecord(payload)
  return { response, data, message: asString(data?.message) || asString(asRecord(Array.isArray(payload) ? payload[0] : null)?.message) || 'Unable to load Proforma Invoices.' }
}
function parseInvoice(value: unknown, files: unknown = []): Invoice | null {
  const d = asRecord(value)
  if (!asString(d?.invoiceId) || !asString(d?.opportunityId) || !['Sent', 'Approved', 'Changes Requested'].includes(String(d?.status))) return null
  const token = asString(d?.secureToken) || ''
  return {
    invoiceId: asString(d?.invoiceId)!, opportunityId: asString(d?.opportunityId)!,
    name: asString(d?.name) || 'Proforma Invoice', opportunityName: asString(d?.opportunityName) || 'Project',
    managerApproval: d?.managerApproval === true, status: asString(d?.status)!, comments: asString(d?.clientComments) || '', secureToken: token, createdDate: asString(d?.createdDate) || '',
    canApprove: d?.status === 'Sent' && Boolean(token), canRequestChanges: d?.status === 'Sent' && Boolean(token),
    files: (Array.isArray(files) ? files : []).flatMap(value => {
      const f = asRecord(value)
      return asString(f?.fileVersionId) ? [{ fileVersionId: asString(f?.fileVersionId)!, title: asString(f?.title) || 'Invoice file', fileType: asString(f?.fileType) || '' }] : []
    }),
  }
}
export async function getProformaInvoices(leadId: string): Promise<InvoicesResult> {
  if (!leadId) return { success: false, message: 'Account unavailable.', invoices: [] }
  try {
    const { response, data, message } = await request('?' + new URLSearchParams({ leadId, list: 'true' }))
    if (!response.ok || data?.success !== true || !Array.isArray(data.invoices)) return { success: false, message, invoices: [] }
    const invoices = data.invoices.map(value => parseInvoice(value))
    if (invoices.some(value => !value)) return { success: false, message: 'Invalid invoice response. Please retry.', invoices: [] }
    return { success: true, message: '', invoices: invoices as Invoice[] }
  } catch { return { success: false, message: 'Unable to connect. Please try again.', invoices: [] } }
}
export async function getProformaInvoice(leadId: string, invoice: Invoice): Promise<{ success: boolean; message: string; invoice?: Invoice }> {
  try {
    const { response, data, message } = await request('?' + new URLSearchParams({ leadId, invoiceId: invoice.invoiceId, secureToken: invoice.secureToken }))
    if (!response.ok || data?.success !== true) return { success: false, message }
    const detail = parseInvoice(data.invoice, data.files)
    if (!detail || detail.invoiceId !== invoice.invoiceId || detail.opportunityId !== invoice.opportunityId) return { success: false, message: 'Unable to verify this invoice.' }
    return { success: true, message: '', invoice: detail }
  } catch { return { success: false, message: 'Unable to load this invoice. Please try again.' } }
}
export async function submitProformaDecision(leadId: string, invoice: Invoice, status: 'Approved' | 'Changes Requested', comments: string) {
  if (!leadId || !invoice.secureToken) return { success: false, message: 'Invoice access is unavailable. Please refresh.' }
  if (status === 'Changes Requested' && !comments.trim()) return { success: false, message: 'Please describe the changes you need.' }
  try {
    const { response, data, message } = await request('', { method: 'POST', body: JSON.stringify({ leadId, invoiceId: invoice.invoiceId, secureToken: invoice.secureToken, action: status === 'Approved' ? 'APPROVE' : 'REQUEST_CHANGES', comments: comments.trim() }) })
    return { success: response.ok && data?.success === true && data.invoiceId === invoice.invoiceId && data.status === status, message, conflict: response.status === 409 }
  } catch { return { success: false, message: 'Unable to submit your response. Please try again.' } }
}
export function proformaFileUrl(leadId: string, invoice: Invoice, file: InvoiceFile) {
  return root() + '?' + new URLSearchParams({ leadId, invoiceId: invoice.invoiceId, secureToken: invoice.secureToken, download: 'true', fileVersionId: file.fileVersionId })
}
