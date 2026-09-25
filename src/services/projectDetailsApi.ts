import { BASE_URL, SITE_PATH, asRecord, asString, parseResponse } from './salesforceApi'
export type ProjectDetails = {
  siteSpace: string; typeOfProject: string; projectScope: string; planLevel: string
  customerBudget: string; siteLocation: string; projectDescription: string
}
export type ProjectDetailsResult = {
  leadId?: string; projects?: ProjectDetailsResult[];
  approvalStatus?: 'Pending' | 'Approved' | 'Rejected';
  success: boolean; message: string; projectSubmitted?: boolean; details?: ProjectDetails; conflict?: boolean
}
const endpoint = `${BASE_URL}${SITE_PATH}/services/apexrest/registration/lead/project-details`
export async function requestProjectDetails(leadId: string, values?: ProjectDetails, createNewProject = false): Promise<ProjectDetailsResult> {
  if (!BASE_URL || !leadId) return { success: false, message: 'Unable to load your account configuration.' }
  try {
    const response = await fetch(values ? endpoint : `${endpoint}?leadId=${encodeURIComponent(leadId)}`, {
      method: values ? 'POST' : 'GET',
      headers: { Accept: 'application/json', ...(values ? { 'Content-Type': 'application/json' } : {}) },
      ...(values ? { body: JSON.stringify({ leadId, ...values, ...(createNewProject ? { createNewProject: true } : {}) }) } : {}),
    })
    const data = asRecord(await parseResponse(response))
    if (!response.ok || data?.success !== true) return {
      success: false, conflict: response.status === 409 && data?.projectSubmitted === true,
      message: asString(data?.message) || 'Unable to load or save project details. Please try again.',
    }
    if (typeof data.projectSubmitted !== 'boolean' || (createNewProject ? (!asString(data.leadId) || data.leadId === leadId) : (data.leadId && data.leadId !== leadId))) {
      return { success: false, message: 'Unable to verify the project details response. Please reload.' }
    }
    if (values && !data.projectSubmitted) return { success: false, message: 'Submission was not confirmed. Please reload before trying again.' }
    const details = Object.fromEntries(
      ['siteSpace', 'typeOfProject', 'projectScope', 'planLevel', 'customerBudget', 'siteLocation', 'projectDescription']
        .map(key => [key, typeof data[key] === 'number' ? String(data[key]) : asString(data[key]) || values?.[key as keyof ProjectDetails] || '']),
    ) as ProjectDetails
    const approvalStatus = data.approvalStatus === 'Pending' || data.approvalStatus === 'Approved' || data.approvalStatus === 'Rejected' ? data.approvalStatus : undefined
    const projects = Array.isArray(data.projects) ? data.projects.map(item => {
      const project = asRecord(item)
      if (!project || !asString(project.leadId) || typeof project.projectSubmitted !== 'boolean') return null
      return {
        success: true, message: '', leadId: asString(project.leadId), projectSubmitted: project.projectSubmitted,
        approvalStatus: (['Pending', 'Approved', 'Rejected'].includes(asString(project.approvalStatus) || '') ? project.approvalStatus : undefined) as ProjectDetailsResult['approvalStatus'],
        details: Object.fromEntries(Object.keys(details).map(key => [key,
          typeof project[key] === 'number' ? String(project[key]) : asString(project[key]) || '',
        ])) as ProjectDetails,
      }
    }).filter((project): project is NonNullable<typeof project> => project !== null) : undefined
    return { leadId: asString(data.leadId), projects, approvalStatus, success: true, projectSubmitted: data.projectSubmitted, details, message: asString(data.message) || '' }
  } catch {
    return { success: false, message: 'Unable to connect. Please try again.' }
  }
}
