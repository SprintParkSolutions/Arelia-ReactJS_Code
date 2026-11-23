import { afterEach, describe, expect, it, vi } from 'vitest'
import { registerProspect, loginProspect } from './salesforceApi'

afterEach(() => vi.unstubAllGlobals())
const values = { phone: ' +919876543210 ', firstName: ' Ada ', lastName: ' Lovelace ', email: ' ADA@example.com ', password: 'Example1!', confirmPassword: 'Example1!' }
describe('prospect API', () => {
  it('sends the Apex registration contract and requires a created Lead ID', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: true, leadId: '00Q123' })))
    vi.stubGlobal('fetch', fetchMock)
    expect((await registerProspect(values)).success).toBe(true)
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toMatch(/\/registration\/leads$/)
    expect(JSON.parse(init.body)).toEqual({ ...values, firstName: 'Ada', lastName: 'Lovelace', email: 'ada@example.com', companyName: 'self', phone: '+919876543210' })
  })
  it.each([
    [400, { success: true, leadId: '00Q123' }],
    [200, { success: false, message: 'Rejected' }],
    [200, { success: true }],
  ])('rejects unsuccessful or incomplete responses', async (status, body) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status })))
    expect((await registerProspect(values)).success).toBe(false)
  })
  it('handles network failures', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
    expect((await registerProspect(values)).success).toBe(false)
  })
  it('maps the supplied lead login response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: true, leadId: '00Q123', fullName: 'Ada Lovelace', email: 'ada@example.com', phone: '+919876543210' }))))
    expect(await loginProspect('ada@example.com', 'Example1!')).toMatchObject({ success: true, leadId: '00Q123', name: 'Ada Lovelace', email: 'ada@example.com', phone: '+919876543210' })
  })
})
