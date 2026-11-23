import { Link } from 'react-router-dom'
import { ArrowIcon } from './ArrowIcon'
import './ExploreLink.css'

type ExploreLinkProps = {
  label: string
  direction?: 'right' | 'down'
} & ({ to: string; href?: never } | { href: string; to?: never })

export function ExploreLink({ label, direction = 'right', to, href }: ExploreLinkProps) {
  const content = (
    <>
      <span className="explore-link__label">{label}</span>
      <span className="explore-link__arrow" aria-hidden="true">
        <span className="explore-link__arrow-track">
          <ArrowIcon direction={direction} />
          <ArrowIcon direction={direction} />
        </span>
      </span>
    </>
  )
  const className = `explore-link explore-link--${direction}`

  return to !== undefined
    ? <Link className={className} to={to}>{content}</Link>
    : <a className={className} href={href}>{content}</a>
}
