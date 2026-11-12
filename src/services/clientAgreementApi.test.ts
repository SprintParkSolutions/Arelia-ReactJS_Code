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
it('accepts a signed agreement even when the sent flag is false', async () => {
  const payload = { success: true, clientAgreementSent: false, clientAgreementSigned: true, showNotification: true, opportunityId: 'signed-opp', notificationMessage: 'Your Client Agreement has been successfully signed. Please check your registered email address to download a copy of the signed agreement.' }
  vi.stubGlobal('fetch', vi.fn().mockImplementation(() => Promise.resolve(new Response(JSON.stringify(payload)))))
  expect(await getAgreementNotice('lead1')).toEqual({ opportunityId: 'signed-opp', message: payload.notificationMessage, notificationType: 'CLIENT_AGREEMENT_SIGNED' })
  payload.showNotification = false
  expect(await getAgreementNotice('lead1')).toBeNull()
})
