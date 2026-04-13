import { useEffect, useRef } from 'react'
import './VideoBackground.css'

type VideoBackgroundProps = {
  src: string
  isHome?: boolean
  isSection?: boolean
}

export function VideoBackground({
  src,
  isHome = false,
  isSection = false,
}: VideoBackgroundProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)

  useEffect(() => {
    const videoElement = videoRef.current

    if (!videoElement) {
      return
    }

    videoElement.load()

    const playPromise = videoElement.play()

    if (playPromise) {
      playPromise.catch(() => {
        // Some browsers may block autoplay until the element is ready.
      })
    }
  }, [src])

  return (
    <div
      className={`video-background${isSection ? ' video-background--section' : ''}`}
      aria-hidden="true"
    >
      <video
        key={src}
        ref={videoRef}
        className={`video-background__media${isHome ? ' video-background__media--home' : ''}`}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
      >
        <source src={src} type="video/mp4" />
      </video>
      <div
        className={`video-background__overlay${isHome ? ' video-background__overlay--home' : ''}`}
      />
    </div>
  )
}
