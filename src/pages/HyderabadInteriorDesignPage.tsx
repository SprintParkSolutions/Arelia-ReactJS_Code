import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Link } from 'react-router-dom'
import './HyderabadInteriorDesignPage.css'

type HyderabadInteriorDesignPageProps = {
  onOpenConsultation: () => void
}

const services = [
  { title: 'Residential interiors for apartments, villas, and homes', image: '/images/Hyderabad/hyderabad-residential-v1.webp' },
  { title: 'Commercial interiors for offices, retail, and workspaces', image: '/images/Service%20Page/commercial/services-commercial-01.jpg' },
  { title: 'Hospitality interiors for hotels, restaurants, and lounges', image: '/images/AboutUs%20Page/Maison%20Arelia%20Suite.avif' },
  { title: 'End-to-end interior execution from design through handover', image: '/images/Hyderabad/interior-execution-concept-v1.webp' },
] as const

const process = [
  ['01', 'Design clarity', 'Start with your needs, style, layout, and a considered design direction.'],
  ['02', 'Budget visibility', 'Review structured estimates and material choices with clear context.'],
  ['03', 'Digital progress', 'Follow approvals, updates, milestones, and project communication in one place.'],
  ['04', 'Delivered with care', 'Coordinate execution through to a refined, ready-to-use space.'],
] as const

const planningQuestions = [
  { category: 'BUDGET & SCOPE', question: 'What affects the cost of interior design?', answer: <>The scope of work, property size, material finishes, custom furniture and site condition all affect the budget. Share your floor plan and requirements with our team so the estimate can reflect your space.</> },
  { category: 'YOUR SPACE', question: 'Can I discuss an apartment, villa or office project?', answer: <>Arelia Space offers residential, commercial and hospitality interior design in Hyderabad. <Link to="/services">Explore our interior design services</Link> and discuss the design and execution support your project needs.</> },
  { category: 'PROJECT TIMELINE', question: 'How long will an interior project take?', answer: <>The timeline depends on design approvals, the scope of work, material availability and site readiness. Discuss these details during your consultation so the team can plan the project stages with you.</> },
  { category: 'GETTING STARTED', question: 'What should I bring to a consultation?', answer: <>Bring your floor plan, site photos, preferred styles, budget expectations and target move-in date. Let us know whether you need a full interior project or help with specific spaces.</> },
  { category: 'VISIT OUR STUDIO', question: 'Where is the Arelia Space studio?', answer: <>Our studio is at Unit No. 1204, Asian Sun City, Block B, Kondapur, Hyderabad 500084. <Link to="/contact-us">Contact our team for directions and to arrange a visit</Link>.</> },
] as const

