import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ConsultationForm } from './ConsultationForm'
import {
  generateOTP,
  registerLead,
  sendOtp,
} from '../../services/salesforceApi'

vi.mock('../../services/salesforceApi', () => ({
  generateOTP: vi.fn(),
  registerLead: vi.fn(),
  sendOtp: vi.fn(),
}))

const mockedGenerateOtp = vi.mocked(generateOTP)
const mockedRegisterLead = vi.mocked(registerLead)
const mockedSendOtp = vi.mocked(sendOtp)

async function fillConsultationForm() {
  const user = userEvent.setup()

  await user.type(screen.getByLabelText('First Name'), 'Arelia')
  await user.type(screen.getByLabelText('Last Name'), 'Space')
  await user.type(screen.getByLabelText('Email'), 'hello@arelia.com')
  await user.type(screen.getByLabelText('Phone'), '9876543210')
  await user.type(screen.getByLabelText('Company'), 'Arelia Space')

  return user
}

describe('ConsultationForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedGenerateOtp.mockReturnValue('123456')
    mockedSendOtp.mockResolvedValue({ success: true, message: 'OTP sent' })
    mockedRegisterLead.mockResolvedValue({ success: true, message: 'Lead created' })
  })

  it('shows validation errors when the form is submitted empty', async () => {
    const user = userEvent.setup()

    render(<ConsultationForm />)

    await user.click(screen.getByRole('button', { name: 'Get Started' }))

    expect(screen.getByText('First name is required')).toBeInTheDocument()
    expect(screen.getByText('Last name is required')).toBeInTheDocument()
    expect(screen.getByText('Email is required')).toBeInTheDocument()
    expect(screen.getByText('Phone number is required')).toBeInTheDocument()
    expect(mockedSendOtp).not.toHaveBeenCalled()
  })

  it('submits valid details and advances to OTP verification', async () => {
    render(<ConsultationForm />)
    const user = await fillConsultationForm()

    await user.click(screen.getByRole('button', { name: 'Get Started' }))

    await waitFor(() => {
      expect(mockedSendOtp).toHaveBeenCalledWith('hello@arelia.com', '123456')
    })

    expect(screen.getByText('Verify Your Email')).toBeInTheDocument()
    expect(screen.getByText(/hello@arelia\.com/i)).toBeInTheDocument()
  })

  it('shows an error when the entered OTP does not match the generated OTP', async () => {
    render(<ConsultationForm />)
    const user = await fillConsultationForm()

    await user.click(screen.getByRole('button', { name: 'Get Started' }))

    await screen.findByText('Verify Your Email')
    await user.type(screen.getByLabelText('Enter OTP'), '654321')
    await user.click(screen.getByRole('button', { name: 'Verify OTP' }))

    expect(screen.getByText('Please enter the correct OTP.')).toBeInTheDocument()
    expect(mockedRegisterLead).not.toHaveBeenCalled()
  })

  it('creates the lead after the correct OTP is verified', async () => {
    render(<ConsultationForm />)
    const user = await fillConsultationForm()

    await user.click(screen.getByRole('button', { name: 'Get Started' }))

    await screen.findByText('Verify Your Email')
    await user.type(screen.getByLabelText('Enter OTP'), '123456')
    await user.click(screen.getByRole('button', { name: 'Verify OTP' }))

    await waitFor(() => {
      expect(mockedRegisterLead).toHaveBeenCalledWith(
        'Arelia',
        'Space',
        'hello@arelia.com',
        '9876543210',
        'Arelia Space',
      )
    })

    expect(screen.getByText('Thank you')).toBeInTheDocument()
  })
})
