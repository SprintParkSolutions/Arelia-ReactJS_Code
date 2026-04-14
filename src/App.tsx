import './App.css'
import { Route, Routes } from 'react-router-dom'
import { NavigationMenu } from './components/navigationMenu/naviagationMenu'
import { VideoBackground } from './components/videoBackground/VideoBackground'
import { HomePage } from './pages/HomePage'
import ServicesSection from './pages/ServicesSection'
import { AboutPage } from './pages/AboutPage'

type PageContentProps = {
  eyebrow?: string
  title: string
  description?: string
  secondaryText?: string
  actions?: string[]
  className?: string
}

function PageContent({
  eyebrow,
  title,
  description,
  secondaryText,
  actions,
  className = '',
}: PageContentProps) {
  return (
    <main className={`page ${className}`.trim()}>
      <div className="page__inner">
        {eyebrow ? <p className="page__eyebrow">{eyebrow}</p> : null}
        <h1 className="page__title">{title}</h1>
        {description ? <p className="page__description">{description}</p> : null}
        {secondaryText ? <p className="page__secondary">{secondaryText}</p> : null}
        {actions?.length ? (
          <div className="page__actions" aria-label="Hero highlights">
            {actions.map((action) => (
              <span key={action} className="page__action-pill">
                {action}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </main>
  )
}

function App() {
  return (
    <div className="app-shell">
      <VideoBackground src="/videos/arelia-global-background.mp4" />
      <NavigationMenu />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/about-us" element={<AboutPage />} />
        <Route path="/services" element={<ServicesSection />} />
        <Route
          path="/projects"
          element={
            <PageContent
              eyebrow="Offerings"
              title="Projects"
              description="Your projects page now has a dedicated route, making the navigation work cleanly in this React app."
            />
          }
        />
        <Route
          path="/reach-us"
          element={
            <PageContent
              eyebrow="Connect"
              title="Reach Us"
              description="Keep this page for enquiries, consultations, and any contact form or location details you want to add next."
            />
          }
        />
      </Routes>
    </div>
  )
}

export default App
