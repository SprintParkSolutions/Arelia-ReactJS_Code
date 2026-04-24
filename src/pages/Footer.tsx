import { Link } from 'react-router-dom'
import { useEffect, useRef } from 'react'
import './Footer.css'

const services = [
  'Commercial Interiors',
  'Residential Interiors',
  'Hospitality Interior Spaces',
]

export function Footer() {
  const footerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const footer = footerRef.current
    if (!footer) return

    // Subtle parallax effect on scroll
    const handleScroll = () => {
      const scrollY = window.scrollY
      const footerTop = footer.offsetTop

      if (scrollY > footerTop - window.innerHeight) {
        const parallaxValue = (scrollY - (footerTop - window.innerHeight)) * 0.015
        footer.style.setProperty('--parallax-offset', `${parallaxValue}px`)
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  return (
    <footer className="site-footer" ref={footerRef}>
      <div className="site-footer__glass-container">
        {/* Multiple glass layers for depth */}
        <div className="site-footer__glass-layer site-footer__glass-layer--1" />
        <div className="site-footer__glass-layer site-footer__glass-layer--2" />
        <div className="site-footer__glass-layer site-footer__glass-layer--3" />

        {/* Floating light reflections */}
        <div className="site-footer__light-reflection site-footer__light-reflection--1" />
        <div className="site-footer__light-reflection site-footer__light-reflection--2" />
        <div className="site-footer__light-reflection site-footer__light-reflection--3" />

        {/* Animated gradient streaks */}
        <div className="site-footer__gradient-streak site-footer__gradient-streak--1" />
        <div className="site-footer__gradient-streak site-footer__gradient-streak--2" />

        {/* Cursor interaction ripple */}
        <div className="site-footer__cursor-ripple" />

        {/* Refraction edge effect */}
        <div className="site-footer__refraction-edge" />
      </div>

      <div className="site-footer__inner">
        <div className="site-footer__grid">
          <div className="site-footer__brand">
            <img
              src="/images/Logos/Arelia_Logo.png"
              alt="Arelia"
              className="site-footer__logo"
            />
            <p className="site-footer__copy">
              Arelia Space creates refined interior experiences with clarity, detail,
              and execution built into every stage.
            </p>
          </div>

          <div className="site-footer__column">
            <h3 className="site-footer__title">Navigation</h3>
            <div className="site-footer__links">
              <Link to="/" className="site-footer__link">Home</Link>
              <Link to="/about-us" className="site-footer__link">About Us</Link>
              <Link to="/services" className="site-footer__link">Services</Link>
              <Link to="/contact-us" className="site-footer__link">Contact Us</Link>
            </div>
          </div>

          <div className="site-footer__column">
            <h3 className="site-footer__title">Services</h3>
            <div className="site-footer__links">
              {services.map((service) => (
                <span key={service} className="site-footer__link">{service}</span>
              ))}
            </div>
          </div>

          <div className="site-footer__column">
            <h3 className="site-footer__title">Contact</h3>
            <div className="site-footer__links">
              <a href="tel:+917207845556" className="site-footer__link site-footer__link--interactive">+91 72078 45556</a>
              <a href="mailto:info@areliaspace.com" className="site-footer__link site-footer__link--interactive">info@areliaspace.com</a>
              <span className="site-footer__link">
                Unit No 1204, Forest Department,
                <br />
                Asian Sun City, Block B, Kondapur,
                <br />
                Hyderabad 500084
              </span>
            </div>
          </div>
        </div>

        <div className="site-footer__bottom">
          <p>&copy; 2026 Arelia</p>
          <div className="site-footer__bottom-links">
            <span className="site-footer__bottom-link">Privacy Policy</span>
            <span className="site-footer__bottom-link">Terms of Service</span>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
