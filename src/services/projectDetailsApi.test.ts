import { afterEach, describe, expect, it, vi } from 'vitest'
import { requestProjectDetails } from './projectDetailsApi'
afterEach(() => vi.unstubAllGlobals())
describe('project details API', () => {
  it('loads saved data and preserves submission state', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: true, leadId: '00Q123', projectSubmitted: true, approvalStatus: 'Approved', customerBudget: '500000', siteLocation: 'Hyderabad' })))
    vi.stubGlobal('fetch', fetchMock)
    expect(await requestProjectDetails('00Q123')).toMatchObject({ success: true, approvalStatus: 'Approved', projectSubmitted: true, details: { customerBudget: '500000', siteLocation: 'Hyderabad' } })
    expect(fetchMock.mock.calls[0][0]).toMatch(/project-details\?leadId=00Q123$/)
  })
  it('posts fields to update the existing Lead', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: true, projectSubmitted: true, leadId: '00Q123' })))
    vi.stubGlobal('fetch', fetchMock)
    const values = { siteSpace: '1200', typeOfProject: 'Home', projectScope: 'Kitchen', planLevel: 'Standard', customerBudget: '50000', siteLocation: 'Hyderabad', projectDescription: 'Kitchen' }
    expect(await requestProjectDetails('00Q123', values)).toMatchObject({ success: true, details: values })
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ leadId: '00Q123', ...values })
  })
  it('recognizes already-submitted conflicts', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: false, projectSubmitted: true }), { status: 409 })))
    expect(await requestProjectDetails('00Q123')).toMatchObject({ success: false, conflict: true })
  })
  it('does not treat malformed responses as unsubmitted accounts', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: true }))))
    expect((await requestProjectDetails('00Q123')).success).toBe(false)
  })
  it('reports connectivity errors', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
    expect(await requestProjectDetails('00Q123')).toMatchObject({ success: false, message: 'Unable to connect. Please try again.' })
  })
})