export function HyderabadInteriorDesignPage({
  onOpenConsultation,
}: HyderabadInteriorDesignPageProps) {
  const [activeService, setActiveService] = useState(0)
  const [activeQuestion, setActiveQuestion] = useState<number | null>(0)
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    const interval = window.setInterval(() => setActiveService((current) => (current + 1) % services.length), 3600)
    return () => window.clearInterval(interval)
  }, [])

  return (
    <main className="hyderabad-page">
      <section className="hyderabad-page__hero">
        <motion.img
          className="hyderabad-page__hero-image"
          src="/images/Hyderabad/hyderabad-living-concept-v2.webp"
          alt="Interior design concept: a warm apartment living room with walnut joinery and natural stone finishes"
          fetchPriority="high"
          initial={{ scale: 1.08, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.35, ease: [0.22, 1, 0.36, 1] }}
        />
        <motion.div
          className="hyderabad-page__shell"
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="hyderabad-page__eyebrow">ARELIA SPACE • KONDAPUR, HYDERABAD</p>
          <h1>Premium Interior Designers in Hyderabad</h1>
          <p className="hyderabad-page__lead">
            Arelia Space creates residential, commercial, and hospitality interiors
            with transparent budgeting, digital project tracking, and end-to-end execution.
          </p>
          <button type="button" className="hyderabad-page__button" onClick={onOpenConsultation}>
            Book a consultation
          </button>
        </motion.div>
      </section>

      <section className="hyderabad-page__shell hyderabad-page__intro" aria-labelledby="hyderabad-services-title">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="hyderabad-page__eyebrow">OUR SERVICES</p>
          <h2 id="hyderabad-services-title">
            <span>Interior design shaped</span>
            <span>around your space.</span>
          </h2>
        </motion.div>
        <motion.ul
          initial={{ opacity: 0, x: 26 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.65, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
        >
          {services.map((service, index) => (
            <li key={service.title}>
              <button type="button" className={index === activeService ? 'is-active' : ''} onMouseEnter={() => setActiveService(index)} onFocus={() => setActiveService(index)} onClick={() => setActiveService(index)}>
                {service.title}
              </button>
            </li>
          ))}
        </motion.ul>
        <motion.figure
          className="hyderabad-page__image-pair"
          initial={{ opacity: 0, y: 34 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.img
            key={services[activeService].image}
            src={services[activeService].image}
            alt={`Illustrative service visual: ${services[activeService].title}`}
            loading="lazy"
            initial={{ opacity: 0, scale: 1.035 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          />
        </motion.figure>
      </section>

      <section className="hyderabad-page__process" aria-labelledby="hyderabad-process-title">
        <div className="hyderabad-page__shell">
          <motion.div
            className="hyderabad-page__process-intro"
            initial={{ opacity: 0, x: -36 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="hyderabad-page__eyebrow">THE ARELIA APPROACH</p>
            <h2 id="hyderabad-process-title">
              <span>Clarity in design.</span>
              <span>Confidence in delivery.</span>
            </h2>
          </motion.div>
          <div className="hyderabad-page__process-grid">
            {process.map(([number, title, description], index) => (
              <motion.article
                key={number}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                whileHover={{ x: 10 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.55, delay: index * 0.09, ease: [0.22, 1, 0.36, 1] }}
              >
                <span>{number}</span>
                <h3>{title}</h3>
                <p>{description}</p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section className="hyderabad-page__shell hyderabad-page__local" aria-labelledby="hyderabad-local-title">
        <motion.div className="hyderabad-page__local-intro"
          initial={{ opacity: 0, x: -26 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="hyderabad-page__eyebrow">VISIT THE ARELIA STUDIO</p>
          <h2 id="hyderabad-local-title">Bring your ideas.<br /><em>Let’s shape your space.</em></h2>
          <p>
            Bring your plans, inspiration, and questions. Our Hyderabad team can help
            you shape a clear direction for your residential, commercial, or hospitality space.
          </p>
        <div className="hyderabad-page__studio-card">
          <p className="hyderabad-page__studio-card-label">Arelia Space Hyderabad</p>
          <address>
            Unit No. 1204, Asian Sun City, Block B<br />
            Kondapur, Hyderabad 500084
          </address>
          <p className="hyderabad-page__studio-card-note">
            Studio visits and project consultations are arranged in advance.
          </p>
          <div className="hyderabad-page__studio-actions">
            <button type="button" className="hyderabad-page__faq-cta" onClick={onOpenConsultation}>Plan your studio visit <span aria-hidden="true">↗</span></button>
            <Link to="/contact-us" className="hyderabad-page__faq-cta hyderabad-page__faq-cta--outline">View location <span aria-hidden="true">→</span></Link>
          </div>
        </div>
        </motion.div>
        <motion.figure className="hyderabad-page__studio-visual"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: reduceMotion ? 0 : 0.7 }}
        >
          <img src="/images/Hyderabad/studio-consultation-concept-v2.webp" alt="Illustrative consultation setting with apartment plans, wood finishes, stone and fabric samples" width="1200" height="800" loading="lazy" />
          <figcaption><span>PLANS. MATERIALS. POSSIBILITIES.</span><span>Consultation concept</span></figcaption>
        </motion.figure>
      </section>
      <section className="hyderabad-page__faq" aria-labelledby="hyderabad-faq-title">
        <div className="hyderabad-page__faq-layout">
          <motion.div className="hyderabad-page__faq-intro"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: reduceMotion ? 0 : 0.6 }}
          >
            <p className="hyderabad-page__eyebrow"><span aria-hidden="true" /> THE FINER DETAILS</p>
            <h2 id="hyderabad-faq-title">Your questions,<br /><em>answered.</em></h2>
            <p className="hyderabad-page__faq-description">A clearer picture of your interior design journey in Hyderabad. Explore the details, then let’s talk about your space.</p>
            <div className="hyderabad-page__faq-actions">
              <button type="button" className="hyderabad-page__faq-cta" onClick={onOpenConsultation}>Book a consultation <span aria-hidden="true">↗</span></button>
              <Link to="/contact-us" className="hyderabad-page__faq-cta hyderabad-page__faq-cta--outline">Contact our studio <span aria-hidden="true">→</span></Link>
            </div>
            <p className="hyderabad-page__faq-personal">Have something else in mind?<br /><a href="tel:+917207845556">Speak with us: +91 72078 45556</a></p>
          </motion.div>
          <div className="hyderabad-page__faq-panel">
            <div className="hyderabad-page__faq-panel-heading"><span>PLANNING YOUR INTERIORS</span><span>05 QUESTIONS</span></div>
            {planningQuestions.map((item, index) => {
              const isOpen = activeQuestion === index
              return (
              <motion.article key={item.question} className={`hyderabad-page__faq-item${isOpen ? ' is-open' : ''}`}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: reduceMotion ? 0 : 0.5, delay: reduceMotion ? 0 : index * 0.065 }}
              >
                <h3 className="hyderabad-page__faq-question-heading">
                <button type="button" className="hyderabad-page__faq-trigger"
                  id={`hyderabad-question-${index}`}
                  aria-expanded={isOpen}
                  aria-controls={`hyderabad-answer-${index}`}
                  onClick={() => setActiveQuestion(isOpen ? null : index)}
                >
                  <span className="hyderabad-page__faq-number" aria-hidden="true">0{index + 1}</span>
                  <span className="hyderabad-page__faq-question">{item.question}</span>
                  <span className="hyderabad-page__faq-toggle" aria-hidden="true" />
                </button>
                </h3>
                <motion.div id={`hyderabad-answer-${index}`} role="region"
                  aria-labelledby={`hyderabad-question-${index}`} aria-hidden={!isOpen} inert={!isOpen}
                  className="hyderabad-page__faq-answer-wrap"
                  initial={false}
                  animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }}
                  transition={{ duration: reduceMotion ? 0 : 0.38, ease: [0.22, 1, 0.36, 1] }}
                ><div className="hyderabad-page__faq-answer"><p>{item.answer}</p></div></motion.div>
              </motion.article>
            )})}
          </div>
        </div>
      </section>
    </main>
  )
}
