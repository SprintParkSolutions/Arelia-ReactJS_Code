import { BASE_URL, SITE_PATH, asRecord, asString, parseResponse } from './salesforceApi'
export type SupervisorResult = {
  success: boolean; message: string; assigned?: boolean; supervisorUserId?: string
  supervisorUser?: string; supervisorUserEmail?: string; supervisorUserPhone?: string
}
export async function getSupervisor(leadId: string): Promise<SupervisorResult> {
  if (!BASE_URL || !leadId) return { success: false, message: 'Unable to load your account configuration.' }
  try {
    const response = await fetch(`${BASE_URL}${SITE_PATH}/services/apexrest/registration/lead/supervisor?leadId=${encodeURIComponent(leadId)}`, { headers: { Accept: 'application/json' } })
    const payload = await parseResponse(response)
    const data = asRecord(payload)
    const salesforceError = Array.isArray(payload) ? asRecord(payload[0]) : undefined
    if (response.status === 403 && salesforceError?.errorCode === 'FORBIDDEN') {
      return { success: false, message: 'Salesforce has denied access to supervisor information. An administrator must enable ProspectSupervisorInfoApi for the configured Salesforce Site user.' }
    }
    if (!response.ok || data?.success !== true) return { success: false, message: asString(data?.message) || asString(salesforceError?.message) || 'Unable to load supervisor information.' }
    if (data.leadId !== leadId || typeof data.assigned !== 'boolean' || (data.assigned && !asString(data.supervisorUserId))) {
      return { success: false, message: 'Unable to verify supervisor information. Please retry.' }
    }
    return {
      success: true, message: asString(data.message) || '', assigned: data.assigned,
      supervisorUserId: asString(data.supervisorUserId), supervisorUser: asString(data.supervisorUser),
      supervisorUserEmail: asString(data.supervisorUserEmail), supervisorUserPhone: asString(data.supervisorUserPhone),
    }
  } catch { return { success: false, message: 'Unable to connect. Please try again.' } }
}
