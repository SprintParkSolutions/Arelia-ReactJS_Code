import type { CSSProperties, ReactElement, SVGProps } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  motion,
  AnimatePresence,
  useInView,
  type Variants,
} from 'framer-motion'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { VideoBackground } from '../components/videoBackground/VideoBackground'
import './HomePage.css'

gsap.registerPlugin(ScrollTrigger)

const HOME_PAGE_IMAGES_PATH = `${import.meta.env.BASE_URL}images/Home%20Page`

const homePageImagePath = (fileName: string) =>
  `${HOME_PAGE_IMAGES_PATH}/${encodeURIComponent(fileName)}`

const homePageOptimizedImagePath = (fileName: string) =>
  `${HOME_PAGE_IMAGES_PATH}/${encodeURIComponent(fileName)}`

type FeatureItem = {
  id: string
  number: string
  title: string
  description: string
  image: string
  thumbnail: string
  Icon: (props: SVGProps<SVGSVGElement>) => ReactElement
}

type Testimonial = {
  id: string
  name: string
  quote: string
}

type HomePageProps = {
  onOpenConsultation: () => void
}

type DeferredSectionProps = {
  children: ReactElement
  minHeight: string
}

function useDeferredActivation<T extends HTMLElement>(rootMargin = '250px 0px') {
  const ref = useRef<T | null>(null)
  const [isActive, setIsActive] = useState(false)

  useEffect(() => {
    if (isActive || ref.current === null) {
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) {
          return
        }

        setIsActive(true)
        observer.disconnect()
      },
      { rootMargin },
    )

    observer.observe(ref.current)

    return () => {
      observer.disconnect()
    }
  }, [isActive, rootMargin])

  return { ref, isActive }
}

const QUOTE_BACKGROUND_LAYER = homePageOptimizedImagePath('quote-background.webp')
const QUOTE_FOREGROUND_LAYER = homePageImagePath('quote-foreground.jpg')
const QUOTE_TEXT = 'Every Space Has a Story ,We Help You Tell It Beautifully.'
const CONTACT_IMAGE = homePageOptimizedImagePath('contact-cta-background.webp')

const stats = [
  { label: 'Years Experience', value: '05+' },
  { label: 'Projects Delivered ', value: '350+' },
  { label: 'Satisfaction Rate', value: '100%' },
] as const

const testimonials: readonly Testimonial[] = [
  {
    id: 'sana',
    name: 'Sana Mehra',
    quote:
      'Arelia brought calm to an otherwise complex build. Every approval, budget check, and milestone felt beautifully controlled from day one.',
  },
  {
    id: 'arjun',
    name: 'Arjun Khanna',
    quote:
      'What stood out was the clarity. Instead of chasing updates, I always knew where the project stood and what was coming next.',
  },
  {
    id: 'mira',
    name: 'Mira Rao',
    quote:
      'The experience felt premium throughout. Arelia made collaboration smoother, the numbers easier to trust, and the entire project far more elegant.',
  },
  {
    id: 'dev',
    name: 'Dev Malhotra',
    quote:
      'The project never felt overwhelming because the communication was so clear. It felt as considered as the design itself.',
  },
  {
    id: 'anya',
    name: 'Anya Kapoor',
    quote:
      'From approvals to budget visibility, Arelia introduced a level of confidence our clients noticed immediately.',
  },
  {
    id: 'rohan',
    name: 'Rohan Sethi',
    quote:
      'It felt less like software and more like having an elegant command center for the entire experience.',
  },
] as const

const getInitials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')

function PlatformIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <rect x="3" y="5" width="18" height="14" rx="3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 9h8M8 13h5M7 18.5h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function BudgetIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M5 8h14v8a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3V8Z" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 8V7a4 4 0 1 1 8 0v1" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 11v4M10 13h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function TransparencyIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M12 4 19.5 12 12 20 4.5 12 12 4Z" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 8v8M8 12h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function MobileIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <rect x="7" y="3.5" width="10" height="17" rx="2.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10 6.5h4M9.5 11.5h5M9.5 14.5h3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="12" cy="17.5" r="1" fill="currentColor" />
    </svg>
  )
}

