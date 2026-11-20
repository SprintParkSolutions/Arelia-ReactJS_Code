import type { JourneyProject } from './ProjectJourney'
import type { PendingOverview } from './approvals/pendingApprovalItems'
import type { ProjectDetailsResult } from '../services/projectDetailsApi'
import type { Design } from '../services/designApprovalsApi'
import type { Invoice } from '../services/proformaApi'
import type { BudgetResult } from '../services/budgetReviewApi'
import type { PaymentResult } from '../services/paymentTermsApi'
import type { VisitReport } from '../services/siteVisitApi'
import { approvedSiteVisitReportId } from './siteVisit/siteVisitRequest'

type TrackedProject = {
  id: string; name: string; status?: string; completionPercentage?: number; leadId?: string; opportunityId?: string
}
type JourneyRosterEntry = Omit<TrackedProject, 'name'> & { name?: string; details?: ProjectDetailsResult }
type Inputs = {
  projects: TrackedProject[]
  details?: ProjectDetailsResult | null
  leadId?: string
  visits: { leadId: string; report: VisitReport | null }[]
  designs?: Design[]
  invoices?: Invoice[]
  budgets?: BudgetResult | null
  payments?: PaymentResult | null
  agreements: { leadId?: string; opportunityId: string; signed: boolean }[]
  firstInstallmentPaid?: ReadonlySet<string>
  pending: PendingOverview
}

const actionSteps = { siteVisit: 1, design: 2, invoice: 3, budget: 4, payment: 5 }
const projectCompletionStep = 9
const statusSteps: ReadonlyMap<string, number> = new Map([
  ['project details', 0], ['site visit', 1], ['3d design', 2], ['proforma invoice', 3],
  ['budget review', 4], ['payment terms', 5], ['client agreement', 6], ['first installment', 7],
  ['in progress', 8], ['project execution', 8], ['project completion', projectCompletionStep],
])

