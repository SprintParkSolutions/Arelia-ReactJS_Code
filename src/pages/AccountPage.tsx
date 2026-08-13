import { motion } from 'framer-motion'
import { FiArrowLeft, FiLogIn, FiShield, FiUser, FiUserPlus } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import './AccountPage.css'

export function AccountPage() {
  const navigate = useNavigate()

  return (
    <main className="accountPage">
      <header className="accountPage__header">
        <button type="button" onClick={() => navigate(-1)} aria-label="Go back">
          <FiArrowLeft aria-hidden="true" />
        </button>
        <span>Arelia Account</span>
      </header>

      <section className="accountPage__content">
        <motion.div
          className="accountPage__intro"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
        >
          <span className="accountPage__avatar"><FiUser aria-hidden="true" /></span>
          <h1>Welcome to Arelia</h1>
          <p>Create a new account or sign in to access your profile and submit your project details.</p>
        </motion.div>

        <div className="accountPage__choices">
          <motion.article
            className="accountPage__card"
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.08 }}
          >
            <FiUserPlus className="accountPage__cardIcon" aria-hidden="true" />
            <h2>New to Arelia?</h2>
            <p>Verify your email and create your account.</p>
            <button type="button" className="accountPage__button accountPage__button--filled" onClick={() => navigate('/signup')}>
              <FiUserPlus aria-hidden="true" />
              <span>Sign Up</span>
            </button>
          </motion.article>

          <motion.article
            className="accountPage__card"
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.16 }}
          >
            <FiLogIn className="accountPage__cardIcon" aria-hidden="true" />
            <h2>Already have an account?</h2>
            <p>Sign in using your registered email and password.</p>
            <button type="button" className="accountPage__button" onClick={() => navigate('/login')}>
              <FiLogIn aria-hidden="true" />
              <span>Sign In</span>
            </button>
          </motion.article>
        </div>

        <div className="accountPage__privacy">
          <FiShield aria-hidden="true" />
          <p>Your account information is used only to manage your Arelia profile and project request.</p>
        </div>
      </section>
    </main>
  )
}
