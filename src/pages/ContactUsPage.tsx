import { motion } from 'framer-motion'
import { ConsultationForm } from '../components/consultation/ConsultationForm'
import './ContactUsPage.css'

const heroImagePath = '/images/ReachUs%20Page/ContactUs.png'
const exactAddress =
  'Unit No 1204, Forest Department, Asian Sun City, Block B, Kondapur, Hyderabad, Telangana 500084'
const encodedAddress = encodeURIComponent(exactAddress)
const mapUrl = `https://www.google.com/maps?q=${encodedAddress}&output=embed`
const mapsExternalUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`

export function ContactUsPage() {
  return (
    <main className="contact-page">
      <section className="contact-page__hero-shell">
        <div
          className="contact-page__hero"
          style={{ backgroundImage: `url(${heroImagePath})` }}
        >
          <div className="contact-page__hero-overlay" />

          <div className="contact-page__hero-content">
            <p className="contact-page__tag">INQUIRY &amp; COLLABORATION</p>
            <h1 className="contact-page__hero-title">
              Get In <span>Touch</span>
            </h1>
            <p className="contact-page__hero-text">
              We&apos;d love to hear from you. Whether you have a question or want to
              collaborate, our team is ready to help.
            </p>
          </div>
        </div>
      </section>

      <section className="contact-page__contact-section">
        <div className="contact-page__section-inner">
          <div className="contact-page__contact-grid">
            <div className="contact-page__details contact-page__glass-card">
              <div className="contact-page__detail-block">
                <p className="contact-page__label">DIRECT LINE</p>
                <h2>+91 72078 45556</h2>
              </div>

              <div className="contact-page__detail-block">
                <p className="contact-page__label">EMAIL</p>
                <h2>info@areliaspace.com</h2>
              </div>

              <div className="contact-page__detail-block">
                <p className="contact-page__label">ADDRESS</p>
                <h2 id="address">
                  Unit No 1204, Forest Department, Asian Sun City, Block B, Kondapur
                  <br />
                  Hyderabad, Telangana 500084
                </h2>
              </div>
            </div>

            <ConsultationForm
              mode="page"
              title="Book your consultation"
              description="Use the same quick enquiry flow here to share your details before we map the right conversation for your project."
              submitLabel="Submit Enquiry"
            />
          </div>
        </div>
      </section>

      <section className="contact-page__map-section">
        <div className="contact-page__section-inner">
          <motion.div
            className="contact-page__map-grid"
            initial={{ opacity: 0, y: 48 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="contact-page__map-info-card">
              <p className="contact-page__label">LOCATION</p>
              <h2 className="contact-page__map-title">Visit The Studio</h2>
              <p className="contact-page__map-description">
                Find us in Kondapur for consultations, walkthroughs, and project planning.
              </p>
              <div className="contact-page__map-meta">
                <span>Hyderabad</span>
                <span>Mon-Fri, 10 AM - 9 PM</span>
              </div>
              <a
                href={mapsExternalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="contact-page__map-studio-card"
              >
                <p className="contact-page__map-address-label">Arelia Space</p>
                <p className="contact-page__map-address-text">
                  Unit No 1204, Forest Department, Asian Sun City, Block B, Kondapur
                  <br />
                  Hyderabad, Telangana 500084
                </p>
              </a>
              <div className="contact-page__map-actions">
                <a
                  href={mapsExternalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="contact-page__map-link"
                >
                  Open in Maps
                </a>
              </div>
            </div>

            <div className="contact-page__map-card">
              <div className="contact-page__map-ambient contact-page__map-ambient--one" />
              <div className="contact-page__map-ambient contact-page__map-ambient--two" />
              <div className="contact-page__map-container">
                <a
                  href={mapsExternalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="contact-page__map-address-card"
                >
                  <p className="contact-page__map-address-label">Pinned Location</p>
                  <p className="contact-page__map-address-text">
                    Unit No 1204, Asian Sun City, Block B, Kondapur
                  </p>
                </a>
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
