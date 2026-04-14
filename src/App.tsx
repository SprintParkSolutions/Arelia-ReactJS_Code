import { useEffect, useState } from 'react'
import gsap from 'gsap'
import Lenis from 'lenis'
import './App.css'
import { useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { NavigationMenu } from './components/navigationMenu/naviagationMenu'
import { VideoBackground } from './components/videoBackground/VideoBackground'
import { Loader } from './components/loader/Loader'
import defaultBackgroundVideo from './assets/arelia-global-background.mp4'
import { HomePage } from './pages/HomePage'
import ServicesSection from './pages/ServicesSection'
import { AboutPage } from './pages/AboutPage'
import { ContactUsPage } from './pages/ContactUsPage'
import { Footer } from './pages/Footer'

function ScrollToTop() {
  const location = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [location.pathname])

  return null
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      {STATIC_PAGE_CONTENT.map((page) => (
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
  )
}

export default App
