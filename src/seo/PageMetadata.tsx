import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { applyPageMetadata } from './metadata'
export function PageMetadata() {
  const { pathname } = useLocation()
  useEffect(() => applyPageMetadata(document, pathname), [pathname])
  return null
}
