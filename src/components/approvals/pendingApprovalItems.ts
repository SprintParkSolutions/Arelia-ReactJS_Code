import type { ProjectDetailsResult } from '../../services/projectDetailsApi'
import type { DesignsResult } from '../../services/designApprovalsApi'
import type { InvoicesResult } from '../../services/proformaApi'
import { BUDGET_SENT, type BudgetResult } from '../../services/budgetReviewApi'
import { PAYMENT_SENT, type PaymentResult } from '../../services/paymentTermsApi'
import type { Appointment } from '../../services/siteVisitApi'
import { canRespondToSiteVisit } from '../siteVisit/siteVisitRequest'

export type PendingKind = 'siteVisit' | 'design' | 'invoice' | 'budget' | 'payment'
export type PendingItem = { id: string; kind: PendingKind; targetId: string; title: string; description: string }
export type PendingGroup = { id: string; label: string; items: PendingItem[] }
export type PendingOverview = { groups: PendingGroup[]; multipleProjects: boolean; count: number }
type Input = {
  projectDetails?: ProjectDetailsResult | null; leadIds: string[]; projects: { id: string; name: string }[]
  visits: { leadId: string; appointment: Appointment | null }[]
  designs: DesignsResult | null; invoices: InvoicesResult | null
  budgets: BudgetResult | null; payments: PaymentResult | null
}

export function buildPendingApprovals(input: Input): PendingOverview {
  const invoices = input.invoices?.success ? input.invoices.invoices : []
  const designs = input.designs?.success ? input.designs.designs : []
  const budgets = input.budgets?.success
    ? input.budgets.projects || [{ id: input.leadIds[0] || '', result: input.budgets }] : []
  const payments = input.payments?.success
    ? input.payments.projects || [{ id: input.leadIds[0] || '', result: input.payments }] : []
  // Join Lead-based requests and Opportunity-based designs by explicit API IDs.
  // Include completed records in the mapping so approval does not renumber projects.
  const leadByOpportunity = new Map<string, string>()
  for (const invoice of invoices) if (invoice.leadId) leadByOpportunity.set(invoice.opportunityId, invoice.leadId)
  for (const project of budgets) if (project.result.success && project.result.budget) {
    leadByOpportunity.set(project.result.budget.opportunityId, project.result.budget.leadId || project.id)
  }
  for (const project of payments) if (project.result.success && project.result.payment) {
    leadByOpportunity.set(project.result.payment.opportunityId, project.result.payment.leadId || project.id)
  }
  // Conversion metadata is available before invoices or review records exist.
  // It is authoritative when the same project appears as both a Lead and an Opportunity.
  const projectDetails = input.projectDetails?.success ? input.projectDetails : null
  for (const project of projectDetails ? [projectDetails, ...(projectDetails.projects || [])] : []) {
    if (project.leadId && project.convertedOpportunityId) {
      leadByOpportunity.set(project.convertedOpportunityId, project.leadId)
    }
  }
  const opportunityKey = (id: string) => leadByOpportunity.get(id) || id
  const roster = new Map<string, PendingGroup>()
  const register = (id: string) => {
    if (id && !roster.has(id)) roster.set(id, { id, label: `Project ${roster.size + 1}`, items: [] })
  }
  input.leadIds.forEach(register)
  input.visits.forEach(visit => register(visit.leadId))
  budgets.forEach(project => register(project.id))
  payments.forEach(project => register(project.id))
  for (const invoice of invoices) register(invoice.leadId || opportunityKey(invoice.opportunityId))
  input.projects.forEach(project => register(opportunityKey(project.id)))
  if (input.designs?.success) input.designs.projects?.forEach(project => register(opportunityKey(project.id)))
  designs.forEach(design => register(opportunityKey(design.opportunityId)))
  const add = (projectId: string, item: PendingItem) => {
    register(projectId)
    const items = roster.get(projectId)?.items
    if (items && !items.some(existing => existing.id === item.id)) items.push(item)
  }
  for (const visit of input.visits) if (canRespondToSiteVisit(visit.appointment)) {
    add(visit.leadId, { id: `visit:${visit.leadId}`, kind: 'siteVisit', targetId: visit.leadId,
      title: 'Site Visit Appointment', description: [visit.appointment?.appointmentDate, visit.appointment?.appointmentTimeSlot].filter(Boolean).join(' · ') })
  }
  for (const design of designs) if (design.status === 'Sent' && design.canApprove) {
    add(opportunityKey(design.opportunityId), { id: `design:${design.designId}`, kind: 'design', targetId: design.designId, title: '3D Design', description: design.designName })
  }
  for (const invoice of invoices) if (invoice.status === 'Sent' && invoice.canApprove) {
    add(invoice.leadId || opportunityKey(invoice.opportunityId), { id: `invoice:${invoice.invoiceId}`, kind: 'invoice', targetId: invoice.invoiceId, title: 'Proforma Invoice', description: invoice.name })
  }
  for (const project of budgets) {
    const budget = project.result.success ? project.result.budget : null
    if (budget?.status === BUDGET_SENT && budget.canRespond) add(budget.leadId || project.id, {
      id: `budget:${budget.opportunityId}`, kind: 'budget', targetId: budget.opportunityId, title: 'Budget Review', description: budget.opportunityName,
    })
  }
  for (const project of payments) {
    const payment = project.result.success ? project.result.payment : null
    if (payment?.status === PAYMENT_SENT && payment.canRespond) add(payment.leadId || project.id, {
      id: `payment:${payment.opportunityId}`, kind: 'payment', targetId: payment.opportunityId, title: 'Payment Terms', description: payment.opportunityName,
    })
  }
  const groups = [...roster.values()].filter(group => group.items.length > 0)
  return { groups, multipleProjects: roster.size > 1, count: groups.reduce((sum, group) => sum + group.items.length, 0) }
}