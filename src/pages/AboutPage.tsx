import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import type { Variants } from 'framer-motion'
import './AboutPage.css'

const ABOUT_US_IMAGES_PATH = '/images/AboutUs%20Page'
const aboutUsImagePath = (fileName: string) => `${ABOUT_US_IMAGES_PATH}/${fileName}`

const bathRetreatImage = aboutUsImagePath('Bath Retreat.avif')
const bedroomImage = aboutUsImagePath('Bedroom.avif')
const livingSpaceImage = aboutUsImagePath('Living Space.jpg')
const officeSpaceImage = aboutUsImagePath('Office Space.avif')
const obsidianResidenceImage = aboutUsImagePath('The Obsidian Residence.avif')
const velourExecutiveSuitesImage = aboutUsImagePath('Velour Executive Suites.avif')
const maisonAreliaSuiteImage = aboutUsImagePath('Maison Arelia Suite.avif')
const terraceGardenImage = aboutUsImagePath('The Terrace Garden.avif')
const noirAtelierFlagshipImage = aboutUsImagePath('Noir Atelier Flagship.jpg')
const registrationImage = aboutUsImagePath('Registration.jpg')
const leadGenerationImage = aboutUsImagePath('lead-generation.jpg')
const siteVisitImage = aboutUsImagePath('Site Visit.jpg')
const feasibilityImage = aboutUsImagePath('Feasibility.avif')
const proposalImage = aboutUsImagePath('Proposal.avif')
const approvalImage = aboutUsImagePath('Approval.avif')
const executionImage = aboutUsImagePath('Execution.avif')
const qualityAuditImage = aboutUsImagePath('Quality Audit.jpg')

const heroSlides = [
  {
    label: 'Bath Retreat',
    image: bathRetreatImage,
  },
  {
    label: 'Bedroom',
    image: bedroomImage,
  },
  {
    label: 'Living Space',
    image: livingSpaceImage,
  },
  {
    label: 'Office Space',
    image: officeSpaceImage,
  },
]

const studioStats = [
  { value: '320+', label: 'Projects delivered' },
  { value: '14', label: 'Years of expertise' },
  { value: '98%', label: 'Client satisfaction' },
  
]

const designCards = [
  {
    tag: 'Residential',
    title: 'The Obsidian Residence',
    location: 'New Delhi - 2024',
    description:
      'A 4,200 sq ft urban sanctuary fusing raw concrete with curated warmth, where every surface becomes a conversation between texture and light.',
    image: obsidianResidenceImage,
    features: ['Textured Plaster Walls', 'Custom Millwork', 'Bespoke Lighting'],
  },
  {
    tag: 'Commercial',
    title: 'Velour Executive Suites',
    location: 'Mumbai - 2024',
    description:
      'A workspace sculpted in warm walnut and smoked stone for authority without coldness.',
    image: velourExecutiveSuitesImage,
  },
  {
    tag: 'Hospitality',
    title: 'Maison Arelia Suite',
    location: 'Hyderabad - 2023',
    description:
      'Five-star hospitality rooted in regional craft and softened by intimate contrast.',
    image: maisonAreliaSuiteImage,
  },
  {
    tag: 'Landscape',
    title: 'The Terrace Garden',
    location: 'Bangalore - 2024',
    description:
      'An elevated outdoor living room layered with native botanicals, terrazzo, and ambient lighting.',
    image: terraceGardenImage,
    features: ['Native Planting', 'Terrazzo Floors', 'Ambient Lighting'],
  },
  {
    tag: 'Retail',
    title: 'Noir Atelier Flagship',
    location: 'Pune - 2023',
    description:
      'A luxury retail stage where product becomes architecture under a curated dramatic glow.',
    image: noirAtelierFlagshipImage,
    features: ['Drama Lighting', 'Custom Display', 'Black Mirror Surfaces'],
  },
]

