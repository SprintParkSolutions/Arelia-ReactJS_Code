import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import type { Variants } from 'framer-motion'
import './AboutPage.css'

const ABOUT_US_IMAGES_PATH = '/images/AboutUs%20Page'
const aboutUsImagePath = (fileName: string) => `${ABOUT_US_IMAGES_PATH}/${fileName}`

const bathRetreatImage = aboutUsImagePath('Bath Retreat.avif')
const bedroomImage = aboutUsImagePath('Bedroom.avif')
const livingSpaceImage = aboutUsImagePath('Living Space.jpg')
const obsidianResidenceImage = aboutUsImagePath('jason-wang.jpg')
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

// Image pairs for hero composition rotation
const heroPairs = [
  {
    primary: { image: obsidianResidenceImage, label: 'The Obsidian Residence' },
    secondary: { image: velourExecutiveSuitesImage, label: 'Velour Executive Suites' },
  },
  {
    primary: { image: maisonAreliaSuiteImage, label: 'Maison Arelia Suite' },
    secondary: { image: terraceGardenImage, label: 'The Terrace Garden' },
  },
  {
    primary: { image: noirAtelierFlagshipImage, label: 'Noir Atelier Flagship' },
    secondary: { image: bathRetreatImage, label: 'Bath Retreat' },
  },
  {
    primary: { image: bedroomImage, label: 'Bedroom' },
    secondary: { image: livingSpaceImage, label: 'Living Space' },
  },
]

const studioStats = [
  { value: '320+', label: 'Projects delivered' },
  { value: '14', label: 'Years of expertise' },
  { value: '98%', label: 'Client satisfaction' },
] as const

type DesignCard = {
  tag: string
  title: string
  location: string
  description: string
  image: string
  features?: string[]
}

const designCards: DesignCard[] = [
  {
    tag: 'Residential',
    title: 'The Obsidian Residence',
    location: 'New Delhi - 2024',
    description:
      'Where Comfort Becomes an Art Form.A serene retreat where soft textures meet structured elegance, every corner whispers calm, every detail breathes purpose and belonging.',
    image: obsidianResidenceImage,
    features: ['Textured Plaster Walls', 'Custom Millwork', 'Bespoke Lighting'],
  },
  {
    tag: 'Commercial',
    title: 'Velour Executive Suites',
    location: 'Mumbai - 2024',
    description:
      'Where Ambition Finds Its Space." A workspace carved with precision and confidence , where authority meets warmth and every environment is built to inspire productivity.',
    image: velourExecutiveSuitesImage,
  },
  {
    tag: 'Hospitality',
    title: 'Maison Arelia Suite',
    location: 'Hyderabad - 2023',
    description:
      'Where Every Guest Feels at Home." A five-star experience rooted in warmth and elegance , where thoughtful design turns every visit into a memory worth returning to. ',
    image: maisonAreliaSuiteImage,
  },
  {
    tag: 'Landscape',
    title: 'The Terrace Garden',
    location: 'Bangalore - 2024',
    description:
      'Where Nature Meets Design." An open-air sanctuary layered with lush botanicals, natural stone, and soft ambient light , where the outdoors feels as curated as any room. ',
    image: terraceGardenImage,
    features: ['Native Planting', 'Terrazzo Floors', 'Ambient Lighting'],
  },
  {
    tag: 'Retail',
    title: 'Noir Atelier Flagship',
    location: 'Pune - 2023',
    description:
      'Where Products Find Their Stage." A dramatic space where every product commands attention , bold, curated, and designed to leave a lasting impression on every visitor.',
    image: noirAtelierFlagshipImage,
    features: ['Drama Lighting', 'Custom Display', 'Black Mirror Surfaces'],
  },
] as const

