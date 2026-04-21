import { useEffect, useMemo, useState } from 'react'
import './Loader.css'

type LoaderProps = {
  onComplete: () => void
}

const LOADER_DURATION_MS = 2800

function easeInOutCubic(progress: number) {
  return progress < 0.5
    ? 4 * progress * progress * progress
    : 1 - Math.pow(-2 * progress + 2, 3) / 2
}

export function Loader({ onComplete }: LoaderProps) {
  const [progress, setProgress] = useState(0)
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    let animationFrame = 0
    let completionTimer = 0
    const startTime = performance.now()

    const animate = (timestamp: number) => {
      const elapsed = timestamp - startTime
      const rawProgress = Math.min(elapsed / LOADER_DURATION_MS, 1)
      const easedProgress = easeInOutCubic(rawProgress) * 100

      setProgress(easedProgress)

      if (rawProgress < 1) {
        animationFrame = window.requestAnimationFrame(animate)
        return
      }

      setIsComplete(true)
      // Extended slightly for a graceful exit transition
      completionTimer = window.setTimeout(onComplete, 800) 
    }

    animationFrame = window.requestAnimationFrame(animate)

    return () => {
      window.cancelAnimationFrame(animationFrame)
      window.clearTimeout(completionTimer)
    }
  }, [onComplete])

  const roundedProgress = useMemo(() => Math.round(progress), [progress])

  return (
    <div className={`loader${isComplete ? ' loader--complete' : ''}`} aria-live="polite">
      <div className="loader__grain" aria-hidden="true" />
      <div className="loader__content">
        
        {/* Cinematic Logo Reveal */}
        <div className="loader__logo-container">
            <img 
              src="/images/Logos/Arelia_Logo.png" 
              alt="Arelia Loading" 
              className={`loader__logo ${isComplete ? 'loader__logo--launch' : ''}`}
            />
            <div className="loader__logo-glow" style={{ opacity: progress / 100 }} />
        </div>

        <div className="loader__bar-container">
          <div className="loader__bar">
            <div className="loader__bar-fill" style={{ width: `${progress}%` }}>
              <span className="loader__bar-highlight" />
            </div>
          </div>
          <p className="loader__progress">{roundedProgress}%</p>
        </div>

      </div>
    </div>
  )
}