const whyChooseFeatures: readonly FeatureItem[] = [
  {
    id: 'platform',
    number: '01',
    title: 'Everything in One Platform',
    description:
      'Replace multiple tools with a single interior design platform designed for planning, coordination, and execution.',
    image: homePageOptimizedImagePath('why-choose-platform-main.webp'),
    thumbnail: homePageOptimizedImagePath('why-choose-platform-thumb.webp'),
    Icon: PlatformIcon,
  },
  {
    id: 'budget',
    number: '02',
    title: 'Control Your Budget with Clarity',
    description: 'Stay financially in control with structured estimation and real-time cost tracking.',
    image: homePageOptimizedImagePath('why-choose-budget-main.webp'),
    thumbnail: homePageImagePath('why-choose-budget-thumb.jpg'),
    Icon: BudgetIcon,
  },
  {
    id: 'transparency',
    number: '03',
    title: 'Total Transparency at Every Step',
    description: 'Track updates, milestones, and execution progress with full visibility.',
    image: homePageOptimizedImagePath('why-choose-transparency-main.webp'),
    thumbnail: homePageImagePath('why-choose-transparency-thumb.jpg'),
    Icon: TransparencyIcon,
  },
  {
    id: 'mobile',
    number: '04',
    title: 'Your Project, In Your Pocket',
    description: 'Monitor progress, updates, and communication anytime through mobile access.',
    image: homePageOptimizedImagePath('why-choose-mobile-main.webp'),
    thumbnail: homePageOptimizedImagePath('why-choose-mobile-thumb.webp'),
    Icon: MobileIcon,
  },
] as const

// ============================================================
// HOME HERO
// ============================================================

function HomeHeroSection() {
  return (
    <section className="home-page__hero">
      <VideoBackground
        src="/videos/Arelia_Space-lite.mp4"
        posterSrc="/videos/Arelia_Space-poster.webp"
        isHome
        isSection
        deferMs={1200}
      />
      <div className="home-page__content">
        <h1 className="home-page__title">
          <span className="home-page__line">We Don't Just Design Spaces</span>
          <span className="home-page__line">
            We Design <span className="home-page__brand home-page__brand--inline">How You Live.</span>
          </span>
        </h1>
      </div>
    </section>
  )
}

function DeferredSection({ children, minHeight }: DeferredSectionProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [shouldRender, setShouldRender] = useState(false)

  useEffect(() => {
    if (shouldRender || containerRef.current === null) {
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) {
          return
        }

        setShouldRender(true)
        observer.disconnect()
      },
      { rootMargin: '400px 0px' },
    )

    observer.observe(containerRef.current)

    return () => {
      observer.disconnect()
    }
  }, [shouldRender])

  return (
    <div
      ref={containerRef}
      className={`home-page__deferred-section${shouldRender ? ' is-loaded' : ''}`}
      style={{ '--deferred-min-height': minHeight } as CSSProperties}
    >
      {shouldRender ? children : null}
    </div>
  )
}

// ============================================================
// WHY CHOOSE SECTION
// ============================================================

