const rawSiteUrl = import.meta.env.VITE_SALESFORCE_SITE_URL?.trim() || ''
const rawSitePath = import.meta.env.VITE_SALESFORCE_SITE_PATH?.trim() || '/Arelia'

export const BASE_URL = rawSiteUrl.replace(/\/+$/, '')
export const SITE_PATH = rawSitePath ? `/${rawSitePath.replace(/^\/+|\/+$/g, '')}` : ''

const REGISTRATION_BASE_URL = `${BASE_URL}${SITE_PATH}/services/apexrest/registration`
const CONVERTED_PROJECT_BASE_URL = `${BASE_URL}${SITE_PATH}/services/apexrest/converted-customer/project`
const LOGIN_BASE_URL = `${BASE_URL}${SITE_PATH}/services/apexrest/mobileLogin`
const PROSPECT_LOGIN_URL = `${REGISTRATION_BASE_URL}/lead/login`
const FORGOT_PASSWORD_BASE_URL = `${BASE_URL}${SITE_PATH}/services/apexrest/mobileForgotPassword`

export type LoginClientResponse = {
  success: boolean
  message: string
  contactId?: string
  leadId?: string
  name?: string
}

export type ForgotPasswordResponse = {
  success: boolean
  message?: string
}

export type SiteVisitAppointment = {
  success: boolean
  message?: string
  appointmentAvailable: boolean
  actionRequired: boolean
  leadId?: string
  opportunityId?: string
  appointmentSentDate?: string
  appointmentDate?: string
  appointmentTimeSlot?: string
  appointmentStatus?: string
  appointmentConfirmed: boolean
  requestedDate?: string
  requestedTimeSlot?: string
  clientResponseMessage?: string
  availableTimeSlots: string[]
}

export type SiteVisitResponsePayload = {
  leadId?: string
  opportunityId?: string
  contactId?: string
  response: 'Approved' | 'Reschedule Requested'
  requestedDate?: string
  requestedTimeSlot?: string
}

export type DesignApprovalFile = {
  versionId: string
  title: string
  fileExtension?: string
  isImage: boolean
  downloadUrl: string
}

export type DesignApproval = {
  id: string
  opportunityId: string
  title: string
  projectName?: string
  status: string
  comments?: string
  createdDate?: string
  canApprove: boolean
  canRequestChanges: boolean
  files: DesignApprovalFile[]
}

export type DesignApprovalsResponse = {
  success: boolean
  message?: string
  designs: DesignApproval[]
}

export type DesignApprovalDecisionPayload = {
  opportunityId: string
  contactId: string
  designId: string
  status: 'Approved' | 'Changes Requested'
  comments?: string
}

export type SiteVisitReportDocument = {
  documentId?: string
  versionId: string
  title: string
  fileExtension?: string
  contentSize?: number
  isImage: boolean
  downloadUrl: string
}

export type SiteVisitReport = {
  reportId: string
  reportName?: string
  recordType?: string
  leadId?: string
  opportunityId?: string
  siteVisitType?: string
  projectStage?: string
  siteVisitDate?: string
  siteVisitTimeSlot?: string
  siteAddress?: string
  roomsCount?: number
  siteAreaSqFt?: number
  usableAreaSqFt?: number
  description?: string
  estimatedBudgetDescription?: string
  estimatedCompletionDate?: string
  estimatedCompletionMonths?: number
  totalEstimatedCost?: number
  status?: string
  supervisorName?: string
  layoutBlueprintUploaded?: boolean
  reviewChanges?: boolean
  reviewChangeReason?: string
  clientApproval?: boolean
  finalSubmitted?: boolean
  managementApproval?: boolean
  documents: SiteVisitReportDocument[]
}

export type SiteVisitReportResponse = {
  success: boolean
  reportAvailable: boolean
  message?: string
  report?: SiteVisitReport
}

export type ProjectDetails = {
  success: boolean
  message?: string
  leadId?: string
  opportunityId?: string
  projectSubmitted: boolean
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  siteSpace?: string
  typeOfProject?: string
  projectScope?: string
  planLevel?: string
  customerBudget?: string
  siteLocation?: string
  projectDescription?: string
}

export type ProjectDetailsPayload = {
  leadId?: string
  opportunityId?: string
  contactId?: string
  siteSpace: string
  typeOfProject: string
  projectScope: string
  planLevel: string
  customerBudget: string
  siteLocation: string
  projectDescription: string
  // quotationType?: 'Manual' | 'Automation'
}

function applySiteVisitStatusRules(
  appointment: SiteVisitAppointment,
): SiteVisitAppointment {
  if (appointment.appointmentStatus?.trim().toLowerCase() !== 'rescheduled') {
    return appointment
  }

  return {
    ...appointment,
    appointmentConfirmed: true,
    appointmentDate: undefined,
    appointmentTimeSlot: undefined,
  }
}

export type PortalClientRecord = { 
  id: string
  type: 'Contact' | 'Lead'
  name: string
  email?: string
  phone?: string
  company?: string
}

export type PortalProject = {
  id: string
  name: string
  status?: string
  startDate?: string
  endDate?: string
  description?: string
}

export type ContactProjectLookup = {
  id: string
  name?: string
}

export type SupportCaseRecord = {
  caseId: string
  caseNumber?: string
  subject: string
  description?: string
  status?: string
  priority?: string
  category?: string
  createdDate?: string
  projectId?: string
  projectName?: string
}

export type ClientPortalResponse = {
  success: boolean
  message: string
  sourceLeadId?: string
  client?: PortalClientRecord
  projects: PortalProject[]
}

export type ProjectVendor = {
  id?: string
  vendorName: string
  vendorCategory?: string
  completionPercentage?: number
  status?: string
}

export type VendorTaskMediaItem = {
  documentId: string
  versionId?: string
  title: string
  fileType?: string
  mediaType: 'image' | 'video' | 'file'
  downloadUrl: string
  previewUrl?: string
}

