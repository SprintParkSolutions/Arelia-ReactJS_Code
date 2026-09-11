import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import { ArrowIcon } from "../components/ArrowIcon";
import "./AboutPage.css";

const ABOUT_US_IMAGES_PATH = "/images/AboutUs%20Page";
const aboutUsImagePath = (fileName: string) =>
  `${ABOUT_US_IMAGES_PATH}/${fileName}`;

const bathRetreatImage = aboutUsImagePath("Bath Retreat.avif");
const bedroomImage = aboutUsImagePath("Bedroom.avif");
const livingSpaceImage = aboutUsImagePath("Living Space.jpg");
const obsidianResidenceImage = aboutUsImagePath("Residential_Home.webp");
const velourExecutiveSuitesImage = aboutUsImagePath(
  "Velour Executive Suites.avif",
);
const maisonAreliaSuiteImage = aboutUsImagePath("Maison Arelia Suite.avif");
const terraceGardenImage = aboutUsImagePath("The Terrace Garden.avif");
const noirAtelierFlagshipImage = aboutUsImagePath("Noir Atelier Flagship.jpg");
const registrationImage = aboutUsImagePath("Registration.jpg");
const leadGenerationImage = aboutUsImagePath("lead-generation.jpg");
const siteVisitImage = aboutUsImagePath("Site Visit.jpg");
const feasibilityImage = aboutUsImagePath("Feasibility.avif");
const proposalImage = aboutUsImagePath("Proposal.avif");
const approvalImage = aboutUsImagePath("Approval.avif");
const executionImage = aboutUsImagePath("Execution.avif");
const qualityAuditImage = aboutUsImagePath("Quality Audit.jpg");

// Image pairs for hero composition rotation
const heroPairs = [
  {
    primary: { image: obsidianResidenceImage, label: "The Obsidian Residence" },
    secondary: {
      image: velourExecutiveSuitesImage,
      label: "Velour Executive Suites",
    },
  },
  {
    primary: { image: maisonAreliaSuiteImage, label: "Maison Arelia Suite" },
    secondary: { image: terraceGardenImage, label: "The Terrace Garden" },
  },
  {
    primary: {
      image: noirAtelierFlagshipImage,
      label: "Noir Atelier Flagship",
    },
    secondary: { image: bathRetreatImage, label: "Bath Retreat" },
  },
  {
    primary: { image: bedroomImage, label: "Bedroom" },
    secondary: { image: livingSpaceImage, label: "Living Space" },
  },
];

const studioStats = [
  { value: "150+", label: "Projects delivered" },
  { value: "05+", label: "Years of expertise" },
  { value: "100%", label: "Client satisfaction" },
] as const;

type DesignCard = {
  tag: string;
  servicePath: string;
  title: string;
  location: string;
  description: string;
  image: string;
  features?: string[];
};

const designCards: DesignCard[] = [
  {
    tag: "Residential",
    servicePath: "/services/residential",
    title: "Residential Interior Design in Hyderabad",
    location: "Beautiful Homes Designed Around You",
    description:
      "Transform your home with thoughtfully planned Residential interiors by Arelia Space. From space planning and custom furniture to lighting, finishes, and complete home interiors, we create elegant and functional spaces tailored to your lifestyle.",
    image: obsidianResidenceImage,
    features: ["Space Planning", "Custom Furniture", "Premium Finishes", "Lighting Design"],
  },
  {
    tag: "Commercial",
    servicePath: "/services/commercial",
    title: "Commercial Interior Design in Hyderabad",
    location: "Smart Workspaces Designed for Business",
    description:
      "Transform your Commercial space with thoughtfully planned interiors by Arelia Space. From efficient space planning and custom workstations to lighting, finishes, meeting areas, and collaborative zones, we create professional and functional environments designed to support productivity, comfort, and your brand identity.",
    image: velourExecutiveSuitesImage,
    features: ["Efficient Space Planning", "Custom Workstations", "Professional Lighting", "Collaborative Spaces"],
  },
  {
    tag: "Hospitality",
    servicePath: "/services/hospitality",
    title: "Hospitality Interior Design in Hyderabad",
    location: "Inviting Spaces Designed for Memorable Guest Experiences",
    description:
      "Transform your Hospitality space with thoughtfully planned interiors by Arelia Space. From welcoming lobbies and elegant guest rooms to ambient lighting, premium finishes, and functional layouts, we create warm, stylish, and experience-driven environments that reflect comfort, luxury, and your brand identity.",
    image: maisonAreliaSuiteImage,
    features: ["Guest-Centric Space Planning", "Ambient Lighting", "Premium Finishes", "Comfort-Driven Design"],
  },
] as const;