function WhyChooseSection() {
  const { ref: sectionRef, isActive } = useDeferredActivation<HTMLElement>('350px 0px')
  const cardRef = useRef<HTMLElement | null>(null)
  const layoutRef = useRef<HTMLDivElement | null>(null)
  const contentRef = useRef<HTMLDivElement | null>(null)
  const imageLayerRef = useRef<HTMLDivElement | null>(null)
  const activeImageRef = useRef<HTMLDivElement | null>(null)
  const detailImageRef = useRef<HTMLDivElement | null>(null)
  const navRef = useRef<HTMLElement | null>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [isAutoPaused, setIsAutoPaused] = useState(false)

  useEffect(() => {
    if (
      !isActive ||
      !sectionRef.current ||
      !cardRef.current ||
      !contentRef.current ||
      !imageLayerRef.current ||
      !navRef.current
    ) {
      return
    }

    whyChooseFeatures.flatMap((feature) => [feature.image, feature.thumbnail]).forEach((src) => {
      const image = new Image()
      image.src = src
    })

    const cardElement = cardRef.current
    const updateCardLight = (event: MouseEvent) => {
      const rect = cardElement.getBoundingClientRect()
      const x = ((event.clientX - rect.left) / rect.width) * 100
      const y = ((event.clientY - rect.top) / rect.height) * 100
      cardElement.style.setProperty('--pointer-x', `${Math.max(0, Math.min(100, x))}`)
      cardElement.style.setProperty('--pointer-y', `${Math.max(0, Math.min(100, y))}`)
    }
    const resetCardLight = () => {
      cardElement.style.setProperty('--pointer-x', '50')
      cardElement.style.setProperty('--pointer-y', '50')
    }

    const context = gsap.context(() => {
      gsap.fromTo('.why-choose-luxe__reveal', { autoAlpha: 0, y: 28 }, { autoAlpha: 1, y: 0, duration: 0.9, stagger: 0.1, ease: 'power3.out' })
      gsap.fromTo('.why-choose-luxe__nav-item', { autoAlpha: 0, x: -26 }, { autoAlpha: 1, x: 0, duration: 0.7, stagger: 0.08, ease: 'power3.out', delay: 0.14 })
    }, sectionRef)

    cardElement.addEventListener('mousemove', updateCardLight)
    cardElement.addEventListener('mouseleave', resetCardLight)

    return () => {
      cardElement.removeEventListener('mousemove', updateCardLight)
      cardElement.removeEventListener('mouseleave', resetCardLight)
      context.revert()
    }
  }, [isActive, sectionRef])

  useEffect(() => {
    if (
      !isActive ||
      !contentRef.current ||
      !imageLayerRef.current ||
      !activeImageRef.current ||
      !detailImageRef.current ||
      !navRef.current
    ) {
      return
    }

    const nextFeature = whyChooseFeatures[activeIndex]
    const nextBackground = document.createElement('div')
    nextBackground.className = 'why-choose-luxe__image why-choose-luxe__image--incoming'
    nextBackground.style.backgroundImage = `url(${nextFeature.image})`
    imageLayerRef.current.appendChild(nextBackground)

    const timeline = gsap.timeline({ defaults: { ease: 'power3.out' } })
    timeline.to(navRef.current.querySelectorAll('.why-choose-luxe__nav-item'), {
      x: (_index: number, target: Element) => (target.classList.contains('is-active') ? 10 : 0),
      duration: 0.46,
      stagger: 0.02,
    }, 0)
    timeline.to(contentRef.current, { autoAlpha: 0, y: 24, filter: 'blur(8px)', duration: 0.2 })
    timeline.fromTo(nextBackground, { autoAlpha: 0, scale: 1.1, xPercent: 4 }, { autoAlpha: 1, scale: 1, xPercent: 0, duration: 0.8 }, 0)
    timeline.to(activeImageRef.current, { autoAlpha: 0, scale: 0.96, xPercent: -2, duration: 0.7 }, 0)
    timeline.fromTo(detailImageRef.current, { autoAlpha: 0.32, xPercent: 12, scale: 1.08 }, { autoAlpha: 1, xPercent: 0, scale: 1, duration: 0.68 }, 0.08)
    timeline.call(() => {
      activeImageRef.current?.remove()
      nextBackground.classList.remove('why-choose-luxe__image--incoming')
      activeImageRef.current = nextBackground
    })
    timeline.fromTo(contentRef.current, { autoAlpha: 0, y: 26, filter: 'blur(10px)' }, { autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: 0.56 })

    return () => {
      timeline.kill()
    }
  }, [activeIndex, isActive])

  useEffect(() => {
    if (!isActive || isAutoPaused) {
      return
    }

    const intervalId = window.setInterval(() => {
      setActiveIndex((currentIndex) => (currentIndex + 1) % whyChooseFeatures.length)
    }, 1800)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [isActive, isAutoPaused])

  const activeFeature = whyChooseFeatures[activeIndex]

  return (
    <section ref={sectionRef} className={`why-choose-luxe luxury-section--wide${isAutoPaused ? '' : ' is-auto-cycling'}`}>
      <div className="why-choose-luxe__backlight" aria-hidden="true" />
      <div className="why-choose-luxe__shell" aria-hidden="true" />
      <div className="why-choose-luxe__inner">
        <header className="why-choose-luxe__header why-choose-luxe__reveal">
          <p className="why-choose-luxe__eyebrow">Why Choose Arelia</p>
          <h2 className="why-choose-luxe__headline">Because Your Space Deserves More Than Just Design</h2>
          <p className="why-choose-luxe__subtitle">
           Arelia is a smart online interior design platform delivering innovative, transparent, and end-to-end interior design services for residential, commercial, and hospitality spaces  powered by Salesforce, driven by excellence. 
          </p>
        </header>

        <div
          ref={layoutRef}
          className="why-choose-luxe__layout"
          onMouseEnter={() => setIsAutoPaused(true)}
          onMouseLeave={() => setIsAutoPaused(false)}
          onFocusCapture={() => setIsAutoPaused(true)}
          onBlurCapture={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
              setIsAutoPaused(false)
            }
          }}
        >
          <div className="why-choose-luxe__accent why-choose-luxe__accent--left" aria-hidden="true">
            <svg viewBox="0 0 180 180" fill="none">
              <circle cx="90" cy="90" r="78" stroke="currentColor" strokeWidth="1.2" strokeOpacity="0.28" />
              <circle cx="90" cy="90" r="52" stroke="currentColor" strokeWidth="1.2" strokeOpacity="0.18" />
              <path d="M33 90h114M90 33v114" stroke="currentColor" strokeWidth="1.2" strokeOpacity="0.18" />
            </svg>
          </div>

          <nav ref={navRef} className="why-choose-luxe__nav why-choose-luxe__reveal" aria-label="Why Choose Arelia features">
            {whyChooseFeatures.map((feature, index) => (
              <button
                key={feature.id}
                type="button"
                className={`why-choose-luxe__nav-item${index === activeIndex ? ' is-active' : ''}`}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => setActiveIndex(index)}
                onFocus={() => setActiveIndex(index)}
              >
                <span className="why-choose-luxe__nav-number">{feature.number}</span>
                <span
                  className="why-choose-luxe__nav-thumb"
                  aria-hidden="true"
                  style={{ backgroundImage: `url(${feature.thumbnail})` }}
                />
                <span className="why-choose-luxe__nav-copy">
                  <span className="why-choose-luxe__nav-title">{feature.title}</span>
                  <span className="why-choose-luxe__nav-arrow" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none">
                      <path d="M6 12h12M13 7l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </span>
              </button>
            ))}
          </nav>

          <article ref={cardRef} className="why-choose-luxe__card why-choose-luxe__reveal" data-magnetic>
            <div ref={imageLayerRef} className="why-choose-luxe__image-layer" aria-hidden="true">
              <div ref={activeImageRef} className="why-choose-luxe__image" style={{ backgroundImage: `url(${activeFeature.image})` }} />
            </div>
            <div className="why-choose-luxe__overlay" aria-hidden="true" />
            <div className="why-choose-luxe__glass" aria-hidden="true" />
            <div className="why-choose-luxe__card-accent why-choose-luxe__card-accent--top" aria-hidden="true">
              <svg viewBox="0 0 220 120" fill="none">
                <path d="M12 60h104c18 0 26-14 42-14s22 14 50 14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                <circle cx="166" cy="46" r="5" fill="currentColor" fillOpacity="0.28" />
              </svg>
            </div>
            <div className="why-choose-luxe__card-accent why-choose-luxe__card-accent--bottom" aria-hidden="true">
              <svg viewBox="0 0 140 140" fill="none">
                <rect x="16" y="16" width="108" height="108" rx="24" stroke="currentColor" strokeWidth="1.3" strokeOpacity="0.3" />
                <path d="M42 98l24-24 14 14 20-30" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            <div ref={contentRef} className="why-choose-luxe__content">
              <div className="why-choose-luxe__icon-shell">
                <span className="why-choose-luxe__icon">
                  <activeFeature.Icon />
                </span>
              </div>
              <div className="why-choose-luxe__copy">
                <p className="why-choose-luxe__kicker">Interior Intelligence</p>
                <h3 className="why-choose-luxe__card-title">{activeFeature.title}</h3>
                <p className="why-choose-luxe__description">{activeFeature.description}</p>
              </div>
            </div>

            <div className="why-choose-luxe__detail-strip" aria-hidden="true">
              <div ref={detailImageRef} className="why-choose-luxe__detail-image" style={{ backgroundImage: `url(${activeFeature.thumbnail})` }} />
            </div>
          </article>
        </div>
      </div>
    </section>
  )
}

