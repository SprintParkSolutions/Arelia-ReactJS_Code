import { ArrowIcon } from '../components/ArrowIcon'
import { ExploreLink } from '../components/ExploreLink'
import { serviceCategories, type ServiceCategory } from './serviceCategories'
import './ServiceCategoryPage.css'

type Props = { category: ServiceCategory; onOpenConsultation: () => void }

export function ServiceCategoryPage({ category, onOpenConsultation }: Props) {
  const service = serviceCategories[category]
  const planningImage = service.spaces[1]

  return (
    <main className="service-detail">
      <div className="service-detail__shell">
        <section className="service-detail__hero" aria-labelledby="service-title">
          <div className="service-detail__intro">
            <p className="service-detail__eyebrow">{service.label} interior design</p>
            <h1 id="service-title">{service.title}</h1>
            <p>{service.intro}</p>
            <div className="service-detail__actions">
              <button type="button" className="service-detail__button" onClick={onOpenConsultation}>Discuss your project <ArrowIcon /></button>
              <ExploreLink label="Explore the spaces" href="#spaces" direction="down" />
            </div>
          </div>
          <figure className="service-detail__image">
            <img src={service.image} alt={service.imageAlt} width="960" height="640" fetchPriority="high" />
          </figure>
        </section>

        <section id="spaces" className="service-detail__spaces" aria-labelledby="spaces-title">
          <div className="service-detail__section-head">
            <div><p className="service-detail__eyebrow">Designed around your needs</p><h2 id="spaces-title">Spaces we can shape for you</h2></div>
          </div>
          <div className="service-detail__grid">
            {service.spaces.map((space, index) => (
              <article className="service-detail__card" key={space.title}>
                <figure className="service-detail__card-image">
                  <img src={space.image} alt={`${space.title} interior design concept`} width="960" height="640" loading="lazy" decoding="async" />
                  <figcaption>Design concept</figcaption>
                </figure>
                <div className="service-detail__card-body">
                  <span className="service-detail__number" aria-hidden="true">0{index + 1}</span>
                  <h3>{space.title}</h3>
                  <p>{space.description}</p>
                  <ul aria-label={`${space.title} design details`}>
                    {space.details.split(' / ').map(detail => <li key={detail}>{detail}</li>)}
                  </ul>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="service-detail__planning" aria-labelledby="planning-title">
          <figure className="service-detail__planning-image">
            <img src={planningImage.image} alt={`${planningImage.title} interior design concept`} width="960" height="640" loading="lazy" decoding="async" />
          </figure>
          <div className="service-detail__planning-copy">
            <p className="service-detail__eyebrow">Your next chapter starts here</p>
            <h2 id="planning-title">Let's plan your {category === 'residential' ? 'home' : category === 'commercial' ? 'business space' : 'guest experience'}.</h2>
            <p>{service.planning}</p>
            <ol className="service-detail__planning-steps" aria-label="What we will discuss">
              <li><span>01</span>Your space & priorities</li>
              <li><span>02</span>Design direction & finishes</li>
              <li><span>03</span>Budget & next steps</li>
            </ol>
            <div className="service-detail__planning-actions">
              <button type="button" className="service-detail__button" onClick={onOpenConsultation}>Book a consultation <ArrowIcon /></button>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
