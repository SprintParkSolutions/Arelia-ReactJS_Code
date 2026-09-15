const CONSENT_KEY = 'arelia-cookie-consent'

export type CookieConsent = {
  analytics: boolean
  functional: boolean
}

export function getCookieConsent(): CookieConsent | null {
  try {
    const stored = window.localStorage.getItem(CONSENT_KEY)
    return stored ? JSON.parse(stored) as CookieConsent : null
  } catch {
    return null
  }
}

export function saveCookieConsent(consent: CookieConsent) {
  window.localStorage.setItem(CONSENT_KEY, JSON.stringify(consent))
}

export function initializeAnalytics() {
  window.gtag('consent', 'update', {
    analytics_storage: 'granted',
  })
}

export function updateGoogleConsent(consent: CookieConsent) {
  window.gtag('consent', 'update', {
    analytics_storage: consent.analytics ? 'granted' : 'denied',
    functionality_storage: consent.functional ? 'granted' : 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
  })
}

export function trackPageView(path: string) {
  if (!getCookieConsent()?.analytics) return
  initializeAnalytics()
  window.gtag('event', 'page_view', {
    page_path: path,
    page_location: window.location.href,
    page_title: document.title,
  })
}
