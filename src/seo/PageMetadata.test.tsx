import { render, waitFor, cleanup } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { PageMetadata } from './PageMetadata'

afterEach(cleanup)

it('updates metadata on navigation and excludes account and unknown URLs', async () => {
  const router = createMemoryRouter([{ path: '*', element: <PageMetadata /> }], { initialEntries: ['/interior-designers-hyderabad/'] })
  render(<RouterProvider router={router} />)
  await waitFor(() => expect(document.title).toContain('Hyderabad & Kondapur'))
  expect(document.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe('https://areliaspace.com/interior-designers-hyderabad/')
  for (const path of ['/login', '/dashboard', '/payment/success/example', '/missing-page']) {
    await router.navigate(path)
    await waitFor(() => expect(document.querySelector('meta[name="robots"]')?.getAttribute('content')).toBe('noindex, follow'))
    expect(document.querySelector('link[rel="canonical"]')).toBeNull()
  }
  await router.navigate('/services')
  await waitFor(() => expect(document.title).toBe('Interior Design Services in Hyderabad | Arelia Space'))
  expect(document.querySelector('meta[name="robots"]')?.getAttribute('content')).toBe('index, follow')
  expect(document.querySelectorAll('link[rel="canonical"]')).toHaveLength(1)
  expect(document.querySelector('meta[property="og:url"]')?.getAttribute('content')).toBe('https://areliaspace.com/services/')
})
