import { useEffect, useMemo, useState } from 'react'
import './Loader.css'

type LoaderProps = {
  onComplete: () => void
  variant?: 'boot' | 'route'
  title?: string
}

const LOADER_DURATION_MS = 900
const LOADER_EXIT_DELAY_MS = 250

function easeInOutCubic(progress: number) {
  return progress < 0.5
    ? 4 * progress * progress * progress
    : 1 - Math.pow(-2 * progress + 2, 3) / 2
}

export function Loader({ onComplete, variant = 'boot', title = 'Loading private workspace' }: LoaderProps) {
  const [progress, setProgress] = useState(0)
  const [isComplete, setIsComplete] = useState(false)
  const durationMs = variant === 'route' ? 520 : LOADER_DURATION_MS

  useEffect(() => {
    let animationFrame = 0
    let completionTimer = 0
    const startTime = performance.now()
    let lastProgressUpdate = startTime

    const animate = (timestamp: number) => {
      const elapsed = timestamp - startTime
      const rawProgress = Math.min(elapsed / durationMs, 1)
      const easedProgress = easeInOutCubic(rawProgress) * 100

      if (rawProgress === 1 || timestamp - lastProgressUpdate >= 75) {
        lastProgressUpdate = timestamp
        setProgress(easedProgress)
      }

      if (rawProgress < 1) {
        animationFrame = window.requestAnimationFrame(animate)
        return
      }

      setIsComplete(true)
      completionTimer = window.setTimeout(onComplete, LOADER_EXIT_DELAY_MS)
    }

    animationFrame = window.requestAnimationFrame(animate)

    return () => {
      window.cancelAnimationFrame(animationFrame)
      window.clearTimeout(completionTimer)
    }
  }, [durationMs, onComplete])

  const roundedProgress = useMemo(() => Math.round(progress), [progress])

  return (
    <div className={`loader loader--${variant}${isComplete ? ' loader--complete' : ''}`} aria-live="polite">
      <div className="loader__grain" aria-hidden="true" />
      <div className="loader__content">
        <div className="loader__logo-container">
          <img
            src="/images/Logos/Arelia_Logo.webp"
            alt="Arelia Loading"
            className={`loader__logo ${isComplete ? 'loader__logo--launch' : ''}`}
            decoding="async"
            fetchPriority="high"
          />
          <div className="loader__logo-glow" style={{ opacity: progress / 100 }} />
        </div>

        <div className="loader__copy">
          <p className="loader__eyebrow">ARELIA CLIENT PORTAL</p>
          <p className="loader__title">{title}</p>
        </div>

        <div className="loader__bar-container">
          <div className="loader__bar">
            <div className="loader__bar-fill" style={{ width: `${progress}%` }}>
              <span className="loader__bar-highlight" />
            </div>
          </div>
          {variant === 'boot' ? <p className="loader__progress">{roundedProgress}%</p> : null}
        </div>
      </div>
    </div>
  )
}