export type ProjectVendorTask = {
  taskName: string
  status?: string
  dueDate?: string
  startDate?: string
  completedDate?: string
  assignedPercentage?: number
}

export type ProjectVendorTaskSummary = {
  totalTasks: number
  completedTasks: number
  incompleteTasks: number
}

export type ProjectVendorTasksResponse = {
  success: boolean
  message?: string
  tasks: ProjectVendorTask[]
  summary?: ProjectVendorTaskSummary
}

export type ProjectStatusRecord = {
  id?: string
  projectName: string
  projectStatus?: string
  projectType?: string
  budget?: number
  startDate?: string
  endDate?: string
  completionPercentage?: number
  vendors: ProjectVendor[]
}

export type ProjectStatusResponse = {
  success: boolean
  projects: ProjectStatusRecord[]
}

export type PaymentTerm = {
  id?: string
  label?: string
  name?: string
  percentage?: number
  paymentReceived?: boolean
  dueDate?: string
}

export type SupportCasePayload = {
  contactId: string
  projectId?: string
  subject: string
  description: string
  priority: string
  category: string
  otherCategory?: string
}

export type SupportCaseResponse = {
  success: boolean
  caseId?: string
  message?: string
}

export type ProjectFile = {
  documentId?: string
  versionId?: string
  title: string
  fileType?: string
  fileSize?: number
  downloadUrl: string
  previewUrl?: string
}

export type ProjectImage = {
  documentId?: string
  versionId?: string
  title: string
  imageUrl: string
  previewUrl?: string
}

export type ProjectImagesResponse = {
  success: boolean
  images: ProjectImage[]
  message?: string
}

export type ProjectMediaResponse = {
  success: boolean
  message?: string
  projectId?: string
  files: ProjectFile[]
  images: ProjectImage[]
}

export async function parseResponse(response: Response): Promise<unknown> {
  const text = await response.text()
  if (!text) return {}
  try {
    return JSON.parse(text)
  } catch {
    return { message: text }
  }
}

export function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : undefined
}

export function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined
}

export function asNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return undefined
}

export function asBoolean(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') {
    if (value.toLowerCase() === 'true') return true
    if (value.toLowerCase() === 'false') return false
  }
  return undefined
}

export function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

function roundPercentage(value: unknown): number | undefined {
  const parsed = asNumber(value)
  return parsed == null ? undefined : Math.round(parsed)
}

function getMissingConfigMessage() {
  console.error('VITE_SALESFORCE_SITE_URL is not configured.')
  return 'We are unable to connect right now. Please try again shortly or contact support.'
}

