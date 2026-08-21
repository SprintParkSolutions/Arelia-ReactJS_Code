import { useEffect } from 'react'
import type { LegalPageContent } from './legalContent'
import './LegalPage.css'

type LegalPageProps = {
  content: LegalPageContent
}

const slugify = (value: string) =>
  value.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

function RichText({ text }: { text: string }) {
  const parts = text.split(/(https:\/\/areliaspace\.com\/|info@areliaspace\.com|7207845556)/g)

  return parts.map((part, index) => {
    if (part === 'https://areliaspace.com/') {
      return <a key={index} href={part} target="_blank" rel="noreferrer">{part}</a>
    }
    if (part === 'info@areliaspace.com') {
      return <a key={index} href="mailto:info@areliaspace.com">{part}</a>
    }
    if (part === '7207845556') {
      return <a key={index} href="tel:+917207845556">{part}</a>
    }
    return part
  })
}

export function LegalPage({ content }: LegalPageProps) {
  useEffect(() => {
    document.title = `${content.title} | Arelia`

    return () => {
      document.title = 'ARELIA Space | Premium Interior Design'
    }
  }, [content.title])

  return (
    <main className="legal-page">
      <header className="legal-page__hero">
        <div className="legal-page__hero-inner">
          <p className="legal-page__eyebrow">Legal</p>
          <h1>{content.title}</h1>
          <p className="legal-page__description">{content.description}</p>
          {content.effectiveDate ? <p className="legal-page__effective">Effective date · {content.effectiveDate}</p> : null}
        </div>
      </header>

      <div className="legal-page__layout">
        <nav className="legal-page__toc" aria-label={`${content.title} sections`}>
          <p>On this page</p>
          <ol>
            {content.sections.map((section, index) => (
              <li key={section.title}>
                <a href={`#${slugify(section.title)}`}>
                  <span>{String(index + 1).padStart(2, '0')}</span>{section.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <article className="legal-page__article">
          {content.introduction?.map((paragraph) => <p className="legal-page__lead" key={paragraph}><RichText text={paragraph} /></p>)}

          {content.sections.map((section, index) => (
            <section className="legal-page__section" id={slugify(section.title)} key={section.title}>
              <div className="legal-page__section-heading">
                <span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
                <h2>{section.title}</h2>
              </div>
              {section.contact ? (
                <address className="legal-page__contact">
                  <strong>ARELIA Space</strong>
                  <span>Email: <a href="mailto:info@areliaspace.com">info@areliaspace.com</a></span>
                  <span>Phone: <a href="tel:+917207845556">7207845556</a></span>
                  <span>Address: {section.contact.address}</span>
                </address>
              ) : null}
              {section.paragraphs?.map((paragraph) => <p key={paragraph}><RichText text={paragraph} /></p>)}
              {section.items ? <ul>{section.items.map((item) => <li key={item}><RichText text={item} /></li>)}</ul> : null}
              {section.closingParagraphs?.map((paragraph) => <p key={paragraph}><RichText text={paragraph} /></p>)}
            </section>
          ))}
        </article>
      </div>
    </main>
  )
}
