import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import './HyderabadInteriorDesignPage.css'

type HyderabadInteriorDesignPageProps = {
  onOpenConsultation: () => void
}

const services = [
  { title: 'Residential interiors for apartments, villas, and homes', image: '/images/Hyderabad/hyderabad-residential-v1.webp' },
  { title: 'Commercial interiors for offices, retail, and workspaces', image: '/images/Service%20Page/commercial/services-commercial-01.jpg' },
  { title: 'Hospitality interiors for hotels, restaurants, and lounges', image: '/images/AboutUs%20Page/Maison%20Arelia%20Suite.avif' },
  { title: 'End-to-end interior execution from design through handover', image: '/images/Home%20Page/End-to-end-coordination.webp' },
] as const

const process = [
  ['01', 'Design clarity', 'Start with your needs, style, layout, and a considered design direction.'],
  ['02', 'Budget visibility', 'Review structured estimates and material choices with clear context.'],
  ['03', 'Digital progress', 'Follow approvals, updates, milestones, and project communication in one place.'],
  ['04', 'Delivered with care', 'Coordinate execution through to a refined, ready-to-use space.'],
] as const

export function HyderabadInteriorDesignPage({
  onOpenConsultation,
}: HyderabadInteriorDesignPageProps) {
  const [activeService, setActiveService] = useState(0)

  useEffect(() => {
    const previousTitle = document.title
    const description = document.querySelector('meta[name="description"]')
    const previousDescription = description?.getAttribute('content') ?? null

    document.title = 'Interior Designers in Hyderabad | Arelia Space'
    description?.setAttribute(
      'content',
      'Arelia Space delivers premium residential, commercial and hospitality interior design in Hyderabad, with transparent budgeting, digital project tracking and end-to-end execution.',
    )

    return () => {
      document.title = previousTitle
      if (previousDescription !== null) {
        description?.setAttribute('content', previousDescription)
      }
    }
  }, [])

  useEffect(() => {
    const interval = window.setInterval(() => setActiveService((current) => (current + 1) % services.length), 3600)
    return () => window.clearInterval(interval)
  }, [])

  return (
    <main className="hyderabad-page">
      <section className="hyderabad-page__hero">
        <motion.img
          className="hyderabad-page__hero-image"
          src="/images/Hyderabad/hyderabad-hero-v1.webp"
          alt="Bright, refined living room interior"
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
            alt={services[activeService].title}
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
          <h2 id="hyderabad-local-title">Begin your project with a conversation.</h2>
          <p>
            Bring your plans, inspiration, and questions. Our Hyderabad team can help
            you shape a clear direction for your residential, commercial, or hospitality space.
          </p>
        </motion.div>
        <motion.div className="hyderabad-page__studio-card"
          initial={{ opacity: 0, x: 26 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.65, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="hyderabad-page__studio-card-number">HYD / 01</span>
          <p className="hyderabad-page__studio-card-label">Arelia Space Hyderabad</p>
          <address>
            Unit No. 1204, Asian Sun City, Block B<br />
            Kondapur, Hyderabad 500084
          </address>
          <p className="hyderabad-page__studio-card-note">
            Studio visits and project consultations are arranged in advance.
          </p>
          <Link to="/contact-us" className="hyderabad-page__text-link">
          Plan your studio visit <span aria-hidden="true">-&gt;</span>
          </Link>
        </motion.div>
        <figure className="hyderabad-page__studio-visual" aria-hidden="true">
          <img src="/images/Hyderabad/hyderabad-studio-visit-v1.png" alt="" loading="lazy" />
        </figure>
      </section>
    </main>
  )
}
