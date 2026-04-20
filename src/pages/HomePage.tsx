import type { CSSProperties, ReactElement, SVGProps } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { VideoBackground } from '../components/videoBackground/VideoBackground'
import './HomePage.css'

gsap.registerPlugin(ScrollTrigger)

const HOME_PAGE_IMAGES_PATH = `${import.meta.env.BASE_URL}images/Home%20Page`

const homePageImagePath = (fileName: string) =>
  `${HOME_PAGE_IMAGES_PATH}/${fileName}`

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

const SHOWCASE_IMAGE = homePageImagePath('showcase-main.jpg')
const QUOTE_BACKGROUND_LAYER = homePageImagePath('quote-background.jpg')
const QUOTE_FOREGROUND_LAYER = homePageImagePath('quote-foreground.jpg')
const QUOTE_TEXT = 'Luxury is not a stage of living, but a state of architecture.'
const CONTACT_IMAGE = homePageImagePath('contact-cta-background.jpg')

const stats = [
  { label: 'Years Experience', value: '05+' },
  { label: 'Projects Completed', value: '350+' },
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
    image: homePageImagePath('why-choose-platform-main.jpg'),
    thumbnail: homePageImagePath('why-choose-platform-thumb.jpg'),
    Icon: PlatformIcon,
  },
  {
    id: 'budget',
    number: '02',
    title: 'Control Your Budget with Clarity',
    description: 'Stay financially in control with structured estimation and real-time cost tracking.',
    image: homePageImagePath('why-choose-budget-main.jpg'),
    thumbnail: homePageImagePath('why-choose-budget-thumb.jpg'),
    Icon: BudgetIcon,
  },
  {
    id: 'transparency',
    number: '03',
    title: 'Total Transparency at Every Step',
    description: 'Track updates, milestones, and execution progress with full visibility.',
    image: homePageImagePath('why-choose-transparency-main.jpg'),
    thumbnail: homePageImagePath('why-choose-transparency-thumb.jpg'),
    Icon: TransparencyIcon,
  },
  {
    id: 'mobile',
    number: '04',
    title: 'Your Project, In Your Pocket',
    description: 'Monitor progress, updates, and communication anytime through mobile access.',
    image: homePageImagePath('why-choose-mobile-main.jpg'),
    thumbnail: homePageImagePath('why-choose-mobile-thumb.jpg'),
    Icon: MobileIcon,
  },
] as const

function HomeHeroSection() {
  return (
    <section className="home-page__hero">
      <VideoBackground src="/videos/Arelia_Home.mp4" isHome isSection />
      <div className="home-page__content">
        <h1 className="home-page__title">
          <span className="home-page__line">Execute your dream</span>
          <span className="home-page__line">space with</span>
          <span className="home-page__brand">Arelia</span>
        </h1>
      </div>
    </section>
  )
}

