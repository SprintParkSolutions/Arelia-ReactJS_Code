import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { PendingApprovals } from './PendingApprovals'
import { buildPendingApprovals } from './pendingApprovalItems'
import type { Design } from '../../services/designApprovalsApi'
import type { Invoice } from '../../services/proformaApi'
import { BUDGET_SENT, type BudgetReview } from '../../services/budgetReviewApi'
import { PAYMENT_SENT, type PaymentReview } from '../../services/paymentTermsApi'
import type { Appointment } from '../../services/siteVisitApi'

type Input = Parameters<typeof buildPendingApprovals>[0]
const design: Design = { designId: 'd1', designName: 'Living room concept', opportunityId: 'o1', opportunityName: 'Renovation', status: 'Sent', comments: '', createdDate: '', canApprove: true, canRequestChanges: true, files: [] }
const invoice: Invoice = { leadId: 'l1', invoiceId: 'i1', name: 'PI-001', opportunityId: 'o1', opportunityName: 'Renovation', status: 'Sent', comments: '', secureToken: 'token', createdDate: '', canApprove: true, canRequestChanges: true, files: [] }
const budget: BudgetReview = { leadId: 'l1', opportunityId: 'o1', opportunityName: 'Renovation', status: BUDGET_SENT, customerBudget: 50000, supervisorBudget: 45000, estimatedDuration: '2', clientRemarks: '', canRespond: true }
const payment: PaymentReview = { leadId: 'l1', opportunityId: 'o1', opportunityName: 'Renovation', status: PAYMENT_SENT, clientRemarks: '', canRespond: true, terms: [{ id: 't1', label: 'Deposit', percentage: 25, dueDate: '' }] }
const appointment: Appointment = { success: true, message: '', appointmentAvailable: true, actionRequired: true, appointmentSentDate: '2030-10-01', appointmentDate: '2030-10-10', appointmentTimeSlot: '9AM-10AM', appointmentStatus: 'Pending' }
function fixture(): Input {
  return { leadIds: ['l1'], projects: [{ id: 'o1', name: 'Renovation' }], visits: [{ leadId: 'l1', appointment }],
    designs: { success: true, message: '', designs: [design] }, invoices: { success: true, message: '', invoices: [invoice] },
    budgets: { success: true, message: '', budget: null, projects: [{ id: 'l1', result: { success: true, message: '', budget } }] },
    payments: { success: true, message: '', payment: null, projects: [{ id: 'l1', result: { success: true, message: '', payment } }] } }
}
describe('Pending approvals overview', () => {
  it('uses conversion metadata to keep two projects when only a visit and design are pending', () => {
    const input: Input = {
      leadIds: ['l1', 'l2'], projects: [],
      projectDetails: { success: true, message: '', leadId: 'l1', isConverted: true, convertedOpportunityId: 'o1', projects: [
        { success: true, message: '', leadId: 'l1', isConverted: true, convertedOpportunityId: 'o1' },
        { success: true, message: '', leadId: 'l2', isConverted: false },
      ] },
      visits: [{ leadId: 'l1', appointment: { ...appointment, appointmentStatus: 'Approved', actionRequired: false } }, { leadId: 'l2', appointment }],
      designs: { success: true, message: '', projects: [{ id: 'o1', name: 'Renovation' }], designs: [design] },
      invoices: null, budgets: null, payments: null,
    }
    const overview = buildPendingApprovals(input)
    expect(overview.count).toBe(2)
    expect(overview.groups.map(group => [group.label, group.items.map(item => item.kind)])).toEqual([
      ['Project 1', ['design']], ['Project 2', ['siteVisit']],
    ])
    input.projects = [{ id: 'o1', name: 'Renovation' }]
    expect(buildPendingApprovals(input).groups.map(group => group.label)).toEqual(['Project 1', 'Project 2'])
  })
  it('keeps a converted single project flat without invoice or budget mappings', () => {
    const input: Input = { leadIds: ['l1'], projects: [{ id: 'o1', name: 'Renovation' }],
      projectDetails: { success: true, message: '', leadId: 'l1', convertedOpportunityId: 'o1' },
      visits: [{ leadId: 'l1', appointment }], designs: { success: true, message: '', designs: [design] },
      invoices: null, budgets: null, payments: null }
    const overview = buildPendingApprovals(input)
    expect(overview.multipleProjects).toBe(false)
    expect(overview.groups).toHaveLength(1)
    expect(overview.count).toBe(2)
  })
  it('joins Lead and Opportunity records into a flat single-project list', () => {
    const overview = buildPendingApprovals(fixture())
    expect(overview.count).toBe(5)
    expect(overview.multipleProjects).toBe(false)
    expect(overview.groups).toHaveLength(1)
    const review = vi.fn()
    render(<PendingApprovals overview={overview} onReview={review} />)
    expect(screen.queryByRole('heading', { name: 'Project 1' })).not.toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /^Review / })).toHaveLength(5)
    fireEvent.click(screen.getByRole('button', { name: 'Review Proforma Invoice' }))
    expect(review).toHaveBeenCalledWith(expect.objectContaining({ kind: 'invoice', targetId: 'i1' }))
  })
  it('groups multiple projects by explicit IDs even when their names match', () => {
    const input = fixture()
    input.leadIds.push('l2')
    input.projects.push({ id: 'o2', name: 'Renovation' })
    input.invoices!.invoices.push({ ...invoice, leadId: 'l2', opportunityId: 'o2', invoiceId: 'i2' })
    input.designs!.designs.push({ ...design, opportunityId: 'o2', designId: 'd2' })
    const overview = buildPendingApprovals(input)
    expect(overview.count).toBe(7)
    expect(overview.groups.map(group => [group.label, group.items.length])).toEqual([['Project 1', 5], ['Project 2', 2]])
    const review = vi.fn()
    render(<PendingApprovals overview={overview} onReview={review} />)
    fireEvent.click(screen.getByRole('button', { name: 'Review 3D Design for Project 2' }))
    expect(review).toHaveBeenCalledWith(expect.objectContaining({ kind: 'design', targetId: 'd2' }))
    expect(within(screen.getByRole('heading', { name: 'Project 2' }).closest('.pendingApprovals__group') as HTMLElement).getAllByRole('listitem')).toHaveLength(2)
  })
  it('keeps project numbering when earlier projects have no pending items', () => {
    const input = fixture()
    input.leadIds.unshift('l0')
    const overview = buildPendingApprovals(input)
    expect(overview.multipleProjects).toBe(true)
    expect(overview.groups.map(group => group.label)).toEqual(['Project 2'])
  })
  it('removes approved and changes-requested items, hiding the section when resolved', () => {
    const input = fixture()
    const { rerender } = render(<PendingApprovals overview={buildPendingApprovals(input)} onReview={vi.fn()} />)
    input.visits[0].appointment = { ...appointment, appointmentStatus: 'Approved', actionRequired: false }
    input.designs!.designs = [{ ...design, status: 'Approved', canApprove: false }]
    input.invoices!.invoices = [{ ...invoice, status: 'Changes Requested', canApprove: false }]
    input.budgets!.projects![0].result.budget = { ...budget, status: 'Client Approved', canRespond: false }
    input.payments!.projects![0].result.payment = { ...payment, status: 'Client Approved', canRespond: false }
    const overview = buildPendingApprovals(input)
    expect(overview.count).toBe(0)
    rerender(<PendingApprovals overview={overview} onReview={vi.fn()} />)
    expect(screen.queryByRole('heading', { name: 'Pending your approval' })).not.toBeInTheDocument()
  })
  it('excludes failed responses, unsent appointments, and items without response permission', () => {
    const input = fixture()
    input.visits[0].appointment = { ...appointment, appointmentSentDate: '' }
    input.designs!.success = false
    input.invoices!.invoices = [{ ...invoice, canApprove: false }]
    input.budgets!.projects![0].result.success = false
    input.payments!.projects![0].result.payment = { ...payment, canRespond: false }
    expect(buildPendingApprovals(input).count).toBe(0)
  })
})