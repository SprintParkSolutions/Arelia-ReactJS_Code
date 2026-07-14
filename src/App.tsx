import { Suspense, lazy, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Route, Routes, useLocation } from 'react-router-dom'

import './App.css'

import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { Loader } from './components/loader/Loader'
import NavigationMenu from './components/navigationMenu/navigationMenu'
import { SocialSidebar } from './components/socialsidebar/SocialSidebar'
import { VideoBackground } from './components/videoBackground/VideoBackground'
import { ToastProvider } from './components/toast/ToastContext'
import { useAuth } from './context/AuthContext'

import { Footer } from './pages/Footer'
import { HomePage } from './pages/HomePage'
import { AboutPage } from './pages/AboutPage'
import ServicesSection from './pages/ServicesSection'
import { ContactUsPage } from './pages/ContactUsPage'
import { Login as LoginPage } from './pages/Login'
import { DashboardPage } from './pages/DashboardPage'
import { PaymentGatewayPage } from './pages/PaymentGatewayPage'
import { PaymentResultPage } from './pages/PaymentResultPage'
import { PaymentHistoryPage } from './pages/PaymentHistoryPage'
import { PaymentReceiptPage } from './pages/PaymentReceiptPage'

// FIX: Added `.then()` to handle the named export for your ConsultationModal
const ConsultationModal = lazy(() =>
  import('./components/consultation/ConsultationModal').then((module) => ({
    default: module.ConsultationModal,
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
    (location.pathname === '/dashboard' || location.pathname.startsWith('/payment')) && isAuthenticated

  useEffect(() => {
    window.dataLayer = window.dataLayer || []
    window.dataLayer.push({
      event: 'page_view',
      page_path: location.pathname,
    })
  }, [location.pathname])

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

      <ToastProvider>
      <div className={`app-shell${isLoginPage ? ' app-shell--login' : ''}`}>
        <ScrollToTop />

        {/* FIX: Changed 'videoSrc' to 'src' to match your interface */}
        <VideoBackground
          src="/videos/arelia-global-background-lite.mp4"
          posterSrc="/videos/arelia-global-background-poster.webp"
          deferMs={2500}
        />

        {!isDashboardPage ? (
          <NavigationMenu
            onOpenConsultation={() =>
              setIsConsultationOpen(true)
            }
          />
        ) : null}

        <div className="app-shell__content">
          <AnimatePresence mode="popLayout" initial={false}>
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
                transition: {
                  duration: 0.16,
                  ease: 'easeIn',
                },
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

                <Route
                  path="/payment/history"
                  element={
                    <ProtectedRoute>
                      <PaymentHistoryPage />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/payment/success/:paymentTermId"
                  element={
                    <ProtectedRoute>
                      <PaymentResultPage status="success" />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/payment/failed/:paymentTermId"
                  element={
                    <ProtectedRoute>
                      <PaymentResultPage status="failed" />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/payment/receipt/:paymentTermId"
                  element={
                    <ProtectedRoute>
                      <PaymentReceiptPage />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/payment/:paymentTermId"
                  element={
                    <ProtectedRoute>
                      <PaymentGatewayPage />
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
      </ToastProvider>
    </>
  )
}