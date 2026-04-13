import { VideoBackground } from '../videoBackground/VideoBackground'
import homeVideo from '../../assets/Home_Video.mp4'
import './HomeHero.css'

export function HomeHero() {
  return (
    <section className="home-hero">
      <VideoBackground src={homeVideo} isHome isSection />
      <div className="home-hero__content">
        <h1 className="home-hero__title">
          <span className="home-hero__line">Execute your dream</span>
          <span className="home-hero__line">space with</span>
          <span className="home-hero__brand">Arelia</span>
        </h1>
      </div>
    </section>
  )
}