// ============================================================
// SIGNATURE SHOWCASE — 4 cards with Framer Motion
// ============================================================

type ShowcaseCardData = {
  id: string
  number: string
  title: string
  description: string
  image: string
  floatDuration: number
  Icon: (props: SVGProps<SVGSVGElement>) => ReactElement
}

const SHOWCASE_CARDS: readonly ShowcaseCardData[] = [
  {
    id: 'tracking',
    number: '01',
    title: 'Live Project Tracking',
    description: 'Monitor every milestone and vendor in real time.',
    image: homePageOptimizedImagePath('Live-Tracking.webp'),
    floatDuration: 5.4,
    Icon: (props) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" {...props}>
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
        <path d="M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
      </svg>
    ),
  },
  {
    id: 'mobile',
    number: '02',
    title: 'Live Mobile Updates',
    description: 'Instant updates and approvals, right on your phone.',
    image: homePageOptimizedImagePath('Live-Update.webp'),
    floatDuration: 6.0,
    Icon: (props) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" {...props}>
        <rect x="7" y="2" width="10" height="20" rx="3" />
        <path d="M10 6h4M9.5 10.5h5M9.5 13.5h3" />
        <circle cx="12" cy="17.5" r="1" fill="currentColor" />
      </svg>
    ),
  },
  {
    id: 'coordination',
    number: '03',
    title: 'End-to-End Coordination',
    description: 'Every vendor, approval and detail — handled for you.',
    image: homePageOptimizedImagePath('End-to-end-coordination.webp'),
    floatDuration: 5.7,
    Icon: (props) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" {...props}>
        <circle cx="5" cy="12" r="2" />
        <circle cx="19" cy="6" r="2" />
        <circle cx="19" cy="18" r="2" />
        <path d="M7 11.2L17 7M7 12.8L17 17" />
      </svg>
    ),
  },
  {
    id: 'visualization',
    number: '04',
    title: '3D Design Visualization',
    description: 'See your space before a single wall is built.',
    image: homePageImagePath('3D design.jpg'),
    floatDuration: 6.3,
    Icon: (props) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" {...props}>
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
    ),
  },
] as const

const CYCLE_INTERVAL = 2600

// ── Typewriter title ──────────────────────────────────────────────────────────
function TypewriterTitle({ text }: { text: string }) {
  return (
    <h3 className="ssc-card__title" aria-label={text}>
      {text.split('').map((char, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 + i * 0.032, duration: 0.18, ease: 'easeOut' }}
          style={{ display: char === ' ' ? 'inline' : 'inline-block' }}
        >
          {char === ' ' ? '\u00A0' : char}
        </motion.span>
      ))}
    </h3>
  )
}

