const ANALYTICS_ID = 'G-MMZHTEJJJF'
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
  if (document.querySelector(`script[data-arelia-analytics="${ANALYTICS_ID}"]`)) return

  window.dataLayer = window.dataLayer || []
  window.gtag = (...args: unknown[]) => window.dataLayer.push(args)
  window.gtag('js', new Date())
  window.gtag('config', ANALYTICS_ID, { send_page_view: false })

  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${ANALYTICS_ID}`
  script.dataset.areliaAnalytics = ANALYTICS_ID
  document.head.appendChild(script)
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
