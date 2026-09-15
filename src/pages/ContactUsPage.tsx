import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useLocation } from 'react-router-dom'
import { ConsultationForm } from '../components/consultation/ConsultationForm'
import './ContactUsPage.css'

const heroImagePath = '/images/ReachUs%20Page/ContactUs.png'
const exactAddress =
  'Unit No 1204, Forest Department, Asian Sun City, Block B, Kondapur, Hyderabad, Telangana 500084'
const encodedAddress = encodeURIComponent(exactAddress)
const mapUrl = `https://www.google.com/maps?q=${encodedAddress}&output=embed`
const mapsExternalUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`

function MapPinIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 21s6-5.38 6-11a6 6 0 1 0-12 0c0 5.62 6 11 6 11Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="10" r="2.4" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  )
}

export function ContactUsPage() {
  const { hash, key } = useLocation()
  const locationRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (hash !== '#studio-location') return

    // Wait until this page mounts after the outgoing route's exit animation.
    const frame = window.requestAnimationFrame(() => {
      locationRef.current?.scrollIntoView({ behavior: 'auto', block: 'start' })
    })
    return () => window.cancelAnimationFrame(frame)
  }, [hash, key])

  return (
    <main className="contact-page">
      <section className="contact-page__hero-shell">
        <div
          className="contact-page__hero"
          style={{ backgroundImage: `url(${heroImagePath})` }}
        >
          <div className="contact-page__hero-overlay" />
          <div className="contact-page__hero-ambient contact-page__hero-ambient--one" />
          <div className="contact-page__hero-ambient contact-page__hero-ambient--two" />

          <div className="contact-page__hero-content contact-page__section-inner">
            <div className="contact-page__hero-grid">
              <div className="contact-page__hero-copy px-4 text-center md:px-0 md:text-left">
                <p className="contact-page__tag">YOUR JOURNEY STARTS HERE</p>
                <h1 className="contact-page__hero-title">
                 Get In Touch
                
                
                </h1>

                <p className="contact-page__hero-text">

                  Reach out today and let Arelia's design experts guide you through a seamless
                  , transparent, and inspiring interior design journey  from first enquiry to final handover.
                </p>
              </div>

              <div className="contact-page__hero-form-shell">
                <ConsultationForm
                  mode="page"
                  title=""
                  description=""
                  submitLabel="CONNECT WITH US"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="contact-page__studio-section">
        <div className="contact-page__section-inner">
          <motion.div
            className="contact-page__studio-grid"
            initial={{ opacity: 0, y: 48 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="contact-page__details contact-page__glass-card">
              <div className="contact-page__panel-ambient contact-page__panel-ambient--one" />
              <div className="contact-page__panel-ambient contact-page__panel-ambient--two" />
              <div className="contact-page__panel-sheen" />
              <p className="contact-page__label">FIND US HERE</p>
              <h2 className="contact-page__map-title">Our Studio Doors Are Always Open</h2>
              <p className="contact-page__map-description">
                Visit our Kondapur studio to explore ideas, materials, and possibilities for your space.
              </p>

              <div className="contact-page__detail-stack">
                <div className="contact-page__detail-block">
                  <p className="contact-page__label">DIRECT LINE</p>
                  <a className="contact-page__contact-link" href="tel:+917207845556">+91 72078 45556 <span aria-hidden="true">↗</span></a>
                </div>

                <div className="contact-page__detail-block">
                  <p className="contact-page__label">EMAIL</p>
                  <a className="contact-page__contact-link" href="mailto:info@areliaspace.com">info@areliaspace.com <span aria-hidden="true">↗</span></a>
                </div>

                <div className="contact-page__detail-block">
                  <p className="contact-page__label">ADDRESS</p>
                  <address id="address" className="contact-page__address">
                    Unit No 1204, Forest Department, Asian Sun City, Block B, Kondapur
                    <br />
                    Hyderabad, Telangana 500084
                  </address>
                </div>
              </div>
            </div>

            <div id="studio-location" ref={locationRef} className="contact-page__map-shell contact-page__glass-card">
              <div className="contact-page__panel-ambient contact-page__panel-ambient--one" />
              <div className="contact-page__panel-ambient contact-page__panel-ambient--two" />
              <div className="contact-page__panel-sheen" />
              <div className="contact-page__map-ambient contact-page__map-ambient--one" />
              <div className="contact-page__map-ambient contact-page__map-ambient--two" />
              <div className="contact-page__map-shell-head">
                <div>
                  <p className="contact-page__label">LOCATION</p>
                  <h2 className="contact-page__map-title">Visit The Studio</h2>
                </div>
                <a
                  href={mapsExternalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="contact-page__map-icon-link"
                  aria-label="Open location in Google Maps"
                >
                  <span className="contact-page__map-icon-glow" aria-hidden="true" />
                  <span className="contact-page__map-icon-shell">
                    <MapPinIcon />
                  </span>
                  <span>Get directions</span>
                </a>
              </div>

              <div className="contact-page__map-container">
                <iframe
                  src={mapUrl}
                  className="contact-page__map-frame"
                  width="100%"
                  height="460"
                  style={{ border: 0 }}
                  loading="lazy"
                  title="Arelia Space location"
                />
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  )
}

export default ContactUsPage