// ── Cycle progress bar ────────────────────────────────────────────────────────
function CycleBar() {
  return (
    <motion.span
      className="ssc-card__cycle-bar"
      initial={{ scaleX: 0 }}
      animate={{ scaleX: 1 }}
      transition={{ duration: CYCLE_INTERVAL / 1000, ease: 'linear' }}
      style={{ transformOrigin: 'left' }}
    />
  )
}

// ── Framer Motion card variants ───────────────────────────────────────────────
const cardVariants: Variants = {
  hidden: { opacity: 0, y: 48, scale: 0.96 },
  visible: (custom: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: custom * 0.14,
      duration: 0.75,
      ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
    },
  }),
}

type CardProps = {
  card: ShowcaseCardData
  index: number
  isActive: boolean
  isAnyHovered: boolean
  onMouseEnter: () => void
  onMouseLeave: () => void
}

function ShowcaseCard({ card, index, isActive, isAnyHovered, onMouseEnter, onMouseLeave }: CardProps) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const [glowPos, setGlowPos] = useState({ x: 50, y: 50 })
  const [isLocalHover, setIsLocalHover] = useState(false)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    const dx = (e.clientX - cx) / (rect.width / 2)
    const dy = (e.clientY - cy) / (rect.height / 2)
    setTilt({ x: dy * -7, y: dx * 7 })
    setGlowPos({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    })
  }

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 })
    setIsLocalHover(false)
    onMouseLeave()
  }

  // Staircase vertical rhythm: card 0 = 0, 1 = -28, 2 = -16, 3 = -8
  const elevationMap = [0, -28, -16, -8]
  const baseY = elevationMap[index] ?? 0

  const animateY = isLocalHover ? baseY - 16 : isActive ? baseY - 12 : baseY
  const animateScale = isLocalHover ? 1.06 : isActive ? 1.035 : 1
  const animateOpacity = !isActive && isAnyHovered ? 0.55 : 1

  return (
    <motion.div
      ref={ref}
      className={`ssc-card${isActive ? ' ssc-card--active' : ''}${isLocalHover ? ' ssc-card--hovered' : ''}`}
      variants={cardVariants}
      custom={index}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      style={{ y: animateY }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => {
        setIsLocalHover(true)
        onMouseEnter()
      }}
      onMouseLeave={handleMouseLeave}
    >
      <motion.div
        className="ssc-card__inner"
        animate={{
          scale: animateScale,
          opacity: animateOpacity,
          rotateX: isLocalHover ? tilt.x : 0,
          rotateY: isLocalHover ? tilt.y : 0,
        }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        style={{ transformStyle: 'preserve-3d', height: '100%' }}
      >
        {/* Independent float loop */}
        <motion.div
          className="ssc-card__float-layer"
          animate={{ y: [0, -9, 0] }}
          transition={{
            duration: card.floatDuration,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: index * 0.4,
          }}
          style={{ height: '100%' }}
        >
          {/* Background image */}
          <motion.div
            className="ssc-card__image"
            animate={{ scale: isActive || isLocalHover ? 1.1 : 1 }}
            transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
            style={{ backgroundImage: `url(${card.image})` }}
          />

          {/* Glass overlay */}
          <div className="ssc-card__glass" />

          {/* Cursor radial glow */}
          <div
            className="ssc-card__cursor-glow"
            style={{
              background: `radial-gradient(circle at ${glowPos.x}% ${glowPos.y}%, rgba(212,175,55,0.22) 0%, transparent 68%)`,
              opacity: isLocalHover ? 1 : 0,
            }}
          />

          {/* Active outer ring */}
          <motion.div
            className="ssc-card__active-ring"
            animate={{ opacity: isActive ? 1 : 0 }}
            transition={{ duration: 0.5 }}
          />

          {/* Shimmer sweep on hover */}
          <motion.div
            className="ssc-card__shimmer"
            initial={{ x: '-120%' }}
            animate={isLocalHover ? { x: '320%' } : { x: '-120%' }}
            transition={
              isLocalHover
                ? { duration: 0.9, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }
                : { duration: 0 }
            }
          />

          {/* Bottom gold glow */}
          <motion.div
            className="ssc-card__foot-glow"
            animate={{ opacity: isActive ? 1 : 0.42, scaleX: isActive ? 1.2 : 0.85 }}
            transition={{ duration: 0.55 }}
          />

          {/* Content overlay — active only */}
          <AnimatePresence mode="wait">
            {isActive && (
              <motion.div
                key={card.id}
                className="ssc-card__content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <motion.div
                  className="ssc-card__icon-wrap"
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1, type: 'spring', stiffness: 400, damping: 22 }}
                >
                  <card.Icon />
                </motion.div>

                <TypewriterTitle text={card.title} />

                <motion.p
                  className="ssc-card__desc"
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.38, duration: 0.4, ease: 'easeOut' }}
                >
                  {card.description}
                </motion.p>

                <CycleBar key={`bar-${card.id}`} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Number watermark */}
          <motion.span
            className="ssc-card__number"
            animate={{ opacity: isActive ? 0.22 : 0.08 }}
            transition={{ duration: 0.45 }}
            aria-hidden="true"
          >
            {card.number}
          </motion.span>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}

