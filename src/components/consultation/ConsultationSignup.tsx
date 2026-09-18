import { useEffect, useRef, useState, type SubmitEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiCheckCircle, FiEye, FiEyeOff, FiUserPlus } from 'react-icons/fi'
import { registerProspect, sendOtp } from '../../services/salesforceApi'
import { getCountries, getCountryCallingCode, parsePhoneNumber, type Country } from 'react-phone-number-input'
import countryLabels from 'react-phone-number-input/locale/en'
import './ConsultationSignup.css'
import { OtpVerification } from './OtpVerification'

const countries = getCountries().sort((a, b) => countryLabels[a].localeCompare(countryLabels[b]))

const emptyValues = { firstName: '', lastName: '', email: '', phone: '', password: '', confirmPassword: '' }
type Values = typeof emptyValues
const fields: { name: keyof Values; label: string; autoComplete: string; maxLength?: number }[] = [
  { name: 'firstName', label: 'First Name', autoComplete: 'given-name', maxLength: 40 },
  { name: 'lastName', label: 'Last Name', autoComplete: 'family-name', maxLength: 80 },
  { name: 'email', label: 'Email Address', autoComplete: 'email', maxLength: 80 },
  { name: 'phone', label: 'Phone Number', autoComplete: 'tel-national' },
  { name: 'password', label: 'Password', autoComplete: 'new-password' },
  { name: 'confirmPassword', label: 'Confirm Password', autoComplete: 'new-password' },
]
const namePattern = /^[A-Za-z ]*$/
const rules = [
  { label: 'At least 8 characters', test: (value: string) => value.length >= 8 },
  { label: 'One uppercase letter', test: (value: string) => /[A-Z]/.test(value) },
  { label: 'One lowercase letter', test: (value: string) => /[a-z]/.test(value) },
  { label: 'One number', test: (value: string) => /[0-9]/.test(value) },
  { label: 'One special character', test: (value: string) => /[^A-Za-z0-9\s]/.test(value) },
]

