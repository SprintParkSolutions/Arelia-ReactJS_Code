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

    const tryPlay = () => {
      const playPromise = videoElement.play()

      if (playPromise) {
        playPromise.catch(() => {
          // Some browsers may block autoplay until the element is fully ready.
        })
      }
    }

    // Reinforce autoplay-related flags at the DOM level for Safari/iOS reliability.
    videoElement.muted = true
    videoElement.defaultMuted = true
    videoElement.playsInline = true
    videoElement.setAttribute('muted', '')
    videoElement.setAttribute('playsinline', '')
    videoElement.setAttribute('webkit-playsinline', '')

    videoElement.load()
    videoElement.addEventListener('canplay', tryPlay)

    tryPlay()

    return () => {
      videoElement.removeEventListener('canplay', tryPlay)
    }
  }, [src])

  return (
    <div
      className={`site-video-background${isSection ? ' site-video-background--section' : ' site-video-background--fixed'}`}
      aria-hidden="true"
    >
      <video
        ref={videoRef}
        className={`site-video-background__media${isHome ? ' site-video-background__media--home' : ''}`}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
      >
        <source src={src} type="video/mp4" />
      </video>
      <div
        className={`site-video-background__overlay${isHome ? ' site-video-background__overlay--home' : ''}`}
      />
    </div>
  )
}