function WhyChooseSection() {
  const sectionRef = useRef<HTMLElement | null>(null)
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
    if (!sectionRef.current || !cardRef.current || !contentRef.current || !imageLayerRef.current || !navRef.current) {
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
  }, [])

  useEffect(() => {
    if (!contentRef.current || !imageLayerRef.current || !activeImageRef.current || !detailImageRef.current || !navRef.current) {
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
  }, [activeIndex])

  useEffect(() => {
    if (isAutoPaused) {
      return
    }

    const intervalId = window.setInterval(() => {
      setActiveIndex((currentIndex) => (currentIndex + 1) % whyChooseFeatures.length)
    }, 1800)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [isAutoPaused])

  const activeFeature = whyChooseFeatures[activeIndex]

  return (
    <section ref={sectionRef} className={`why-choose-luxe luxury-section--wide${isAutoPaused ? '' : ' is-auto-cycling'}`}>
      <div className="why-choose-luxe__backlight" aria-hidden="true" />
      <div className="why-choose-luxe__shell" aria-hidden="true" />
      <div className="why-choose-luxe__inner">
        <header className="why-choose-luxe__header why-choose-luxe__reveal">
          <p className="why-choose-luxe__eyebrow">Why Choose Arelia</p>
          <h2 className="why-choose-luxe__headline">A calmer, richer way to experience an interior project.</h2>
          <p className="why-choose-luxe__subtitle">
            A refined command layer built to make planning, visibility, and execution feel beautifully effortless.
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

function SignatureShowcaseSection() {
  const sectionRef = useRef<HTMLElement | null>(null)
  const imageRef = useRef<HTMLDivElement | null>(null)
  const introTextRef = useRef<HTMLDivElement | null>(null)
  const feature1Ref = useRef<HTMLDivElement | null>(null)
  const feature2Ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!sectionRef.current || !imageRef.current) return
    const animationContext = gsap.context(() => {
      // Image entrance
      gsap.fromTo(imageRef.current, 
        { autoAlpha: 0, scale: 0.92 },
        { autoAlpha: 1, scale: 1, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: sectionRef.current, start: 'top 75%', once: true } }
      )
      
      // Intro text reveal on scroll
      if (introTextRef.current) {
        gsap.fromTo(introTextRef.current, 
          { autoAlpha: 0, y: 30 },
          { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power3.out', scrollTrigger: { trigger: introTextRef.current, start: 'top 85%', once: true } }
        )
      }
      
      // Features stagger entrance
      gsap.fromTo([feature1Ref.current, feature2Ref.current],
        { autoAlpha: 0, y: 30 },
        { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power3.out', stagger: 0.15, scrollTrigger: { trigger: sectionRef.current, start: 'top 70%', once: true } }
      )
      
      // Image parallax on scroll (subtle)
      gsap.to(imageRef.current, {
        y: -20,
        ease: 'none',
        scrollTrigger: { trigger: sectionRef.current, start: 'top center', end: 'bottom center', scrub: 1 }
      })
    }, sectionRef)
    return () => animationContext.revert()
  }, [])

  return (
    <section ref={sectionRef} className="signature-showcase luxury-section">
      <div className="signature-showcase__background" />
      
      <div className="signature-showcase__container">
        {/* Main Content Grid */}
        <div className="signature-showcase__content">
          {/* Image Section - Left Side */}
          <div ref={imageRef} className="signature-showcase__image-container">
            <div className="signature-showcase__image-frame">
              <div className="signature-showcase__image-glow" />
              <div className="signature-showcase__image-media" style={{ backgroundImage: `url(${SHOWCASE_IMAGE})` }} />
              <div className="signature-showcase__image-overlay" />
              <div className="signature-showcase__image-edge" />
              <div className="signature-showcase__image-shine" />
            </div>
          </div>

          {/* Right-Side Content Area - Sticky Text Flow */}
          <div className="signature-showcase__right-content">
            {/* Intro Section - Top */}
            <div ref={introTextRef} className="signature-showcase__intro-text">
              <p className="signature-showcase__eyebrow">Arelia Standard</p>
              <h2 className="signature-showcase__title">The precision of craft, the poetry of space.</h2>
              <p className="signature-showcase__subtitle">Every project is orchestrated with cinematic attention to detail.</p>
            </div>

            {/* Features Section - Bottom Flow */}
            <div className="signature-showcase__features">
              {/* Feature 01 */}
              <div ref={feature1Ref} className="signature-showcase__feature">
                <div className="signature-showcase__feature-marker">01</div>
                <div className="signature-showcase__feature-header">
                  <h3 className="signature-showcase__feature-title">Refined Coordination</h3>
                  <div className="signature-showcase__feature-divider" />
                </div>
                <p className="signature-showcase__feature-text">Every vendor, decision, and milestone is orchestrated with the same care as the final aesthetic. Coordination that feels seamless.</p>
                <div className="signature-showcase__feature-accent" />
              </div>

              {/* Feature 02 */}
              <div ref={feature2Ref} className="signature-showcase__feature">
                <div className="signature-showcase__feature-marker">02</div>
                <div className="signature-showcase__feature-header">
                  <h3 className="signature-showcase__feature-title">Measured Luxury</h3>
                  <div className="signature-showcase__feature-divider" />
                </div>
                <p className="signature-showcase__feature-text">Budgets stay visible, approvals stay elegant, and every touchpoint feels polished instead of rushed. Transparency with sophistication.</p>
                <div className="signature-showcase__feature-accent" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function QuoteSectionSection() {
  const sectionRef = useRef<HTMLElement | null>(null)
  const backgroundRef = useRef<HTMLDivElement | null>(null)
  const foregroundRef = useRef<HTMLDivElement | null>(null)
  const wordRefs = useRef<Array<HTMLSpanElement | null>>([])
  const words = useMemo(() => QUOTE_TEXT.split(' '), [])

  useEffect(() => {
    if (!sectionRef.current || !backgroundRef.current || !foregroundRef.current) return
    const animationContext = gsap.context(() => {
      gsap.fromTo(sectionRef.current, { autoAlpha: 0, y: 50 }, { autoAlpha: 1, y: 0, duration: 1.2, ease: 'power3.out', scrollTrigger: { trigger: sectionRef.current, start: 'top 85%', once: true } })
      gsap.to(backgroundRef.current, { yPercent: -5, ease: 'none', scrollTrigger: { trigger: sectionRef.current, start: 'top bottom', end: 'bottom top', scrub: true } })
      gsap.to(foregroundRef.current, { yPercent: -15, scale: 1.05, ease: 'none', scrollTrigger: { trigger: sectionRef.current, start: 'top bottom', end: 'bottom top', scrub: true } })
      gsap.fromTo(wordRefs.current, { autoAlpha: 0, y: 15 }, { autoAlpha: 1, y: 0, stagger: 0.05, duration: 0.8, ease: 'power2.out', scrollTrigger: { trigger: sectionRef.current, start: 'top 75%', once: true } })
    }, sectionRef)
    return () => animationContext.revert()
  }, [])

  return (
    <section ref={sectionRef} className="quote-section">
      <div ref={backgroundRef} className="quote-section__layer quote-section__layer--background" style={{ backgroundImage: `url(${QUOTE_BACKGROUND_LAYER})` }} />
      <div ref={foregroundRef} className="quote-section__layer quote-section__layer--foreground" style={{ backgroundImage: `url(${QUOTE_FOREGROUND_LAYER})` }} />
      <div className="quote-section__content">
        <div className="quote-section__quote-box">
          <p className="quote-section__eyebrow">Spatial Philosophy</p>
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
  const sectionRef = useRef<HTMLElement | null>(null)
  const [isActive, setIsActive] = useState(false)

  useEffect(() => {
    if (sectionRef.current === null) return
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
  }, [])

  return (
    <section ref={sectionRef} className="stats luxury-section">
      <div className="stats__header">
        <p className="stats__eyebrow">Measured Excellence</p>
        <h2>Numbers That Speak</h2>
      </div>
      <div className="stats__row">
        {stats.map((stat) => (
          <article key={stat.label} className="stats__lane" data-magnetic>
            <div className="stats__line" />
            <AnimatedNumber value={stat.value} isActive={isActive} />
            <p className="stats__label">{stat.label}</p>
            <span className="stats__streak" aria-hidden="true" />
          </article>
        ))}
      </div>
    </section>
  )
}

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
  const sectionRef = useRef<HTMLElement | null>(null)
  const duplicated = [...testimonials, ...testimonials]

  useEffect(() => {
    if (sectionRef.current === null) return
    const context = gsap.context(() => {
      gsap.fromTo('.client-testimonials__reveal', { autoAlpha: 0, y: 32 }, { autoAlpha: 1, y: 0, duration: 0.95, stagger: 0.1, ease: 'power3.out' })
      gsap.fromTo('.client-testimonials__row', { autoAlpha: 0, y: 28 }, { autoAlpha: 1, y: 0, duration: 1.1, stagger: 0.08, ease: 'power3.out', delay: 0.1 })
    }, sectionRef)
    return () => context.revert()
  }, [])

  return (
    <section ref={sectionRef} className="client-testimonials luxury-section luxury-section--wide">
      <div className="client-testimonials__backlight" aria-hidden="true" />
      <div className="client-testimonials__dust client-testimonials__dust--one" aria-hidden="true" />
      <div className="client-testimonials__dust client-testimonials__dust--two" aria-hidden="true" />
      <div className="client-testimonials__edge client-testimonials__edge--left" aria-hidden="true" />
      <div className="client-testimonials__edge client-testimonials__edge--right" aria-hidden="true" />
      <div className="client-testimonials__center-glow" aria-hidden="true" />

      <div className="client-testimonials__header client-testimonials__reveal">
        <p className="client-testimonials__eyebrow">Client Stories</p>
        <h2>Real spaces. Real trust. Real confidence in the process.</h2>
        <p className="client-testimonials__subtitle">
          A seamless stream of client stories that keeps credibility in motion, just like the rest of the experience.
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

function ContactCTASection({ onOpenConsultation }: { onOpenConsultation: () => void }) {
  const sectionRef = useRef<HTMLElement | null>(null)
  const backgroundRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (sectionRef.current === null || backgroundRef.current === null) return
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
  }, [])

  return (
    <section ref={sectionRef} className="contact-cta luxury-section luxury-section--wide">
      <div ref={backgroundRef} className="contact-cta__background" style={{ backgroundImage: `url(${CONTACT_IMAGE})` }} />
      <div className="contact-cta__overlay" />
      <div className="contact-cta__vignette" />
      <div className="contact-cta__content">
        <p className="contact-cta__eyebrow contact-cta__reveal">Begin The Conversation</p>
        <h2 className="contact-cta__reveal">Ready to get started, or want to know more?</h2>
        <p className="contact-cta__copy contact-cta__reveal">
          Let&apos;s shape a project experience that feels cinematic from first impression to final reveal.
        </p>
        <button type="button" onClick={onOpenConsultation} className="contact-cta__button contact-cta__reveal" data-magnetic>
          <span className="contact-cta__button-fill" />
          <span className="contact-cta__button-label">Book Consultation</span>
        </button>
      </div>
    </section>
  )
}

export function HomePage({ onOpenConsultation }: HomePageProps) {
  return (
    <main className="home-page">
      <HomeHeroSection />
      <div className="home-page__sections">
        <WhyChooseSection />
        <SignatureShowcaseSection />
        <QuoteSectionSection />
        <StatsSection />
        <ClientTestimonialsSection />
        <ContactCTASection onOpenConsultation={onOpenConsultation} />
      </div>
    </main>
  )
}
