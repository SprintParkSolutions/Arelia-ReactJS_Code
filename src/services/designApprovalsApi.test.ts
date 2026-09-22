import { afterEach, describe, expect, it, vi } from 'vitest'
import { designFileUrl, getDesignApprovals, submitDesignDecision, type Design } from './designApprovalsApi'
import { loginProspect } from './salesforceApi'
afterEach(() => vi.unstubAllGlobals())
const design: Design = { designId: 'design1', opportunityId: 'opp1', designName: 'Living room', opportunityName: 'Home', managerApproval: false, status: 'Sent', comments: '', createdDate: '', canApprove: true, canRequestChanges: true, files: [] }
function mock(payload: unknown, status = 200) {
  const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify(payload), { status }))
  vi.stubGlobal('fetch', fetcher); return fetcher
}
describe('design approval API', () => {
  it('loads sent designs and hides drafts', async () => {
    const fetcher = mock({ success: true, data: { designs: [design, { ...design, designId: 'draft', status: 'Draft' }] } })
    expect((await getDesignApprovals('contact1')).designs).toEqual([design])
    expect(fetcher.mock.calls[0][0]).toContain('contactId=contact1')
  })
  it('never enables a second response even if flags are inconsistent', async () => {
    mock({ success: true, data: { designs: [{ ...design, status: 'Approved' }] } })
    expect((await getDesignApprovals('contact1')).designs[0]).toMatchObject({ canApprove: false, canRequestChanges: false })
  })
  it('requires a Contact identity and handles permission failures', async () => {
    const fetcher = mock([{ message: 'Class access denied' }], 403)
    expect((await getDesignApprovals('')).success).toBe(false)
    expect(fetcher).not.toHaveBeenCalled()
    expect(await getDesignApprovals('contact1')).toMatchObject({ success: false, message: 'Class access denied' })
  })
  it('sends an exact decision payload and trims comments', async () => {
    const fetcher = mock({ success: true, message: 'Saved' })
    expect((await submitDesignDecision('contact1', design, 'Changes Requested', ' Move the wall ')).success).toBe(true)
    expect(JSON.parse(fetcher.mock.calls[0][1].body)).toEqual({ contactId: 'contact1', opportunityId: 'opp1', designId: 'design1', status: 'Changes Requested', comments: 'Move the wall' })
  })
  it('rejects empty change requests before calling Salesforce', async () => {
    const fetcher = mock({})
    expect((await submitDesignDecision('contact1', design, 'Changes Requested', '  ')).success).toBe(false)
    expect(fetcher).not.toHaveBeenCalled()
  })
  it('returns conflict on an already recorded response', async () => {
    mock({ success: false, message: 'Already responded' }, 409)
    expect(await submitDesignDecision('contact1', design, 'Approved', '')).toMatchObject({ success: false, conflict: true, message: 'Already responded' })
  })
  it('scopes files to the Contact, Opportunity and Design', () => {
    expect(designFileUrl('contact1', design, { versionId: 'version1', title: 'Plan', extension: 'pdf' })).toContain('file?contactId=contact1&opportunityId=opp1&designId=design1&versionId=version1')
  })
  it('retains the converted Contact ID returned by login', async () => {
    mock({ success: true, leadId: 'lead1', contactId: 'contact1', fullName: 'Client' })
    expect(await loginProspect('client@example.com', 'Password1!')).toMatchObject({ success: true, leadId: 'lead1', contactId: 'contact1' })
  })
})