export function ConsultationSignup({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate()
  const [country, setCountry] = useState<Country>('IN')
  const [values, setValues] = useState(emptyValues)
  const [errors, setErrors] = useState<Partial<Record<keyof Values, string>>>({})
  const [visible, setVisible] = useState({ password: false, confirmPassword: false })
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [success, setSuccess] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [otpVersion, setOtpVersion] = useState(0)
  const challenge = useRef<{ code: string; expires: number; attempts: number; values: Values } | null>(null)
  const pending = useRef(false)
  const mounted = useRef(true)
  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false }
  }, [])
  useEffect(() => {
    if (!success) return
    const timer = window.setTimeout(() => {
      onClose()
      navigate('/login?account=prospect', { state: { signupSuccess: true } })
    }, 1800)
    return () => window.clearTimeout(timer)
  }, [success, navigate, onClose])

  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending.current || success) return
    const next: typeof errors = {}
    for (const field of fields) {
      if (!values[field.name].trim()) next[field.name] = `${field.label} is required.`
    }
    for (const name of ['firstName', 'lastName'] as const) {
      if (!namePattern.test(values[name])) next[name] = 'Use letters and spaces only.'
    }
    if (values.email.trim() && !/^[A-Z0-9_%+-]+(?:\.[A-Z0-9_%+-]+)*@(?:[A-Z0-9](?:[A-Z0-9-]*[A-Z0-9])?\.)+[A-Z]{2,}$/i.test(values.email.trim())) {
      next.email = 'Enter a valid email address.'
    }
    const parsedPhone = parsePhoneNumber(values.phone.trim(), country)
    if (values.phone.trim() && (
      !/^[0-9]+$/.test(values.phone) ||
      !parsedPhone?.isValid() ||
      parsedPhone.countryCallingCode !== getCountryCallingCode(country)
    )) next.phone = 'Enter a valid phone number for the selected country.'
    if (values.password && rules.some(rule => !rule.test(values.password))) next.password = 'Your password must meet all five requirements.'
    if (values.password.length > 20) next.password = 'Password cannot contain more than 20 characters.'
    if (values.password !== values.password.trim()) next.password = 'Password cannot start or end with spaces.'
    if (values.confirmPassword && values.password !== values.confirmPassword) next.confirmPassword = 'Passwords do not match.'
    setErrors(next)
    setMessage('')
    if (Object.keys(next).length) return
    pending.current = true
    setBusy(true)
    try {
      const code = createCode()
      const signupValues = { ...values, email: values.email.trim().toLowerCase(), phone: parsedPhone!.number }
      const result = await sendOtp(signupValues.email, code)
      if (!mounted.current) return
      if (result.success) {
        challenge.current = { code, expires: Date.now() + 60_000, attempts: 0, values: signupValues }
        setVerifying(true)
        setOtpVersion(current => current + 1)
      } else {
        setMessage(result.message || 'Unable to send the verification email. Please try again.')
      }
    } catch {
      if (mounted.current) setMessage('Unable to connect. Please try again.')
    } finally {
      pending.current = false
      if (mounted.current) setBusy(false)
    }
  }

  function createCode() {
    const random = new Uint32Array(1)
    do { crypto.getRandomValues(random) } while (random[0] >= 4_294_000_000)
    return (random[0] % 1_000_000).toString().padStart(6, '0')
  }

  async function verifyCode(code: string) {
    const current = challenge.current
    if (pending.current || !current || success) return
    if (Date.now() >= current.expires) {
      setMessage('OTP has expired. Please request a new one.')
      return
    }
    if (current.attempts >= 5) {
      setMessage('Too many attempts. Please wait for expiry and resend the OTP.')
      return
    }
    if (code !== current.code) {
      current.attempts += 1
      setMessage('Please enter the correct OTP.')
      return
    }
    pending.current = true
    setBusy(true)
    setMessage('')
    try {
      const result = await registerProspect(current.values)
      if (!mounted.current) return
      if (result.success) {
        challenge.current = null
        setValues(emptyValues)
        setVerifying(false)
        setSuccess(true)
      } else {
        setMessage(result.message || 'Unable to create your account. Please try again.')
      }
    } catch {
      if (mounted.current) setMessage('Unable to connect. Please try again.')
    } finally {
      pending.current = false
      if (mounted.current) setBusy(false)
    }
  }

  async function resendCode() {
    const current = challenge.current
    if (pending.current || !current || Date.now() < current.expires) return
    pending.current = true
    setBusy(true)
    setMessage('')
    try {
      const code = createCode()
      const result = await sendOtp(current.values.email, code)
      if (!mounted.current) return
      if (result.success) {
        challenge.current = { ...current, code, attempts: 0, expires: Date.now() + 60_000 }
        setOtpVersion(version => version + 1)
      } else {
        setMessage(result.message || 'Unable to resend OTP. Please try again.')
      }
    } catch {
      if (mounted.current) setMessage('Unable to resend OTP. Please try again.')
    } finally {
      pending.current = false
      if (mounted.current) setBusy(false)
    }
  }

  if (verifying) return (
    <div className="consultation-signup">
      <OtpVerification resetOnResend={false} key={otpVersion} email={challenge.current?.values.email || ''}
        onVerify={verifyCode} onResend={resendCode} isVerifying={busy} errorMessage={message} />
      <p className="consultation-signup__signin">
        <button type="button" disabled={busy} onClick={() => {
          challenge.current = null
          setMessage('')
          setVerifying(false)
        }}>Change email or details</button>
      </p>
    </div>
  )

  return (
    <div className="consultation-signup">
      <div className="consultation-signup__intro">
        <span className="consultation-signup__icon" aria-hidden="true">{success ? <FiCheckCircle /> : <FiUserPlus />}</span>
        <p className="consultation-signup__eyebrow">Book Consultation</p>
        <h2>{success ? 'Account Created' : 'Create Your Account'}</h2>
        <p>{success ? 'Your account has been created successfully.' : 'Tell us about yourself to begin your Arelia journey.'}</p>
      </div>
      {success ? <p role="status">Taking you to Sign In…</p> : (
        <form onSubmit={submit} noValidate aria-busy={busy}>
          <div className="consultation-signup__fields">
            {fields.map(({ name, label, autoComplete, maxLength }) => {
              const secret = name === 'password' || name === 'confirmPassword'
              return (
                <div key={name} className={(name === 'email' || name === 'phone') ? 'consultation-signup__wide' : ''}>
                  <label htmlFor={`signup-${name}`}>{label}</label>
                  <div className={name === 'phone' ? 'consultation-signup__input consultation-signup__phone' : 'consultation-signup__input'}>
                    {name === 'phone' && (
                      <select aria-label="Country code" value={country} disabled={busy}
                        onChange={event => {
                          setCountry(event.target.value as Country)
                          setErrors(current => ({ ...current, phone: undefined }))
                          setMessage('')
                        }}>
                        {countries.map(code => (
                          <option key={code} value={code}>{countryLabels[code]} (+{getCountryCallingCode(code)})</option>
                        ))}
                      </select>
                    )}
                    <input id={`signup-${name}`} name={name} required disabled={busy}
                      type={secret ? (visible[name] ? 'text' : 'password') : name === 'email' ? 'email' : name === 'phone' ? 'tel' : 'text'}
                      inputMode={name === 'phone' ? 'numeric' : undefined}
                      placeholder={name === 'phone' ? 'Phone number' : undefined}
                      autoComplete={autoComplete} maxLength={maxLength} value={values[name]}
                      aria-invalid={Boolean(errors[name])}
                      aria-describedby={`signup-${name}-error${name === 'password' ? ' signup-password-rules' : ''}`}
                      onChange={event => {
                        const value = event.target.value
                        if (name === 'phone' && !/^[0-9]*$/.test(value)) {
                          setErrors(current => ({ ...current, phone: 'Use numbers only.' }))
                          return
                        }
                        if ((name === 'firstName' || name === 'lastName') && !namePattern.test(value)) {
                          setErrors(current => ({ ...current, [name]: 'Use letters and spaces only.' }))
                          return
                        }
                        setValues(current => ({ ...current, [name]: value }))
                        setErrors(current => ({ ...current, [name]: undefined }))
                        setMessage('')
                      }} />
                    {secret && <button type="button" disabled={busy} aria-label={`${visible[name] ? 'Hide' : 'Show'} ${label.toLowerCase()}`}
                      aria-pressed={visible[name]} onClick={() => setVisible(current => ({ ...current, [name]: !current[name] }))}>
                      {visible[name] ? <FiEyeOff /> : <FiEye />}
                    </button>}
                  </div>
                  <span className="consultation-signup__error" id={`signup-${name}-error`}>{errors[name]}</span>
                </div>
              )
            })}
          </div>
          <div className="consultation-signup__rules" id="signup-password-rules">
            <strong>Password must contain:</strong>
            <ul>{rules.map(rule => <li key={rule.label} className={rule.test(values.password) ? 'is-met' : ''}>
              <FiCheckCircle aria-hidden="true" />{rule.label}
              <span className="consultation-signup__sr"> — {rule.test(values.password) ? 'met' : 'not met'}</span>
            </li>)}</ul>
            <small>Maximum 20 characters.</small>
          </div>
          {message && <p className="consultation-signup__error" role="alert">{message}</p>}
          <button className="consultation-signup__submit" disabled={busy} type="submit">
            <FiUserPlus aria-hidden="true" />{busy ? 'Sending OTP…' : 'Sign Up'}
          </button>
          <p className="consultation-signup__signin">Already have an account? <button disabled={busy} type="button" onClick={() => {
            onClose()
            navigate('/login?account=prospect')
          }}>Sign In</button></p>
        </form>
      )}
    </div>
  )
}