function absolutizeSalesforceUrl(value: unknown): string | undefined {
  const url = asString(value)
  if (!url) return undefined
  if (/^https?:\/\//i.test(url)) return url
  if (!BASE_URL) return url
  const normalizedPath = url.startsWith('/') ? url : `/${url}`
  return `${BASE_URL}${SITE_PATH}${normalizedPath}`
}

function normalizeClientRecord(rawClient: unknown): PortalClientRecord | undefined {
  const client = asRecord(rawClient)
  if (!client) return undefined

  const account = asRecord(client.Account)
  const id = String(client.id || client.Id || client.contactId || client.leadId || client.recordId || client.Id__c || '')
  const name = String(client.name || client.Name || client.fullName || client.full_name || client.clientName || client.contactName || '')
  const email = asString(client.email || client.Email || client.emailAddress || client.email__c)
  const phone = asString(client.phone || client.Phone || client.phoneNumber || client.mobilePhone || client.phone__c)
  const company = asString(client.company || client.Company || client.companyName || client.accountName || account?.Name)
  const type = client.type || client.Type || client.recordType || (client.isLead ? 'Lead' : 'Contact')

  if (!id && !name && !email) return undefined

  return {
    id: id || name || 'unknown',
    type: type === 'Lead' ? 'Lead' : 'Contact',
    name: name || id || 'Unknown',
    email,
    phone,
    company,
  }
}

function normalizeSupportCaseRecord(rawCase: unknown): SupportCaseRecord | undefined {
  const item = asRecord(rawCase)
  if (!item) return undefined
  const projectRelation =
    asRecord(item.Project__r) ||
    asRecord(item.project) ||
    asRecord(item.projectRecord) ||
    asRecord(item.relatedProject)

  const caseId = asString(item.caseId || item.Id)
  const subject = asString(item.subject || item.Subject)
  if (!caseId || !subject) return undefined

  return {
    caseId,
    caseNumber: asString(item.caseNumber || item.CaseNumber),
    subject,
    description: asString(item.description || item.Description),
    status: asString(item.status || item.Status),
    priority: asString(item.priority || item.Priority),
    category: asString(item.category || item.Type),
    createdDate: asString(item.createdDate || item.CreatedDate),
    projectId: asString(
      item.projectId ||
      item.ProjectId ||
      item.Project__c ||
      item.projectLookupId ||
      projectRelation?.id ||
      projectRelation?.projectId ||
      projectRelation?.Id,
    ),
    projectName: asString(
      item.projectName ||
      item.ProjectName ||
      item.Project_Name__c ||
      item.Project ||
      item.project ||
      projectRelation?.Name ||
      projectRelation?.name ||
      projectRelation?.projectName ||
      projectRelation?.Project_Name__c,
    ),
  }
}

function normalizeProjectVendor(rawVendor: unknown): ProjectVendor | undefined {
  const vendor = asRecord(rawVendor)
  if (!vendor) return undefined

  const vendorName = asString(vendor.vendorName || vendor.name || vendor.Name)
  if (!vendorName) return undefined

  return {
    id: asString(vendor.vendorId || vendor.id || vendor.Id),
    vendorName,
    vendorCategory: asString(vendor.vendorCategory || vendor.category || vendor.Category),
    completionPercentage: roundPercentage(
      vendor.completionPercentage || vendor.progress || vendor.percentComplete,
    ),
    status: asString(
      vendor.status ||
        vendor.assignmentStatus ||
        vendor.vendorStatus ||
        vendor.phaseStatus ||
        vendor.Status ||
        vendor.Assignment_Status__c ||
        vendor.Vendor_Status__c,
    ),
  }
}

function normalizeProjectStatusRecord(rawProject: unknown): ProjectStatusRecord | undefined {
  const project = asRecord(rawProject)
  if (!project) return undefined

  const projectName = asString(project.projectName || project.name || project.Name)
  if (!projectName) return undefined

  return {
    id: asString(project.id || project.Id || project.projectId || project.ProjectId) || projectName,
    projectName,
    projectStatus: asString(project.projectStatus || project.status || project.Status),
    projectType: asString(
      project.projectType ||
      project.typeOfProject ||
      project.Type_Of_Project__c ||
      project.interiorProjectType ||
      project.Interior_Project_Type__c,
    ),
    budget: asNumber(project.budget || project.Budget),
    startDate: asString(project.startDate || project.StartDate),
    endDate: asString(project.endDate || project.EndDate),
    completionPercentage: roundPercentage(
      project.completionPercentage || project.progress || project.percentComplete,
    ),
    vendors: asArray(project.vendors).map(normalizeProjectVendor).filter(Boolean) as ProjectVendor[],
  }
}

function normalizePaymentTerm(rawTerm: unknown): PaymentTerm | undefined {
  const term = asRecord(rawTerm)
  if (!term) return undefined

  const label = asString(term.label || term.name || term.Name)
  if (!label) return undefined

  return {
    id: asString(term.id || term.Id),
    label,
    name: asString(term.name || term.Name),
    percentage: asNumber(term.percentage || term.Percent__c),
    paymentReceived: asBoolean(term.paymentReceived || term.isPaid || term.Payment_Received__c),
    dueDate: asString(term.dueDate || term.Due_Date__c),
  }
}

function normalizeProjectFile(rawFile: unknown): ProjectFile | undefined {
  const file = asRecord(rawFile)
  if (!file) return undefined

  const title = asString(file.title || file.name || file.Name)
  const downloadUrl = absolutizeSalesforceUrl(file.downloadUrl || file.url || file.fileUrl)
  const previewUrl = absolutizeSalesforceUrl(
    file.previewUrl ||
      file.preview ||
      file.playUrl ||
      file.videoUrl ||
      file.streamUrl ||
      file.mediaUrl ||
      file.filePreviewUrl,
  )
  if (!title || !downloadUrl) return undefined

  return {
    title,
    fileType: asString(file.fileType || file.type || file.FileType),
    documentId: asString(file.documentId),
    versionId: asString(file.versionId),
    fileSize: asNumber(file.fileSize || file.contentSize),
    downloadUrl,
    previewUrl,
  }
}

function normalizeContactProjectLookup(rawProject: unknown): ContactProjectLookup | undefined {
  const project = asRecord(rawProject)
  if (!project) return undefined

  const id = asString(project.projectId || project.id || project.Id || project.recordId)
  if (!id) return undefined

  return {
    id,
    name: asString(project.projectName || project.name || project.Name),
  }
}

function normalizeProjectImage(rawImage: unknown): ProjectImage | undefined {
  const image = asRecord(rawImage)
  if (!image) return undefined

  const imageUrl = absolutizeSalesforceUrl(image.imageUrl || image.url || image.previewUrl)
  if (!imageUrl) return undefined

  return {
    documentId: asString(image.documentId),
    versionId: asString(image.versionId),
    title: asString(image.title || image.name || image.Name) || 'Project image',
    imageUrl,
    previewUrl: absolutizeSalesforceUrl(image.previewUrl),
  }
}

function normalizeVendorTaskMediaItem(rawItem: unknown): VendorTaskMediaItem | undefined {
  const item = asRecord(rawItem)
  if (!item) return undefined

  const documentId = asString(item.documentId || item.contentDocumentId || item.id)
  const versionId = asString(item.versionId || item.contentVersionId)
  const title = asString(item.title || item.name || item.fileName)
  const fileType = asString(item.fileType || item.type || item.extension)
  const downloadUrl = absolutizeSalesforceUrl(item.downloadUrl || item.url || item.mediaUrl)
  const previewUrl = absolutizeSalesforceUrl(item.previewUrl || item.thumbnailUrl || item.imageUrl)

  if (!documentId || !title || !downloadUrl) return undefined

  const normalizedType = (fileType || '').toUpperCase()
  const mediaType: VendorTaskMediaItem['mediaType'] = normalizedType.includes('MP4') ||
    normalizedType.includes('MOV') ||
    normalizedType.includes('AVI')
    ? 'video'
    : normalizedType.includes('PNG') ||
        normalizedType.includes('JPG') ||
        normalizedType.includes('JPEG') ||
        normalizedType.includes('WEBP')
      ? 'image'
      : 'file'

  return {
    documentId,
    versionId,
    title,
    fileType,
    mediaType,
    downloadUrl,
    previewUrl,
  }
}

function normalizeVendorTask(rawTask: unknown): ProjectVendorTask | undefined {
  const task = asRecord(rawTask)
  if (!task) return undefined

  const taskName = asString(task.taskName || task.title || task.subject || task.Name)
  if (!taskName) return undefined

  return {
    taskName,
    status: asString(task.status || task.taskStatus || task.StageName),
    dueDate: asString(task.dueDate || task.activityDate),
    startDate: asString(task.startDate),
    completedDate: asString(task.completedDate),
    assignedPercentage: roundPercentage(
      task.assignedPercentage ?? task.completionPercentage ?? task.progress,
    ),
  }
}

function normalizeVendorTaskSummary(rawSummary: unknown): ProjectVendorTaskSummary | undefined {
  const summary = asRecord(rawSummary)
  if (!summary) return undefined

  return {
    totalTasks: asNumber(summary.totalTasks) ?? 0,
    completedTasks: asNumber(summary.completedTasks) ?? 0,
    incompleteTasks: asNumber(summary.incompleteTasks) ?? 0,
  }
}

export async function loginClient(email: string, password: string): Promise<LoginClientResponse> {
  if (!BASE_URL) return { success: false, message: getMissingConfigMessage() }

  const normalizedEmail = email.trim().toLowerCase()

  try {
    const response = await fetch(`${LOGIN_BASE_URL}/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: normalizedEmail, password }),
    })

    const data = asRecord(await parseResponse(response))
    if (response.ok && data?.success === true) {
      return {
        success: true,
        message: asString(data?.message) || 'Login successful.',
        contactId: data?.contactId ? String(data.contactId) : undefined,
        leadId: data?.leadId ? String(data.leadId) : undefined,
        name: data?.name ? String(data.name) : undefined,
      }
    }
  } catch (error) {
    console.error('Existing client login request failed; trying prospect login.', error)
  }

  try {
    const response = await fetch(PROSPECT_LOGIN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: normalizedEmail, password }),
    })
    const data = asRecord(await parseResponse(response))

    return {
      success: response.ok && data?.success === true,
      message:
        asString(data?.message) ||
        (response.ok ? 'Sign in successful.' : 'Invalid email address or password.'),
      leadId: data?.leadId ? String(data.leadId) : undefined,
      name: asString(data?.fullName) || undefined,
    }
  } catch (error) {
    console.error('Prospect login request failed:', error)
    return {
      success: false,
      message: 'We could not reach our servers. Please check your connection and try again.',
    }
  }
}

export async function requestPasswordResetOtp(email: string): Promise<ForgotPasswordResponse> {
  if (!BASE_URL) return { success: false, message: getMissingConfigMessage() }

  try {
    const response = await fetch(`${FORGOT_PASSWORD_BASE_URL}/sendOtp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim() }),
    })
    const data = asRecord(await parseResponse(response))
    return {
      success: asBoolean(data?.success) ?? response.ok,
      message: asString(data?.message),
    }
  } catch (error) {
    console.error('Error requesting password reset code:', error)
    return {
      success: false,
      message: 'We could not reach our servers. Please check your connection and try again.',
    }
  }
}

