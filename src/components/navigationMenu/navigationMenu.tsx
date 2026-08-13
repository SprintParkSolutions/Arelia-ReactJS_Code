import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { FiLogOut, FiMenu, FiPhone, FiUser, FiX } from 'react-icons/fi'
import { useLocation, useNavigate } from 'react-router-dom'
import { dashboardTabs } from '../../constants/dashboardTabs'
import { useAuth } from '../../context/AuthContext'
import { LogoutModal } from '../auth/LogoutModal'
import './navigationMenu.css'

const publicNavItems = [
  { label: 'Home', path: '/' },
  { label: 'About Us', path: '/about-us' },
  { label: 'Services', path: '/services' },
  { label: 'Contact Us', path: '/contact-us' },
]

const logoSrc = '/images/Logos/Arelia.png'
const phoneHref = 'tel:+917207845556'

function getInitials(fullName: string) {
  return fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

export default function NavigationMenu() {
  const navigate = useNavigate()
  const location = useLocation()
  const pathname = location.pathname
  const isLoginPage = pathname === '/login'
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < 1024,
  )
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false)
  const { activeDashboardTab, client, isAuthenticated, logout, setActiveDashboardTab } = useAuth()

  useEffect(() => {
    const handleResize = () => {
      const nextIsMobile = window.innerWidth < 1024
      setIsMobile(nextIsMobile)
      if (!nextIsMobile) setIsMobileMenuOpen(false)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const displayName = client?.name || 'Client'
  const initials = getInitials(displayName) || 'CL'

  const handleBrandClick = () => {
    if (isAuthenticated) {
      setActiveDashboardTab('profile')
      navigate('/dashboard')
      setIsMobileMenuOpen(false)
      return
    }

    navigate('/')
  }

  const handleLogoutConfirm = () => {
    setIsLogoutModalOpen(false)
    setIsMobileMenuOpen(false)
    logout()
    navigate('/login', { replace: true })
  }

  const handleDashboardTabClick = (tabId: (typeof dashboardTabs)[number]['id']) => {
    setActiveDashboardTab(tabId)
    if (pathname !== '/dashboard') {
      navigate('/dashboard')
    }
    setIsMobileMenuOpen(false)
  }

  const renderPublicLinks = (isMobileDrawer = false) => (
    <ul className={isMobileDrawer ? 'navigationMenu__drawerLinks' : 'navigationMenu__links'}>
      {publicNavItems.map((item) => {
        const isActive = pathname === item.path
        return (
          <li key={item.path} className="navigationMenu__item">
            <button
              type="button"
              className={`navigationMenu__link${isActive ? ' is-active' : ''}${isMobileDrawer ? ' navigationMenu__link--drawer' : ''}`}
              onClick={() => {
                navigate(item.path)
                setIsMobileMenuOpen(false)
              }}
            >
              {!isMobileDrawer && isActive ? (
                <motion.span
                  layoutId="navigationMenuPublicActivePill"
                  className="navigationMenu__activePill navigationMenu__activePill--public"
                  transition={{ type: 'spring', stiffness: 380, damping: 34 }}
                />
              ) : null}
              <span className="navigationMenu__linkLabel">{item.label}</span>
            </button>
          </li>
        )
      })}
    </ul>
  )

  const renderDashboardLinks = (isMobileDrawer = false) => (
    <ul className={isMobileDrawer ? 'navigationMenu__drawerLinks' : 'navigationMenu__links'}>
      {dashboardTabs.map((tab) => {
        const isActive = pathname === '/dashboard' && activeDashboardTab === tab.id
        return (
          <li key={tab.id} className="navigationMenu__item">
            <button
              type="button"
              className={`navigationMenu__link navigationMenu__link--dashboard${isActive ? ' is-active' : ''}${isMobileDrawer ? ' navigationMenu__link--drawer' : ''}`}
              onClick={() => handleDashboardTabClick(tab.id)}
            >
              {!isMobileDrawer && isActive ? (
                <motion.span
                  layoutId="navigationMenuDashboardActivePill"
                  className="navigationMenu__activePill navigationMenu__activePill--dashboard"
                  transition={{ type: 'spring', stiffness: 380, damping: 34 }}
                />
              ) : null}
              <span className="navigationMenu__linkLabel">{tab.label}</span>
            </button>
          </li>
        )
      })}
    </ul>
  )

  return (
    <>
      <LogoutModal
        isOpen={isLogoutModalOpen}
        onCancel={() => setIsLogoutModalOpen(false)}
        onConfirm={handleLogoutConfirm}
      />

      <div
        className={`navigationMenu ${
          isLoginPage
            ? 'navigationMenu--login'
            : isAuthenticated
              ? 'navigationMenu--authenticated'
              : 'navigationMenu--public'
        }`}
      >
        <div
          className={`navigationMenu__bar ${
            isLoginPage
              ? 'navigationMenu__bar--login'
              : isAuthenticated
                ? 'navigationMenu__bar--authenticated'
                : 'navigationMenu__bar--public'
          }`}
        >
          <button
            type="button"
            className="navigationMenu__brand"
            onClick={handleBrandClick}
            aria-label={isAuthenticated ? 'Go to dashboard' : 'Go to home page'}
          >
            <img
              src={logoSrc}
              alt="Arelia logo"
              className="navigationMenu__brandLogo"
              draggable={false}
            />
            <div className="navigationMenu__brandCopy">
              <span className="navigationMenu__brandTitle">ARELIA</span>
              {isAuthenticated ? (
                <span className="navigationMenu__brandSubtitle">Client Portal</span>
              ) : null}
            </div>
          </button>

          {!isMobile && !isLoginPage ? (
            <>
              {!isAuthenticated ? (
                renderPublicLinks()
              ) : (
                renderDashboardLinks()
              )}

              <div className="navigationMenu__actions">
                {!isAuthenticated ? (
                  <>
                    <button
                      type="button"
                      className="navigationMenu__action"
                      onClick={() => navigate('/account')}
                    >
                      <FiUser aria-hidden="true" />
                      Sign In / Sign Up
                    </button>
                    <a href={phoneHref} className="navigationMenu__iconButton" aria-label="Call Arelia">
                      <FiPhone aria-hidden="true" />
                    </a>
                  </>
                ) : (
                  <>
                    <div className="navigationMenu__profileCard">
                      <span className="navigationMenu__avatar" aria-hidden="true">
                        {initials}
                      </span>
                      <div className="navigationMenu__profileCopy">
                        <span className="navigationMenu__profileLabel">Client</span>
                        <span className="navigationMenu__profileName">{displayName}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="navigationMenu__action navigationMenu__action--logout"
                      onClick={() => setIsLogoutModalOpen(true)}
                    >
                      <FiLogOut aria-hidden="true" />
                      <span>Logout</span>
                    </button>
                  </>
                )}
              </div>
            </>
          ) : !isLoginPage ? (
            <div className="navigationMenu__actions">
              {isAuthenticated ? (
                <div className="navigationMenu__profileCard navigationMenu__profileCard--compact">
                  <span className="navigationMenu__avatar" aria-hidden="true">
                    {initials}
                  </span>
                  <div className="navigationMenu__profileCopy">
                    <span className="navigationMenu__profileLabel">Client</span>
                    <span className="navigationMenu__profileName">{displayName}</span>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  className="navigationMenu__action navigationMenu__action--account"
                  onClick={() => navigate('/account')}
                >
                  <FiUser aria-hidden="true" />
                  <span>Sign In / Sign Up</span>
                </button>
              )}
              <button
                type="button"
                className="navigationMenu__menuToggle"
                onClick={() => setIsMobileMenuOpen((value) => !value)}
                aria-expanded={isMobileMenuOpen}
                aria-label="Toggle navigation menu"
              >
                {isMobileMenuOpen ? <FiX aria-hidden="true" /> : <FiMenu aria-hidden="true" />}
              </button>
            </div>
          ) : (
            <div className="navigationMenu__loginSpacer" aria-hidden="true" />
          )}
        </div>

        <AnimatePresence>
          {isMobile && isMobileMenuOpen && !isLoginPage ? (
            <>
              <motion.div
                className="navigationMenu__drawerBackdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMobileMenuOpen(false)}
              />
              <motion.div
                className="navigationMenu__drawer"
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              >
                {!isAuthenticated ? (
                  <>
                    {renderPublicLinks(true)}
                    <div className="navigationMenu__drawerActions">
                      <button
                        type="button"
                        className="navigationMenu__action navigationMenu__action--drawer"
                        onClick={() => {
                          navigate('/account')
                          setIsMobileMenuOpen(false)
                        }}
                      >
                        <FiUser aria-hidden="true" />
                        Sign In / Sign Up
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    {renderDashboardLinks(true)}
                    <div className="navigationMenu__drawerActions">
                      <button
                        type="button"
                        className="navigationMenu__action navigationMenu__action--logout navigationMenu__action--drawer"
                        onClick={() => setIsLogoutModalOpen(true)}
                      >
                        <FiLogOut aria-hidden="true" />
                        <span>Logout</span>
                      </button>
                    </div>
                  </>
                )}
              </motion.div>
            </>
          ) : null}
        </AnimatePresence>
      </div>
    </>
  )
}
