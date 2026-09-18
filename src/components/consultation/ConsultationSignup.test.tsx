import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ConsultationSignup } from './ConsultationSignup'
import { registerProspect, sendOtp } from '../../services/salesforceApi'
vi.mock('../../services/salesforceApi', () => ({ registerProspect: vi.fn(), sendOtp: vi.fn() }))
const register = vi.mocked(registerProspect)
const send = vi.mocked(sendOtp)
const close = vi.fn()
function setup() {
  render(<MemoryRouter><Routes><Route path="/" element={<ConsultationSignup onClose={close} />} /><Route path="/login" element={<h1>Sign In Screen</h1>} /></Routes></MemoryRouter>)
}
function fill(password = 'Example1!', confirmation = password, email = 'ada@example.com') {
  for (const [label, value] of Object.entries({ 'First Name': 'Ada', 'Last Name': 'Lovelace', 'Email Address': email, 'Phone Number': '9876543210', Password: password, 'Confirm Password': confirmation })) {
    fireEvent.change(screen.getByLabelText(label, { exact: true }), { target: { value } })
  }
}
async function verifySentCode() {
  await screen.findByLabelText('Enter OTP')
  fireEvent.change(screen.getByLabelText('Enter OTP'), { target: { value: send.mock.calls.at(-1)![1] } })
  fireEvent.click(screen.getByRole('button', { name: 'Verify OTP' }))
}
function submit() { fireEvent.click(screen.getByRole('button', { name: 'Sign Up' })) }
beforeEach(() => { vi.clearAllMocks(); send.mockResolvedValue({ success: true }); register.mockResolvedValue({ success: true, leadId: '00Q123' }) })
afterEach(() => vi.useRealTimers())
describe('consultation signup', () => {
  it.each(['First Name', 'Last Name'])('blocks digits and special characters in %s', label => {
    setup()
    const input = screen.getByLabelText(label)
    fireEvent.change(input, { target: { value: 'Mary Jane' } })
    for (const value of ['Mary Jane1', 'Mary@Jane', '123', 'Jane-Doe', "O'Neil"]) {
      fireEvent.change(input, { target: { value } })
      expect(input).toHaveValue('Mary Jane')
      expect(screen.getByText('Use letters and spaces only.')).toBeInTheDocument()
    }
    fireEvent.change(input, { target: { value: 'Jane' } })
    expect(input).toHaveValue('Jane')
    expect(screen.queryByText('Use letters and spaces only.')).not.toBeInTheDocument()
    fireEvent.change(input, { target: { value: '' } })
    expect(input).toHaveValue('')
  })
  it('requires all six fields', () => {
    setup(); submit()
    expect(screen.getAllByText(/is required\./)).toHaveLength(6)
    expect(register).not.toHaveBeenCalled()
  })
  it.each(['Ab1!', 'example1!', 'EXAMPLE1!', 'Example!!', 'Example12', 'Example123456789012345!'])('rejects invalid password %s', password => {
    setup(); fill(password); submit()
    expect(register).not.toHaveBeenCalled()
  })
  it('rejects mismatched passwords and invalid email', () => {
    setup(); fill('Example1!', 'Different1!', 'bad@address'); submit()
    expect(screen.getByText('Passwords do not match.')).toBeInTheDocument()
    expect(screen.getByText('Enter a valid email address.')).toBeInTheDocument()
    expect(register).not.toHaveBeenCalled()
  })
  it.each(['12345', '98765432101'])('rejects invalid phone %s', phone => {
    setup(); fill()
    fireEvent.change(screen.getByLabelText('Phone Number'), { target: { value: phone } })
    submit()
    expect(screen.getByText('Enter a valid phone number for the selected country.')).toBeInTheDocument()
    expect(register).not.toHaveBeenCalled()
  })
  it('lists country codes and submits an international number for the selected country', async () => {
    setup(); fill()
    expect(screen.getByRole('combobox', { name: 'Country code' })).toHaveValue('IN')
    expect(screen.getAllByRole('option').length).toBeGreaterThan(200)
    fireEvent.change(screen.getByRole('combobox', { name: 'Country code' }), { target: { value: 'GB' } })
    fireEvent.change(screen.getByLabelText('Phone Number'), { target: { value: '02079460018' } })
    submit()
    await verifySentCode()
    await waitFor(() => expect(register).toHaveBeenCalledWith(expect.objectContaining({ phone: '+442079460018' })))
  })
  it('blocks non-numeric phone input and allows correction and deletion', () => {
    setup(); fill()
    const input = screen.getByLabelText('Phone Number')
    for (const value of ['98765abcde', '+919876543210', '98765 43210', '98765-43210', '(9876543210)', '9876543210!']) {
      fireEvent.change(input, { target: { value } })
      expect(input).toHaveValue('9876543210')
      expect(screen.getByText('Use numbers only.')).toBeInTheDocument()
    }
    fireEvent.change(input, { target: { value: '9005556662' } })
    expect(input).toHaveValue('9005556662')
    expect(screen.queryByText('Use numbers only.')).not.toBeInTheDocument()
    fireEvent.change(input, { target: { value: '' } })
    expect(input).toHaveValue('')
  })
  it('includes the phone in signup', async () => {
    setup(); fill(); submit()
    await verifySentCode()
    await waitFor(() => expect(register).toHaveBeenCalledWith(expect.objectContaining({ phone: '+919876543210' })))
  })
  it('shows API failures and allows retry', async () => {
    register.mockResolvedValue({ success: false, message: 'Unable to save Lead.' })
    setup(); fill(); submit()
    await verifySentCode()
    expect(await screen.findByText('Unable to save Lead.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Verify OTP' })).toBeEnabled()
  })
  it('prevents duplicate submissions while pending', async () => {
    let resolve!: (value: { success: boolean }) => void
    send.mockReturnValue(new Promise(done => { resolve = done }))
    setup(); fill(); submit()
    expect(screen.getByRole('button', { name: 'Sending OTP…' })).toBeDisabled()
    fireEvent.submit(screen.getByRole('button', { name: 'Sending OTP…' }).closest('form')!)
    expect(send).toHaveBeenCalledTimes(1)
    expect(register).not.toHaveBeenCalled()
    await act(async () => resolve({ success: false }))
  })
  it('shows success, clears passwords and redirects to sign in', async () => {
    vi.useFakeTimers()
    setup(); fill(); submit()
    await act(async () => {})
    fireEvent.change(screen.getByLabelText('Enter OTP'), { target: { value: send.mock.calls[0][1] } })
    fireEvent.click(screen.getByRole('button', { name: 'Verify OTP' }))
    await act(async () => {})
    expect(screen.getByRole('status')).toHaveTextContent('Taking you to Sign In')
    expect(screen.queryByLabelText('Password', { exact: true })).not.toBeInTheDocument()
    await act(async () => vi.advanceTimersByTime(1800))
    expect(screen.getByText('Sign In Screen')).toBeInTheDocument()
    expect(close).toHaveBeenCalledOnce()
  })
  it('does not create a Lead until the emailed OTP matches', async () => {
    setup(); fill(); submit()
    await screen.findByLabelText('Enter OTP')
    expect(send).toHaveBeenCalledWith('ada@example.com', expect.stringMatching(/^[0-9]{6}$/))
    expect(register).not.toHaveBeenCalled()
    const wrong = send.mock.calls[0][1] === '000000' ? '111111' : '000000'
    fireEvent.change(screen.getByLabelText('Enter OTP'), { target: { value: wrong } })
    fireEvent.click(screen.getByRole('button', { name: 'Verify OTP' }))
    expect(screen.getByText('Please enter the correct OTP.')).toBeInTheDocument()
    expect(register).not.toHaveBeenCalled()
    await verifySentCode()
    await waitFor(() => expect(register).toHaveBeenCalledOnce())
  })
  it('stays on signup when email sending fails', async () => {
    send.mockResolvedValue({ success: false, message: 'Email could not be sent.' })
    setup(); fill(); submit()
    expect(await screen.findByRole('alert')).toHaveTextContent('Email could not be sent.')
    expect(register).not.toHaveBeenCalled()
    expect(screen.queryByLabelText('Enter OTP')).not.toBeInTheDocument()
  })
  it('expires codes and leaves resend available when sending fails', async () => {
    vi.useFakeTimers()
    setup(); fill(); submit()
    await act(async () => {})
    await act(async () => vi.advanceTimersByTime(60_000))
    expect(screen.getByText('OTP has expired')).toBeInTheDocument()
    expect(register).not.toHaveBeenCalled()
    send.mockResolvedValueOnce({ success: false, message: 'Send failed.' })
    fireEvent.click(screen.getByRole('button', { name: 'Resend OTP' }))
    await act(async () => {})
    expect(screen.getByText('Send failed.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Resend OTP' })).toBeEnabled()
    fireEvent.click(screen.getByRole('button', { name: 'Resend OTP' }))
    await act(async () => {})
    expect(screen.getByLabelText('Enter OTP')).toBeEnabled()
    expect(send).toHaveBeenCalledTimes(3)
  })
  it('requires another OTP after changing email', async () => {
    setup(); fill(); submit()
    await screen.findByLabelText('Enter OTP')
    fireEvent.click(screen.getByRole('button', { name: 'Change email or details' }))
    fireEvent.change(screen.getByLabelText('Email Address'), { target: { value: 'new@example.com' } })
    submit()
    await screen.findByLabelText('Enter OTP')
    expect(send).toHaveBeenLastCalledWith('new@example.com', expect.any(String))
    expect(register).not.toHaveBeenCalled()
  })
  it('toggles password visibility', async () => {
    setup(); fill()
    fireEvent.click(screen.getByRole('button', { name: 'Show password' }))
    await waitFor(() => expect(screen.getByLabelText('Password', { exact: true })).toHaveAttribute('type', 'text'))
  })
})