export async function verifyPasswordResetOtp(
  email: string,
  otp: string,
): Promise<ForgotPasswordResponse> {
  if (!BASE_URL) return { success: false, message: getMissingConfigMessage() }

  try {
    const response = await fetch(`${FORGOT_PASSWORD_BASE_URL}/verifyOtp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), otp: otp.trim() }),
    })
    const data = asRecord(await parseResponse(response))
    return {
      success: asBoolean(data?.success) ?? response.ok,
      message: asString(data?.message),
    }
  } catch (error) {
    console.error('Error verifying reset code:', error)
    return {
      success: false,
      message: 'We could not reach our servers. Please check your connection and try again.',
    }
  }
}

export async function confirmPasswordReset(
  email: string,
  otp: string,
  newPassword: string,
): Promise<ForgotPasswordResponse> {
  if (!BASE_URL) return { success: false, message: getMissingConfigMessage() }

  try {
    const response = await fetch(`${FORGOT_PASSWORD_BASE_URL}/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), otp: otp.trim(), newPassword }),
    })
    const data = asRecord(await parseResponse(response))
    return {
      success: asBoolean(data?.success) ?? response.ok,
      message: asString(data?.message),
    }
  } catch (error) {
    console.error('Error resetting password:', error)
    return {
      success: false,
      message: 'We could not reach our servers. Please check your connection and try again.',
    }
  }
}

