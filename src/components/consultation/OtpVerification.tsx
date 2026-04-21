import { useState, useEffect } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import './OtpVerification.css'

type OtpVerificationProps = {
  email: string
  onVerify: (otp: string) => void
  onResend: () => void
  isVerifying: boolean
}

export function OtpVerification({
  email,
  onVerify,
  onResend,
  isVerifying,
}: OtpVerificationProps) {
  const [otp, setOtp] = useState('')
  const [timeLeft, setTimeLeft] = useState(60)
  const [error, setError] = useState('')
  const isTimeExpired = timeLeft <= 0

  useEffect(() => {
    if (isTimeExpired) {
      return
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [isTimeExpired])

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6)
    setOtp(value)
    setError('')
  }

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (otp.length !== 6) {
      setError('Please enter a 6-digit OTP')
      return
    }

    if (isTimeExpired) {
      setError('OTP has expired. Please request a new one.')
      return
    }

    onVerify(otp)
  }

  const handleResend = () => {
    setOtp('')
    setTimeLeft(60)
    setError('')
    onResend()
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="otp-verification">
      <div className="otp-verification__intro">
        <p className="otp-verification__eyebrow">Email Verification</p>
        <h2 className="otp-verification__title">Verify Your Email</h2>
        <p className="otp-verification__description">
          We've sent a 6-digit OTP to <strong>{email}</strong>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="otp-verification__form">
        <label className="otp-verification__field">
          <span className="otp-verification__label">Enter OTP</span>
          <input
            type="text"
            value={otp}
            onChange={handleChange}
            placeholder="000000"
            maxLength={6}
            disabled={isVerifying || isTimeExpired}
            className="otp-verification__input"
            inputMode="numeric"
            autoFocus
          />
          {error && <span className="otp-verification__error">{error}</span>}
        </label>

        <div className="otp-verification__timer">
          {!isTimeExpired ? (
            <p className="otp-verification__time">
              OTP expires in: <strong>{formatTime(timeLeft)}</strong>
            </p>
          ) : (
            <p className="otp-verification__expired">OTP has expired</p>
          )}
        </div>

        <div className="otp-verification__actions">
          {!isTimeExpired ? (
            <button
              type="submit"
              className="otp-verification__verify-btn"
              disabled={isVerifying || otp.length !== 6}
            >
              {isVerifying ? 'Verifying...' : 'Verify OTP'}
            </button>
          ) : (
            <button
              type="button"
              className="otp-verification__resend-btn"
              onClick={handleResend}
              disabled={isVerifying}
            >
              Resend OTP
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
