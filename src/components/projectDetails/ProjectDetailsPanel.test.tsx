import { act, fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, expect, it, vi } from 'vitest'
import { ProjectDetailsPanel } from './ProjectDetailsPanel'
import { requestProjectDetails, type ProjectDetailsResult } from '../../services/projectDetailsApi'
vi.mock('../../services/projectDetailsApi', () => ({ requestProjectDetails: vi.fn() }))
const details = { siteSpace: '1200', typeOfProject: 'Home', projectScope: 'Kitchen', planLevel: 'Standard', customerBudget: '50000', siteLocation: 'First site', projectDescription: 'First brief' }
const result: ProjectDetailsResult = { success: true, message: '', projectSubmitted: true, details,
  projects: [
    { success: true, message: '', leadId: '00Q123', projectSubmitted: true, details },
    { success: true, message: '', leadId: '00Q456', projectSubmitted: true, details: { ...details, siteLocation: 'Second site' } },
  ],
}
const onSaved = vi.fn()
const onCancel = vi.fn()
const reload = vi.fn()
beforeEach(() => vi.clearAllMocks())
it('displays both saved briefs separately', () => {
  render(<ProjectDetailsPanel leadId="00Q123" result={result} addingProject={false} onSaved={onSaved} onCancel={onCancel} reload={reload} />)
  expect(screen.getByText('First site')).toBeInTheDocument()
  expect(screen.getByText('Second site')).toBeInTheDocument()
  expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
})
it('opens a blank form and creates a new project only on submission', async () => {
  vi.mocked(requestProjectDetails).mockResolvedValue({ success: true, message: '', leadId: '00Q789', projectSubmitted: true, details })
  render(<ProjectDetailsPanel leadId="00Q123" result={result} addingProject onSaved={onSaved} onCancel={onCancel} reload={reload} />)
  expect(requestProjectDetails).not.toHaveBeenCalled()
  const labels = ['Site Space', 'Type of Project', 'Project Scope', 'Plan Level', 'Customer Budget', 'Site Location', 'Project Description']
  labels.forEach((label, index) => {
    expect(screen.getByLabelText(label)).toHaveValue('')
    fireEvent.change(screen.getByLabelText(label), { target: { value: Object.values(details)[index] } })
  })
  fireEvent.click(screen.getByRole('button', { name: 'Submit Project Details' }))
  await act(async () => {})
  expect(requestProjectDetails).toHaveBeenCalledWith('00Q123', details, true)
  expect(onSaved).toHaveBeenCalledOnce()
})
it('can return to existing projects without creating a lead', () => {
  render(<ProjectDetailsPanel leadId="00Q123" result={result} addingProject onSaved={onSaved} onCancel={onCancel} reload={reload} />)
  fireEvent.click(screen.getByRole('button', { name: 'Back to projects' }))
  expect(onCancel).toHaveBeenCalledOnce()
  expect(requestProjectDetails).not.toHaveBeenCalled()
})
