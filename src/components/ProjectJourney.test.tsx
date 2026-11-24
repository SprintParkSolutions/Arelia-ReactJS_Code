import { useState } from 'react'
import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import { ProjectJourney, type JourneyProject } from './ProjectJourney'
import { buildProjectJourneys } from './projectJourneyData'

const projects: JourneyProject[] = [
  { id: 'kitchen', name: 'Kitchen', currentStep: 7, completionPercentage: 35 },
  { id: 'loft', name: 'Loft', currentStep: 10, completionPercentage: 0 },
]

test('only renders carousel controls for multiple projects', () => {
  const { rerender } = render(<ProjectJourney projects={projects.slice(0, 1)} onSelect={vi.fn()} onOpenProjectDetails={vi.fn()} onOpenSupervisor={vi.fn()} onOpenSiteVisit={vi.fn()} onOpenDesignApprovals={vi.fn()} onOpenProformaApprovals={vi.fn()} onOpenBudgetApprovals={vi.fn()} onOpenPaymentApprovals={vi.fn()} onOpenPaymentSchedule={vi.fn()} onOpenProjectStatus={vi.fn()} />)
  expect(screen.queryByRole('button', { name: 'Next project' })).toBeNull()
  expect(screen.getByText('Step 8 of 12')).toBeInTheDocument()
  expect(screen.getByText('35%')).toBeInTheDocument()
  expect(screen.getByRole('progressbar', { name: 'Project completion' })).toHaveAttribute('value', '35')
  expect(within(screen.getByRole('listitem', { current: 'step' })).getByText('Client Agreement')).toBeInTheDocument()
  rerender(<ProjectJourney projects={[]} onSelect={vi.fn()} onOpenProjectDetails={vi.fn()} onOpenSupervisor={vi.fn()} onOpenSiteVisit={vi.fn()} onOpenDesignApprovals={vi.fn()} onOpenProformaApprovals={vi.fn()} onOpenBudgetApprovals={vi.fn()} onOpenPaymentApprovals={vi.fn()} onOpenPaymentSchedule={vi.fn()} onOpenProjectStatus={vi.fn()} />)
  expect(screen.queryByRole('region', { name: 'Your Project Journey' })).toBeNull()
})

test('arrows switch the selected project and its progress and wrap at the ends', () => {
  function Carousel() {
    const [id, setId] = useState('kitchen')
    return <ProjectJourney projects={projects} selectedId={id} onSelect={setId} onOpenProjectDetails={vi.fn()} onOpenSupervisor={vi.fn()} onOpenSiteVisit={vi.fn()} onOpenDesignApprovals={vi.fn()} onOpenProformaApprovals={vi.fn()} onOpenBudgetApprovals={vi.fn()} onOpenPaymentApprovals={vi.fn()} onOpenPaymentSchedule={vi.fn()} onOpenProjectStatus={vi.fn()} />
  }
  render(<Carousel />)

  fireEvent.click(screen.getByRole('button', { name: 'Previous project' }))
  expect(screen.queryByText('Loft')).not.toBeInTheDocument()
  expect(screen.getByText('Project 2 of 2')).toBeInTheDocument()
  expect(screen.getByText('0%')).toBeInTheDocument()
  expect(within(screen.getByRole('listitem', { current: 'step' })).getByText('Project Execution')).toBeInTheDocument()

  fireEvent.click(screen.getByRole('button', { name: 'Next project' }))
  expect(screen.getByText('Project 1 of 2')).toBeInTheDocument()
})

const approvedVisit = { success: true, message: '', reportAvailable: true, report: {
  leadId: 'lead1', reportId: 'report1', managementApproval: true, finalSubmitted: true,
} }

const design = {
  designId: 'design1', designName: 'Kitchen design', opportunityId: 'opp1', opportunityName: 'Kitchen',
  status: 'Sent', comments: '', createdDate: '', canApprove: true, canRequestChanges: true, files: [],
}

const approvedInvoice = {
  invoiceId: 'invoice1', leadId: 'lead1', opportunityId: 'opp1', opportunityName: 'Kitchen',
  name: 'Kitchen invoice', status: 'Approved', managerApproval: true,
  comments: '', secureToken: '', createdDate: '', canApprove: false, canRequestChanges: false, files: [],
}

const approvedBudget = {
  leadId: 'lead1', opportunityId: 'opp1', opportunityName: 'Kitchen', status: 'Manager Approved',
  customerBudget: null, supervisorBudget: null, estimatedDuration: '', clientRemarks: '', canRespond: false,
}

