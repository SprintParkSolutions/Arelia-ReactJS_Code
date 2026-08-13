import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { FiArrowLeft, FiCheckCircle, FiEye, FiEyeOff, FiInfo, FiLock, FiMail, FiPhone, FiUser, FiUserPlus } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import { generateOTP, registerLead, sendOtp } from '../api'
import './SignUpPage.css'

type Step = 'email' | 'otp' | 'profile' | 'password' | 'success'
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function SignUpPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [generatedOtp, setGeneratedOtp] = useState('')
  const [otp, setOtp] = useState('')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [seconds, setSeconds] = useState(60)

  useEffect(() => {
    if (step !== 'otp' || seconds <= 0) return
    const timer = window.setInterval(() => setSeconds((value) => value - 1), 1000)
    return () => window.clearInterval(timer)
  }, [step, seconds])

  const sendCode = async () => {
    if (!emailPattern.test(email.trim())) return setError('Enter a valid email address.')
    setLoading(true); setError('')
    const code = generateOTP()
    const result = await sendOtp(email.trim(), code)
    setLoading(false)
    if (!result.success) return setError(result.message || 'Unable to send OTP. Please try again.')
    setGeneratedOtp(code); setOtp(''); setSeconds(60); setStep('otp')
  }

  const verifyCode = () => {
    if (otp.length !== 6) return setError('Enter the 6-digit verification code.')
    if (seconds <= 0) return setError('This OTP has expired. Please request a new one.')
    if (otp !== generatedOtp) return setError('The verification code is incorrect.')
    setError(''); setStep('profile')
  }

  const continueProfile = () => {
    if (!/^[A-Za-z]+(?:[ '-][A-Za-z]+)*$/.test(fullName.trim())) return setError('Enter your full name using letters only.')
    if (!/^\d{10}$/.test(phone)) return setError('Enter a valid 10-digit phone number.')
    setError(''); setStep('password')
  }

  const requirements = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  }
  const passwordValid = Object.values(requirements).every(Boolean)

  const createAccount = async () => {
    if (!passwordValid) return setError('Your password does not meet all requirements.')
    if (password !== confirmPassword) return setError('Passwords do not match.')
    const nameParts = fullName.trim().split(/\s+/)
    const lastName = nameParts.pop() || fullName.trim()
    const firstName = nameParts.join(' ')
    setLoading(true); setError('')
    const result = await registerLead(firstName, lastName, email.trim(), phone, 'Self', password, confirmPassword)
    setLoading(false)
    if (!result.success) return setError(result.message || 'Unable to create your account. Please try again.')
    setStep('success')
  }

  const goBack = () => {
    setError('')
    if (step === 'email') navigate('/account')
    else if (step === 'otp') setStep('email')
    else if (step === 'profile') setStep('otp')
    else if (step === 'password') setStep('profile')
    else navigate('/login')
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (step === 'email') void sendCode()
    if (step === 'otp') verifyCode()
    if (step === 'profile') continueProfile()
    if (step === 'password') void createAccount()
  }

  const header = step === 'email' ? 'Create Account' : step === 'otp' ? 'Verify OTP' : step === 'profile' ? 'Complete Your Profile' : step === 'password' ? 'Create Password' : 'Account Created'

  return (
    <main className="signUpPage">
      <header className="signUpPage__header"><button type="button" onClick={goBack}><FiArrowLeft /></button><strong>{header}</strong></header>
      <form className="signUpPage__panel" onSubmit={submit} noValidate>
        {step === 'email' && <>
          <Icon><FiMail /></Icon><h1>Verify Your Email</h1><p>Enter your email address. We will send a verification code to continue creating your Arelia account.</p>
          <Field icon={<FiMail />}><input type="email" value={email} onChange={(e) => { setEmail(e.target.value); setError('') }} placeholder="Email Address" autoComplete="email" /></Field>
          <Primary loading={loading}>Send OTP</Primary><Note>Make sure you have access to this email address. The verification code will be required on the next screen.</Note>
        </>}
        {step === 'otp' && <>
          <Icon><FiLock /></Icon><h1>Enter Verification Code</h1><p>We sent a 6-digit verification code to <strong>{maskEmail(email)}</strong></p>
          <Field icon={<FiLock />}><input value={otp} onChange={(e) => { setOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); setError('') }} placeholder="000000" inputMode="numeric" /></Field>
          <Primary loading={loading}>Verify OTP</Primary>
          <div className="signUpPage__resend">Didn't receive the code? <button type="button" disabled={seconds > 0 || loading} onClick={() => void sendCode()}>{seconds > 0 ? `Resend OTP in ${seconds} seconds` : 'Resend OTP'}</button><button type="button" onClick={() => setStep('email')}>Change email address</button></div>
          <Note>Do not share your OTP with anyone. Arelia will never ask you to share your verification code.</Note>
        </>}
        {step === 'profile' && <>
          <Icon><FiUserPlus /></Icon><h1>Tell Us About Yourself</h1><p>Your email has been verified successfully. Enter your name and phone number to continue.</p>
          <div className="signUpPage__verified"><FiCheckCircle /> {email}</div>
          <Field icon={<FiUser />}><input value={fullName} onChange={(e) => { setFullName(e.target.value); setError('') }} placeholder="Full Name" autoComplete="name" /></Field>
          <Field icon={<FiPhone />}><input value={phone} onChange={(e) => { setPhone(e.target.value.replace(/\D/g, '').slice(0, 10)); setError('') }} placeholder="Phone Number" inputMode="numeric" autoComplete="tel" /></Field>
          <Primary loading={loading}>Continue</Primary><Note>On the next screen, create a password that you can use whenever you sign in to your Arelia profile.</Note>
        </>}
        {step === 'password' && <>
          <Icon><FiLock /></Icon><h1>Secure Your Account</h1><p>Create a secure password. You will use your email and this password whenever you sign in to your Arelia profile.</p>
          <div className="signUpPage__summary"><span><FiUser />{fullName}</span><span><FiMail />{email}</span><span><FiPhone />{phone}</span></div>
          <Field icon={<FiLock />} action={<button type="button" onClick={() => setShowPassword((v) => !v)}>{showPassword ? <FiEyeOff /> : <FiEye />}</button>}><input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => { setPassword(e.target.value); setError('') }} placeholder="Create Password" autoComplete="new-password" /></Field>
          <Field icon={<FiLock />}><input type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={(e) => { setConfirmPassword(e.target.value); setError('') }} placeholder="Confirm Password" autoComplete="new-password" /></Field>
          <div className="signUpPage__requirements"><strong>Password must contain:</strong>{[['length','At least 8 characters'],['upper','One uppercase letter'],['lower','One lowercase letter'],['number','One number'],['special','One special character']].map(([key, label]) => <span className={requirements[key as keyof typeof requirements] ? 'is-valid' : ''} key={key}><FiCheckCircle />{label}</span>)}</div>
          <Primary loading={loading}>Create Account</Primary>
        </>}
        {step === 'success' && <div className="signUpPage__success"><Icon><FiCheckCircle /></Icon><h1>Account Created</h1><p>Your Arelia account has been created successfully.</p><button type="button" className="signUpPage__primary" onClick={() => navigate('/login')}>Sign In</button></div>}
        {error && <p className="signUpPage__error" role="alert">{error}</p>}
      </form>
    </main>
  )
}

function maskEmail(email: string) { const [name, domain = ''] = email.split('@'); return `${name.slice(0, 2)}***@${domain}` }
function Icon({ children }: { children: ReactNode }) { return <span className="signUpPage__heroIcon">{children}</span> }
function Field({ children, icon, action }: { children: ReactNode; icon: ReactNode; action?: ReactNode }) { return <label className="signUpPage__field"><span>{icon}</span>{children}{action}</label> }
function Primary({ children, loading }: { children: ReactNode; loading: boolean }) { return <button className="signUpPage__primary" type="submit" disabled={loading}>{loading ? 'Please wait…' : children}</button> }
function Note({ children }: { children: ReactNode }) { return <div className="signUpPage__note"><FiInfo /> <span>{children}</span></div> }