const processSteps = [
  {
    number: "01",
    title: "Registration",
    description: "Enquiry & Verification Your journey begins here.",
    image: registrationImage,
  },
  {
    number: "02",
    title: "Lead Creation",
    description:
      "Vision Mapping We capture your vision, goals, and preferences.",
    image: leadGenerationImage,
  },
  {
    number: "03",
    title: "Site Visit",
    description: "Space Reading Our expert supervisor visits your space.",
    image: siteVisitImage,
  },
  {
    number: "04",
    title: "Feasibility",
    description:
      "Design Blueprint We translate site realities into creative possibilities.",
    image: feasibilityImage,
  },
  {
    number: "05",
    title: "Proposal",
    description:
      "Budget & Proposal A transparent, detailed project proposal is crafted.",
    image: proposalImage,
  },
  {
    number: "06",
    title: "Approval",
    description:
      "Vendor Selection We invite, evaluate, and negotiate with trusted vendors.",
    image: approvalImage,
  },
  {
    number: "07",
    title: "Execution",
    description:
      "Space Transformation The vision comes to life , with dedicated supervision.",
    image: executionImage,
  },
  {
    number: "08",
    title: "Quality Audit",
    description:
      " Quality Handover A rigorous final inspection ensures every detail meets Arelia standards before we hand over your perfect space.",
    image: qualityAuditImage,
  },
] as const;

const marqueeWords = [
  "Residential",
  "Commercial",
  "Hospitality",
  "Landscape",
  "Retail",
  "Bespoke",
  "Editorial",
  "Luxury",
  "Spatial Design",
  "Arelia",
] as const;

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 36 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.9, ease: "easeOut" },
  },
};

const stagger: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
    },
  },
};

type AboutPageProps = {
  onOpenConsultation: () => void;
};