const approvedPayment = {
  leadId: 'lead1', opportunityId: 'opp1', opportunityName: 'Kitchen',
  status: 'Client Approved', clientRemarks: '', canRespond: false, terms: [],
}

test('joins a converted project by ID and scopes milestone records to that project', () => {
  const journeys = buildProjectJourneys({
    projects: [{ id: 'opp1', name: 'Kitchen', completionPercentage: 35 }],
    details: {
      success: true, message: '', projects: [
        { success: true, message: '', leadId: 'lead1', convertedOpportunityId: 'opp1', projectSubmitted: true },
        { success: true, message: '', leadId: 'lead2', projectSubmitted: true, details: {
          siteSpace: '', typeOfProject: '', projectScope: '', planLevel: '',
          customerBudget: '', siteLocation: 'Loft', projectDescription: '',
        } },
      ],
    },
    assignedSupervisorLeadIds: new Set(['lead1']),
    visits: [{ leadId: 'lead1', report: approvedVisit }],
    designs: [{ ...design, managerApproval: true }],
    invoices: [approvedInvoice],
    budgets: { success: true, message: '', budget: null, projects: [{ id: 'lead1', result: { success: true, message: '', budget: approvedBudget } }] },
    payments: { success: true, message: '', payment: null, projects: [{ id: 'lead1', result: { success: true, message: '', payment: approvedPayment } }] },
    agreements: [{ leadId: 'lead1', opportunityId: 'opp1', signed: true }],
    pending: { count: 0, multipleProjects: false, groups: [] },
  })

  expect(journeys).toEqual([
    expect.objectContaining({ id: 'opp1', name: 'Kitchen', currentStep: 9, completionPercentage: 35 }),
    expect.objectContaining({ id: 'lead2', name: undefined, currentStep: 0, completionPercentage: undefined }),
  ])
})


test('shows Customer Requirements guidance on hover and opens Customer Requirements on click', async () => {
  const user = userEvent.setup()
  const openProjectDetails = vi.fn()
  render(<ProjectJourney projects={projects} onSelect={vi.fn()} onOpenProjectDetails={openProjectDetails} onOpenSupervisor={vi.fn()} onOpenSiteVisit={vi.fn()} onOpenDesignApprovals={vi.fn()} onOpenProformaApprovals={vi.fn()} onOpenBudgetApprovals={vi.fn()} onOpenPaymentApprovals={vi.fn()} onOpenPaymentSchedule={vi.fn()} onOpenProjectStatus={vi.fn()} />)
  const trigger = screen.getByRole('button', { name: 'Customer Requirements' })
  expect(screen.queryByRole('tooltip')).toBeNull()
  await user.hover(trigger)
  expect(screen.getByRole('tooltip')).toHaveTextContent('Open Customer Requirements in the menu')
  fireEvent.keyDown(trigger, { key: 'Escape' })
  expect(screen.queryByRole('tooltip')).toBeNull()
  await user.click(trigger)
  expect(openProjectDetails).toHaveBeenCalledOnce()
})

test('the touch help button toggles guidance without opening Customer Requirements', () => {
  const openProjectDetails = vi.fn()
  render(<ProjectJourney projects={projects} onSelect={vi.fn()} onOpenProjectDetails={openProjectDetails} onOpenSupervisor={vi.fn()} onOpenSiteVisit={vi.fn()} onOpenDesignApprovals={vi.fn()} onOpenProformaApprovals={vi.fn()} onOpenBudgetApprovals={vi.fn()} onOpenPaymentApprovals={vi.fn()} onOpenPaymentSchedule={vi.fn()} onOpenProjectStatus={vi.fn()} />)
  const help = screen.getByLabelText('Help with Customer Requirements')
  fireEvent.click(help)
  expect(help).toHaveAttribute('aria-expanded', 'true')
  expect(screen.getByText(/Open Customer Requirements in the menu/)).toBeVisible()
  fireEvent.click(help)
  expect(help).toHaveAttribute('aria-expanded', 'false')
  expect(openProjectDetails).not.toHaveBeenCalled()
})

test.each([
  ['Pending', 0],
  ['Rejected', 0],
  [undefined, 0],
  ['Approved', 1],
] as const)('keeps Customer Requirements current until approval (%s)', (approvalStatus, currentStep) => {
  const journeys = buildProjectJourneys({
    leadId: 'lead1',
    projects: [],
    details: { success: true, message: '', projectSubmitted: true, approvalStatus },
    visits: [],
    agreements: [],
    pending: {
      count: 1,
      multipleProjects: false,
      groups: [{ id: 'lead1', label: 'Project 1', items: [
        { id: 'visit:lead1', kind: 'siteVisit', targetId: 'lead1', title: 'Site Visit', description: '' },
      ] }],
    },
  })
  expect(journeys[0].currentStep).toBe(currentStep)
  expect(journeys[0].action).toBeUndefined()
})

