import './SuccessScreen.css'

export function SuccessScreen() {
  return (
    <div className="success-screen">
      <div className="success-screen__top">
        <div className="success-screen__icon">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h2 className="success-screen__title">Thank you</h2>
        <p className="success-screen__subtitle">Your consultation request has been received</p>
      </div>

      <div className="success-screen__divider"></div>

      <div className="success-screen__what-next">
        <h3 className="success-screen__what-next-title">What Next?</h3>
        
        <div className="success-screen__steps">
          <div className="success-screen__step">
            <div className="success-screen__step-number">1</div>
            <div className="success-screen__step-content">
              <p className="success-screen__step-text">Check your email</p>
              <p className="success-screen__step-desc">We've sent confirmation details</p>
            </div>
          </div>

          <div className="success-screen__step">
            <div className="success-screen__step-number">2</div>
            <div className="success-screen__step-content">
              <p className="success-screen__step-text">Fill the form</p>
              <p className="success-screen__step-desc">Provide more project information</p>
            </div>
          </div>

          <div className="success-screen__step">
            <div className="success-screen__step-number">3</div>
            <div className="success-screen__step-content">
              <p className="success-screen__step-text">Our member will contact you soon</p>
              <p className="success-screen__step-desc">Within 24 hours on weekdays</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
