import { afterEach, describe, expect, it, vi } from 'vitest'
import { getSupervisor } from './supervisorApi'
afterEach(() => vi.unstubAllGlobals())
describe('supervisor API', () => {
  it('loads the assigned supervisor for the requested Lead', async () => {
    const payload = { success: true, leadId: '00Q123', assigned: true, supervisorUserId: '005123', supervisorUser: 'Alex Smith', supervisorUserEmail: 'alex@example.com', supervisorUserPhone: '+919876543210' }
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(payload)))
    vi.stubGlobal('fetch', fetchMock)
    expect(await getSupervisor('00Q123')).toMatchObject({ success: true, supervisorUser: 'Alex Smith', supervisorUserEmail: 'alex@example.com', supervisorUserPhone: '+919876543210' })
    expect(fetchMock.mock.calls[0][0]).toContain('/registration/lead/supervisor?leadId=00Q123')
  })
  it('supports an unassigned Lead', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: true, leadId: '00Q123', assigned: false }))))
    expect(await getSupervisor('00Q123')).toMatchObject({ success: true, assigned: false })
  })
  it.each([
    { success: true, leadId: 'another-lead', assigned: false },
    { success: true, leadId: '00Q123', assigned: true },
    { success: true, leadId: '00Q123' },
  ])('rejects inconsistent responses', async payload => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(payload))))
    expect((await getSupervisor('00Q123')).success).toBe(false)
  })
  it('explains missing Apex class access instead of hiding the Salesforce error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify([{ errorCode: 'FORBIDDEN', message: 'You do not have access to the Apex class named: ProspectSupervisorInfoApi' }]), { status: 403 })))
    const result = await getSupervisor('00Q123')
    expect(result.success).toBe(false)
    expect(result.message).toContain('enable ProspectSupervisorInfoApi')
  })
  it('preserves other Salesforce array error messages', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify([{ errorCode: 'NOT_FOUND', message: 'The requested resource does not exist' }]), { status: 404 })))
    expect(await getSupervisor('00Q123')).toMatchObject({ success: false, message: 'The requested resource does not exist' })
  })
  it('handles network failures', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
    expect((await getSupervisor('00Q123')).success).toBe(false)
  })
})