function SignatureShowcaseSection() {
  const { ref: sectionRef, isActive } = useDeferredActivation<HTMLElement>('350px 0px')
  const [activeIndex, setActiveIndex] = useState(0)
  const [isAnyHovered, setIsAnyHovered] = useState(false)

  useEffect(() => {
    if (!isActive || isAnyHovered) return
    const id = window.setInterval(() => {
      setActiveIndex((i) => (i + 1) % SHOWCASE_CARDS.length)
    }, CYCLE_INTERVAL)
    return () => window.clearInterval(id)
  }, [isActive, isAnyHovered])

  return (
    <section ref={sectionRef} className="ssc-section">
      {/* Header */}
      <header className="ssc-header">
        <motion.p
          className="ssc-eyebrow"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          OUR STANDARDS
        </motion.p>

        <motion.h2
          className="ssc-headline"
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1, duration: 0.7, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
        >
          Where Excellence is Not an Option, It's a Standard.
        </motion.h2>

        <motion.p
          className="ssc-subtitle"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          At Arelia, every project is built on innovative interior design, transparent workflow, and unwavering commitment , from first enquiry to final handover. 
        </motion.p>

        <motion.div
          className="ssc-divider"
          initial={{ opacity: 0, scaleX: 0.4 }}
          whileInView={{ opacity: 1, scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.7 }}
        >
          <span className="ssc-divider__line" />
          <span className="ssc-divider__diamond" />
          <span className="ssc-divider__line" />
        </motion.div>
      </header>

      {/* Cards */}
      <div className="ssc-grid">
        {SHOWCASE_CARDS.map((card, idx) => (
          <ShowcaseCard
            key={card.id}
            card={card}
            index={idx}
            isActive={idx === activeIndex}
            isAnyHovered={isAnyHovered}
            onMouseEnter={() => {
              setIsAnyHovered(true)
              setActiveIndex(idx)
            }}
            onMouseLeave={() => setIsAnyHovered(false)}
          />
        ))}
      </div>

      {/* Dot indicators */}
      <div className="ssc-dots" role="tablist" aria-label="Feature navigation">
        {SHOWCASE_CARDS.map((card, idx) => (
          <button
            key={card.id}
            type="button"
            role="tab"
            aria-selected={idx === activeIndex}
            aria-label={card.title}
            className={`ssc-dot${idx === activeIndex ? ' ssc-dot--active' : ''}`}
            onClick={() => setActiveIndex(idx)}
          />
        ))}
      </div>
    </section>
  )
}

// ============================================================
// QUOTE SECTION
// ============================================================

function QuoteSectionSection() {
  const { ref: sectionRef, isActive } = useDeferredActivation<HTMLElement>('300px 0px')
  const backgroundRef = useRef<HTMLDivElement | null>(null)
  const foregroundRef = useRef<HTMLDivElement | null>(null)
  const wordRefs = useRef<Array<HTMLSpanElement | null>>([])
  const words = useMemo(() => QUOTE_TEXT.split(' '), [])

  useEffect(() => {
    if (!isActive || !sectionRef.current || !backgroundRef.current || !foregroundRef.current) return
    const animationContext = gsap.context(() => {
      gsap.fromTo(sectionRef.current, { autoAlpha: 0, y: 50 }, { autoAlpha: 1, y: 0, duration: 1.2, ease: 'power3.out', scrollTrigger: { trigger: sectionRef.current, start: 'top 85%', once: true } })
      gsap.to(backgroundRef.current, { yPercent: -5, ease: 'none', scrollTrigger: { trigger: sectionRef.current, start: 'top bottom', end: 'bottom top', scrub: true } })
      gsap.to(foregroundRef.current, { yPercent: -15, scale: 1.05, ease: 'none', scrollTrigger: { trigger: sectionRef.current, start: 'top bottom', end: 'bottom top', scrub: true } })
      gsap.fromTo(wordRefs.current, { autoAlpha: 0, y: 15 }, { autoAlpha: 1, y: 0, stagger: 0.05, duration: 0.8, ease: 'power2.out', scrollTrigger: { trigger: sectionRef.current, start: 'top 75%', once: true } })
    }, sectionRef)
    return () => animationContext.revert()
  }, [isActive, sectionRef])

  return (
    <section ref={sectionRef} className="quote-section">
      <div ref={backgroundRef} className="quote-section__layer quote-section__layer--background" style={{ backgroundImage: `url(${QUOTE_BACKGROUND_LAYER})` }} />
      <div ref={foregroundRef} className="quote-section__layer quote-section__layer--foreground" style={{ backgroundImage: `url(${QUOTE_FOREGROUND_LAYER})` }} />
      <div className="quote-section__content">
        <div className="quote-section__quote-box">
          <p className="quote-section__eyebrow">THE ARELIA WAY</p>
          <blockquote className="quote-section__quote">
            {words.map((word, index) => (
              <span
                key={`${word}-${index}`}
                ref={(element) => {
                  wordRefs.current[index] = element
                }}
                className="quote-section__word"
              >
                {word}&nbsp;
              </span>
            ))}
          </blockquote>
        </div>
      </div>
    </section>
  )
}