test.each([
  ['missing', null, 2],
  ['pending', { ...approvedVisit, report: { ...approvedVisit.report, managementApproval: false } }, 2],
  ['draft', { ...approvedVisit, report: { ...approvedVisit.report, finalSubmitted: false } }, 2],
  ['unrelated', { ...approvedVisit, report: { ...approvedVisit.report, leadId: 'another-lead' } }, 2],
  ['approved', approvedVisit, 3],
] as const)('completes Site Visit only with a final approved report (%s)', (_, report, currentStep) => {
  const journeys = buildProjectJourneys({
    leadId: 'lead1',
    projects: [{ id: 'opp1', name: 'Kitchen', status: '3D Design' }],
    details: { success: true, message: '', projectSubmitted: true, approvalStatus: 'Approved', convertedOpportunityId: 'opp1' },
    assignedSupervisorLeadIds: new Set(['lead1']),
    visits: [{ leadId: 'lead1', report }],
    agreements: [],
    pending: { count: 0, multipleProjects: false, groups: [] },
  })
  expect(journeys[0].currentStep).toBe(currentStep)
})

test('Site Visit help and navigation use the selected project', async () => {
  const user = userEvent.setup()
  const openSiteVisit = vi.fn()
  render(<ProjectJourney projects={[{ ...projects[0], currentStep: 2, siteVisitLeadId: 'lead-kitchen' }]}
    onSelect={vi.fn()} onOpenProjectDetails={vi.fn()} onOpenSupervisor={vi.fn()} onOpenSiteVisit={openSiteVisit} onOpenDesignApprovals={vi.fn()} onOpenProformaApprovals={vi.fn()} onOpenBudgetApprovals={vi.fn()} onOpenPaymentApprovals={vi.fn()} onOpenPaymentSchedule={vi.fn()} onOpenProjectStatus={vi.fn()} />)
  const stage = screen.getByRole('button', { name: 'Site Visit' })
  await user.hover(stage)
  expect(screen.getByRole('tooltip')).toHaveTextContent('confirm your visit, request a new time, or view your approved report.')
  await user.unhover(stage)
  const info = screen.getByLabelText('Help with Site Visit')
  fireEvent.click(info)
  expect(info).toHaveAttribute('aria-expanded', 'true')
  expect(openSiteVisit).not.toHaveBeenCalled()
  await user.click(stage)
  expect(openSiteVisit).toHaveBeenCalledWith('lead-kitchen')
})

test.each([
  ['manager approved', { ...design, managerApproval: true }, 4],
  ['client approved only', { ...design, status: 'Approved', managerApproval: false }, 3],
  ['unrelated manager approval', { ...design, opportunityId: 'opp2', managerApproval: true }, 3],
] as const)('completes 3D Design on manager approval (%s)', (_, record, currentStep) => {
  const journeys = buildProjectJourneys({
    leadId: 'lead1',
    projects: [{ id: 'opp1', name: 'Kitchen', status: 'Proforma Invoice' }],
    details: { success: true, message: '', projectSubmitted: true, approvalStatus: 'Approved', convertedOpportunityId: 'opp1' },
    assignedSupervisorLeadIds: new Set(['lead1']),
    visits: [{ leadId: 'lead1', report: approvedVisit }],
    designs: [record],
    agreements: [],
    pending: { count: 0, multipleProjects: false, groups: [] },
  })
  expect(journeys[0].currentStep).toBe(currentStep)
})

test('3D Design exposes help and opens approvals for the selected project', async () => {
  const user = userEvent.setup()
  const openDesignApprovals = vi.fn()
  render(<ProjectJourney projects={projects} selectedId="loft" onSelect={vi.fn()}
    onOpenProjectDetails={vi.fn()} onOpenSupervisor={vi.fn()} onOpenSiteVisit={vi.fn()} onOpenDesignApprovals={openDesignApprovals} onOpenProformaApprovals={vi.fn()} onOpenBudgetApprovals={vi.fn()} onOpenPaymentApprovals={vi.fn()} onOpenPaymentSchedule={vi.fn()} onOpenProjectStatus={vi.fn()} />)
  const stage = screen.getByRole('button', { name: '3D Design' })
  await user.hover(stage)
  expect(screen.getByRole('tooltip')).toHaveTextContent('3D Design Approvals to view your designs, approve them, or request changes.')
  await user.unhover(stage)
  const info = screen.getByLabelText('Help with 3D Design')
  fireEvent.click(info)
  expect(info).toHaveAttribute('aria-expanded', 'true')
  expect(openDesignApprovals).not.toHaveBeenCalled()
  await user.click(stage)
  expect(openDesignApprovals).toHaveBeenCalledWith('loft')
})

