import { useEffect, useState } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import './App.css'
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

  return (
    <>
      {isLoading ? <Loader onComplete={() => setIsLoading(false)} /> : null}

      {!isLoading ? (
        <div className="app-shell">
          <ScrollToTop />
          <VideoBackground src="/videos/arelia-global-background.mp4" />
          <NavigationMenu />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/about-us" element={<AboutPage />} />
            <Route path="/services" element={<ServicesSection />} />
            <Route path="/contact-us" element={<ContactUsPage />} />
          </Routes>
          <Footer />
        </div>
      ) : null}
    </>
  )
}