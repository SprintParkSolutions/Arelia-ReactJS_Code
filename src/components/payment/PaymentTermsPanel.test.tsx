import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { afterEach, expect, it, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import { PaymentTermsPanel } from './PaymentTermsPanel'
import { downloadPaymentStatement } from '../../utils/paymentStatement'
import type { PaymentTerm } from '../../services/salesforceApi'

vi.mock('../../utils/paymentStatement', () => ({ downloadPaymentStatement: vi.fn().mockResolvedValue(undefined) }))
afterEach(() => { cleanup(); vi.clearAllMocks() })

const terms: PaymentTerm[] = [
  { id: 'first', label: 'First installment', percentage: 20, dueDate: '2026-11-06', paymentReceived: true, amount: 17000, paidAmount: 17000 },
  { id: 'second', label: 'Second installment', percentage: 30, dueDate: '2026-11-09', amount: 25500 },
  { id: 'third', label: 'Third installment', percentage: 25, amount: 21250 },
  { id: 'fourth', label: 'Fourth installment', percentage: 25, amount: 21250 },
]
function Location() { return <output data-testid="location">{useLocation().pathname}</output> }
function setup(overrides: Partial<Parameters<typeof PaymentTermsPanel>[0]> = {}) {
  const onSupport = vi.fn()
  render(<MemoryRouter><PaymentTermsPanel terms={terms} projectName="Home" contractBudget={85000} onSupport={onSupport} {...overrides} /><Location /></MemoryRouter>)
  return { onSupport }
}

it('shows live totals and one payment action inside the schedule', () => {
  setup()
  expect(screen.getByText('\u20b9 85,000')).toBeInTheDocument()
  expect(screen.getByText('\u20b9 68,000')).toBeInTheDocument()
  expect(screen.getByText('1 of 4 installments paid')).toBeInTheDocument()
  expect(screen.getByRole('progressbar')).toHaveAttribute('value', '20')
  expect(screen.getAllByRole('button', { name: /^Pay / })).toHaveLength(1)
  expect(screen.queryByText('NEXT PAYMENT')).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Pay Second installment' }))
  expect(screen.getByTestId('location')).toHaveTextContent('/payment/second')
})

it('preserves the receipt route and opens Support Cases', () => {
  const { onSupport } = setup()
  fireEvent.click(screen.getByRole('button', { name: 'View receipt for First installment' }))
  expect(screen.getByTestId('location')).toHaveTextContent('/payment/receipt/first')
  fireEvent.click(screen.getByRole('button', { name: 'Go to Support Cases' }))
  expect(onSupport).toHaveBeenCalledOnce()
})

it('downloads the selected project and customer statement and reports failures', async () => {
  vi.mocked(downloadPaymentStatement).mockRejectedValueOnce(new Error('PDF failed'))
  setup({ customerName: 'Client', contactId: 'contact1' })
  fireEvent.click(screen.getByRole('button', { name: 'Download statement' }))
  await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Unable to download'))
  expect(downloadPaymentStatement).toHaveBeenCalledWith({ terms, projectName: 'Home', contractBudget: 85000, customerName: 'Client', contactId: 'contact1' })
  fireEvent.click(screen.getByRole('button', { name: 'Download statement' }))
  await waitFor(() => expect(downloadPaymentStatement).toHaveBeenCalledTimes(2))
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
})

it('removes payment actions when every installment is received', () => {
  setup({ terms: terms.map(term => ({ ...term, paymentReceived: true })) })
  expect(screen.getByText('4 of 4 installments paid')).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: /^Pay / })).not.toBeInTheDocument()
  expect(screen.getByRole('progressbar')).toHaveAttribute('value', '100')
})

it('shows unchanged historical payments and redistributed unpaid amounts after an increase', () => {
  setup({ contractBudget: 85000, terms: [
    { ...terms[0], totalAmount: 95000 },
    { ...terms[1], paymentReceived: true, paidAmount: 25500, totalAmount: 95000 },
    { ...terms[2], amount: 26250, totalAmount: 95000 },
    { ...terms[3], amount: 26250, totalAmount: 95000 },
  ] })
  expect(screen.getByText('\u20b9 95,000')).toBeInTheDocument()
  expect(screen.getByText('\u20b9 42,500')).toBeInTheDocument()
  expect(screen.getByText('\u20b9 52,500')).toBeInTheDocument()
  expect(screen.getByText('\u20b9 17,000')).toBeInTheDocument()
  expect(screen.getByText('\u20b9 25,500')).toBeInTheDocument()
  expect(screen.getAllByText('\u20b9 26,250')).toHaveLength(2)
  expect(screen.getByText('45% paid')).toBeInTheDocument()
  expect(screen.getByText('2 of 4 installments paid')).toBeInTheDocument()
})
it('blocks payment and export when the backend has no historical amounts', () => {
  setup({ terms: terms.map(term => ({ ...term, amount: undefined, paidAmount: undefined })) })
  expect(screen.getByRole('alert')).toHaveTextContent('recorded payment amounts are unavailable')
  expect(screen.getByRole('button', { name: 'Download statement' })).toBeDisabled()
  expect(screen.getByRole('button', { name: 'Pay Second installment' })).toBeDisabled()
  expect(screen.getByText('Paid total unavailable')).toBeInTheDocument()
})
