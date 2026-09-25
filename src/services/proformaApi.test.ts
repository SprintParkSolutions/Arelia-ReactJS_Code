import { afterEach, describe, expect, it, vi } from 'vitest'
import { getProformaInvoices, getProformaInvoice, submitProformaDecision, proformaFileUrl, type Invoice } from './proformaApi'
afterEach(() => vi.unstubAllGlobals())
const invoice: Invoice = { invoiceId: 'invoice1', name: 'PI-001', opportunityId: 'opp1', opportunityName: 'Home', status: 'Sent', comments: '', secureToken: 'test-token', createdDate: '', canApprove: true, canRequestChanges: true, files: [] }
function mock(data: unknown, status = 200) {
  const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify(data), { status }))
  vi.stubGlobal('fetch', fetcher)
  return fetcher
}
describe('Proforma API', () => {
  it('loads multiple sent/responded invoices and enables only pending decisions', async () => {
    const fetcher = mock({ success: true, invoices: [invoice, { ...invoice, invoiceId: 'invoice2', status: 'Approved' }] })
    const result = await getProformaInvoices('lead1')
    expect(result.success).toBe(true)
    expect(result.invoices).toHaveLength(2)
    expect(result.invoices[1].canApprove).toBe(false)
    expect(fetcher.mock.calls[0][0]).toContain('leadId=lead1&list=true')
  })
  it('loads exact invoice files and rejects mismatched invoice ownership data', async () => {
    mock({ success: true, invoice, files: [{ title: 'Invoice', fileType: 'PDF', fileVersionId: 'version1' }] })
    expect(await getProformaInvoice('lead1', invoice)).toMatchObject({ success: true, invoice: { files: [{ fileVersionId: 'version1' }] } })
    mock({ success: true, invoice: { ...invoice, opportunityId: 'wrong' }, files: [] })
    expect((await getProformaInvoice('lead1', invoice)).success).toBe(false)
  })
  it('sends approval and comments with the required invoice token', async () => {
    const fetcher = mock({ success: true, invoiceId: 'invoice1', status: 'Approved', message: 'Saved' })
    expect((await submitProformaDecision('lead1', invoice, 'Approved', ' Fine ')).success).toBe(true)
    expect(JSON.parse(fetcher.mock.calls[0][1].body)).toEqual({ leadId: 'lead1', invoiceId: 'invoice1', secureToken: 'test-token', action: 'APPROVE', comments: 'Fine' })
  })
  it('requires change comments and never sends a missing token', async () => {
    const fetcher = mock({})
    expect((await submitProformaDecision('lead1', invoice, 'Changes Requested', ' ')).success).toBe(false)
    expect((await submitProformaDecision('lead1', { ...invoice, secureToken: '' }, 'Approved', '')).success).toBe(false)
    expect(fetcher).not.toHaveBeenCalled()
  })
  it('submits REQUEST_CHANGES and surfaces duplicate conflicts', async () => {
    const fetcher = mock({ success: false, message: 'Already responded' }, 409)
    expect(await submitProformaDecision('lead1', invoice, 'Changes Requested', 'Revise total')).toMatchObject({ success: false, conflict: true })
    expect(JSON.parse(fetcher.mock.calls[0][1].body).action).toBe('REQUEST_CHANGES')
  })
  it('handles denied access without hiding the error as an empty list', async () => {
    mock([{ message: 'Access denied' }], 403)
    expect(await getProformaInvoices('lead1')).toMatchObject({ success: false, message: 'Access denied' })
  })
  it('scopes downloads using the exact invoice token and version ID', () => {
    expect(proformaFileUrl('lead1', invoice, { title: 'Invoice', fileType: 'PDF', fileVersionId: 'version1' })).toContain('leadId=lead1&invoiceId=invoice1&secureToken=test-token&download=true&fileVersionId=version1')
  })
})

it('uses the second project Lead for decisions, details and downloads', async () => {
  const second = { ...invoice, leadId: 'lead2' }
  let fetcher = mock({ success: true, invoiceId: 'invoice1', status: 'Approved', message: 'Saved' })
  await submitProformaDecision('lead1', second, 'Approved', '')
  expect(JSON.parse(fetcher.mock.calls[0][1].body).leadId).toBe('lead2')
  fetcher = mock({ success: true, invoice: second, files: [] })
  await getProformaInvoice('lead1', second)
  expect(fetcher.mock.calls[0][0]).toContain('leadId=lead2')
  expect(proformaFileUrl('lead1', second, { fileVersionId: 'version2', title: 'Invoice', fileType: 'PDF' })).toContain('leadId=lead2')
})

it.each(['', '   '])('defaults blank approval comments to Approved By Client', async comments => {
  const fetcher = mock({ success: true, invoiceId: 'invoice1', status: 'Approved', message: 'Saved' })
  expect((await submitProformaDecision('lead1', invoice, 'Approved', comments)).success).toBe(true)
  expect(JSON.parse(fetcher.mock.calls[0][1].body).comments).toBe('Approved By Client')
})
