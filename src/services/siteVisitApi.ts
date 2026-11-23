import { BASE_URL, SITE_PATH, asRecord, asString, parseResponse } from './salesforceApi'
export type Appointment = {
  success: boolean; message: string; leadId?: string; appointmentAvailable?: boolean; actionRequired?: boolean
  appointmentDate?: string; appointmentTimeSlot?: string; appointmentStatus?: string; appointmentSentDate?: string
  appointmentConfirmed?: boolean; requestedDate?: string; requestedTimeSlot?: string
  siteLocation?: string; supervisorName?: string; availableTimeSlots?: string[]
}
export type VisitReport = { success: boolean; message: string; reportAvailable?: boolean; report?: Record<string, unknown>; documents?: { versionId: string; title: string; fileExtension: string }[] }
const root = () => `${BASE_URL}${SITE_PATH}/services/apexrest/registration/lead/`
async function request(path: string, init?: RequestInit) {
  if (!BASE_URL) throw new Error('Salesforce is not configured.')
  const response = await fetch(root() + path, { ...init, headers: { Accept: 'application/json', ...(init?.body ? { 'Content-Type': 'application/json' } : {}) }, cache: 'no-store' })
  const payload = await parseResponse(response)
  const data = asRecord(payload)
  const message = asString(data?.message) || asString(asRecord(Array.isArray(payload) ? payload[0] : null)?.message)
  return { response, data, message }
}
function failure(error: unknown) { return { success: false, message: error instanceof Error ? error.message : 'Unable to connect. Please try again.' } }
function appointment(data: Record<string, unknown>, leadId: string): Appointment {
  if (data.leadId !== leadId) return { success: false, message: 'Unable to verify appointment details.' }
  const result: Appointment = { success: true, message: asString(data.message) || '', leadId }
  const strings = ['appointmentDate', 'appointmentTimeSlot', 'appointmentStatus', 'appointmentSentDate', 'requestedDate', 'requestedTimeSlot', 'siteLocation', 'supervisorName'] as const
  for (const key of strings) result[key] = asString(data[key])
  result.appointmentAvailable = data.appointmentAvailable === true
  result.actionRequired = data.actionRequired === true
  result.appointmentConfirmed = data.appointmentConfirmed === true
  result.availableTimeSlots = Array.isArray(data.availableTimeSlots) ? data.availableTimeSlots.filter((v): v is string => typeof v === 'string') : []
  return result
}
export async function getSiteVisit(leadId: string): Promise<Appointment> {
  try {
    const { response, data, message } = await request('site-visit?leadId=' + encodeURIComponent(leadId))
    if (!response.ok || data?.success !== true) return { success: false, message: message || 'Unable to load the appointment.' }
    return appointment(data, leadId)
  } catch (error) { return failure(error) }
}
export async function respondToSiteVisit(leadId: string, responseValue: 'Approved' | 'Rescheduled', requestedDate?: string, requestedTimeSlot?: string): Promise<Appointment> {
  try {
    const { response, data, message } = await request('site-visit/response', { method: 'POST', body: JSON.stringify({ leadId, response: responseValue, ...(responseValue === 'Rescheduled' ? { requestedDate, requestedTimeSlot } : {}) }) })
    if (!response.ok || data?.success !== true) return { success: false, message: message || 'Unable to save your response.' }
    return { ...appointment(data, leadId), appointmentAvailable: true, actionRequired: false }
  } catch (error) { return failure(error) }
}
export async function getSiteVisitReport(leadId: string): Promise<VisitReport> {
  try {
    const { response, data, message } = await request('site-visit-report/?leadId=' + encodeURIComponent(leadId))
    if (response.status === 404 && data?.reportAvailable === false && message?.startsWith('No final-submitted and management-approved')) return { success: true, message: 'Your report will appear here after management approval.', reportAvailable: false }
    if (!response.ok || data?.success !== true) return { success: false, message: message || 'Unable to load the site visit report.' }
    const report = asRecord(data.report)
    if (data.reportAvailable !== true || report?.leadId !== leadId || report.managementApproval !== true || report.finalSubmitted !== true || !asString(report.reportId)) return { success: false, message: 'The report is not available for viewing.' }
    const documents = (Array.isArray(data.documents) ? data.documents : []).flatMap(value => {
      const doc = asRecord(value)
      return asString(doc?.versionId) ? [{ versionId: asString(doc?.versionId)!, title: asString(doc?.title) || 'Document', fileExtension: asString(doc?.fileExtension) || '' }] : []
    })
    return { success: true, message: message || '', reportAvailable: true, report, documents }
  } catch (error) { return failure(error) }
}
export function reportDocumentUrl(leadId: string, reportId: string, versionId: string) {
  return root() + 'site-visit-report/?' + new URLSearchParams({ leadId, reportId, versionId }).toString()
}
