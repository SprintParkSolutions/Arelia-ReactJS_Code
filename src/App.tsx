import { Suspense, lazy, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Route, Routes, useLocation } from 'react-router-dom'

import './App.css'

import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { Loader } from './components/loader/Loader'
import NavigationMenu from './components/navigationMenu/navigationMenu'
import { SocialSidebar } from './components/socialsidebar/SocialSidebar'
import { VideoBackground } from './components/videoBackground/VideoBackground'
import { useAuth } from './context/AuthContext'

import { Footer } from './pages/Footer'

// FIX: Added `.then()` to handle the named export for your ConsultationModal
const ConsultationModal = lazy(() =>
  import('./components/consultation/ConsultationModal').then((module) => ({
    default: module.ConsultationModal,
  })),
)

const HomePage = lazy(() =>
  import('./pages/HomePage').then((module) => ({
    default: module.HomePage,
  })),
)

const AboutPage = lazy(() =>
  import('./pages/AboutPage').then((module) => ({
    default: module.AboutPage,
  })),
)

// FIX: Simplified the lazy load for ServicesSection (it uses default export)
const ServicesSection = lazy(() => import('./pages/ServicesSection'))

const ContactUsPage = lazy(() =>
  import('./pages/ContactUsPage').then((module) => ({
    default: module.ContactUsPage,
  })),
)

const LoginPage = lazy(() =>
  import('./pages/Login').then((module) => ({
    default: module.Login,
  })),
)

const DashboardPage = lazy(() =>
  import('./pages/DashboardPage').then((module) => ({
    default: module.DashboardPage,
  })),
)

function ScrollToTop() {
  const location = useLocation()

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }, [location.pathname])

  return null
}

export default function App() {
  const [isLoading, setIsLoading] = useState(
    () => typeof window !== 'undefined',
  )

  const [isConsultationOpen, setIsConsultationOpen] = useState(false)

  const { isAuthenticated } = useAuth()
  const location = useLocation()

  const isLoginPage = location.pathname === '/login'
  const isDashboardPage =
    location.pathname === '/dashboard' && isAuthenticated

  const handleLoaderComplete = () => {
    setIsLoading(false)
  }

  return (
    <>
      {isLoading ? (
        <Loader
          onComplete={handleLoaderComplete}
          title="Preparing your private client portal"
        />
      ) : null}

      <div className="app-shell">
        <ScrollToTop />

        {/* FIX: Changed 'videoSrc' to 'src' to match your interface */}
        <VideoBackground
          src="/videos/arelia-global-background-lite.mp4"
          deferMs={2500}
        />

        {!isDashboardPage ? (
          <NavigationMenu
            onOpenConsultation={() =>
              setIsConsultationOpen(true)
            }
          />
        ) : null}

        <Suspense
          fallback={
            <div
              className="app-shell__route-fallback"
              aria-hidden="true"
            >
              <div className="app-shell__routeFallbackGlass" />
            </div>
          }
        >
          <div className="app-shell__content">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={location.pathname}
                className="app-shell__routeStage"
                initial={{
                  opacity: 0,
                  y: 18,
                  filter: 'blur(12px)',
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                  filter: 'blur(0px)',
                }}
                exit={{
                  opacity: 0,
                  y: -12,
                  filter: 'blur(8px)',
                }}
                transition={{
                  duration: 0.42,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <Routes location={location}>
                  <Route
                    path="/"
                    element={
                      <HomePage
                        onOpenConsultation={() =>
                          setIsConsultationOpen(true)
                        }
                      />
                    }
                  />

                  <Route
                    path="/about-us"
                    element={
                      <AboutPage
                        onOpenConsultation={() =>
                          setIsConsultationOpen(true)
                        }
                      />
                    }
                  />

                  <Route
                    path="/services"
                    element={
                      <ServicesSection
                        onOpenConsultation={() =>
                          setIsConsultationOpen(true)
                        }
                      />
                    }
                  />

                  <Route
                    path="/contact-us"
                    element={<ContactUsPage />}
                  />

                  <Route
                    path="/login"
                    element={<LoginPage />}
                  />

                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute>
                        <DashboardPage />
                      </ProtectedRoute>
                    }
                  />
                </Routes>
              </motion.div>
            </AnimatePresence>

            {!isLoginPage && !isDashboardPage ? (
              <Footer />
            ) : null}
          </div>
        </Suspense>

        {!isAuthenticated && !isLoginPage ? (
          <SocialSidebar />
        ) : null}

        {/* FIX: Kept the modal mounted and passed isOpen prop for Framer Motion exit animations */}
        <Suspense fallback={null}>
          <ConsultationModal 
            isOpen={isConsultationOpen} 
            onClose={() => setIsConsultationOpen(false)} 
          />
        </Suspense>
      </div>
    </>
  )
}