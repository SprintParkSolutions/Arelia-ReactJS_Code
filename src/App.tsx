import { Suspense, lazy, useEffect, useState } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import './App.css'
import NavigationMenu from './components/navigationMenu/navigationMenu'
import { SocialSidebar } from './components/socialsidebar/SocialSidebar'
import { VideoBackground } from './components/videoBackground/VideoBackground'
import { Footer } from './pages/Footer'
import { Loader } from './components/loader/Loader'

const ConsultationModal = lazy(() =>
  import('./components/consultation/ConsultationModal').then((module) => ({
    default: module.ConsultationModal,
  })),
)
const HomePage = lazy(() =>
  import('./pages/HomePage').then((module) => ({ default: module.HomePage })),
)
const ServicesSection = lazy(() => import('./pages/ServicesSection'))
const AboutPage = lazy(() =>
  import('./pages/AboutPage').then((module) => ({ default: module.AboutPage })),
)
const ContactUsPage = lazy(() =>
  import('./pages/ContactUsPage').then((module) => ({ default: module.ContactUsPage })),
)

function ScrollToTop() {
  const location = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [location.pathname])

  return null
}

export default function App() {
  const [isLoading, setIsLoading] = useState(() => {
    if (typeof window === 'undefined') {
      return false
    }

    return window.sessionStorage.getItem('arelia-loader-seen') !== 'true'
  })
  const [isConsultationOpen, setIsConsultationOpen] = useState(false)

  const handleLoaderComplete = () => {
    window.sessionStorage.setItem('arelia-loader-seen', 'true')
    setIsLoading(false)
  }

  return (
    <>
      {isLoading ? <Loader onComplete={handleLoaderComplete} /> : null}

      <div className="app-shell">
        <ScrollToTop />
        <VideoBackground
          src="/videos/arelia-global-background-lite.mp4"
          posterSrc="/videos/arelia-global-background-poster.webp"
          deferMs={2500}
        />
        <NavigationMenu onOpenConsultation={() => setIsConsultationOpen(true)} />
        <Suspense fallback={<div className="app-shell__route-fallback" aria-hidden="true" />}>
          <div className="app-shell__content">
            <Routes>
              <Route
                path="/"
                element={<HomePage onOpenConsultation={() => setIsConsultationOpen(true)} />}
              />
              <Route
                path="/about-us"
                element={<AboutPage onOpenConsultation={() => setIsConsultationOpen(true)} />}
              />
              <Route
                path="/services"
                element={<ServicesSection onOpenConsultation={() => setIsConsultationOpen(true)} />}
              />
              <Route path="/contact-us" element={<ContactUsPage />} />
            </Routes>
            <Footer />
          </div>
        </Suspense>
        <Suspense fallback={null}>
          <ConsultationModal
            isOpen={isConsultationOpen}
            onClose={() => setIsConsultationOpen(false)}
          />
        </Suspense>
        {/* Global SocialSidebar - Persists across all pages */}
        <SocialSidebar />
      </div>
    </>
  )
}
