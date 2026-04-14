import { useEffect, useMemo, useState } from 'react'
import sofaIcon from '../../assets/loader/sofa.svg'
import chairIcon from '../../assets/loader/chair.svg'
import lampIcon from '../../assets/loader/lamp.svg'
import homeIcon from '../../assets/loader/home.svg'
import './Loader.css'

type LoaderProps = {
  onComplete: () => void
}

const LOADER_DURATION_MS = 2800

const loaderIcons = [
  { label: 'Sofa', src: sofaIcon },
  { label: 'Chair', src: chairIcon },
  { label: 'Lamp', src: lampIcon },
  { label: 'Home', src: homeIcon },
]

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
      completionTimer = window.setTimeout(onComplete, 520)
    }

    animationFrame = window.requestAnimationFrame(animate)

    return () => {
      window.cancelAnimationFrame(animationFrame)
      window.clearTimeout(completionTimer)
    }
  }, [onComplete])

  const roundedProgress = useMemo(() => Math.round(progress), [progress])
  const activeIndex = Math.min(loaderIcons.length - 1, Math.floor(progress / 25))

  return (
    <div className={`loader${isComplete ? ' loader--complete' : ''}`} aria-live="polite">
      <div className="loader__grain" aria-hidden="true" />
      <div className="loader__content">
        <div className="loader__icons" aria-hidden="true">
          {loaderIcons.map((icon, index) => {
            const isActive = index <= activeIndex

            return (
              <div
                key={icon.label}
                className={`loader__icon${isActive ? ' is-active' : ''}`}
                style={{ animationDelay: `${index * 0.18}s` }}
              >
                <img src={icon.src} alt="" />
              </div>
            )
          })}
        </div>

        <div className="loader__bar">
          <div className="loader__bar-fill" style={{ width: `${progress}%` }}>
            <span className="loader__bar-glow" />
          </div>
        </div>

        <p className="loader__progress">{roundedProgress}%</p>
      </div>
    </div>
  )
}