export function buildProjectJourneys(input: Inputs): JourneyProject[] {
  const details = new Map<string, ProjectDetailsResult>()
  if (input.details?.success) {
    const primaryId = input.details.leadId || input.leadId
    if (primaryId && !input.details.projects?.length) details.set(primaryId, input.details)
    for (const project of input.details.projects || []) {
      if (project.leadId) details.set(project.leadId, project)
    }
  }
  const budgets = input.budgets?.projects?.flatMap(({ id, result }) =>
    result.success && result.budget ? [{ ...result.budget, leadId: result.budget.leadId || id }] : [],
  ) || []
  const payments = input.payments?.projects?.flatMap(({ id, result }) =>
    result.success && result.payment ? [{ ...result.payment, leadId: result.payment.leadId || id }] : [],
  ) || []

  const roster = new Map<string, JourneyRosterEntry>(input.projects.map(project => [project.id, project]))
  const relatedRecords = [...(input.invoices || []), ...budgets, ...payments]
  const references = [...details].map(([leadId, project]) => {
    const related = relatedRecords
      .find(record => record.leadId === leadId || record.opportunityId === project.convertedOpportunityId)
    const opportunityId = project.convertedOpportunityId || related?.opportunityId
    const name = related?.opportunityName || input.designs?.find(design => design.opportunityId === opportunityId)?.opportunityName
    return { leadId, opportunityId, name, project }
  })
  const matches = new Map<string, string>()
  const claimed = new Set<string>()
  function match(leadId: string, projectId: string) {
    matches.set(leadId, projectId)
    claimed.add(projectId)
  }
  for (const reference of references) {
    const tracked = input.projects.find(project => !claimed.has(project.id) &&
      (project.leadId === reference.leadId || project.id === reference.leadId ||
        (reference.opportunityId && (project.opportunityId === reference.opportunityId || project.id === reference.opportunityId))))
    if (tracked) match(reference.leadId, tracked.id)
  }

  // Older project status responses may omit the relationship IDs.
  const unlinkedProjects = input.projects.filter(project => !claimed.has(project.id) && !project.leadId && !project.opportunityId)
  const convertedBriefs = references.filter(reference => !matches.has(reference.leadId) && reference.opportunityId)
  for (const reference of convertedBriefs) {
    const name = reference.name?.trim().toLowerCase()
    if (!name || convertedBriefs.filter(item => item.name?.trim().toLowerCase() === name).length !== 1) continue
    const candidates = unlinkedProjects.filter(project => project.name.trim().toLowerCase() === name)
    if (candidates.length === 1 && !claimed.has(candidates[0].id)) match(reference.leadId, candidates[0].id)
  }
  const remainingBriefs = convertedBriefs.filter(reference => !matches.has(reference.leadId))
  const remainingProjects = unlinkedProjects.filter(project => !claimed.has(project.id))
  if (remainingBriefs.length === 1 && remainingProjects.length === 1) {
    match(remainingBriefs[0].leadId, remainingProjects[0].id)
  }

  for (const { leadId, opportunityId, name, project } of references) {
    const id = matches.get(leadId) || leadId
    const tracked = roster.get(id)
    if (!tracked && !project.projectSubmitted && (leadId !== input.leadId || input.projects.length > 0)) continue
    roster.set(id, { ...tracked, id, name: tracked?.name || name, opportunityId: opportunityId || tracked?.opportunityId, leadId, details: project })
  }

  return [...roster.values()].map(project => {
    const ids = new Set([project.id, project.leadId, project.opportunityId].filter(Boolean))
    const belongs = (record: { opportunityId: string; leadId?: string }) =>
      ids.has(record.opportunityId) || Boolean(record.leadId && ids.has(record.leadId))
    const actions = input.pending.groups.filter(group => ids.has(group.id)).flatMap(group => group.items)
    const status = project.status?.trim().replace(/\s+/g, ' ').toLowerCase() || ''
    const visits = input.visits.filter(visit => ids.has(visit.leadId))
    const visitComplete = visits.some(visit => approvedSiteVisitReportId(visit.leadId, visit.report))
    const designs = (input.designs || []).filter(belongs)
    const designComplete = designs.some(design => design.managerApproval === true)
    const designStep = designComplete ? 3 : designs.length ? 2 : 0
    const invoices = (input.invoices || []).filter(belongs)
    const invoiceComplete = invoices.some(invoice => invoice.managerApproval === true)
    const invoiceStep = invoiceComplete ? 4 : invoices.length ? 3 : 0
    const projectBudgets = budgets.filter(belongs)
    const budgetComplete = projectBudgets.some(budget => budget.status === 'Manager Approved')
    const budgetStep = budgetComplete ? 5 : projectBudgets.length ? 4 : 0
    const projectPayments = payments.filter(belongs)
    const paymentComplete = projectPayments.some(payment => payment.status === 'Client Approved')
    const paymentStep = paymentComplete ? 6 : projectPayments.length ? 5 : 0
    const agreements = input.agreements.filter(belongs)
    const agreementSigned = agreements.some(agreement => agreement.signed)
    const agreementStep = agreementSigned ? 7 : agreements.length ? 6 : 0
    const statusStep = statusSteps.get(status) ?? 0
    const approval = project.details?.approvalStatus
    const installmentPaid = input.firstInstallmentPaid?.has(project.id) === true
    const furthestStep = Math.max(statusStep, approval === 'Approved' ? 1 : 0,
      visitComplete ? 2 : 0, installmentPaid ? 8 : 0,
      designStep, invoiceStep, budgetStep, paymentStep, agreementStep,
      ...actions.map(action => actionSteps[action.kind]))
    const canVerifySiteVisit = Boolean(project.leadId || visits.length)
    const siteVisitVerifiedStep = canVerifySiteVisit && !visitComplete ? Math.min(furthestStep, 1) : furthestStep
    const canVerifyDesign = Boolean(project.leadId || designs.length)
    const designVerifiedStep = canVerifyDesign && !designComplete ? Math.min(siteVisitVerifiedStep, 2) : siteVisitVerifiedStep
    const canVerifyInvoice = Boolean(project.leadId || invoices.length)
    const invoiceVerifiedStep = canVerifyInvoice && !invoiceComplete ? Math.min(designVerifiedStep, 3) : designVerifiedStep
    const canVerifyBudget = Boolean(project.leadId || projectBudgets.length)
    const budgetVerifiedStep = canVerifyBudget && !budgetComplete ? Math.min(invoiceVerifiedStep, 4) : invoiceVerifiedStep
    const canVerifyPayment = Boolean(project.leadId || projectPayments.length)
    const paymentVerifiedStep = canVerifyPayment && !paymentComplete ? Math.min(budgetVerifiedStep, 5) : budgetVerifiedStep
    const canVerifyAgreement = Boolean(project.leadId || agreements.length)
    const agreementVerifiedStep = canVerifyAgreement && !agreementSigned ? Math.min(paymentVerifiedStep, 6) : paymentVerifiedStep
    const verifiedStep = project.leadId && !installmentPaid ? Math.min(agreementVerifiedStep, 7) : agreementVerifiedStep
    const awaitingApproval = approval === 'Pending' || approval === 'Rejected' ||
      (verifiedStep === 1 && project.details != null && approval !== 'Approved')
    const completion = project.completionPercentage
    const completionPercentage = completion != null && Number.isFinite(completion) ? Math.min(100, Math.max(0, completion)) : undefined
    const currentStep = status === 'completed'
      ? projectCompletionStep + 1
      : completionPercentage === 100 ? projectCompletionStep : awaitingApproval ? 0 : verifiedStep
    return {
      id: project.id,
      name: project.name,
      currentStep,
      siteVisitLeadId: project.leadId || visits[0]?.leadId,
      completionPercentage,
      action: actions.find(action => actionSteps[action.kind] === currentStep),
    }
  })
}
