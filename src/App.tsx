import './App.css'
import { Route, Routes } from 'react-router-dom'
import { NavigationMenu } from './components/navigationMenu/naviagationMenu'
import { VideoBackground } from './components/videoBackground/VideoBackground'
import defaultBackgroundVideo from './assets/arelia-global-background.mp4'
import { HomePage } from './pages/HomePage'
import ServicesSection from './pages/ServicesSection'

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
      <VideoBackground src={defaultBackgroundVideo} />
      <NavigationMenu />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route
          path="/about-us"
          element={
            <PageContent
              eyebrow="Studio Story"
              title="About Us"
              description="Arelia is built around the belief that premium interiors should feel intentional from the first concept conversation to final handover."
              secondaryText="The studio brings together design thinking, practical execution, and a refined client experience in one clear process."
            />
          }
        />
        <Route
          path="/services"
          element={<ServicesSection />}
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