export async function getClientPortalDetails({
  contactId,
  leadId,
  email,
}: {
  contactId?: string | null
  leadId?: string | null
  email?: string | null
}): Promise<ClientPortalResponse> {
  if (!BASE_URL) return { success: false, message: getMissingConfigMessage(), projects: [] }

  const targetId = contactId || leadId
  if (!targetId) {
    return { success: false, message: 'Please log in again to view your dashboard.', projects: [] }
  }

  try {
    const profileRequest = fetch(`${BASE_URL}${SITE_PATH}/services/apexrest/mobileClientProfile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contactId: targetId }),
    })

    const dashboardParams = new URLSearchParams()
    dashboardParams.set('contactId', targetId)

    const dashboardRequest = fetch(
      `${BASE_URL}${SITE_PATH}/services/apexrest/mobile/dashboard?${dashboardParams.toString()}`,
      {
        method: 'GET',
        headers: { Accept: 'application/json' },
      },
    )

    const projectLookupRequest = fetch(
      `${BASE_URL}${SITE_PATH}/services/apexrest/mobile/getProjectByContact`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactId: targetId, email }),
      },
    )

    const [profileRes, dashboardRes, projectLookupRes] = await Promise.all([
      profileRequest,
      dashboardRequest,
      projectLookupRequest,
    ])

    const profileData = asRecord(await parseResponse(profileRes))
    const dashboardData = asRecord(await parseResponse(dashboardRes))
    const rawClient = profileData?.user || profileData?.client || profileData?.data || dashboardData
    const clientRecord = normalizeClientRecord(rawClient)
    const projectLookupData = await parseResponse(projectLookupRes)
    const projectLookupRoot = asRecord(projectLookupData)
    const profileUser = asRecord(profileData?.user || profileData?.client || profileData?.data)
    const sourceLeadId = asString(
      profileData?.sourceLeadId ||
      profileData?.originalLeadId ||
      profileData?.convertedLeadId ||
      profileUser?.sourceLeadId ||
      profileUser?.originalLeadId ||
      profileUser?.convertedLeadId ||
      dashboardData?.sourceLeadId ||
      dashboardData?.originalLeadId ||
      dashboardData?.convertedLeadId ||
      projectLookupRoot?.sourceLeadId ||
      projectLookupRoot?.originalLeadId ||
      projectLookupRoot?.convertedLeadId,
    )
    let projectLookup =
      normalizeContactProjectLookup(projectLookupRoot?.project || projectLookupRoot?.data) ||
      normalizeContactProjectLookup(projectLookupData)

    if (!projectLookup?.id && clientRecord?.email) {
      projectLookup = (await getProjectByContact(targetId, clientRecord.email)) || undefined
    }

    const projects: PortalProject[] = []
    if (
      dashboardData?.projectName &&
      typeof dashboardData.projectName === 'string' &&
      dashboardData.projectName !== 'No Active Project'
    ) {
      const budget = asNumber(dashboardData.budget)
      const progress = roundPercentage(dashboardData.progress)

      projects.push({
        id: asString(dashboardData.projectId || dashboardData.id) || projectLookup?.id || '',
        name: dashboardData.projectName,
        status: progress != null ? `Progress: ${progress}%` : 'Active',
        startDate: asString(dashboardData.startDate),
        endDate: asString(dashboardData.endDate),
        description: budget != null ? `Estimated Budget: Rs ${budget.toLocaleString()}` : undefined,
      })
    } else if (projectLookup?.id) {
      // Some logins resolve to a duplicate Contact with no direct dashboard project.
      // In that case, fall back to the explicit project lookup result.
      projects.push({
        id: projectLookup.id,
        name: projectLookup.name || 'Project',
        status: 'Active',
      })
    }

    return {
      success: profileRes.ok || dashboardRes.ok,
      message: asString(profileData?.message) || asString(dashboardData?.message) || '',
      sourceLeadId,
      client: clientRecord,
      projects,
    }
  } catch (error) {
    console.error('Error loading portal details:', error)
    return {
      success: false,
      message: 'We could not load your dashboard right now. Please try again in a moment.',
      projects: [],
    }
  }
}

export async function getSupportCases(contactId: string): Promise<SupportCaseRecord[] | null> {
  try {
    const params = new URLSearchParams()
    params.set('contactId', contactId)

    const response = await fetch(
      `${BASE_URL}${SITE_PATH}/services/apexrest/mobileSupportCase?${params.toString()}`,
      {
        method: 'GET',
        headers: { Accept: 'application/json' },
      },
    )

    const data = asRecord(await parseResponse(response))
    if (!(data?.success ?? response.ok)) return null

    return asArray(data?.cases).map(normalizeSupportCaseRecord).filter(Boolean) as SupportCaseRecord[]
  } catch (error) {
    console.error('Error fetching support cases:', error)
    return null
  }
}

export async function getProjectByContact(
  contactId: string,
  email?: string | null,
): Promise<ContactProjectLookup | null> {
  try {
    const response = await fetch(`${BASE_URL}${SITE_PATH}/services/apexrest/mobile/getProjectByContact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contactId, email }),
    })
    const data = await parseResponse(response)
    const root = asRecord(data)
    return (
      normalizeContactProjectLookup(root?.project || root?.data) ||
      normalizeContactProjectLookup(data) ||
      null
    )
  } catch (error) {
    console.error('Error fetching project by contact:', error)
    return null
  }
}

export async function getProjectStatus(
  contactId: string,
  projectId?: string,
): Promise<ProjectStatusResponse | null> {
  try {
    const response = await fetch(`${BASE_URL}${SITE_PATH}/services/apexrest/mobileProjectStatus`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contactId, projectId }),
    })

    const data = asRecord(await parseResponse(response))
    const projects = (
      data?.project
        ? [normalizeProjectStatusRecord(data.project)]
        : asArray(data?.projects).map(normalizeProjectStatusRecord)
    ).filter(Boolean) as ProjectStatusRecord[]

    return {
      success: asBoolean(data?.success) ?? response.ok,
      projects,
    }
  } catch (error) {
    console.error('Error fetching project status:', error)
    return null
  }
}

export async function getVendorTasks(
  projectId: string,
  vendorName: string,
): Promise<ProjectVendorTasksResponse | null> {
  try {
    const response = await fetch(`${BASE_URL}${SITE_PATH}/services/apexrest/mobileVendorTasksV2`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, vendorName }),
    })
    const data = asRecord(await parseResponse(response))

    return {
      success: asBoolean(data?.success) ?? response.ok,
      message: asString(data?.message),
      tasks: asArray(data?.tasks).map(normalizeVendorTask).filter(Boolean) as ProjectVendorTask[],
      summary: normalizeVendorTaskSummary(data?.summary),
    }
  } catch (error) {
    console.error('Error fetching vendor tasks:', error)
    return null
  }
}

export async function getVendorTaskSummary(
  projectId: string,
  vendorName: string,
): Promise<ProjectVendorTaskSummary | null> {
  try {
    const response = await fetch(`${BASE_URL}${SITE_PATH}/services/apexrest/mobileVendorTasksV2`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, vendorName, summaryOnly: true }),
    })
    const data = asRecord(await parseResponse(response))
    return normalizeVendorTaskSummary(data?.summary) ?? null
  } catch (error) {
    console.error('Error fetching vendor task summary:', error)
    return null
  }
}

export async function getProjectTimeline(contactId: string, projectId: string) {
  try {
    const response = await fetch(`${BASE_URL}${SITE_PATH}/services/apexrest/mobileProjectTimeline`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contactId, projectId }),
    })
    return await parseResponse(response)
  } catch (error) {
    console.error('Error fetching project timeline:', error)
    return null
  }
}

export async function getPaymentTerms(projectName: string): Promise<PaymentTerm[] | null> {
  try {
    const encoded = encodeURIComponent(projectName.trim())
    const response = await fetch(
      `${BASE_URL}${SITE_PATH}/services/apexrest/payment-terms?projectName=${encoded}`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      },
    )
    const data = await parseResponse(response)
    return asArray(data).map(normalizePaymentTerm).filter(Boolean) as PaymentTerm[]
  } catch (error) {
    console.error('Error fetching payment terms:', error)
    return null
  }
}