test('Proforma Invoice exposes help and opens approvals for the selected project', async () => {
  const user = userEvent.setup()
  const openProformaApprovals = vi.fn()
  render(<ProjectJourney projects={[{ ...projects[0], siteVisitLeadId: 'lead-kitchen' }]}
    onSelect={vi.fn()} onOpenProjectDetails={vi.fn()} onOpenSupervisor={vi.fn()} onOpenSiteVisit={vi.fn()}
    onOpenDesignApprovals={vi.fn()} onOpenProformaApprovals={openProformaApprovals} onOpenBudgetApprovals={vi.fn()} onOpenPaymentApprovals={vi.fn()} onOpenPaymentSchedule={vi.fn()} onOpenProjectStatus={vi.fn()} />)
  const stage = screen.getByRole('button', { name: 'Proforma Invoice' })
  await user.hover(stage)
  expect(screen.getByRole('tooltip')).toHaveTextContent('Proforma Invoice Approvals to review your invoice, approve it, or request changes.')
  await user.unhover(stage)
  const info = screen.getByLabelText('Help with Proforma Invoice')
  fireEvent.click(info)
  expect(info).toHaveAttribute('aria-expanded', 'true')
  expect(openProformaApprovals).not.toHaveBeenCalled()
  await user.click(stage)
  expect(openProformaApprovals).toHaveBeenCalledWith('lead-kitchen')
})

test('Budget Review exposes help and opens approvals for the selected project', async () => {
  const user = userEvent.setup()
  const openBudgetApprovals = vi.fn()
  render(<ProjectJourney projects={[{ ...projects[0], siteVisitLeadId: 'lead-kitchen' }]}
    onSelect={vi.fn()} onOpenProjectDetails={vi.fn()} onOpenSupervisor={vi.fn()} onOpenSiteVisit={vi.fn()}
    onOpenDesignApprovals={vi.fn()} onOpenProformaApprovals={vi.fn()} onOpenBudgetApprovals={openBudgetApprovals} onOpenPaymentApprovals={vi.fn()} onOpenPaymentSchedule={vi.fn()} onOpenProjectStatus={vi.fn()} />)
  const stage = screen.getByRole('button', { name: 'Budget Review' })
  await user.hover(stage)
  expect(screen.getByRole('tooltip')).toHaveTextContent('Budget Review Approvals to review your proposed budget, approve it, or request changes.')
  await user.unhover(stage)
  const info = screen.getByLabelText('Help with Budget Review')
  fireEvent.click(info)
  expect(info).toHaveAttribute('aria-expanded', 'true')
  expect(openBudgetApprovals).not.toHaveBeenCalled()
  await user.click(stage)
  expect(openBudgetApprovals).toHaveBeenCalledWith('lead-kitchen')
})

test.each([
  ['Manager Approved', 6],
  ['Client Approved', 5],
  ['Sent for Client Approval', 5],
] as const)('completes Budget Review on manager approval (%s)', (status, currentStep) => {
  const journeys = buildProjectJourneys({
    leadId: 'lead1',
    projects: [{ id: 'opp1', name: 'Kitchen', status: 'Budget Review' }],
    details: { success: true, message: '', projectSubmitted: true, approvalStatus: 'Approved', convertedOpportunityId: 'opp1' },
    assignedSupervisorLeadIds: new Set(['lead1']),
    visits: [{ leadId: 'lead1', report: approvedVisit }],
    designs: [{ ...design, managerApproval: true }],
    invoices: [approvedInvoice],
    budgets: { success: true, message: '', budget: null, projects: [
      { id: 'lead1', result: { success: true, message: '', budget: { ...approvedBudget, status } } },
    ] },
    agreements: [],
    pending: { count: 0, multipleProjects: false, groups: [] },
  })
  expect(journeys[0].currentStep).toBe(currentStep)
})

