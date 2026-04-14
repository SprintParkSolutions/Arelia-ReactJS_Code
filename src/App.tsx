import { useEffect, useState } from 'react'
import gsap from 'gsap'
import Lenis from 'lenis'
import './App.css'
import { Route, Routes } from 'react-router-dom'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { NavigationMenu } from './components/navigationMenu/naviagationMenu'
import { VideoBackground } from './components/videoBackground/VideoBackground'
import { Loader } from './components/loader/Loader'
import defaultBackgroundVideo from './assets/arelia-global-background.mp4'
import { HomePage } from './pages/HomePage'

gsap.registerPlugin(ScrollTrigger)

const STATIC_PAGE_CONTENT = [
  {
    path: '/about-us',
    eyebrow: 'Studio Story',
    title: 'About Us',
    description:
      'Arelia is built around the belief that premium interiors should feel intentional from the first concept conversation to final handover.',
    secondaryText:
      'The studio brings together design thinking, practical execution, and a refined client experience in one clear process.',
  },
  {
    path: '/services',
    eyebrow: 'Offerings',
    title: 'Services',
    description: 'Your services page now has a dedicated route, making the navigation work cleanly in this React app.',
  },
  {
    path: '/reach-us',
    eyebrow: 'Connect',
    title: 'Reach Us',
    description:
      'Keep this page for enquiries, consultations, and any contact form or location details you want to add next.',
  },
  {
    path: '/contact',
    eyebrow: 'Connect',
    title: 'Contact',
    description:
      'Keep this page for enquiries, consultations, and any contact form or location details you want to add next.',
    secondaryText:
      'This route is also wired to the home CTA so the transition lands on a dedicated contact URL.',
  },
] satisfies Array<{
  path: string
  eyebrow?: string
  title: string
  description?: string
  secondaryText?: string
}>

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

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      {STATIC_PAGE_CONTENT.map((page) => (
        <Route
          key={page.path}
          path={page.path}
          element={
            <PageContent
              eyebrow={page.eyebrow}
              title={page.title}
              description={page.description}
              secondaryText={page.secondaryText}
            />
          }
        />
      ))}
    </Routes>
  )
}

function useAppShell(isLoading: boolean) {
  const [isAppVisible, setIsAppVisible] = useState(false)

  useEffect(() => {
    if (isLoading) {
      return
    }

    const lenis = new Lenis({
      duration: 1.18,
      smoothWheel: true,
      touchMultiplier: 1.08,
      lerp: 0.08,
    })

    let animationFrame = 0
    const handleLenisScroll = () => {
      ScrollTrigger.update()
    }

    const frameReveal = window.requestAnimationFrame(() => {
      setIsAppVisible(true)
    })

    const onAnimationFrame = (time: number) => {
      lenis.raf(time)
      animationFrame = window.requestAnimationFrame(onAnimationFrame)
    }

    lenis.on('scroll', handleLenisScroll)
    animationFrame = window.requestAnimationFrame(onAnimationFrame)

    return () => {
      window.cancelAnimationFrame(animationFrame)
      window.cancelAnimationFrame(frameReveal)
      lenis.off('scroll', handleLenisScroll)
      lenis.destroy()
      setIsAppVisible(false)
    }
  }, [isLoading])

  return isAppVisible
}

function App() {
  const [isLoading, setIsLoading] = useState(true)
  const isAppVisible = useAppShell(isLoading)

  return (
    <>
      {isLoading ? <Loader onComplete={() => setIsLoading(false)} /> : null}

      {!isLoading ? (
        <div className={`app-shell ${isAppVisible ? 'app-shell--ready' : 'app-shell--entering'}`}>
          <VideoBackground src={defaultBackgroundVideo} />
          <NavigationMenu />
          <div className="app-shell__page-frame">
            <AppRoutes />
          </div>
        </div>
      ) : null}
    </>
  )
}

export default App