export async function getProjectFiles(projectId: string): Promise<ProjectFile[] | null> {
  try {
    const endpoints = ['mobile/project-files', 'mobile/projectfiles']

    for (const endpoint of endpoints) {
      const response = await fetch(`${BASE_URL}${SITE_PATH}/services/apexrest/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      })

      if (!response.ok) continue

      const data = await parseResponse(response)
      const root = asRecord(data)
      const fileList = root?.files || root?.data || data
      const normalized = asArray(fileList).map(normalizeProjectFile).filter(Boolean) as ProjectFile[]

      if (normalized.length > 0 || endpoint === endpoints[endpoints.length - 1]) {
        return normalized
      }
    }

    return []
  } catch (error) {
    console.error('Error fetching project files:', error)
    return null
  }
}

export async function getSiteVisitAppointment(
  leadId?: string,
  opportunityId?: string,
  contactId?: string,
): Promise<SiteVisitAppointment> {
  const fallback: SiteVisitAppointment = {
    success: false,
    appointmentAvailable: false,
    actionRequired: false,
    appointmentConfirmed: false,
    availableTimeSlots: [],
  }
  try {
    const params = new URLSearchParams()
    if (leadId) params.set('leadId', leadId)
    if (opportunityId) params.set('opportunityId', opportunityId)
    if (contactId) params.set('contactId', contactId)
    const endpoint = contactId
      ? `${CONVERTED_PROJECT_BASE_URL}/site-visits`
      : `${REGISTRATION_BASE_URL}/lead/site-visit`
    const response = await fetch(`${endpoint}?${params.toString()}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    })
    const data = asRecord(await parseResponse(response))
    return applySiteVisitStatusRules({
      ...fallback,
      success: asBoolean(data?.success) ?? response.ok,
      message: asString(data?.message),
      appointmentAvailable: asBoolean(data?.appointmentAvailable) ?? false,
      actionRequired: asBoolean(data?.actionRequired) ?? false,
      leadId: asString(data?.leadId),
      appointmentSentDate: asString(data?.appointmentSentDate),
      appointmentDate: asString(data?.appointmentDate),
      appointmentTimeSlot: asString(data?.appointmentTimeSlot),
      appointmentStatus: asString(data?.appointmentStatus),
      appointmentConfirmed: asBoolean(data?.appointmentConfirmed) ?? false,
      requestedDate: asString(data?.requestedDate),
      requestedTimeSlot: asString(data?.requestedTimeSlot),
      clientResponseMessage: asString(data?.clientResponseMessage),
      availableTimeSlots: asArray(data?.availableTimeSlots).filter(
        (slot): slot is string => typeof slot === 'string',
      ),
    })
  } catch (error) {
    console.error('Error fetching site visit appointment:', error)
    return { ...fallback, message: 'Could not load the site visit appointment.' }
  }
}

export async function getApprovedSiteVisitReport(
  leadId?: string,
  reportId?: string,
  opportunityId?: string,
  contactId?: string,
): Promise<SiteVisitReportResponse> {
  const params = new URLSearchParams()
  if (leadId) params.set('leadId', leadId)
  if (reportId) params.set('reportId', reportId)
  if (opportunityId) params.set('opportunityId', opportunityId)
  if (contactId) params.set('contactId', contactId)

  try {
    const endpoint = contactId
      ? `${CONVERTED_PROJECT_BASE_URL}/site-visits`
      : `${REGISTRATION_BASE_URL}/lead/site-visit-report`
    const response = await fetch(
      `${endpoint}?${params.toString()}`,
      { method: 'GET', headers: { Accept: 'application/json' } },
    )
    const data = asRecord(await parseResponse(response))
    const reportData = asRecord(data?.report)
    const resolvedReportId = asString(reportData?.reportId)

    if (!response.ok || data?.success !== true || !reportData || !resolvedReportId) {
      return {
        success: false,
        reportAvailable: false,
        message: asString(data?.message) || 'No Site Visit Report was returned for this customer.',
      }
    }

    const documents = asArray(data?.documents)
      .map((item): SiteVisitReportDocument | undefined => {
        const document = asRecord(item)
        const versionId = asString(document?.versionId)
        const title = asString(document?.title)
        if (!versionId || !title) return undefined
        const documentParams = new URLSearchParams({
          reportId: resolvedReportId,
          versionId,
        })
        if (leadId) documentParams.set('leadId', leadId)
        if (opportunityId) documentParams.set('opportunityId', opportunityId)
        if (contactId) documentParams.set('contactId', contactId)
        return {
          documentId: asString(document?.documentId),
          versionId,
          title,
          fileExtension: asString(document?.fileExtension),
          contentSize: asNumber(document?.contentSize),
          isImage: asBoolean(document?.isImage) ?? false,
          downloadUrl: `${REGISTRATION_BASE_URL}/lead/site-visit-report?${documentParams.toString()}`,
        }
      })
      .filter((document): document is SiteVisitReportDocument => Boolean(document))

    return {
      success: true,
      reportAvailable: true,
      message: asString(data?.message),
      report: {
        reportId: resolvedReportId,
        reportName: asString(reportData.reportName),
        recordType: asString(reportData.recordType),
        leadId: asString(reportData.leadId),
        opportunityId: asString(reportData.opportunityId),
        siteVisitType: asString(reportData.siteVisitType),
        projectStage: asString(reportData.projectStage),
        siteVisitDate: asString(reportData.siteVisitDate),
        siteVisitTimeSlot: asString(reportData.siteVisitTimeSlot),
        siteAddress: asString(reportData.siteAddress),
        roomsCount: asNumber(reportData.roomsCount),
        siteAreaSqFt: asNumber(reportData.siteAreaSqFt),
        usableAreaSqFt: asNumber(reportData.usableAreaSqFt),
        description: asString(reportData.description),
        estimatedBudgetDescription: asString(reportData.estimatedBudgetDescription),
        estimatedCompletionDate: asString(reportData.estimatedCompletionDate),
        estimatedCompletionMonths: asNumber(reportData.estimatedCompletionMonths),
        totalEstimatedCost: asNumber(reportData.totalEstimatedCost),
        status: asString(reportData.status),
        supervisorName:
          asString(reportData.supervisorDisplayName) ||
          asString(reportData.supervisorFullName) ||
          asString(reportData.supervisorUserFullName) ||
          asString(asRecord(reportData.supervisor)?.Name) ||
          asString(asRecord(reportData.supervisor)?.name) ||
          asString(asRecord(reportData.Supervisor_User__r)?.Name) ||
          asString(reportData.supervisorName),
        layoutBlueprintUploaded: asBoolean(reportData.layoutBlueprintUploaded),
        reviewChanges: asBoolean(reportData.reviewChanges),
        reviewChangeReason: asString(reportData.reviewChangeReason),
        clientApproval: asBoolean(reportData.clientApproval),
        finalSubmitted: asBoolean(reportData.finalSubmitted),
        managementApproval: asBoolean(reportData.managementApproval),
        documents,
      },
    }
  } catch (error) {
    console.error('Error fetching approved site visit report:', error)
    return {
      success: false,
      reportAvailable: false,
      message: 'Could not load the approved Site Visit Report.',
    }
  }
}

