import { useEffect, useState } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import './App.css'
import { ConsultationModal } from './components/consultation/ConsultationModal'
import { NavigationMenu } from './components/navigationMenu/naviagationMenu'
import { VideoBackground } from './components/videoBackground/VideoBackground'
import { HomePage } from './pages/HomePage'
import ServicesSection from './pages/ServicesSection'
import { AboutPage } from './pages/AboutPage'
import { ContactUsPage } from './pages/ContactUsPage'
import { Footer } from './pages/Footer'
import { Loader } from './components/loader/Loader'

function ScrollToTop() {
  const location = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [location.pathname])

  return null
}

export default function App() {
  const [isLoading, setIsLoading] = useState(true)
  const [isConsultationOpen, setIsConsultationOpen] = useState(false)

  return (
    <>
      {isLoading ? <Loader onComplete={() => setIsLoading(false)} /> : null}

      {!isLoading ? (
        <div className="app-shell">
          <ScrollToTop />
          <VideoBackground src="/videos/arelia-global-background.mp4" />
          <NavigationMenu onOpenConsultation={() => setIsConsultationOpen(true)} />
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
          <ConsultationModal
            isOpen={isConsultationOpen}
            onClose={() => setIsConsultationOpen(false)}
          />
        </div>
      ) : null}
    </>
  )
}
