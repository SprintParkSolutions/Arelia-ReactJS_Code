import { LayoutGroup, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import type { Variants } from 'framer-motion'
import areliaLogo from '../../assets/Arelia_Logo.png'
import './naviagationMenu.css'

const navItems = [
  { label: 'Home', path: '/' },
  { label: 'About Us', path: '/about-us' },
  { label: 'Services', path: '/services' },
  { label: 'Projects', path: '/projects' },
  { label: 'Reach Us', path: '/reach-us' },
]

export function NavigationMenu() {
  const navigate = useNavigate()
  const location = useLocation()
  const [isExpanded, setIsExpanded] = useState(false)
  const [showItems, setShowItems] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const expandTimer = window.setTimeout(() => setIsExpanded(true), 800)
    const itemsTimer = window.setTimeout(() => setShowItems(true), 1250)

    return () => {
      window.clearTimeout(expandTimer)
      window.clearTimeout(itemsTimer)
    }
  }, [])

  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [location.pathname])

  const activeIndex = navItems.findIndex((item) => item.path === location.pathname)

  const staggerContainer: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.08 } },
  }

  const navItemWrapper: Variants = {
    hidden: { opacity: 0, y: 12 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.45, ease: 'easeOut' },
    },
  }

  const lineVariant: Variants = {
    hidden: { scaleX: 0, opacity: 0 },
    visible: {
      scaleX: [0, 1, 1, 0],
      opacity: [0, 1, 1, 0],
      transition: {
        duration: 1.1,
        times: [0, 0.25, 0.75, 1],
        ease: 'easeInOut',
      },
    },
  }

  const textVariant: Variants = {
    hidden: { opacity: 0, y: 8 },
    visible: {
      opacity: [0, 0, 1, 1],
      y: [8, 8, 0, 0],
      transition: {
        duration: 1.1,
        times: [0, 0.25, 0.6, 1],
        ease: 'easeOut',
      },
    },
  }

  const buttonRevealItem: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
    },
  }

  return (
    <motion.nav
      initial={false}
      animate={{ width: isExpanded ? 'min(95%, 1200px)' : '220px' }}
      transition={{ duration: 1.4, ease: [0.77, 0, 0.175, 1] }}
      className="navigation-menu"
    >
      <div className="navigation-menu__pattern" aria-hidden="true">
        <motion.div
          className="navigation-menu__pattern-sweep"
          animate={{ x: ['0%', '-10%'], y: ['0%', '-10%'] }}
          transition={{ duration: 15, ease: 'linear', repeat: Number.POSITIVE_INFINITY }}
        />
        <div className="navigation-menu__pattern-fade" />
      </div>

      <div className="navigation-menu__header">
        <motion.button
          type="button"
          initial={{
            opacity: 0,
            filter: 'blur(12px)',
            scale: 1.08,
            left: '50%',
            x: '-50%',
            y: '-50%',
            top: '50%',
          }}
          animate={{
            opacity: 1,
            filter: 'blur(0px)',
            scale: 1,
            left: isExpanded ? '32px' : '50%',
            x: isExpanded ? '0%' : '-50%',
            y: '-50%',
            top: '50%',
          }}
          transition={{
            opacity: { duration: 1.2, ease: 'easeOut' },
            filter: { duration: 1.2, ease: 'easeOut' },
            scale: { duration: 1.2, ease: [0.16, 1, 0.3, 1] },
            left: { duration: 1.4, ease: [0.77, 0, 0.175, 1], delay: 0.2 },
            x: { duration: 1.4, ease: [0.77, 0, 0.175, 1], delay: 0.2 },
          }}
          className="navigation-menu__brand"
          onClick={() => navigate('/')}
          aria-label="Go to home"
        >
          <img
            className="navigation-menu__brand-image"
            src={areliaLogo}
            alt="Arelia"
          />
        </motion.button>

        <button
          type="button"
          className={`navigation-menu__toggle${isMobileMenuOpen ? ' is-open' : ''}`}
          onClick={() => setIsMobileMenuOpen((current) => !current)}
          aria-expanded={isMobileMenuOpen}
          aria-controls="navigation-menu-links"
          aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      <div
        id="navigation-menu-links"
        className={`navigation-menu__content${isMobileMenuOpen ? ' is-open' : ''}`}
      >
        <motion.div
          className="navigation-menu__motion-wrap"
          variants={staggerContainer}
          initial="hidden"
          animate={showItems ? 'visible' : 'hidden'}
        >
          <LayoutGroup>
            <ul className="navigation-menu__list">
              {navItems.map((item, index) => {
                const isActive = index === activeIndex

                return (
                  <motion.li
                    key={item.path}
                    variants={navItemWrapper}
                    className="navigation-menu__item"
                    onClick={() => {
                      navigate(item.path)
                      setIsMobileMenuOpen(false)
                    }}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="nav-highlight"
                        className="navigation-menu__item-highlight"
                        initial={{ opacity: 0, scale: 0.85 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ type: 'spring', stiffness: 350, damping: 30, mass: 0.9 }}
                      />
                    )}

                    <motion.div
                      variants={lineVariant}
                      className="navigation-menu__item-line"
                    />

                    <motion.span
                      variants={textVariant}
                      className={`navigation-menu__item-label${isActive ? ' is-active' : ''}`}
                    >
                      {item.label}
                    </motion.span>
                  </motion.li>
                )
              })}
            </ul>
          </LayoutGroup>

          <motion.div variants={buttonRevealItem} className="navigation-menu__cta-wrap">
            <button
              type="button"
              className="navigation-menu__cta"
              onClick={() => {
                navigate('/reach-us')
                setIsMobileMenuOpen(false)
              }}
            >
              <motion.div
                className="navigation-menu__cta-glint"
                animate={{ left: ['-50%', '150%'] }}
                transition={{
                  duration: 2.5,
                  ease: 'easeInOut',
                  repeat: Number.POSITIVE_INFINITY,
                  repeatDelay: 3,
                }}
              />
              <div className="navigation-menu__cta-overlay" />
              <span className="navigation-menu__cta-label">Book Consultation</span>
            </button>
          </motion.div>
        </motion.div>
      </div>
    </motion.nav>
  )
}