export async function submitSiteVisitResponse(
  payload: SiteVisitResponsePayload,
): Promise<SiteVisitAppointment> {
  const response = await fetch(`${REGISTRATION_BASE_URL}/lead/site-visit/response`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = asRecord(await parseResponse(response))
  return applySiteVisitStatusRules({
    success: asBoolean(data?.success) ?? response.ok,
    message: asString(data?.message),
    appointmentAvailable: true,
    actionRequired: false,
    leadId: asString(data?.leadId),
    opportunityId: asString(data?.opportunityId),
    appointmentDate: asString(data?.appointmentDate),
    appointmentTimeSlot: asString(data?.appointmentTimeSlot),
    appointmentStatus: asString(data?.appointmentStatus),
    appointmentConfirmed: asBoolean(data?.appointmentConfirmed) ?? false,
    requestedDate: asString(data?.requestedDate),
    requestedTimeSlot: asString(data?.requestedTimeSlot),
    availableTimeSlots: [],
  })
}

export async function getDesignApprovals(
  contactId: string,
  opportunityId?: string,
): Promise<DesignApprovalsResponse> {
  const params = new URLSearchParams({ contactId })
  if (opportunityId) params.set('opportunityId', opportunityId)
  try {
    const response = await fetch(
      `${REGISTRATION_BASE_URL}/opportunity/design-notification-approvals?${params.toString()}`,
      { method: 'GET', headers: { Accept: 'application/json' } },
    )
    const data = asRecord(await parseResponse(response))
    const responseData = asRecord(data?.data)
    const designs = asArray(responseData?.designs).map((item): DesignApproval | undefined => {
      const design = asRecord(item)
      const id = asString(design?.designId)
      const designOpportunityId = asString(design?.opportunityId) || opportunityId
      if (!id || !designOpportunityId) return undefined
      const files = asArray(design?.files).map((entry): DesignApprovalFile | undefined => {
        const file = asRecord(entry)
        const versionId = asString(file?.versionId)
        if (!versionId) return undefined
        const fileParams = new URLSearchParams({ opportunityId: designOpportunityId, contactId, designId: id, versionId })
        const extension = asString(file?.extension)
        const contentType = asString(file?.contentType)
        return {
          versionId,
          title: asString(file?.title) || 'Design image',
          fileExtension: extension,
          isImage: contentType?.startsWith('image/') ?? ['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(extension?.toLowerCase() || ''),
          downloadUrl: `${REGISTRATION_BASE_URL}/opportunity/design-notification-approvals/file?${fileParams.toString()}`,
        }
      }).filter((file): file is DesignApprovalFile => Boolean(file))
      return {
        id,
        opportunityId: designOpportunityId,
        title: asString(design?.designName) || '3D Design',
        projectName: asString(design?.opportunityName) || asString(responseData?.opportunityName),
        status: asString(design?.status) || 'Sent',
        comments: asString(design?.comments),
        createdDate: asString(design?.createdDate),
        canApprove: asBoolean(design?.canApprove) ?? false,
        canRequestChanges: asBoolean(design?.canRequestChanges) ?? false,
        files,
      }
    }).filter((design): design is DesignApproval => Boolean(design))
    return {
      success: asBoolean(data?.success) ?? response.ok,
      message: asString(data?.message),
      designs,
    }
  } catch (error) {
    console.error('Error fetching design approvals:', error)
    return { success: false, message: 'Could not load design approvals.', designs: [] }
  }
}

export async function submitDesignApprovalDecision(
  payload: DesignApprovalDecisionPayload,
): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await fetch(`${REGISTRATION_BASE_URL}/opportunity/design-notification-approvals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = asRecord(await parseResponse(response))
    return {
      success: asBoolean(data?.success) ?? response.ok,
      message: asString(data?.message),
    }
  } catch (error) {
    console.error('Error submitting design approval:', error)
    return { success: false, message: 'Could not submit your decision.' }
  }
}

function normalizeProjectDetails(data: Record<string, unknown> | null | undefined, responseOk: boolean): ProjectDetails {
  return {
    success: asBoolean(data?.success) ?? responseOk,
    message: asString(data?.message),
    leadId: asString(data?.leadId),
    opportunityId: asString(data?.opportunityId),
    projectSubmitted: asBoolean(data?.projectSubmitted) ?? false,
    firstName: asString(data?.firstName),
    lastName: asString(data?.lastName),
    email: asString(data?.email),
    phone: asString(data?.phone),
    siteSpace: asString(data?.siteSpace),
    typeOfProject: asString(data?.typeOfProject),
    projectScope: asString(data?.projectScope),
    planLevel: asString(data?.planLevel),
    customerBudget:
      asString(data?.customerBudget) ||
      (asNumber(data?.customerBudget) != null ? String(asNumber(data?.customerBudget)) : undefined),
    siteLocation: asString(data?.siteLocation),
    projectDescription: asString(data?.projectDescription),
  }
}

export async function getProjectDetails(
  leadId?: string,
  opportunityId?: string,
  contactId?: string,
): Promise<ProjectDetails> {
  const params = new URLSearchParams()
  if (leadId) params.set('leadId', leadId)
  if (opportunityId) params.set('opportunityId', opportunityId)
  if (contactId) params.set('contactId', contactId)
  const endpoint = contactId
    ? CONVERTED_PROJECT_BASE_URL
    : `${REGISTRATION_BASE_URL}/lead/project-details`
  const response = await fetch(`${endpoint}?${params.toString()}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  })
  return normalizeProjectDetails(asRecord(await parseResponse(response)), response.ok)
}

