import { motion } from 'framer-motion'
import { useEffect, useState, type SubmitEvent } from 'react'
import { createPortal } from 'react-dom'
import { FiArrowLeft, FiArrowRight, FiEye, FiEyeOff, FiLock, FiMail } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import {
  confirmPasswordReset,
  loginClient,
  requestPasswordResetOtp,
  verifyPasswordResetOtp,
} from '../api.ts'
import { useAuth } from '../context/AuthContext'
import './Login.css'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MIN_PASSWORD_LENGTH = 8

type ForgotPasswordStep = 'closed' | 'request' | 'sent' | 'newPassword' | 'done'

export function Login() {
  const [email, setEmail] = useState(() => localStorage.getItem('rememberedEmail') ?? '')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [shake, setShake] = useState(false)
  const [rememberMe, setRememberMe] = useState(() => Boolean(localStorage.getItem('rememberedEmail')))
  const [forgotStep, setForgotStep] = useState<ForgotPasswordStep>('closed')
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotOtp, setForgotOtp] = useState('')
  const [forgotNewPassword, setForgotNewPassword] = useState('')
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('')
  const [forgotShowPassword, setForgotShowPassword] = useState(false)
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotError, setForgotError] = useState('')
  const [forgotMessage, setForgotMessage] = useState('')
  const navigate = useNavigate()
  const { login, isAuthenticated } = useAuth()

  useEffect(() => {
    document.body.style.overflow = ''

    if (isAuthenticated) {
      navigate('/dashboard', { replace: true })
    }
  }, [isAuthenticated, navigate])

  const validate = () => {
    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password.')
      return false
    }

    if (!EMAIL_PATTERN.test(email.trim())) {
      setError('Please enter a valid email address.')
      return false
    }

    setError('')
    return true
  }

  const triggerErrorAnimation = () => {
    setShake(true)
    window.setTimeout(() => setShake(false), 400)
  }

  const openForgotPanel = () => {
    setForgotEmail((current) => current || email)
    setForgotOtp('')
    setForgotError('')
    setForgotMessage('')
    setForgotStep('request')
  }

  const closeForgotPanel = () => {
    setForgotStep('closed')
    setForgotEmail('')
    setForgotOtp('')
    setForgotNewPassword('')
    setForgotConfirmPassword('')
    setForgotError('')
    setForgotMessage('')
  }

  const goBackToOtpStep = () => {
    setForgotStep('sent')
    setForgotNewPassword('')
    setForgotConfirmPassword('')
    setForgotError('')
  }

  const handleSendResetCode = async () => {
    const trimmedEmail = forgotEmail.trim()
    if (!trimmedEmail || !EMAIL_PATTERN.test(trimmedEmail)) {
      setForgotError('Please enter a valid email address.')
      return
    }

    setForgotLoading(true)
    setForgotError('')

    const response = await requestPasswordResetOtp(trimmedEmail)

    if (response.success) {
      setForgotStep('sent')
      setForgotOtp('')
      setForgotMessage(
        response.message || 'A verification code has been sent to your email.',
      )
    } else {
      setForgotError(response.message || 'Unable to send a verification code right now.')
    }

    setForgotLoading(false)
  }

  const handleVerifyOtp = async () => {
    if (forgotOtp.length !== 6) {
      setForgotError('Please enter the 6-digit code from your email.')
      return
    }

    setForgotLoading(true)
    setForgotError('')

    const response = await verifyPasswordResetOtp(forgotEmail.trim(), forgotOtp)

    if (response.success) {
      setForgotNewPassword('')
      setForgotConfirmPassword('')
      setForgotStep('newPassword')
    } else {
      setForgotError(response.message || 'That code is invalid or has expired.')
    }

    setForgotLoading(false)
  }

  const handleSetNewPassword = async () => {
    if (forgotNewPassword.length < MIN_PASSWORD_LENGTH) {
      setForgotError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`)
      return
    }
    if (forgotNewPassword !== forgotConfirmPassword) {
      setForgotError('Passwords do not match.')
      return
    }

    setForgotLoading(true)
    setForgotError('')

    const response = await confirmPasswordReset(
      forgotEmail.trim(),
      forgotOtp,
      forgotNewPassword,
    )

    if (response.success) {
      setForgotStep('done')
      setForgotMessage(response.message || 'Your password has been updated. You can now log in.')
    } else {
      setForgotError(response.message || 'That code is invalid or has expired.')
    }

    setForgotLoading(false)
  }

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (forgotStep === 'request') {
      await handleSendResetCode()
      return
    }
    if (forgotStep === 'sent') {
      await handleVerifyOtp()
      return
    }
    if (forgotStep === 'newPassword') {
      await handleSetNewPassword()
      return
    }
    if (forgotStep === 'done') {
      return
    }

    if (!validate()) {
      triggerErrorAnimation()
      return
    }

    setLoading(true)
    setError('')

    const response = await loginClient(email, password)

    if (response.success && (response.contactId || response.leadId)) {
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email.trim())
      } else {
        localStorage.removeItem('rememberedEmail')
      }

      login({
        contactId: response.contactId,
        leadId: response.leadId,
        name: response.name || email.split('@')[0],
        email: email.trim(),
      })
      navigate('/dashboard')
    } else {
      setError(
        response.success
          ? 'We could not verify your account. Please try again or contact support.'
          : response.message || 'Unable to authenticate.',
      )
      triggerErrorAnimation()
    }

    setLoading(false)
  }

  return (
    <main className="loginPage">
      <div className="loginPage__backdrop" aria-hidden="true">
        <span className="loginPage__veil" />
        <span className="loginPage__watermark" />
        <span className="loginPage__corner loginPage__corner--tr" />
        <span className="loginPage__corner loginPage__corner--bl" />
        <span className="loginPage__grain" />
      </div>

      {createPortal(
        <motion.button
          type="button"
          className="loginPage__backButton"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          whileHover={{ y: -2 }}
          onClick={() => navigate('/')}
        >
          <FiArrowLeft aria-hidden="true" />
          <span>Back to Home</span>
        </motion.button>,
        document.body,
      )}

      <section className="loginPage__shell">

        <motion.section
          className={`loginPage__panel${shake ? ' loginPage__panel--shake' : ''}`}
          initial={{ opacity: 0, y: 28, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="loginPage__panelGlow" aria-hidden="true" />
          <motion.div
            className="loginPage__panelHeader"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="loginPage__panelEyebrow">Private Client Portal</p>
            <h1 className="loginPage__panelTitle">Welcome Back</h1>
            <p className="loginPage__panelIntro">Access your private Arelia workspace</p>
          </motion.div>

          <form className="loginForm" onSubmit={handleSubmit} noValidate>
            {forgotStep === 'closed' ? (
              <>
                <motion.div
                  className="loginForm__field"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.42, delay: 0.26, ease: [0.22, 1, 0.36, 1] }}
                >
                  <label htmlFor="email" className="loginForm__label">
                    Email Address
                  </label>
                  <div className="loginForm__inputWrap">
                    <FiMail className="loginForm__inputIcon" aria-hidden="true" />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      className="loginForm__input loginForm__input--icon"
                      placeholder="you@example.com"
                      autoComplete="email"
                      autoFocus
                      disabled={loading}
                    />
                  </div>
                </motion.div>

                <motion.div
                  className="loginForm__field"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.42, delay: 0.32, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div className="loginForm__heading">
                    <label htmlFor="password" className="loginForm__label">
                      Password
                    </label>
                    <button
                      type="button"
                      className="loginForm__toggle"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-pressed={showPassword}
                    >
                      {showPassword ? <FiEyeOff aria-hidden="true" /> : <FiEye aria-hidden="true" />}
                      <span>{showPassword ? 'Hide' : 'Show'}</span>
                    </button>
                  </div>
                  <div className="loginForm__inputWrap">
                    <FiLock className="loginForm__inputIcon" aria-hidden="true" />
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className="loginForm__input loginForm__input--icon"
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      disabled={loading}
                    />
                  </div>
                </motion.div>

                <motion.div
                  className="loginForm__options"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.42, delay: 0.36, ease: [0.22, 1, 0.36, 1] }}
                >
                  <label className="loginForm__remember">
                    <input
                      type="checkbox"
                      className="loginForm__checkboxInput"
                      checked={rememberMe}
                      onChange={(event) => setRememberMe(event.target.checked)}
                      disabled={loading}
                    />
                    <span className="loginForm__checkboxBox" aria-hidden="true" />
                    <span>Remember me</span>
                  </label>
                  <button type="button" className="loginForm__forgot" onClick={openForgotPanel}>
                    Forgot password?
                  </button>
                </motion.div>

                {error ? <p className="loginForm__error">{error}</p> : null}

                <motion.button
                  type="submit"
                  className="loginForm__submit"
                  disabled={loading}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.42, delay: 0.38, ease: [0.22, 1, 0.36, 1] }}
                  whileHover={loading ? undefined : { y: -3, scale: 1.01 }}
                  whileTap={loading ? undefined : { scale: 0.995 }}
                >
                  <span className="loginForm__submitShimmer" aria-hidden="true" />
                  {loading ? <span className="loginForm__loader" aria-hidden="true" /> : null}
                  <span>{loading ? 'Authenticating...' : 'Enter Portal'}</span>
                  {!loading ? <FiArrowRight aria-hidden="true" /> : null}
                </motion.button>
              </>
            ) : (
              <motion.div
                className="loginForm__forgotPanel"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              >
                <p className="loginForm__forgotIntro">
                  {forgotStep === 'request' ? (
                    "Enter your account email and we'll send you a verification code."
                  ) : forgotStep === 'sent' ? (
                    <>
                      We sent a 6-digit code to <strong>{forgotEmail}</strong>. Enter it below to
                      continue.
                    </>
                  ) : forgotStep === 'newPassword' ? (
                    'Create a new password for your account.'
                  ) : (
                    forgotMessage
                  )}
                </p>

                {forgotStep === 'request' ? (
                  <div className="loginForm__field">
                    <label htmlFor="forgotEmail" className="loginForm__label">
                      Email Address
                    </label>
                    <div className="loginForm__inputWrap">
                      <FiMail className="loginForm__inputIcon" aria-hidden="true" />
                      <input
                        id="forgotEmail"
                        type="email"
                        value={forgotEmail}
                        onChange={(event) => setForgotEmail(event.target.value)}
                        className="loginForm__input loginForm__input--icon"
                        placeholder="you@example.com"
                        autoComplete="email"
                        autoFocus
                        disabled={forgotLoading}
                      />
                    </div>
                  </div>
                ) : null}

                {forgotStep === 'sent' ? (
                  <div className="loginForm__field">
                    <label htmlFor="forgotOtp" className="loginForm__label">
                      Verification Code
                    </label>
                    <div className="loginForm__inputWrap">
                      <FiLock className="loginForm__inputIcon" aria-hidden="true" />
                      <input
                        id="forgotOtp"
                        type="text"
                        inputMode="numeric"
                        value={forgotOtp}
                        onChange={(event) =>
                          setForgotOtp(event.target.value.replace(/\D/g, '').slice(0, 6))
                        }
                        className="loginForm__input loginForm__input--icon"
                        placeholder="000000"
                        maxLength={6}
                        autoFocus
                        disabled={forgotLoading}
                      />
                    </div>
                  </div>
                ) : null}

                {forgotStep === 'newPassword' ? (
                  <>
                    <div className="loginForm__field">
                      <div className="loginForm__heading">
                        <label htmlFor="forgotNewPassword" className="loginForm__label">
                          New Password
                        </label>
                        <button
                          type="button"
                          className="loginForm__toggle"
                          onClick={() => setForgotShowPassword((prev) => !prev)}
                          aria-pressed={forgotShowPassword}
                        >
                          {forgotShowPassword ? (
                            <FiEyeOff aria-hidden="true" />
                          ) : (
                            <FiEye aria-hidden="true" />
                          )}
                          <span>{forgotShowPassword ? 'Hide' : 'Show'}</span>
                        </button>
                      </div>
                      <div className="loginForm__inputWrap">
                        <FiLock className="loginForm__inputIcon" aria-hidden="true" />
                        <input
                          id="forgotNewPassword"
                          type={forgotShowPassword ? 'text' : 'password'}
                          value={forgotNewPassword}
                          onChange={(event) => setForgotNewPassword(event.target.value)}
                          className="loginForm__input loginForm__input--icon"
                          placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
                          autoComplete="new-password"
                          autoFocus
                          disabled={forgotLoading}
                        />
                      </div>
                    </div>

                    <div className="loginForm__field">
                      <label htmlFor="forgotConfirmPassword" className="loginForm__label">
                        Confirm Password
                      </label>
                      <div className="loginForm__inputWrap">
                        <FiLock className="loginForm__inputIcon" aria-hidden="true" />
                        <input
                          id="forgotConfirmPassword"
                          type={forgotShowPassword ? 'text' : 'password'}
                          value={forgotConfirmPassword}
                          onChange={(event) => setForgotConfirmPassword(event.target.value)}
                          className="loginForm__input loginForm__input--icon"
                          placeholder="Re-enter your new password"
                          autoComplete="new-password"
                          disabled={forgotLoading}
                        />
                      </div>
                    </div>
                  </>
                ) : null}

                {forgotError ? <p className="loginForm__error">{forgotError}</p> : null}

                {forgotStep !== 'done' ? (
                  <motion.button
                    type="submit"
                    className="loginForm__submit"
                    disabled={forgotLoading}
                    whileHover={forgotLoading ? undefined : { y: -3, scale: 1.01 }}
                    whileTap={forgotLoading ? undefined : { scale: 0.995 }}
                  >
                    <span className="loginForm__submitShimmer" aria-hidden="true" />
                    {forgotLoading ? <span className="loginForm__loader" aria-hidden="true" /> : null}
                    <span>
                      {forgotStep === 'request'
                        ? forgotLoading
                          ? 'Sending...'
                          : 'Send Verification Code'
                        : forgotStep === 'sent'
                          ? 'Verify Code'
                          : forgotLoading
                            ? 'Updating...'
                            : 'Update Password'}
                    </span>
                    {!forgotLoading ? <FiArrowRight aria-hidden="true" /> : null}
                  </motion.button>
                ) : (
                  <button type="button" className="loginForm__submit" onClick={closeForgotPanel}>
                    <span>Back to Login</span>
                  </button>
                )}

                <div className="loginForm__forgotActions">
                  {forgotStep === 'sent' ? (
                    <button
                      type="button"
                      className="loginForm__forgot"
                      onClick={handleSendResetCode}
                      disabled={forgotLoading}
                    >
                      Resend code
                    </button>
                  ) : null}
                  {forgotStep === 'newPassword' ? (
                    <button
                      type="button"
                      className="loginForm__forgot"
                      onClick={goBackToOtpStep}
                      disabled={forgotLoading}
                    >
                      Re-enter code
                    </button>
                  ) : null}
                  {forgotStep !== 'done' ? (
                    <button type="button" className="loginForm__forgot" onClick={closeForgotPanel}>
                      Back to Login
                    </button>
                  ) : null}
                </div>
              </motion.div>
            )}
          </form>

          <motion.p
            className="loginPage__footerNote"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.42, delay: 0.44, ease: [0.22, 1, 0.36, 1] }}
          >
            Secure access for verified Arelia clients and project stakeholders.
          </motion.p>
        </motion.section>
      </section>
    </main>
  )
}