const processSteps = [
  {
    number: '01',
    title: 'Registration',
    description: 'Initial formal onboarding into the Arelia ecosystem.',
    image: registrationImage,
  },
  {
    number: '02',
    title: 'Lead Creation',
    description: 'Systematic logging of project parameters and vision.',
    image: leadGenerationImage,
  },
  {
    number: '03',
    title: 'Site Visit',
    description: 'Physical audit of the architectural canvas.',
    image: siteVisitImage,
  },
  {
    number: '04',
    title: 'Feasibility',
    description: 'Technical validation of design possibilities.',
    image: feasibilityImage,
  },
  {
    number: '05',
    title: 'Proposal',
    description: 'Conceptual presentation and creative pitch.',
    image: proposalImage,
  },
  {
    number: '06',
    title: 'Approval',
    description: 'Finalising the blueprint of collaboration.',
    image: approvalImage,
  },
  {
    number: '07',
    title: 'Execution',
    description: 'The transformation phase begins on-site.',
    image: executionImage,
  },
  {
    number: '08',
    title: 'Quality Audit',
    description: 'Rigorous inspection of material finishing.',
    image: qualityAuditImage,
  },
]

const testimonials = [
  {
    name: 'Anjali K.',
    initial: 'A',
    text:
      'Arelia Space transformed our home beyond expectations. Their attention to detail and design expertise made the entire process seamless. Highly recommend.',
  },
  {
    name: 'Hari Kumar S.',
    initial: 'H',
    text:
      'We are thrilled with our new office space. Arelia combined functionality with style in a way that truly reflects our brand’s luxury identity.',
  },
  {
    name: 'Meera L.',
    initial: 'M',
    text:
      'Exceptional service and impeccable design. Arelia turned our abstract ideas into a space that is both visually elegant and profoundly practical.',
  },
]

const marqueeWords = [
  'Residential',
  'Commercial',
  'Hospitality',
  'Landscape',
  'Retail',
  'Bespoke',
  'Editorial',
  'Luxury',
  'Spatial Design',
  'Arelia',
]

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 36 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.9, ease: 'easeOut' },
  },
}

const stagger: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
    },
  },
}

type AboutPageProps = {
  onOpenConsultation: () => void
}