test.each([
  ['manager approved', approvedInvoice, 5],
  ['client approved only', { ...approvedInvoice, managerApproval: false }, 4],
  ['unrelated manager approval', { ...approvedInvoice, leadId: 'lead2', opportunityId: 'opp2' }, 4],
] as const)('completes Proforma Invoice on manager approval (%s)', (_, record, currentStep) => {
  const journeys = buildProjectJourneys({
    leadId: 'lead1',
    projects: [{ id: 'opp1', name: 'Kitchen', status: 'Proforma Invoice' }],
    details: { success: true, message: '', projectSubmitted: true, approvalStatus: 'Approved', convertedOpportunityId: 'opp1' },
    assignedSupervisorLeadIds: new Set(['lead1']),
    visits: [{ leadId: 'lead1', report: approvedVisit }],
    designs: [{ ...design, managerApproval: true }],
    invoices: [record],
    agreements: [],
    pending: { count: 0, multipleProjects: false, groups: [] },
  })
  expect(journeys[0].currentStep).toBe(currentStep)
})

test('Payment Terms exposes help and opens approvals for the selected project', async () => {
  const user = userEvent.setup()
  const openPaymentApprovals = vi.fn()
  render(<ProjectJourney projects={[{ ...projects[0], siteVisitLeadId: 'lead-kitchen' }]}
    onSelect={vi.fn()} onOpenProjectDetails={vi.fn()} onOpenSupervisor={vi.fn()} onOpenSiteVisit={vi.fn()}
    onOpenDesignApprovals={vi.fn()} onOpenProformaApprovals={vi.fn()} onOpenBudgetApprovals={vi.fn()}
    onOpenPaymentApprovals={openPaymentApprovals} onOpenPaymentSchedule={vi.fn()} onOpenProjectStatus={vi.fn()} />)
  const stage = screen.getByRole('button', { name: 'Payment Terms' })
  await user.hover(stage)
  expect(screen.getByRole('tooltip')).toHaveTextContent('Payment Terms Approvals to review your payment schedule, approve the terms, or request changes.')
  await user.unhover(stage)
  const info = screen.getByLabelText('Help with Payment Terms')
  fireEvent.click(info)
  expect(info).toHaveAttribute('aria-expanded', 'true')
  expect(openPaymentApprovals).not.toHaveBeenCalled()
  await user.click(stage)
  expect(openPaymentApprovals).toHaveBeenCalledWith('lead-kitchen')
})

test.each([
  ['Client Approved', 7],
  ['Client Requested Changes', 6],
  ['Sent for Client Approval', 6],
] as const)('completes Payment Terms on client approval (%s)', (status, currentStep) => {
  const journeys = buildProjectJourneys({
    leadId: 'lead1',
    projects: [{ id: 'opp1', name: 'Kitchen', status: 'Payment Terms' }],
    details: { success: true, message: '', projectSubmitted: true, approvalStatus: 'Approved', convertedOpportunityId: 'opp1' },
    assignedSupervisorLeadIds: new Set(['lead1']),
    visits: [{ leadId: 'lead1', report: approvedVisit }],
    designs: [{ ...design, managerApproval: true }],
    invoices: [approvedInvoice],
    budgets: { success: true, message: '', budget: null, projects: [
      { id: 'lead1', result: { success: true, message: '', budget: approvedBudget } },
    ] },
    payments: { success: true, message: '', payment: null, projects: [
      { id: 'lead1', result: { success: true, message: '', payment: { ...approvedPayment, status } } },
    ] },
    agreements: [],
    pending: { count: 0, multipleProjects: false, groups: [] },
  })
  expect(journeys[0].currentStep).toBe(currentStep)
})

test('Client Agreement explains how to sign on desktop and touch devices', async () => {
  const user = userEvent.setup()
  render(<ProjectJourney projects={projects} onSelect={vi.fn()} onOpenProjectDetails={vi.fn()}
    onOpenSupervisor={vi.fn()} onOpenSiteVisit={vi.fn()} onOpenDesignApprovals={vi.fn()} onOpenProformaApprovals={vi.fn()}
    onOpenBudgetApprovals={vi.fn()} onOpenPaymentApprovals={vi.fn()} onOpenPaymentSchedule={vi.fn()} onOpenProjectStatus={vi.fn()} />)
  expect(screen.queryByRole('button', { name: 'Client Agreement' })).not.toBeInTheDocument()
  const stage = screen.getByText('Client Agreement')
  await user.hover(stage)
  expect(screen.getByRole('tooltip')).toHaveTextContent('check your registered email for a link to review and sign it.')
  await user.unhover(stage)
  const info = screen.getByLabelText('Help with Client Agreement')
  fireEvent.click(info)
  expect(info).toHaveAttribute('aria-expanded', 'true')
})

