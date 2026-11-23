export const siteUrl = 'https://areliaspace.com'
export const socialImage = `${siteUrl}/images/Hyderabad/hyderabad-living-concept-v2.webp`
export const publicPages: Record<string, { title: string; description: string }> = {
  '/services/residential': { title: 'Residential Interior Design in Hyderabad | Arelia Space', description: 'Explore living rooms, kitchens, bedrooms, dining spaces and more. Plan your residential interiors with Arelia Space in Hyderabad.' },
  '/services/commercial': { title: 'Commercial Interior Design in Hyderabad | Arelia Space', description: 'Explore office interiors, reception areas, meeting rooms and customer spaces. Plan your commercial interior project with Arelia Space.' },
  '/services/hospitality': { title: 'Hospitality Interior Design in Hyderabad | Arelia Space', description: 'Explore guest rooms, lobbies, restaurants, cafes and lounges. Plan welcoming hospitality interiors with Arelia Space in Hyderabad.' },
  '/': { title: 'Interior Design Company in Hyderabad | Arelia Space', description: 'Arelia Space is an interior design company in Kondapur, Hyderabad, offering residential, commercial and hospitality interiors with transparent budgeting.' },
  '/interior-designers-hyderabad': { title: 'Interior Designers in Hyderabad & Kondapur | Arelia Space', description: 'Plan your Hyderabad home, office or hospitality interiors with Arelia Space. Explore design, budgeting, digital project tracking and end-to-end execution.' },
  '/services': { title: 'Interior Design Services in Hyderabad | Arelia Space', description: 'Explore residential interiors, commercial spaces, modular kitchens and custom furniture from Arelia Space in Hyderabad. Discuss your project with our team.' },
  '/about-us': { title: 'About Arelia Space | Hyderabad Interior Design Studio', description: 'Meet Arelia Space, an interior design studio in Kondapur, Hyderabad. Discover our approach to design, transparent budgeting and coordinated execution.' },
  '/contact-us': { title: 'Contact Arelia Space | Interior Design Studio in Kondapur', description: 'Contact Arelia Space in Kondapur, Hyderabad to discuss your interiors or arrange a studio visit. Call +91 72078 45556 or send a project enquiry.' },
  '/privacy-policy': { title: 'Privacy Policy | Arelia Space', description: 'Read how Arelia Space collects, uses and protects your personal information.' },
  '/terms-of-service': { title: 'Terms of Service | Arelia Space', description: 'Read the terms governing use of the Arelia Space website and services.' },
  '/disclaimer': { title: 'Disclaimer | Arelia Space', description: 'Read the disclaimer for information and content on the Arelia Space website.' },
  '/cookie-policy': { title: 'Cookie Policy | Arelia Space', description: 'Learn how Arelia Space uses cookies and how to manage your preferences.' },
}
export function getPageMetadata(pathname: string) {
  const path = pathname.replace(/\/+$/, '') || '/'
  const page = publicPages[path]
  return {
    title: page?.title ?? (path === '/login' ? 'Client Login | Arelia Space' : path === '/dashboard' || path.startsWith('/payment/') ? 'Client Portal | Arelia Space' : 'Page Not Found | Arelia Space'),
    description: page?.description ?? 'Arelia Space client account and project services.',
    canonical: page ? `${siteUrl}${path === '/' ? '/' : `${path}/`}` : null,
    robots: page ? 'index, follow' : 'noindex, follow',
  }
}
export function applyPageMetadata(document: Document, pathname: string) {
  const meta = getPageMetadata(pathname)
  document.title = meta.title
  const setMeta = (attribute: string, key: string, content: string) => {
    let element = document.head.querySelector(`meta[${attribute}="${key}"]`)
    if (!element) {
      element = document.createElement('meta')
      element.setAttribute(attribute, key)
      document.head.appendChild(element)
    }
    element.setAttribute('content', content)
  }
  setMeta('name', 'description', meta.description)
  setMeta('name', 'robots', meta.robots)
  setMeta('property', 'og:title', meta.title)
  setMeta('property', 'og:description', meta.description)
  setMeta('property', 'og:image', socialImage)
  setMeta('property', 'og:image:alt', 'Living room interior design inspiration from Arelia Space')
  setMeta('name', 'twitter:card', 'summary_large_image')
  setMeta('name', 'twitter:title', meta.title)
  setMeta('name', 'twitter:description', meta.description)
  setMeta('name', 'twitter:image', socialImage)
  document.head.querySelectorAll('link[rel="canonical"], meta[property="og:url"]').forEach((element) => element.remove())
  if (meta.canonical) {
    const canonical = document.createElement('link')
    canonical.rel = 'canonical'
    canonical.href = meta.canonical
    document.head.appendChild(canonical)
    setMeta('property', 'og:url', meta.canonical)
  }
}
