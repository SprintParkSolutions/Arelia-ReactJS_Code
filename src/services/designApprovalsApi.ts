import { BASE_URL, SITE_PATH, asRecord, asString, parseResponse } from './salesforceApi'
export type DesignFile = { versionId: string; title: string; extension: string }
export type Design = {
  designId: string; designName: string; opportunityId: string; opportunityName: string
  managerApproval?: boolean; status: string; comments: string; createdDate: string; canApprove: boolean; canRequestChanges: boolean; files: DesignFile[]
}
export type DesignsResult = { success: boolean; message: string; designs: Design[]; projects?: { id: string; name: string }[] }
export type DecisionResult = { success: boolean; message: string; conflict?: boolean }
const root = () => `${BASE_URL}${SITE_PATH}/services/apexrest/registration/opportunity/design-notification-approvals/`
async function request(path: string, init?: RequestInit) {
  if (!BASE_URL) throw new Error('Salesforce is not configured.')
  const response = await fetch(root() + path, { ...init, cache: 'no-store', headers: { Accept: 'application/json', ...(init?.body ? { 'Content-Type': 'application/json' } : {}) }, signal: AbortSignal.timeout(20000) })
  const payload = await parseResponse(response)
  const data = asRecord(payload)
  const message = asString(data?.message) || asString(asRecord(Array.isArray(payload) ? payload[0] : null)?.message) || 'Unable to load design approvals.'
  return { response, data, message }
}
export async function getDesignApprovals(contactId: string): Promise<DesignsResult> {
  if (!contactId) return { success: false, message: 'Please sign in again to load your Contact account.', designs: [] }
  try {
    const { response, data, message } = await request('?' + new URLSearchParams({ contactId }))
    const items = asRecord(data?.data)?.designs
    if (!response.ok || data?.success !== true || !Array.isArray(items)) return { success: false, message, designs: [] }
    const designs: Design[] = []
    for (const item of items) {
      const d = asRecord(item)
      if (!asString(d?.designId) || !asString(d?.opportunityId) || !asString(d?.status)) return { success: false, message: 'Invalid design response. Please retry.', designs: [] }
      if (!['Sent', 'Approved', 'Changes Requested'].includes(String(d!.status))) continue
      const files = (Array.isArray(d!.files) ? d!.files : []).flatMap(value => {
        const file = asRecord(value)
        return asString(file?.versionId) ? [{ versionId: asString(file?.versionId)!, title: asString(file?.title) || 'Design file', extension: asString(file?.extension) || '' }] : []
      })
      designs.push({
        designId: asString(d!.designId)!, opportunityId: asString(d!.opportunityId)!,
        designName: asString(d!.designName) || 'Architecture design', opportunityName: asString(d!.opportunityName) || 'Project',
        status: asString(d!.status)!, comments: asString(d!.comments) || '', createdDate: asString(d!.createdDate) || '',
        managerApproval: d!.managerApproval === true,
        canApprove: d!.status === 'Sent' && d!.canApprove === true,
        canRequestChanges: d!.status === 'Sent' && d!.canRequestChanges === true, files,
      })
    }
    const projectData = asRecord(data?.data)?.projects
    const projects = Array.isArray(projectData) ? projectData.flatMap(value => {
      const project = asRecord(value)
      return asString(project?.id) ? [{ id: asString(project?.id)!, name: asString(project?.name) || 'Project' }] : []
    }) : undefined
    return { success: true, message: '', designs, projects }
  } catch { return { success: false, message: 'Unable to connect. Please try again.', designs: [] } }
}
export async function submitDesignDecision(contactId: string, design: Design, status: 'Approved' | 'Changes Requested', comments: string): Promise<DecisionResult> {
  if (!contactId || !design.designId || !design.opportunityId) return { success: false, message: 'Your account or design could not be verified.' }
  if (status === 'Changes Requested' && !comments.trim()) return { success: false, message: 'Please describe the changes you would like.' }
  try {
    const { response, data, message } = await request('', { method: 'POST', body: JSON.stringify({ contactId, opportunityId: design.opportunityId, designId: design.designId, status, comments: comments.trim() }) })
    return { success: response.ok && data?.success === true, message, conflict: response.status === 409 }
  } catch { return { success: false, message: 'Unable to submit your response. Please try again.' } }
}
export function designFileUrl(contactId: string, design: Design, file: DesignFile) {
  return root() + 'file?' + new URLSearchParams({ contactId, opportunityId: design.opportunityId, designId: design.designId, versionId: file.versionId })
}