test.each([
  ['signed, project record pending', [{ leadId: 'lead1', opportunityId: 'opp1', signed: true }], false, 8],
  ['signed, project record created', [{ leadId: 'lead1', opportunityId: 'opp1', signed: true }], true, 9],
  ['sent only', [{ leadId: 'lead1', opportunityId: 'opp1', signed: false }], true, 7],
  ['signed on another project', [{ leadId: 'lead2', opportunityId: 'opp2', signed: true }], true, 7],
] as const)('advances through Client Agreement and Project Initiated (%s)', (_, agreements, created, currentStep) => {
  const journeys = buildProjectJourneys({
    leadId: 'lead1',
    projects: created ? [{ id: 'project-record1', leadId: 'lead1', name: 'Kitchen', status: 'Initiated' }] : [],
    details: { success: true, message: '', projectSubmitted: true, approvalStatus: 'Approved', convertedOpportunityId: 'opp1' },
    assignedSupervisorLeadIds: new Set(['lead1']),
    visits: [{ leadId: 'lead1', report: approvedVisit }],
    designs: [{ ...design, managerApproval: true }],
    invoices: [approvedInvoice],
    budgets: { success: true, message: '', budget: null, projects: [
      { id: 'lead1', result: { success: true, message: '', budget: approvedBudget } },
    ] },
    payments: { success: true, message: '', payment: null, projects: [
      { id: 'lead1', result: { success: true, message: '', payment: approvedPayment } },
    ] },
    agreements: [...agreements],
    pending: { count: 0, multipleProjects: false, groups: [] },
  })
  expect(journeys[0].currentStep).toBe(currentStep)
})

test('First Installment exposes help and opens the selected payment schedule', async () => {
  const user = userEvent.setup()
  const openPaymentSchedule = vi.fn()
  render(<ProjectJourney projects={projects} selectedId="loft" onSelect={vi.fn()} onOpenProjectDetails={vi.fn()}
    onOpenSupervisor={vi.fn()} onOpenSiteVisit={vi.fn()} onOpenDesignApprovals={vi.fn()} onOpenProformaApprovals={vi.fn()}
    onOpenBudgetApprovals={vi.fn()} onOpenPaymentApprovals={vi.fn()} onOpenPaymentSchedule={openPaymentSchedule} onOpenProjectStatus={vi.fn()} />)
  const stage = screen.getByRole('button', { name: 'First Installment' })
  await user.hover(stage)
  expect(screen.getByRole('tooltip')).toHaveTextContent('check the amount and due date of your first installment.')
  await user.unhover(stage)
  const info = screen.getByLabelText('Help with First Installment')
  fireEvent.click(info)
  expect(info).toHaveAttribute('aria-expanded', 'true')
  expect(openPaymentSchedule).not.toHaveBeenCalled()
  await user.click(stage)
  expect(openPaymentSchedule).toHaveBeenCalledWith('loft')
})

test.each([
  ['this project paid', ['opp1'], 10],
  ['payment pending', [], 9],
  ['another project paid', ['opp2'], 9],
] as const)('completes First Installment on confirmed payment (%s)', (_, paidIds, currentStep) => {
  const journeys = buildProjectJourneys({
    leadId: 'lead1',
    projects: [{ id: 'opp1', name: 'Kitchen', status: 'Project Execution' }],
    details: { success: true, message: '', projectSubmitted: true, approvalStatus: 'Approved', convertedOpportunityId: 'opp1' },
    assignedSupervisorLeadIds: new Set(['lead1']),
    visits: [{ leadId: 'lead1', report: approvedVisit }],
    designs: [{ ...design, managerApproval: true }],
    invoices: [approvedInvoice],
    budgets: { success: true, message: '', budget: null, projects: [
      { id: 'lead1', result: { success: true, message: '', budget: approvedBudget } },
    ] },
    payments: { success: true, message: '', payment: null, projects: [
      { id: 'lead1', result: { success: true, message: '', payment: approvedPayment } },
    ] },
    agreements: [{ leadId: 'lead1', opportunityId: 'opp1', signed: true }],
    firstInstallmentPaid: new Set<string>(paidIds),
    pending: { count: 0, multipleProjects: false, groups: [] },
  })
  expect(journeys[0].currentStep).toBe(currentStep)
})

