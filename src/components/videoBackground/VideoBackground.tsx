import { useEffect, useMemo, useRef, useState } from 'react'
import './VideoBackground.css'

type VideoBackgroundProps = {
  src: string
  posterSrc?: string
  isHome?: boolean
  isSection?: boolean
  deferMs?: number
  disableOnMobile?: boolean
}

export function VideoBackground({
  src,
  posterSrc,
  isHome = false,
  isSection = false,
  deferMs = 0,
  disableOnMobile = false,
}: VideoBackgroundProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [shouldLoadVideo, setShouldLoadVideo] = useState(false)
  const [isVideoReady, setIsVideoReady] = useState(false)
  const shouldReduceMotion = useMemo(() => {
    if (typeof window === 'undefined') {
      return false
    }

    const connection = (navigator as Navigator & {
      connection?: { saveData?: boolean }
    }).connection

    return (
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      connection?.saveData === true
    )
  }, [])
  const shouldUsePosterOnly = useMemo(() => {
    if (typeof window === 'undefined') {
      return false
    }

    return disableOnMobile && window.matchMedia('(max-width: 768px)').matches
  }, [disableOnMobile])

  useEffect(() => {
    if (shouldReduceMotion || shouldUsePosterOnly) {
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
  }, [deferMs, shouldReduceMotion, shouldUsePosterOnly])

  useEffect(() => {
    if (!shouldLoadVideo) {
      return
    }

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

    const handleCanPlay = () => {
      setIsVideoReady(true)
      tryPlay()
    }

    // Reinforce autoplay-related flags at the DOM level for Safari/iOS reliability.
    videoElement.muted = true
    videoElement.defaultMuted = true
    videoElement.playsInline = true
    videoElement.setAttribute('muted', '')
    videoElement.setAttribute('playsinline', '')
    videoElement.setAttribute('webkit-playsinline', '')

    videoElement.load()
    videoElement.addEventListener('canplay', handleCanPlay)

    tryPlay()

    return () => {
      videoElement.removeEventListener('canplay', handleCanPlay)
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
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
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