// ============================================================
// STATS SECTION
// ============================================================

type AnimatedNumberProps = {
  value: string
  isActive: boolean
}

function AnimatedNumber({ value, isActive }: AnimatedNumberProps) {
  const characters = useMemo(() => value.split(''), [value])

  return (
    <div className="stats__digits">
      {characters.map((character, index) => (
        <span key={`${character}-${index}`} className="stats__digit-slot">
          {/\d/.test(character) ? (
            <span className={`stats__digit-wheel${isActive ? ' is-active' : ''}`} style={{ '--digit': Number(character) } as CSSProperties}>
              {Array.from({ length: 10 }).map((_, digit) => (
                <span key={digit} className="stats__digit">
                  {digit}
                </span>
              ))}
            </span>
          ) : (
            <span className="stats__digit-static">{character}</span>
          )}
        </span>
      ))}
    </div>
  )
}

function StatsSection() {
  const { ref: sectionRef, isActive: isSectionActive } = useDeferredActivation<HTMLElement>('300px 0px')
  const [isActive, setIsActive] = useState(false)

  useEffect(() => {
    if (!isSectionActive || sectionRef.current === null) return
    const animationContext = gsap.context(() => {
      gsap.fromTo('.stats__lane', { autoAlpha: 0, y: 60 }, {
        autoAlpha: 1,
        y: 0,
        duration: 1,
        ease: 'power3.out',
        stagger: 0.14,
        scrollTrigger: { trigger: sectionRef.current, start: 'top 82%', once: true },
      })

      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: 'top 74%',
        once: true,
        onEnter: () => {
          setIsActive(true)
          gsap.fromTo('.stats__streak', { xPercent: -120, opacity: 0 }, { xPercent: 130, opacity: 1, duration: 1.6, ease: 'power2.out', stagger: 0.08 })
        },
      })
    }, sectionRef)
    return () => animationContext.revert()
  }, [isSectionActive, sectionRef])

  return (
    <section ref={sectionRef} className="stats luxury-section">
      <div className="stats__header">
        <p className="stats__eyebrow"> ARELIA IN NUMBERS</p>
        <h2>Every Number Tells a Story of Trust, Quality and Excellence.</h2>
      </div>
      <div className="stats__row">
        {stats.map((stat) => (
          <article key={stat.label} className="stats__lane" data-magnetic>
            <AnimatedNumber value={stat.value} isActive={isActive} />
            <p className="stats__label">{stat.label}</p>
            <span className="stats__streak" aria-hidden="true" />
          </article>
        ))}
      </div>
    </section>
  )
}

// ============================================================
// CLIENT TESTIMONIALS
// ============================================================

function LocalTestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <article className="client-testimonials__card" data-magnetic>
      <span className="client-testimonials__streak" aria-hidden="true" />
      <span className="client-testimonials__reflection" aria-hidden="true" />
      <div className="client-testimonials__card-inner">
        <div className="client-testimonials__image-wrap">
          <div className="client-testimonials__avatar-shell" aria-hidden="true">
            <div className="client-testimonials__avatar">{getInitials(testimonial.name)}</div>
          </div>
        </div>
        <div className="client-testimonials__copy">
          <div className="client-testimonials__stars" aria-label="5 star testimonial">
            {Array.from({ length: 5 }).map((_, index) => (
              <span key={index} className="client-testimonials__star" aria-hidden="true">
                ★
              </span>
            ))}
          </div>
          <blockquote className="client-testimonials__quote">"{testimonial.quote}"</blockquote>
          <div className="client-testimonials__meta">
            <p className="client-testimonials__name">{testimonial.name}</p>
          </div>
        </div>
      </div>
    </article>
  )
}