test.each([
  ['linked by lead', { leadId: 'lead1' }],
  ['linked by opportunity', { opportunityId: 'opp1' }],
  ['older payload without relationship IDs', {}],
] as const)('keeps two journeys after a project record is created (%s)', (_, relationship) => {
  const journeys = buildProjectJourneys({
    leadId: 'lead1',
    projects: [{ id: 'project-record1', name: 'Kitchen project', completionPercentage: 25, ...relationship }],
    details: { success: true, message: '', projects: [
      { success: true, message: '', leadId: 'lead1', projectSubmitted: true, approvalStatus: 'Approved', convertedOpportunityId: 'opp1' },
      { success: true, message: '', leadId: 'lead2', projectSubmitted: true },
    ] },
    assignedSupervisorLeadIds: new Set(['lead1']),
    visits: [{ leadId: 'lead1', report: approvedVisit }],
    agreements: [],
    pending: { count: 0, multipleProjects: false, groups: [] },
  })

  expect(journeys).toHaveLength(2)
  expect(journeys).toEqual([
    expect.objectContaining({ id: 'project-record1', siteVisitLeadId: 'lead1', completionPercentage: 25, currentStep: 3 }),
    expect.objectContaining({ id: 'lead2', siteVisitLeadId: 'lead2', currentStep: 0 }),
  ])
})

test('keeps a separately linked project record as its own journey', () => {
  const journeys = buildProjectJourneys({
    leadId: 'lead1',
    projects: [{ id: 'project-record3', name: 'Loft project', opportunityId: 'opp3' }],
    details: { success: true, message: '', projects: [
      { success: true, message: '', leadId: 'lead1', projectSubmitted: true, convertedOpportunityId: 'opp1' },
      { success: true, message: '', leadId: 'lead2', projectSubmitted: true },
    ] },
    visits: [],
    agreements: [],
    pending: { count: 0, multipleProjects: false, groups: [] },
  })
  expect(journeys.map(project => project.id)).toEqual(['project-record3', 'lead1', 'lead2'])
})

test.each([
  ['Completed', 99, 'Journey complete', 'is-done'],
  ['Project Execution', 100, 'Step 12 of 12', 'is-current'],
] as const)('shows the final milestone for %s at %i percent', (status, completionPercentage, label, milestoneClass) => {
  const journeys = buildProjectJourneys({
    leadId: 'lead1',
    projects: [{ id: 'project1', name: 'Kitchen', status, leadId: 'lead1', completionPercentage }],
    details: { success: true, message: '', projectSubmitted: true, approvalStatus: 'Approved' },
    visits: [],
    agreements: [],
    pending: { count: 0, multipleProjects: false, groups: [] },
  })
  render(<ProjectJourney projects={journeys} onSelect={vi.fn()} onOpenProjectDetails={vi.fn()}
    onOpenSupervisor={vi.fn()} onOpenSiteVisit={vi.fn()} onOpenDesignApprovals={vi.fn()} onOpenProformaApprovals={vi.fn()}
    onOpenBudgetApprovals={vi.fn()} onOpenPaymentApprovals={vi.fn()} onOpenPaymentSchedule={vi.fn()} onOpenProjectStatus={vi.fn()} />)
  expect(screen.getByText(label)).toBeInTheDocument()
  expect(screen.getByText('Project Completion').closest('li')).toHaveClass(milestoneClass)
  expect(screen.getByText('Project Execution').closest('li')).toHaveClass('is-done')
})

test('Project Execution opens Project Status for the selected project', async () => {
  const user = userEvent.setup()
  const openProjectStatus = vi.fn()
  render(<ProjectJourney projects={projects} selectedId="loft" onSelect={vi.fn()} onOpenProjectDetails={vi.fn()}
    onOpenSupervisor={vi.fn()} onOpenSiteVisit={vi.fn()} onOpenDesignApprovals={vi.fn()} onOpenProformaApprovals={vi.fn()}
    onOpenBudgetApprovals={vi.fn()} onOpenPaymentApprovals={vi.fn()} onOpenPaymentSchedule={vi.fn()}
    onOpenProjectStatus={openProjectStatus} />)
  await user.click(screen.getByRole('button', { name: 'Project Execution' }))
  expect(openProjectStatus).toHaveBeenCalledWith('loft')
})

test('keeps Project Execution current while progress is below 100%', () => {
  const journeys = buildProjectJourneys({
    projects: [{ id: 'project1', name: 'Kitchen', status: 'Project Execution', completionPercentage: 99 }],
    visits: [],
    agreements: [],
    pending: { count: 0, multipleProjects: false, groups: [] },
  })
  expect(journeys[0].currentStep).toBe(10)
})