export async function submitProjectDetails(payload: ProjectDetailsPayload): Promise<ProjectDetails> {
  const response = await fetch(`${REGISTRATION_BASE_URL}/lead/project-details`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
  })
  return normalizeProjectDetails(asRecord(await parseResponse(response)), response.ok)
}

export async function registerLead(
  firstName: string,
  lastName: string,
  email: string,
  phone: string,
  company: string,
  password?: string,
  confirmPassword?: string,
  sourceLeadId?: string,
): Promise<{ success: boolean; message?: string; leadId?: string }> {
  if (!BASE_URL) return { success: false, message: getMissingConfigMessage() }

  try {
    const response = await fetch(`${REGISTRATION_BASE_URL}/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName,
        lastName,
        email,
        phone,
        companyName: !company || company.trim() === '' ? 'Self' : company,
        ...(password
          ? {
              password,
              enterPassword: password,
              Enter_Password__c: password,
            }
          : {}),
        ...(confirmPassword
          ? {
              confirmPassword,
              Confirm_password__c: confirmPassword,
            }
          : {}),
        ...(sourceLeadId ? { sourceLeadId, additionalProject: true } : {}),
      }),
    })
    const data = asRecord(await parseResponse(response))
    return {
      success: data?.success === true,
      message: asString(data?.message),
      leadId: asString(data?.leadId),
    }
  } catch {
    return { success: false, message: 'An error occurred while registering.' }
  }
}

export async function sendOtp(
  email: string,
  otp: string,
): Promise<{ success: boolean; message?: string }> {
  if (!BASE_URL) return { success: false, message: getMissingConfigMessage() }

  try {
    const response = await fetch(`${REGISTRATION_BASE_URL}/otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp }),
    })
    const data = asRecord(await parseResponse(response))
    return { success: response.status === 200, message: asString(data?.message) }
  } catch {
    return { success: false, message: 'An error occurred while sending OTP.' }
  }
}

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function askChatbot(question: string, contactId: string) {
  try {
    const response = await fetch(`${BASE_URL}${SITE_PATH}/services/apexrest/mobileChatbotfinal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: question, contactId }),
    })
    return await parseResponse(response)
  } catch {
    return null
  }
}

export async function createSupportCase(
  payload: SupportCasePayload,
): Promise<SupportCaseResponse> {
  try {
    const response = await fetch(`${BASE_URL}${SITE_PATH}/services/apexrest/mobileSupportCase`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = asRecord(await parseResponse(response))

    return {
      success: asBoolean(data?.success) ?? response.ok,
      caseId: asString(data?.caseId),
      message: asString(data?.message),
    }
  } catch (error) {
    console.error('Error creating support case:', error)
    return {
      success: false,
      message: 'Could not reach Salesforce. Please check your connection and try again.',
    }
  }
}

export async function getProjectImages(projectId: string): Promise<ProjectImagesResponse | null> {
  try {
    const response = await fetch(`${BASE_URL}${SITE_PATH}/services/apexrest/mobileProjectImages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId }),
    })
    const data = asRecord(await parseResponse(response))
    return {
      success: asBoolean(data?.success) ?? response.ok,
      images: asArray(data?.images).map(normalizeProjectImage).filter(Boolean) as ProjectImage[],
    }
  } catch (error) {
    console.error('Error fetching project images:', error)
    return null
  }
}

export async function getProjectMedia(projectId: string): Promise<ProjectMediaResponse | null> {
  try {
    const response = await fetch(`${BASE_URL}${SITE_PATH}/services/apexrest/mobileProjectMedia`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId }),
    })
    const data = asRecord(await parseResponse(response))
    return {
      success: asBoolean(data?.success) ?? response.ok,
      message: asString(data?.message),
      projectId: asString(data?.projectId),
      files: asArray(data?.files).map(normalizeProjectFile).filter(Boolean) as ProjectFile[],
      images: asArray(data?.images).map(normalizeProjectImage).filter(Boolean) as ProjectImage[],
    }
  } catch (error) {
    console.error('Error fetching project media:', error)
    return null
  }
}

export async function getVendorTaskMedia(taskId: string): Promise<VendorTaskMediaItem[] | null> {
  try {
    const response = await fetch(`${BASE_URL}${SITE_PATH}/services/apexrest/mobileVendorTaskMedia`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskId }),
    })
    const data = await parseResponse(response)
    const root = asRecord(data)
    const media = root?.media || root?.files || root?.items || data
    return asArray(media).map(normalizeVendorTaskMediaItem).filter(Boolean) as VendorTaskMediaItem[]
  } catch (error) {
    console.error('Error fetching vendor task media:', error)
    return null
  }
}
