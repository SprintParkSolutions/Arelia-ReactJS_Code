import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowIcon } from '../components/ArrowIcon'
import { ExploreLink } from '../components/ExploreLink'
import './HyderabadInteriorDesignPage.css'

type HyderabadInteriorDesignPageProps = {
  onOpenConsultation: () => void
}

const services = [
  { title: 'Residential interiors for Apartments, Villas, and Homes', image: '/images/Hyderabad/hyderabad-residential-v1.webp' },
  { title: 'Commercial interiors for Offices, Retail, and Workspaces', image: '/images/Service%20Page/commercial/services-commercial-01.jpg' },
  { title: 'Hospitality interiors for Hotels, Restaurants, and Lounges', image: '/images/AboutUs%20Page/Maison%20Arelia%20Suite.avif' },
  { title: 'End-to-end interior execution from design through handover', image: '/images/Hyderabad/interior-execution-concept-v1.webp' },
] as const

const process = [
  ['01', 'Design Clarity', 'Start with your needs, style, layout, and a considered design direction.'],
  ['02', 'Budget Visibility', 'Review structured estimates and material choices with clear context.'],
  ['03', 'Digital Progress', 'Follow approvals, weekly updates, milestones, and project communication with live tracking  in one place.'],
  ['04', 'Delivered with Care', 'Co-ordinate execution through to a refined, ready-to-use space.'],
] as const

const planningQuestions = [
  {
    category: 'WHY ARELIA',
    question: 'Why should I choose Arelia for interior design in Hyderabad?',
    answer: <>Arelia Space brings together personalised interior design, clear project processes, and online client communication. From your first site visit through 3D design approvals, budget reviews, payment terms, digital agreements, and execution, we keep you informed and involved in the decisions that shape your space.</>,
  },
  {
    category: 'THE ARELIA DIFFERENCE',
    question: 'What makes Arelia different from other interior design companies in Hyderabad?',
    answer: <>We combine premium and luxury interior design with a clear, organised project experience. You take part in key design approvals, budget reviews, payment terms, and project decisions through a structured digital process. Alongside project supervision and regular communication, this helps you stay informed from design to execution. <strong>Arelia Space — Premium &amp; Luxury Interior Designs.</strong></>,
  },
  {
    category: '3D DESIGN APPROVALS',
    question: 'How does Arelia ensure the final interior design matches my expectations?',
    answer: <>Arelia involves clients in important design decisions before execution. You can review 3D interior designs, provide feedback, request changes, and approve the design before the project progresses. This collaborative approval process helps reduce misunderstandings and ensures the final outcome is more closely aligned with your preferences.</>,
  },
  {
    category: 'COSTS & BUDGETS',
    question: 'How transparent is Arelia about interior design costs and budgets?',
    answer: <>We walk you through your project budget and give you the relevant cost details to review. This includes proforma invoices, payment terms, and any additional budget requirements, with your approval requested where applicable. Our review process helps you understand proposed costs, make informed decisions, and reduce unexpected expenses.</>,
  },
  {
    category: 'ONLINE PROJECT UPDATES',
    question: 'How can I track my interior design project and receive updates online?',
    answer: <>Arelia's online client portal helps you follow your project and stay connected with our team. Depending on your project stage, you can view site visit appointments, review and approve 3D designs, budgets, and proforma invoices, and access payment information and project notifications. It is a convenient way to keep track of updates and the decisions that need your attention.</>,
  },
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
            Arelia Space creates Residential, Commercial, and Hospitality interiors with
            transparency in Budgeting, Digital Project Tracking, and End-to-End execution.
          </p>
          <button type="button" className="hyderabad-page__button" onClick={onOpenConsultation}>
            <span>Book a consultation</span><ArrowIcon />
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
            you shape a clear direction for your Residential, Commercial, or Hospitality space.
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
          <div className="hyderabad-page__action-group hyderabad-page__studio-actions">
            <button type="button" className="hyderabad-page__faq-cta" onClick={onOpenConsultation}><span>Plan your studio visit</span><ArrowIcon /></button>
            <ExploreLink to="/contact-us#studio-location" label="View location" />
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
            <div className="hyderabad-page__action-group">
              <button type="button" className="hyderabad-page__faq-cta" onClick={onOpenConsultation}><span>Book a consultation</span><ArrowIcon /></button>
              <ExploreLink to="/contact-us#studio-location" label="Contact our studio" />
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
