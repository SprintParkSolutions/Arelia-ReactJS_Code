import { useEffect, useState } from 'react'
import {
  getCookieConsent,
  initializeAnalytics,
  saveCookieConsent,
  trackPageView,
  updateGoogleConsent,
  type CookieConsent as CookieConsentChoice,
} from '../../utils/analytics'
import './CookieConsent.css'

export function CookieConsent() {
  const [isOpen, setIsOpen] = useState(() => getCookieConsent() === null)
  const [showPreferences, setShowPreferences] = useState(false)
  const [analytics, setAnalytics] = useState(false)
  const [functional, setFunctional] = useState(false)

  useEffect(() => {
    const storedConsent = getCookieConsent()
    if (storedConsent?.analytics) {
      initializeAnalytics()
    }
  }, [])

  const applyConsent = (choice: CookieConsentChoice) => {
    saveCookieConsent(choice)
    updateGoogleConsent(choice)
    setIsOpen(false)

    if (choice.analytics) {
      initializeAnalytics()
      trackPageView(window.location.pathname)
    }
  }

  if (!isOpen) return null

  return (
    <div className="cookie-consent" role="region" aria-label="Cookie consent">
      <div className="cookie-consent__accent" aria-hidden="true" />
      <div className="cookie-consent__content">
        <p className="cookie-consent__eyebrow">Privacy preferences</p>
        <h2>We Value Your Privacy</h2>
        <p>
          AreliaSpace uses cookies and similar technologies to ensure our website works properly,
          remember your preferences, understand how visitors use our website, and improve your
          overall experience.
        </p>

        {showPreferences ? (
          <div className="cookie-consent__preferences">
            <div className="cookie-consent__preference">
              <div><strong>Essential cookies</strong><span>Required for core functionality and security.</span></div>
              <span className="cookie-consent__required">Always active</span>
            </div>
            <label className="cookie-consent__preference">
              <div><strong>Analytics cookies</strong><span>Help us understand website usage and improve performance.</span></div>
              <input type="checkbox" checked={analytics} onChange={(event) => setAnalytics(event.target.checked)} />
            </label>
            <label className="cookie-consent__preference">
              <div><strong>Functional cookies</strong><span>Remember preferences and provide a more personalized experience.</span></div>
              <input type="checkbox" checked={functional} onChange={(event) => setFunctional(event.target.checked)} />
            </label>
          </div>
        ) : (
          <p className="cookie-consent__note">
            Choose to accept all cookies, allow only essential cookies, or manage your preferences.
          </p>
        )}
      </div>

      <div className="cookie-consent__actions">
        <button type="button" className="cookie-consent__button cookie-consent__button--primary" onClick={() => applyConsent({ analytics: true, functional: true })}>
          Accept All
        </button>
        <button type="button" className="cookie-consent__button" onClick={() => applyConsent({ analytics: false, functional: false })}>
          Essential Only
        </button>
        {showPreferences ? (
          <button type="button" className="cookie-consent__button" onClick={() => applyConsent({ analytics, functional })}>
            Save Preferences
          </button>
        ) : (
          <button type="button" className="cookie-consent__button cookie-consent__button--text" onClick={() => setShowPreferences(true)}>
            Manage Preferences
          </button>
        )}
      </div>
    </div>
  )
}
