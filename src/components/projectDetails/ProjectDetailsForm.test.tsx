import { act, fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ProjectDetailsForm } from './ProjectDetailsForm'
import { requestProjectDetails, type ProjectDetailsResult } from '../../services/projectDetailsApi'
vi.mock('../../services/projectDetailsApi', () => ({ requestProjectDetails: vi.fn() }))
const request = vi.mocked(requestProjectDetails)
const details = { siteSpace: '1200', typeOfProject: 'Home', projectScope: '2BHK', planLevel: 'Premium', customerBudget: '500000', siteLocation: 'Hyderabad', projectDescription: 'Living room and kitchen' }
const saved = vi.fn()
const reload = vi.fn()
function setup(result: ProjectDetailsResult = { success: true, message: '', projectSubmitted: false, details }) {
  return render(<ProjectDetailsForm leadId="00Q123" result={result} onSaved={saved} reload={reload} />)
}
beforeEach(() => { vi.clearAllMocks() })
describe('project details', () => {
  it('requires all fields and a positive budget', () => {
    setup()
    fireEvent.change(screen.getByLabelText('Site Space'), { target: { value: ' ' } })
    fireEvent.change(screen.getByLabelText('Customer Budget'), { target: { value: '0' } })
    fireEvent.click(screen.getByRole('button', { name: 'Submit Project Details' }))
    expect(screen.getByText('Site Space is required.')).toBeInTheDocument()
    expect(screen.getByText('Enter a budget greater than zero.')).toBeInTheDocument()
    expect(request).not.toHaveBeenCalled()
  })
  it('submits the signed-in Lead ID and becomes read-only', async () => {
    const result = { success: true, message: '', projectSubmitted: true, details }
    request.mockResolvedValue(result)
    const view = setup()
    fireEvent.click(screen.getByRole('button', { name: 'Submit Project Details' }))
    await act(async () => {})
    expect(request).toHaveBeenCalledWith('00Q123', details)
    expect(saved).toHaveBeenCalledWith(result)
    view.rerender(<ProjectDetailsForm leadId="00Q123" result={result} onSaved={saved} reload={reload} />)
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Submit Project Details' })).not.toBeInTheDocument()
    expect(screen.getByText('Living room and kitchen')).toBeInTheDocument()
  })
  it('shows persisted submissions read-only on returning visits', () => {
    setup({ success: true, message: '', projectSubmitted: true, details })
    expect(screen.getByText('Hyderabad')).toBeInTheDocument()
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
  })
  it('retains values when saving fails', async () => {
    request.mockResolvedValue({ success: false, message: 'Unable to save.' })
    setup()
    fireEvent.click(screen.getByRole('button', { name: 'Submit Project Details' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Unable to save.')
    expect(screen.getByLabelText('Site Location')).toHaveValue('Hyderabad')
  })
  it('locks and reloads the server record on a concurrent submission', async () => {
    request.mockResolvedValue({ success: false, message: 'Already submitted', conflict: true })
    setup()
    fireEvent.click(screen.getByRole('button', { name: 'Submit Project Details' }))
    await act(async () => {})
    expect(reload).toHaveBeenCalledOnce()
    expect(screen.getByRole('button', { name: 'Submit Project Details' })).toBeDisabled()
    expect(saved).not.toHaveBeenCalled()
  })
  it('prevents duplicate submissions', async () => {
    let resolve!: (value: ProjectDetailsResult) => void
    request.mockReturnValue(new Promise(done => { resolve = done }))
    setup()
    const button = screen.getByRole('button', { name: 'Submit Project Details' })
    fireEvent.click(button)
    fireEvent.submit(button.closest('form')!)
    expect(request).toHaveBeenCalledOnce()
    await act(async () => resolve({ success: false, message: 'Try again' }))
  })
})
