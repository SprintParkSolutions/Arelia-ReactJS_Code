import { readFileSync } from 'node:fs'
import { afterEach, expect, it, vi } from 'vitest'
import { getPaymentReceipt } from '../services/paymentApi'
import { downloadPaymentStatement } from './paymentStatement'

const state = vi.hoisted(() => ({ documents: [] as import('jspdf').jsPDF[] }))
vi.mock('jspdf', async original => {
  const actual = await original<typeof import('jspdf')>()
  return { jsPDF: class extends actual.jsPDF {
    constructor() {
      super()
      this.save = vi.fn(() => this)
      state.documents.push(this)
    }
  } }
})
vi.mock('../services/paymentApi', () => ({ getPaymentReceipt: vi.fn() }))
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); state.documents.length = 0 })

it('creates a real PDF with the brand image, project amounts, receipt references and pagination', async () => {
  const data = readFileSync('public/images/Logos/Arelia.png').toString('base64')
  vi.stubGlobal('Image', class { src = ''; naturalWidth = 500; naturalHeight = 500; decode() { return Promise.resolve() } })
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({ drawImage: vi.fn() } as unknown as CanvasRenderingContext2D)
  vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/png;base64,' + data)
  vi.mocked(getPaymentReceipt).mockResolvedValue({ receiptNumber: 'RECEIPT-123', razorpayPaymentId: 'pay_456', paymentDate: '2026-11-06' })
  await downloadPaymentStatement({
    projectName: 'Home / A', customerName: 'Customer', contactId: 'contact1', contractBudget: 85000,
    terms: Array.from({ length: 20 }, (_, index) => ({ id: String(index), label: 'Installment ' + index, percentage: 5, amount: 4250, paidAmount: index === 0 ? 4250 : undefined, paymentReceived: index === 0 })),
  })
  const doc = state.documents[0]
  expect(doc.getNumberOfPages()).toBeGreaterThan(1)
  const pdf = doc.output()
  expect(pdf).toContain('/Subtype /Image')
  expect(pdf).toContain('Project: Home / A')
  expect(pdf).toContain('Customer: Customer')
  expect(pdf).toContain('INR 85,000')
  expect(pdf).toContain('RECEIPT-123')
  expect(pdf).toContain('pay_456')
  expect(getPaymentReceipt).toHaveBeenCalledExactlyOnceWith('0', 'contact1')
  expect(doc.save).toHaveBeenCalledWith('Arelia-Home-A-statement.pdf')
})

it('exports paid snapshots and redistributed balances without recalculating amounts', async () => {
  const data = readFileSync('public/images/Logos/Arelia.png').toString('base64')
  vi.stubGlobal('Image', class { src = ''; naturalWidth = 500; naturalHeight = 500; decode() { return Promise.resolve() } })
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({ drawImage: vi.fn() } as unknown as CanvasRenderingContext2D)
  vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/png;base64,' + data)
  vi.mocked(getPaymentReceipt).mockResolvedValue(null)
  await downloadPaymentStatement({ projectName: 'Home', contractBudget: 85000, terms: [
    { id: '1', paymentReceived: true, percentage: 20, amount: 17000, paidAmount: 17000, totalAmount: 95000 },
    { id: '2', paymentReceived: true, percentage: 30, amount: 25500, paidAmount: 25500, totalAmount: 95000 },
    { id: '3', percentage: 25, amount: 26250, totalAmount: 95000 },
    { id: '4', percentage: 25, amount: 26250, totalAmount: 95000 },
  ] })
  const pdf = state.documents[0].output()
  for (const amount of ['95,000', '42,500', '52,500', '17,000', '25,500', '26,250']) expect(pdf).toContain('INR ' + amount)
  expect(pdf).not.toContain('INR 19,000')
  expect(pdf).not.toContain('INR 28,500')
})
it('refuses to fabricate a statement from missing historical payment amounts', async () => {
  await expect(downloadPaymentStatement({ projectName: 'Home', contractBudget: 95000, terms: [{ paymentReceived: true, percentage: 20 }] }))
    .rejects.toThrow('must be reconciled')
  expect(state.documents).toHaveLength(0)
})
