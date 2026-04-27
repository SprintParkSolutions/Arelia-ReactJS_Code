import { useEffect, useMemo, useRef, useState } from 'react'
import './VideoBackground.css'

type VideoBackgroundProps = {
  src: string
  posterSrc?: string
  isHome?: boolean
  isSection?: boolean
  deferMs?: number
}

export function VideoBackground({
  src,
  posterSrc,
  isHome = false,
  isSection = false,
  deferMs = 0,
}: VideoBackgroundProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [shouldLoadVideo, setShouldLoadVideo] = useState(false)
  const [isVideoReady, setIsVideoReady] = useState(false)
  const shouldReduceMotion = useMemo(() => {
    if (typeof window === 'undefined') {
      return false
    }

    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }, [])

  useEffect(() => {
    if (shouldReduceMotion) {
      return
    }

    let timeoutId = 0

    const queueLoad = () => {
      setShouldLoadVideo(true)
    }

    if (deferMs > 0) {
      timeoutId = window.setTimeout(queueLoad, deferMs)
    } else {
      queueLoad()
    }

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [deferMs, shouldReduceMotion])

  useEffect(() => {
    if (!shouldLoadVideo) {
      return
    }

    const videoElement = videoRef.current

    if (!videoElement) {
      return
    }

    const tryPlay = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
        return
      }

      const playPromise = videoElement.play()

      if (playPromise) {
        playPromise
          .then(() => {
            setIsVideoReady(true)
          })
          .catch(() => {
            // Some browsers may block autoplay until the element is fully ready.
          })
      }
    }

    const handleReadyToPlay = () => {
      setIsVideoReady(true)
      tryPlay()
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        tryPlay()
      }
    }

    const handlePageShow = () => {
      tryPlay()
    }

    // Reinforce autoplay-related flags at the DOM level for Safari/iOS reliability.
    videoElement.autoplay = true
    videoElement.loop = true
    videoElement.muted = true
    videoElement.defaultMuted = true
    videoElement.playsInline = true
    videoElement.preload = 'auto'
    videoElement.setAttribute('autoplay', '')
    videoElement.setAttribute('loop', '')
    videoElement.setAttribute('muted', '')
    videoElement.setAttribute('playsinline', '')
    videoElement.setAttribute('webkit-playsinline', '')

    videoElement.load()
    videoElement.addEventListener('loadedmetadata', handleReadyToPlay)
    videoElement.addEventListener('loadeddata', handleReadyToPlay)
    videoElement.addEventListener('canplay', handleReadyToPlay)
    videoElement.addEventListener('playing', handleReadyToPlay)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('pageshow', handlePageShow)

    tryPlay()

    return () => {
      videoElement.removeEventListener('loadedmetadata', handleReadyToPlay)
      videoElement.removeEventListener('loadeddata', handleReadyToPlay)
      videoElement.removeEventListener('canplay', handleReadyToPlay)
      videoElement.removeEventListener('playing', handleReadyToPlay)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('pageshow', handlePageShow)
    }
  }, [shouldLoadVideo, src])

  return (
    <div
      className={`site-video-background${isSection ? ' site-video-background--section' : ' site-video-background--fixed'}`}
      aria-hidden="true"
    >
      {posterSrc ? (
        <div
          className={`site-video-background__poster${isVideoReady ? ' site-video-background__poster--hidden' : ''}`}
          style={{ backgroundImage: `url(${posterSrc})` }}
        />
      ) : null}
      {shouldLoadVideo ? (
        <video
          ref={videoRef}
          className={`site-video-background__media${isHome ? ' site-video-background__media--home' : ''}`}
          autoPlay={true}
          loop={true}
          muted={true}
          playsInline={true}
          preload="auto"
        >
          <source src={src} type="video/mp4" />
        </video>
      ) : null}
      <div
        className={`site-video-background__overlay${isHome ? ' site-video-background__overlay--home' : ''}`}
      />
    </div>
  )
}
