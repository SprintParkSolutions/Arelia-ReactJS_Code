import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { OtpVerification } from './OtpVerification'

describe('OtpVerification', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('submits a sanitized six-digit OTP', async () => {
    const onVerify = vi.fn()
    const user = userEvent.setup()

    render(
      <OtpVerification
        email="hello@arelia.com"
        onVerify={onVerify}
        onResend={vi.fn()}
        isVerifying={false}
      />,
    )

    await user.type(screen.getByLabelText('Enter OTP'), '12ab34cd56')
    await user.click(screen.getByRole('button', { name: 'Verify OTP' }))

    expect(onVerify).toHaveBeenCalledWith('123456')
  })

  it('shows resend once the timer expires and resets after clicking it', async () => {
    vi.useFakeTimers()
    const onResend = vi.fn()

    render(
      <OtpVerification
        email="hello@arelia.com"
        onVerify={vi.fn()}
        onResend={onResend}
        isVerifying={false}
      />,
    )

    act(() => {
      vi.advanceTimersByTime(60000)
    })

    expect(screen.getByText('OTP has expired')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Resend OTP' }))

    expect(onResend).toHaveBeenCalledTimes(1)
    expect(screen.getByText(/OTP expires in:/i)).toBeInTheDocument()
  })
})