export function AboutPage({ onOpenConsultation }: AboutPageProps) {
  const [activeSlide, setActiveSlide] = useState(0)

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % heroSlides.length)
    }, 4200)

    return () => window.clearInterval(interval)
  }, [])

  const marqueeTrack = [...marqueeWords, ...marqueeWords]

  return (
    <main className="about-page">
      <section className="about-hero">
        <div className="about-hero__texture" aria-hidden="true" />
        <div className="about-hero__grid" aria-hidden="true" />
        <div className="about-shell about-hero__layout">
          <motion.div
            className="about-hero__copy"
            initial="hidden"
            animate="visible"
            variants={stagger}
          >
            <motion.p className="about-page__eyebrow" variants={fadeUp}>
              Studio Story
            </motion.p>
            <motion.h1 className="about-hero__title" variants={fadeUp}>
              About
              <span>Arelia</span>
            </motion.h1>
            <motion.p className="about-hero__lead" variants={fadeUp}>
              At Arelia Space, we don&apos;t merely design rooms, we curate atmospheric
              experiences. Founded on the principles of architectural rigor and editorial
              elegance, our platform bridges the gap between high-concept art and living
              functionality.
            </motion.p>
            <motion.p className="about-hero__subcopy" variants={fadeUp}>
              Our philosophy, &quot;The Texture of Light,&quot; is a dedication to how materials
              interact with natural and artificial ambiance to create mood, depth, and
              prestige.
            </motion.p>
            <motion.div className="about-hero__actions" variants={fadeUp}>
              <button type="button" className="about-button about-button--primary" onClick={onOpenConsultation}>
                Book Consultation
              </button>
              <a href="#philosophy" className="about-button about-button--secondary">
                Our Philosophy -&gt;
              </a>
            </motion.div>
            <motion.div className="about-hero__stats" variants={stagger}>
              {studioStats.map((item) => (
                <motion.article key={item.label} className="about-hero__stat" variants={fadeUp}>
                  <p>{item.value}</p>
                  <span>{item.label}</span>
                </motion.article>
              ))}
            </motion.div>
          </motion.div>

          <motion.div
            className="about-hero__visual"
            initial={{ opacity: 0, scale: 0.96, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 1.1, ease: 'easeOut', delay: 0.2 }}
          >
            <motion.div
              className="about-hero__halo"
              animate={{ rotate: 360 }}
              transition={{ duration: 40, repeat: Number.POSITIVE_INFINITY, ease: 'linear' }}
            />
            <div className="about-hero__collage">
              <motion.article
                key={heroSlides[activeSlide].image}
                className="about-hero__card about-hero__card--main"
                initial={{ opacity: 0.55, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.7, ease: 'easeOut' }}
              >
                <motion.img
                  src={heroSlides[activeSlide].image}
                  alt={heroSlides[activeSlide].label}
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 6, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
                />
                <span>{heroSlides[activeSlide].label}</span>
              </motion.article>
              {heroSlides.slice(1).map((slide, index) => (
                <motion.article
                  key={slide.label}
                  className={`about-hero__card about-hero__card--side about-hero__card--${index + 1}`}
                  animate={{ y: [0, -8, 0] }}
                  transition={{
                    duration: 5 + index,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: 'easeInOut',
                    delay: index * 0.5,
                  }}
                >
                  <img src={slide.image} alt={slide.label} />
                  <span>{slide.label}</span>
                </motion.article>
              ))}
            </div>
            <div className="about-hero__dots" aria-label="Hero slide indicators">
              {heroSlides.map((slide, index) => (
                <button
                  key={slide.label}
                  type="button"
                  className={index === activeSlide ? 'is-active' : ''}
                  onClick={() => setActiveSlide(index)}
                />
              ))}
            </div>
          </motion.div>
        </div>
        <motion.div
          className="about-hero__scroll"
          animate={{ opacity: [0.3, 0.9, 0.3], y: [0, 8, 0] }}
          transition={{ duration: 2.8, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
        >
          <span>Scroll</span>
          <i />
        </motion.div>
      </section>

      <section className="about-marquee">
        <div className="about-marquee__track">
          {marqueeTrack.map((word, index) => (
            <span key={`${word}-${index}`}>
              {word}
              <i>*</i>
            </span>
          ))}
        </div>
      </section>

      <section className="about-section" id="philosophy">
        <div className="about-shell">
          <div className="about-section__head about-section__head--split">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.25 }}
              variants={fadeUp}
            >
              <p className="about-page__eyebrow">Our Design Work</p>
              <h2 className="about-section__title">
                Signature <span>Spaces</span>
              </h2>
            </motion.div>
            <motion.p
              className="about-section__intro"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.25 }}
              variants={fadeUp}
            >
              Each project is a bespoke narrative, shaped by the client&apos;s soul, refined by
              our editorial sensibility, and built to endure.
            </motion.p>
          </div>

          <motion.div
            className="about-design"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.18 }}
            variants={stagger}
          >
            <motion.article className="about-design__card about-design__card--featured" variants={fadeUp}>
              <div className="about-design__image-wrap">
                <motion.img
                  src={designCards[0].image}
                  alt={designCards[0].title}
                  whileHover={{ scale: 1.04 }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              </div>
              <div className="about-design__body">
                <span className="about-design__tag">{designCards[0].tag}</span>
                <div className="about-design__header">
                  <div>
                    <h3>{designCards[0].title}</h3>
                    <p>{designCards[0].location}</p>
                  </div>
                  <b>-&gt;</b>
                </div>
                <div className="about-design__body-copy">
                  <span>{designCards[0].description}</span>
                  <div className="about-design__chips">
                    {designCards[0].features?.map((feature) => <i key={feature}>{feature}</i>)}
                  </div>
                </div>
              </div>
            </motion.article>

            <div className="about-design__stack">
              {designCards.slice(1, 3).map((card) => (
                <motion.article key={card.title} className="about-design__card" variants={fadeUp}>
                  <div className="about-design__image-wrap about-design__image-wrap--stack">
                    <motion.img
                      src={card.image}
                      alt={card.title}
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                    />
                  </div>
                  <div className="about-design__body">
                    <span className="about-design__tag">{card.tag}</span>
                    <div className="about-design__header">
                      <div>
                        <h3>{card.title}</h3>
                        <p>{card.location}</p>
                      </div>
                      <b>-&gt;</b>
                    </div>
                    <span className="about-design__caption">{card.description}</span>
                  </div>
                </motion.article>
              ))}
            </div>

            <div className="about-design__bottom">
              {designCards.slice(3).map((card) => (
                <motion.article
                  key={card.title}
                  className="about-design__card about-design__card--wide"
                  variants={fadeUp}
                >
                  <div className="about-design__image-wrap about-design__image-wrap--wide">
                    <motion.img
                      src={card.image}
                      alt={card.title}
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                    />
                  </div>
                  <div className="about-design__body">
                    <span className="about-design__tag">{card.tag}</span>
                    <div className="about-design__header">
                      <div>
                        <h3>{card.title}</h3>
                        <p>{card.location}</p>
                      </div>
                      <b>-&gt;</b>
                    </div>
                    <span className="about-design__caption">{card.description}</span>
                    <div className="about-design__chips">
                      {card.features?.map((feature) => <i key={feature}>{feature}</i>)}
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          </motion.div>

          <motion.div
            className="about-section__action"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.35 }}
            variants={fadeUp}
          >
            <a href="/services" className="about-button about-button--secondary">
              View All Projects -&gt;
            </a>
          </motion.div>
        </div>
      </section>

      <section className="about-section about-section--process">
        <div className="about-shell">
          <motion.div
            className="about-section__head about-section__head--center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeUp}
          >
            <p className="about-page__eyebrow">The Process</p>
            <h2 className="about-section__title">
              Arelia Process / <span>How it works?</span>
            </h2>
          </motion.div>

          <motion.div
            className="about-process"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.16 }}
            variants={stagger}
          >
            <div className="about-process__curve about-process__curve--top" aria-hidden="true" />
            <div className="about-process__curve about-process__curve--bottom" aria-hidden="true" />
            {processSteps.map((step, index) => (
              <motion.article
                key={step.number}
                className={`about-process__step${index > 3 ? ' is-lower' : ''}`}
                variants={fadeUp}
              >
                <div className="about-process__image">
                  <motion.img
                    src={step.image}
                    alt={step.title}
                    whileHover={{ scale: 1.04 }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                  />
                </div>
                <div className="about-process__chip">{step.number}</div>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </motion.article>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="about-section about-section--testimonials">
        <div className="about-shell">
          <motion.div
            className="about-section__head"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeUp}
          >
            <p className="about-page__eyebrow">Testimonials</p>
            <h2 className="about-section__title">
              Clients&apos; <span>Words</span>
            </h2>
          </motion.div>

          <motion.div
            className="about-testimonials"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={stagger}
          >
            {testimonials.map((testimonial, index) => (
              <motion.article
                key={testimonial.name}
                className="about-testimonial"
                variants={fadeUp}
                whileHover={{ y: -8, borderColor: 'rgba(202, 162, 58, 0.35)' }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
              >
                <motion.span
                  className="about-testimonial__quote"
                  animate={{ opacity: [0.2, 0.5, 0.2] }}
                  transition={{
                    duration: 3.6,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: 'easeInOut',
                    delay: index * 0.3,
                  }}
                >
                  &quot;
                </motion.span>
                <div className="about-testimonial__stars">*****</div>
                <p>&quot; {testimonial.text} &quot;</p>
                <footer>
                  <span>{testimonial.initial}</span>
                  <small>- {testimonial.name}</small>
                </footer>
              </motion.article>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="about-section about-section--cta">
        <div className="about-shell">
          <motion.div
            className="about-cta"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeUp}
          >
            <p className="about-page__eyebrow">Begin Your Journey</p>
            <h2 className="about-section__title">
              Let&apos;s craft your
              <span> perfect space</span>
            </h2>
            <p className="about-section__intro about-section__intro--center">
              Every great space starts with a single conversation. Book your consultation and
              let us shape an environment that feels distinctively yours.
            </p>
            <div className="about-cta__actions">
              <button type="button" className="about-button about-button--primary" onClick={onOpenConsultation}>
                Book a Consultation
              </button>
              <a href="/projects" className="about-button about-button--secondary">
                View Our Portfolio
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  )
}