function ClientTestimonialsSection() {
  const { ref: sectionRef, isActive } = useDeferredActivation<HTMLElement>('300px 0px')
  const duplicated = [...testimonials, ...testimonials]

  useEffect(() => {
    if (!isActive || sectionRef.current === null) return
    const context = gsap.context(() => {
      gsap.fromTo('.client-testimonials__reveal', { autoAlpha: 0, y: 32 }, { autoAlpha: 1, y: 0, duration: 0.95, stagger: 0.1, ease: 'power3.out' })
      gsap.fromTo('.client-testimonials__row', { autoAlpha: 0, y: 28 }, { autoAlpha: 1, y: 0, duration: 1.1, stagger: 0.08, ease: 'power3.out', delay: 0.1 })
    }, sectionRef)
    return () => context.revert()
  }, [isActive, sectionRef])

  return (
    <section ref={sectionRef} className="client-testimonials luxury-section luxury-section--wide">
      <div className="client-testimonials__backlight" aria-hidden="true" />
      <div className="client-testimonials__dust client-testimonials__dust--one" aria-hidden="true" />
      <div className="client-testimonials__dust client-testimonials__dust--two" aria-hidden="true" />
      <div className="client-testimonials__edge client-testimonials__edge--left" aria-hidden="true" />
      <div className="client-testimonials__edge client-testimonials__edge--right" aria-hidden="true" />
      <div className="client-testimonials__center-glow" aria-hidden="true" />

      <div className="client-testimonials__header client-testimonials__reveal">
        <p className="client-testimonials__eyebrow">VOICES THAT INSPIRE</p>
        <h2>Real People. Real Spaces. Real Stories.</h2>
        <p className="client-testimonials__subtitle">
          From modern home interiors to commercial office designs and luxury hospitality spaces , here's what our clients say about their Arelia interior design experience. 
        </p>
      </div>

      <div className="client-testimonials__marquee client-testimonials__reveal">
        <div className="client-testimonials__row client-testimonials__row--left client-testimonials__row--slow">
          <div className="client-testimonials__track">
            {duplicated.map((testimonial, index) => (
              <LocalTestimonialCard key={`${testimonial.id}-${index}`} testimonial={testimonial} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ============================================================
// CONTACT CTA
// ============================================================

function ContactCTASection({ onOpenConsultation }: { onOpenConsultation: () => void }) {
  const { ref: sectionRef, isActive } = useDeferredActivation<HTMLElement>('300px 0px')
  const backgroundRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!isActive || sectionRef.current === null || backgroundRef.current === null) return
    const animationContext = gsap.context(() => {
      gsap.fromTo('.contact-cta__reveal', { autoAlpha: 0, y: 70 }, {
        autoAlpha: 1,
        y: 0,
        duration: 1,
        ease: 'power3.out',
        stagger: 0.12,
        scrollTrigger: { trigger: sectionRef.current, start: 'top 84%', once: true },
      })
      gsap.to(backgroundRef.current, {
        yPercent: -12,
        scale: 1.08,
        ease: 'none',
        scrollTrigger: { trigger: sectionRef.current, start: 'top bottom', end: 'bottom top', scrub: 1 },
      })
    }, sectionRef)

    return () => {
      animationContext.revert()
    }
  }, [isActive, sectionRef])

  return (
    <section ref={sectionRef} className="contact-cta luxury-section luxury-section--wide">
      <div ref={backgroundRef} className="contact-cta__background" style={{ backgroundImage: `url(${CONTACT_IMAGE})` }} />
      <div className="contact-cta__overlay" />
      <div className="contact-cta__vignette" />
      <div className="contact-cta__content">
        <p className="contact-cta__eyebrow contact-cta__reveal">YOUR JOURNEY STARTS HERE</p>
        <h2 className="contact-cta__reveal">Ready to Transform Your Space, or Want to Explore More?</h2>
        <p className="contact-cta__copy contact-cta__reveal">
          Let's create a personalized interior design consultation experience that feels thoughtful, elegant, and uniquely yours , from first conversation to final handover. 
        </p>
        <button type="button" onClick={onOpenConsultation} className="contact-cta__button contact-cta__reveal" data-magnetic>
          <span className="contact-cta__button-fill" />
          <span className="contact-cta__button-label">START YOUR PROJECT</span>
        </button>
      </div>
    </section>
  )
}

// ============================================================
// PAGE ROOT
// ============================================================

export function HomePage({ onOpenConsultation }: HomePageProps) {
  return (
    <main className="home-page">
      <HomeHeroSection />
      <div className="home-page__sections">
        <WhyChooseSection />
        <DeferredSection minHeight="780px">
          <SignatureShowcaseSection />
        </DeferredSection>
        <DeferredSection minHeight="760px">
          <QuoteSectionSection />
        </DeferredSection>
        <DeferredSection minHeight="420px">
          <StatsSection />
        </DeferredSection>
        <DeferredSection minHeight="540px">
          <ClientTestimonialsSection />
        </DeferredSection>
        <DeferredSection minHeight="720px">
          <ContactCTASection onOpenConsultation={onOpenConsultation} />
        </DeferredSection>
      </div>
    </main>
  )
} 
