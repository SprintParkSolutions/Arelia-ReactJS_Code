import { Link } from 'react-router-dom'
import './Footer.css'

const services = [
  'Commercial Interior Design',
  'Residential Interior Design',
  'Hospitality Spaces',
  'Retail Interiors',
]

export function Footer() {
  return (
    <footer className="site-footer">
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

          <div>
            <h3 className="site-footer__title">Navigation</h3>
            <div className="site-footer__links">
              <Link to="/">Home</Link>
              <Link to="/about-us">About Us</Link>
              <Link to="/services">Services</Link>
              <Link to="/contact-us">Contact Us</Link>
            </div>
          </div>

          <div>
            <h3 className="site-footer__title">Services</h3>
            <div className="site-footer__links">
              {services.map((service) => (
                <span key={service}>{service}</span>
              ))}
            </div>
          </div>

          <div>
            <h3 className="site-footer__title">Contact</h3>
            <div className="site-footer__links">
              <a href="tel:+917207845556">+91 72078 45556</a>
              <a href="mailto:info@areliaspace.com">info@areliaspace.com</a>
              <span>
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
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