test('advances only the project that receives a supervisor assignment', () => {
  const input: Parameters<typeof buildProjectJourneys>[0] = {
    projects: [],
    details: { success: true, message: '', projects: [
      { leadId: 'lead1', success: true, message: '', projectSubmitted: true, approvalStatus: 'Approved' },
      { leadId: 'lead2', success: true, message: '', projectSubmitted: true, approvalStatus: 'Approved' },
    ] },
    visits: [],
    agreements: [],
    pending: { groups: [], multipleProjects: true, count: 0 },
  }
  const view = (assignedSupervisorLeadIds: ReadonlySet<string>) => (
    <ProjectJourney projects={buildProjectJourneys({ ...input, assignedSupervisorLeadIds })}
      selectedId="lead2" onSelect={vi.fn()} onOpenProjectDetails={vi.fn()} onOpenSupervisor={vi.fn()} onOpenSiteVisit={vi.fn()}
      onOpenDesignApprovals={vi.fn()} onOpenProformaApprovals={vi.fn()} onOpenBudgetApprovals={vi.fn()}
      onOpenPaymentApprovals={vi.fn()} onOpenPaymentSchedule={vi.fn()} onOpenProjectStatus={vi.fn()} />
  )
  const { rerender } = render(view(new Set(['lead1'])))
  expect(screen.getByText('Step 2 of 12')).toBeInTheDocument()
  expect(screen.getByText('Meet Your Supervisor').closest('li')).toHaveAttribute('aria-current', 'step')
  rerender(view(new Set(['lead1', 'lead2'])))
  expect(screen.getByText('Step 3 of 12')).toBeInTheDocument()
  expect(screen.getByText('Meet Your Supervisor').closest('li')).toHaveClass('is-done')
  expect(screen.getByText('Site Visit').closest('li')).toHaveAttribute('aria-current', 'step')
})

test('Meet Your Supervisor shows help and opens the selected project supervisor', async () => {
  const user = userEvent.setup()
  const openSupervisor = vi.fn()
  render(<ProjectJourney projects={[projects[0], { ...projects[1], siteVisitLeadId: 'lead-loft' }]}
    selectedId="loft" onSelect={vi.fn()} onOpenProjectDetails={vi.fn()} onOpenSupervisor={openSupervisor}
    onOpenSiteVisit={vi.fn()} onOpenDesignApprovals={vi.fn()} onOpenProformaApprovals={vi.fn()}
    onOpenBudgetApprovals={vi.fn()} onOpenPaymentApprovals={vi.fn()} onOpenPaymentSchedule={vi.fn()} onOpenProjectStatus={vi.fn()} />)
  const stage = screen.getByRole('button', { name: 'Meet Your Supervisor' })
  await user.hover(stage)
  expect(screen.getByRole('tooltip')).toHaveTextContent('Open Supervisor Information to meet your supervisor and find their contact details.')
  await user.unhover(stage)
  const info = screen.getByLabelText('Help with Meet Your Supervisor')
  fireEvent.click(info)
  expect(info).toHaveAttribute('aria-expanded', 'true')
  expect(openSupervisor).not.toHaveBeenCalled()
  await user.click(stage)
  expect(openSupervisor).toHaveBeenCalledWith('lead-loft')
})

test('only current and completed milestones can navigate', async () => {
  const user = userEvent.setup()
  const openDetails = vi.fn()
  const openSupervisor = vi.fn()
  const openSiteVisit = vi.fn()
  render(<ProjectJourney projects={[{ ...projects[0], currentStep: 1, siteVisitLeadId: 'lead-kitchen' }]}
    onSelect={vi.fn()} onOpenProjectDetails={openDetails} onOpenSupervisor={openSupervisor}
    onOpenSiteVisit={openSiteVisit} onOpenDesignApprovals={vi.fn()} onOpenProformaApprovals={vi.fn()}
    onOpenBudgetApprovals={vi.fn()} onOpenPaymentApprovals={vi.fn()} onOpenPaymentSchedule={vi.fn()} onOpenProjectStatus={vi.fn()} />)
  expect(screen.queryByRole('button', { name: 'Site Visit' })).not.toBeInTheDocument()
  await user.hover(screen.getByText('Site Visit'))
  expect(screen.getByRole('tooltip')).toHaveTextContent('Open Site Visit Appointment & Report')
  await user.click(screen.getByText('Site Visit'))
  expect(openSiteVisit).not.toHaveBeenCalled()

  await user.click(screen.getByRole('button', { name: 'Customer Requirements' }))
  await user.click(screen.getByRole('button', { name: 'Meet Your Supervisor' }))
  expect(openDetails).toHaveBeenCalledOnce()
  expect(openSupervisor).toHaveBeenCalledWith('lead-kitchen')
})
