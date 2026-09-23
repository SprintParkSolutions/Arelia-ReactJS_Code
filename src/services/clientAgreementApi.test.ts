import { afterEach, expect, it, vi } from 'vitest'
import { getAgreementNotice } from './clientAgreementApi'
afterEach(() => vi.unstubAllGlobals())
it('requires successful true checkbox and notification flags', async () => {
  const payload = { success: true, clientAgreementSent: true, showNotification: true, opportunityId: 'opp1', notificationMessage: 'Please sign your agreement.' }
  const fetcher = vi.fn().mockImplementation(() => Promise.resolve(new Response(JSON.stringify(payload))))
  vi.stubGlobal('fetch', fetcher)
  expect(await getAgreementNotice('lead1')).toEqual({ opportunityId: 'opp1', message: payload.notificationMessage })
  expect(fetcher.mock.calls[0][0]).toContain('leadId=lead1')
  payload.clientAgreementSent = false
  expect(await getAgreementNotice('lead1')).toBeNull()
  payload.clientAgreementSent = true
  payload.success = false
  expect(await getAgreementNotice('lead1')).toBeNull()
})
