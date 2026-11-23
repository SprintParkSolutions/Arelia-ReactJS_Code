import { BASE_URL, SITE_PATH, asRecord, asString, parseResponse } from './salesforceApi'
export type AgreementNotice = { opportunityId: string; message: string; notificationType?: 'CLIENT_AGREEMENT_SENT' | 'CLIENT_AGREEMENT_SIGNED' }
export async function getAgreementNotice(leadId: string): Promise<AgreementNotice | null> {
  if (!leadId || !BASE_URL) return null
  try {
    const response = await fetch(`${BASE_URL}${SITE_PATH}/services/apexrest/client-portal/client-agreement-notification?` + new URLSearchParams({ leadId }),
      { cache: 'no-store', signal: AbortSignal.timeout(20000), headers: { Accept: 'application/json' } })
    const data = asRecord(await parseResponse(response))
    if (!response.ok || data?.success !== true || (data.clientAgreementSent !== true && data.clientAgreementSigned !== true) || data.showNotification !== true) return null
    const opportunityId = asString(data.opportunityId)
    const message = asString(data.notificationMessage)
    const signed = data.clientAgreementSigned === true
    return opportunityId && message ? { opportunityId, message, ...(signed ? { notificationType: 'CLIENT_AGREEMENT_SIGNED' as const } : {}) } : null
  } catch { return null }
}
