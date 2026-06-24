import { motion } from 'framer-motion'
import { useEffect, useState, type FormEvent } from 'react'
import { FiArrowLeft, FiArrowRight, FiEye, FiEyeOff } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import { loginClient } from '../api.ts'
import { useAuth } from '../context/AuthContext'
import './Login.css'

const logoSrc = '/images/Logos/Arelia.png'

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [shake, setShake] = useState(false)
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

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailPattern.test(email.trim())) {
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

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!validate()) {
      triggerErrorAnimation()
      return
    }

    setLoading(true)
    setError('')

    const response = await loginClient(email, password)

    if (response.success) {
      login({
        contactId: response.contactId,
        leadId: response.leadId,
        name: response.name || email.split('@')[0],
        email: email.trim(),
      })
      navigate('/dashboard')
    } else {
      setError(response.message || 'Unable to authenticate.')
      triggerErrorAnimation()
    }

    setLoading(false)
  }

  return (
    <main className="loginPage">
      <div className="loginPage__backdrop" aria-hidden="true">
        <span className="loginPage__veil" />
        <span className="loginPage__orb loginPage__orb--gold" />
        <span className="loginPage__orb loginPage__orb--blue" />
        <span className="loginPage__streak loginPage__streak--one" />
        <span className="loginPage__streak loginPage__streak--two" />
        <span className="loginPage__grain" />
        <span className="loginPage__grid" />
      </div>

      <section className="loginPage__shell">
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
        </motion.button>

        <motion.section
          className={`loginPage__panel${shake ? ' loginPage__panel--shake' : ''}`}
          initial={{ opacity: 0, y: 28, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.div
            className="loginPage__brandLockup"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.14, ease: [0.22, 1, 0.36, 1] }}
          >
            <img src={logoSrc} alt="Arelia logo" className="loginPage__brandLogo" />
            <p className="loginPage__brandWordmark">ARELIA</p>
          </motion.div>

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
            <motion.div
              className="loginForm__field"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.42, delay: 0.26, ease: [0.22, 1, 0.36, 1] }}
            >
              <label htmlFor="email" className="loginForm__label">
                Username or Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="loginForm__input"
                placeholder="Enter your email"
                autoComplete="email"
                disabled={loading}
              />
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
                >
                  {showPassword ? <FiEyeOff aria-hidden="true" /> : <FiEye aria-hidden="true" />}
                  <span>{showPassword ? 'Hide' : 'Show'}</span>
                </button>
              </div>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="loginForm__input"
                placeholder="Enter your password"
                autoComplete="current-password"
                disabled={loading}
              />
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