const processSteps = [
  {
    number: '01',
    title: 'Registration',
    description: 'Enquiry & Verification Your journey begins here.',
    image: registrationImage,
  },
  {
    number: '02',
    title: 'Lead Creation',
    description: 'Vision Mapping We capture your vision, goals, and preferences.',
    image: leadGenerationImage,
  },
  {
    number: '03',
    title: 'Site Visit',
    description: 'Space Reading Our expert supervisor visits your space.',  
    image: siteVisitImage,
  },
  {
    number: '04',
    title: 'Feasibility',
    description: 'Design Blueprint We translate site realities into creative possibilities.',
    image: feasibilityImage,
  },
  {
    number: '05',
    title: 'Proposal',
    description: 'Budget & Proposal A transparent, detailed project proposal is crafted.',
    image: proposalImage,
  },
  {
    number: '06',
    title: 'Approval',
    description: 'Vendor Selection We invite, evaluate, and negotiate with trusted vendors.',
    image: approvalImage,
  },
  {
    number: '07',
    title: 'Execution',
    description: 'Space Transformation The vision comes to life , with dedicated supervision.',
    image: executionImage,
  },
  {
    number: '08',
    title: 'Quality Audit',
    description: ' Quality Handover A rigorous final inspection ensures every detail meets Arelia standards before we hand over your perfect space.',
    image: qualityAuditImage,
  },
] as const

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
] as const

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
  const [currentPair, setCurrentPair] = useState(0)
  const [fadeOut, setFadeOut] = useState(false)
  const [activeStep, setActiveStep] = useState(0)

  useEffect(() => {
    const pairInterval = window.setInterval(() => {
      setFadeOut(true)
      setTimeout(() => {
        setCurrentPair((prev) => (prev + 1) % heroPairs.length)
        setFadeOut(false)
      }, 900)
    }, 4500)

    return () => window.clearInterval(pairInterval)
  }, [])

  useEffect(() => {
    const stepInterval = window.setInterval(() => {
      setActiveStep((prev) => (prev + 1) % processSteps.length)
    }, 2400)

    return () => window.clearInterval(stepInterval)
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
             WHO WE ARE
            </motion.p>
            <motion.h1 className="about-hero__title" variants={fadeUp}>
              Design That Fits 
              <span>How People Live Today.</span>
            </motion.h1>
            <motion.p className="about-hero__lead" variants={fadeUp}>
              At Arelia, great design begins long before the first sketch.
               It starts with understanding  how people move through a space,
                where light settles in the morning, and which corner naturally becomes the place everyone gathers. 
                We are a premium interior design company delivering thoughtful, innovative, and end-to-end design experiences across residential, commercial, and hospitality spaces.
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
            <div className="about-hero__glow-backdrop" />
            <div className="about-hero__light-streak" />

            <motion.div
              className="about-hero__image about-hero__image--primary"
              animate={{ opacity: fadeOut ? 0 : 1 }}
              transition={{
                duration: 0.9,
                ease: 'easeInOut',
              }}
            >
              <motion.img
                src={heroPairs[currentPair].primary.image}
                alt={heroPairs[currentPair].primary.label}
                animate={{ scale: fadeOut ? 1 : 1.03 }}
                transition={{
                  duration: 0.9,
                  ease: 'easeOut',
                }}
              />
            </motion.div>

            <motion.div
              className="about-hero__image about-hero__image--secondary"
              animate={{ opacity: fadeOut ? 0 : 1 }}
              transition={{
                duration: 0.9,
                ease: 'easeInOut',
              }}
            >
              <motion.img
                src={heroPairs[currentPair].secondary.image}
                alt={heroPairs[currentPair].secondary.label}
                animate={{ scale: fadeOut ? 1 : 1.03 }}
                transition={{
                  duration: 0.9,
                  ease: 'easeOut',
                }}
              />
            </motion.div>
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
              <p className="about-page__eyebrow">OUR FINEST WORK</p>
              <h2 className="about-section__title">
                Crafted With Purpose. Finished With Pride.
              </h2>
            </motion.div>
            <motion.p
              className="about-section__intro"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.25 }}
              variants={fadeUp}
            >
              Every project is a living story, shaped by your vision,
               refined by our craft, and built to be experienced for a lifetime.
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
                className={`about-process__step${index > 3 ? ' is-lower' : ''}${
                  activeStep === index ? ' active' : ''
                }`}
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
                Book Consultation
              </button>
              <a href="/services" className="about-button about-button--secondary">
                View Our Portfolio
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  )
}