export function AboutPage({ onOpenConsultation }: AboutPageProps) {
  const [currentPair, setCurrentPair] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const location = useLocation();
  const finestWorkRef = useRef<HTMLDivElement>(null);
  const [activeDesign, setActiveDesign] = useState(() => {
    const category = new URLSearchParams(location.search).get('work');
    return Math.max(0, designCards.findIndex(card => card.tag.toLowerCase() === category));
  });
  const selectedDesign = designCards[activeDesign];

  useEffect(() => {
    if (location.hash !== '#our-finest-work') return;
    // Run after the destination mounts through the route exit transition.
    const frame = window.requestAnimationFrame(() => {
      finestWorkRef.current?.scrollIntoView({ behavior: 'auto', block: 'start' });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [location.hash, location.key]);

  useEffect(() => {
    const pairInterval = window.setInterval(() => {
      setFadeOut(true);
      setTimeout(() => {
        setCurrentPair((prev) => (prev + 1) % heroPairs.length);
        setFadeOut(false);
      }, 900);
    }, 4500);

    return () => window.clearInterval(pairInterval);
  }, []);

  useEffect(() => {
    const stepInterval = window.setInterval(() => {
      setActiveStep((prev) => (prev + 1) % processSteps.length);
    }, 2400);

    return () => window.clearInterval(stepInterval);
  }, []);

  const marqueeTrack = [...marqueeWords, ...marqueeWords];

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
              At Arelia, great design begins long before the first sketch. It
              starts with understanding how people move through a space, where
              light settles in the morning, and which corner naturally becomes
              the place everyone gathers. We are a premium interior design
              company delivering thoughtful, innovative, and end-to-end design
              experiences across residential, commercial, and hospitality
              spaces.
            </motion.p>
            <motion.div className="about-hero__actions" variants={fadeUp}>
              <button
                type="button"
                className="about-button about-button--primary"
                onClick={onOpenConsultation}
              >
                Book Consultation
              </button>
              <a
                href="#philosophy"
                className="about-button about-button--secondary"
              >
                Our Philosophy -&gt;
              </a>
            </motion.div>
            <motion.div className="about-hero__stats" variants={stagger}>
              {studioStats.map((item) => (
                <motion.article
                  key={item.label}
                  className="about-hero__stat"
                  variants={fadeUp}
                >
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
            transition={{ duration: 1.1, ease: "easeOut", delay: 0.2 }}
          >
            <div className="about-hero__glow-backdrop" />
            <div className="about-hero__light-streak" />

            <motion.div
              className="about-hero__image about-hero__image--primary"
              animate={{ opacity: fadeOut ? 0 : 1 }}
              transition={{
                duration: 0.9,
                ease: "easeInOut",
              }}
            >
              <motion.img
                src={heroPairs[currentPair].primary.image}
                alt={heroPairs[currentPair].primary.label}
                animate={{ scale: fadeOut ? 1 : 1.03 }}
                transition={{
                  duration: 0.9,
                  ease: "easeOut",
                }}
              />
            </motion.div>

            <motion.div
              className="about-hero__image about-hero__image--secondary"
              animate={{ opacity: fadeOut ? 0 : 1 }}
              transition={{
                duration: 0.9,
                ease: "easeInOut",
              }}
            >
              <motion.img
                src={heroPairs[currentPair].secondary.image}
                alt={heroPairs[currentPair].secondary.label}
                animate={{ scale: fadeOut ? 1 : 1.03 }}
                transition={{
                  duration: 0.9,
                  ease: "easeOut",
                }}
              />
            </motion.div>
          </motion.div>
        </div>
        <motion.div
          className="about-hero__scroll"
          animate={{ opacity: [0.3, 0.9, 0.3], y: [0, 8, 0] }}
          transition={{
            duration: 2.8,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
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
        <div className="about-shell" id="our-finest-work" ref={finestWorkRef}>
          <div className="about-section__head">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.25 }}
              variants={fadeUp}
            >
              <p className="about-page__eyebrow">OUR FINEST WORK</p>
              <h2 className="about-section__title">
                Different Spaces. The Same Attention to Detail.
              </h2>
            </motion.div>
          </div>

          <div className="about-work">
            <div className="about-work__categories" role="group" aria-label="Choose a design category">
              {designCards.map((card, index) => (
                <button
                  key={card.tag}
                  type="button"
                  className="about-work__category"
                  aria-pressed={activeDesign === index}
                  aria-controls="about-work-project"
                  onClick={() => setActiveDesign(index)}
                >
                  <span className="about-work__number" aria-hidden="true">0{index + 1}</span>
                  {card.tag}
                  <span className="about-work__indicator"><ArrowIcon /></span>
                </button>
              ))}
            </div>

            <article id="about-work-project" className="about-work__project" aria-live="polite" aria-atomic="true">
              <div className="about-work__visual">
                <img
                  key={selectedDesign.image}
                  src={selectedDesign.image}
                  alt={`${selectedDesign.title} — ${selectedDesign.tag.toLowerCase()} interior design`}
                  loading="lazy"
                  width="1200"
                  height="900"
                />
                <span className="about-work__image-label">{selectedDesign.tag} / Arelia Space</span>
              </div>
              <div className="about-work__details">
                <p className="about-page__eyebrow">SELECTED WORK / 0{activeDesign + 1}</p>
                <h3>{selectedDesign.title}</h3>
                <p className="about-work__location">{selectedDesign.location}</p>
                <p className="about-work__description">{selectedDesign.description}</p>
                {selectedDesign.features && (
                  <div className="about-work__highlights">
                    <p>Design highlights</p>
                    <ul>
                      {selectedDesign.features.map((feature) => <li key={feature}>{feature}</li>)}
                    </ul>
                  </div>
                )}
                <div className="about-work__actions">
                  <button type="button" className="about-button about-button--primary" onClick={onOpenConsultation}>
                    DISCUSS YOUR SPACE <ArrowIcon />
                  </button>
                  <Link to={selectedDesign.servicePath} className="about-button about-button--secondary">
                    EXPLORE {selectedDesign.tag.toLowerCase()} INTERIORS <ArrowIcon />
                  </Link>
                </div>
              </div>
            </article>
          </div>
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
            <div
              className="about-process__curve about-process__curve--top"
              aria-hidden="true"
            />
            <div
              className="about-process__curve about-process__curve--bottom"
              aria-hidden="true"
            />
            {processSteps.map((step, index) => (
              <motion.article
                key={step.number}
                className={`about-process__step${index > 3 ? " is-lower" : ""}${
                  activeStep === index ? " active" : ""
                }`}
                variants={fadeUp}
              >
                <div className="about-process__image">
                  <motion.img
                    src={step.image}
                    alt={step.title}
                    whileHover={{ scale: 1.04 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
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
              Every great space starts with a single conversation. Book your
              consultation and let us shape an environment that feels
              distinctively yours.
            </p>
            <div className="about-cta__actions">
              <button
                type="button"
                className="about-button about-button--primary"
                onClick={onOpenConsultation}
              >
                Book Consultation
              </button>
              <Link
                to="/services"
                className="about-button about-button--secondary"
              >
                View Our Portfolio
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  );
}
