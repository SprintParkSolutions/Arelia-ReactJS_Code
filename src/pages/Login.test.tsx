import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Login } from './Login'
import { loginClient } from '../api'
import { loginProspect } from '../services/salesforceApi'

vi.mock('../api', () => ({
  loginClient: vi.fn(),
  confirmPasswordReset: vi.fn(),
  requestPasswordResetOtp: vi.fn(),
  verifyPasswordResetOtp: vi.fn(),
}))
vi.mock('../services/salesforceApi', () => ({ loginProspect: vi.fn() }))
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ login: vi.fn(), isAuthenticated: false }),
}))
beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
  vi.mocked(loginProspect).mockResolvedValue({ success: false, message: 'Invalid credentials.' })
  vi.mocked(loginClient).mockResolvedValue({ success: false, message: 'Invalid credentials.' })
})
function setup(path: string) {
  render(<MemoryRouter initialEntries={[path]}><Login /></MemoryRouter>)
}
function submit() {
  fireEvent.change(screen.getByLabelText('Email Address'), { target: { value: 'hello@example.com' } })
  fireEvent.change(screen.getByLabelText('Password', { exact: true }), { target: { value: 'Example1!' } })
  fireEvent.click(screen.getByRole('button', { name: 'Enter Portal' }))
}
describe('unified login', () => {
  it.each(['/login', '/login?account=prospect', '/login?account=client'])('signs in leads from %s', async path => {
    vi.mocked(loginProspect).mockResolvedValue({ success: true, leadId: 'lead-1' })
    setup(path)
    expect(screen.getByText('Client portal sign in')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Client portal sign in' })).not.toBeInTheDocument()
    expect(screen.queryByText('Consultation account sign in')).not.toBeInTheDocument()
    submit()
    await waitFor(() => expect(loginProspect).toHaveBeenCalledWith('hello@example.com', 'Example1!'))
    expect(loginClient).not.toHaveBeenCalled()
  })

  it('authenticates clients when lead authentication does not succeed', async () => {
    vi.mocked(loginClient).mockResolvedValue({ success: true, contactId: 'contact-1' })
    setup('/login')
    submit()
    await waitFor(() => expect(loginClient).toHaveBeenCalledWith('hello@example.com', 'Example1!'))
    expect(loginProspect).toHaveBeenCalledOnce()
    await waitFor(() => expect(screen.getByRole('button', { name: 'Enter Portal' })).not.toBeDisabled())
    expect(screen.queryByText('Invalid credentials.')).not.toBeInTheDocument()
  })

  it('shows an error when neither endpoint authenticates the account', async () => {
    setup('/login')
    submit()
    await waitFor(() => expect(screen.getByText('Invalid credentials.')).toBeInTheDocument())
    expect(loginProspect).toHaveBeenCalledOnce()
    expect(loginClient).toHaveBeenCalledOnce()
  })
})