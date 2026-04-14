import { VideoBackground } from '../components/videoBackground/VideoBackground'
import './HomePage.css'

export function HomePage() {
  return (
    <main className="home-page">
      <section className="home-page__hero">
        <VideoBackground src="/videos/Home_Video.mp4" isHome isSection />
        <div className="home-page__content">
          <h1 className="home-page__title">
            <span className="home-page__line">Execute your dream</span>
            <span className="home-page__line">space with</span>
            <span className="home-page__brand">Arelia</span>
          </h1>
        </div>
      </section>
    </main>
  )
}
