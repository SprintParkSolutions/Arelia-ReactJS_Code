import { jsPDF } from 'jspdf'
import type { PaymentTerm } from '../services/salesforceApi'
import { getPaymentReceipt } from '../services/paymentApi'
import { formatDate } from './format'
import { getPaymentSummary, getTermAmount } from './paymentSummary'

type StatementOptions = {
  terms: PaymentTerm[]
  projectName: string
  contractBudget?: number
  customerName?: string
  contactId?: string
}

// Convert the existing logo to PNG so the exported PDF includes the actual brand asset.
async function loadLogo() {
  const image = new Image()
  image.src = '/images/Logos/Arelia.png'
  await image.decode()
  const canvas = document.createElement('canvas')
  canvas.width = image.naturalWidth
  canvas.height = image.naturalHeight
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Unable to prepare statement logo')
  context.drawImage(image, 0, 0)
  return { data: canvas.toDataURL('image/png'), ratio: image.naturalWidth / image.naturalHeight }
}

export async function downloadPaymentStatement({ terms, projectName, contractBudget, customerName, contactId }: StatementOptions) {
  const summary = getPaymentSummary(terms, contractBudget)
  if (summary.total == null || summary.paid == null || terms.some(term => getTermAmount(term) == null)) {
    throw new Error('Recorded payment amounts must be reconciled before a statement can be generated.')
  }
  const [logo, receipts] = await Promise.all([
    loadLogo(),
    Promise.all(terms.map(term => term.paymentReceived && term.id ? getPaymentReceipt(term.id, contactId) : Promise.resolve(null))),
  ])
  const doc = new jsPDF()
  // Built-in PDF fonts do not contain the rupee glyph; INR keeps amounts portable.
  const money = (value?: number) => value == null ? 'Not available' : `INR ${value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
  const date = new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date())
  let y = 20

  function text(value: string, size = 10, bold = false, width = 174) {
    doc.setFont('helvetica', bold ? 'bold' : 'normal')
    doc.setFontSize(size)
    const lines = doc.splitTextToSize(value, width) as string[]
    for (const line of lines) {
      if (y > 271) { doc.addPage(); y = 22 }
      doc.text(line, 18, y)
      y += size * .45 + 2
    }
  }

  // The dark header keeps the gold/white logo visible when printed.
  doc.setFillColor(20, 21, 22)
  doc.rect(0, 0, 210, 43, 'F')
  const logoWidth = Math.min(48, 25 * logo.ratio)
  const logoHeight = logoWidth / logo.ratio
  doc.addImage(logo.data, 'PNG', 18, 9, logoWidth, logoHeight)
  doc.setTextColor(235, 209, 160)
  doc.setFontSize(17)
  doc.text('Payment statement', doc.internal.pageSize.getWidth() / 2, 24, { align: 'center' })
  doc.setTextColor(35, 35, 35)
  y = 55
  text(`Statement date: ${date}`)
  text(`Project: ${projectName}`, 12, true)
  if (customerName) text(`Customer: ${customerName}`)
  y += 4
  text(`Total project value: ${money(summary.total)}`, 11, true)
  text(`Amount paid: ${money(summary.paid)}`, 11)
  text(`Balance remaining: ${money(summary.balance)}`, 11)
  text(`${summary.paidCount} of ${terms.length} installments paid | ${Math.round(summary.paidPercentage ?? 0)}% of contract`)
  y += 7
  text('Payment schedule', 15, true)
  const nextIndex = terms.findIndex(term => !term.paymentReceived)
  terms.forEach((term, index) => {
    if (y > 225) { doc.addPage(); y = 22 }
    doc.setDrawColor(215, 205, 185)
    doc.line(18, y, 192, y)
    y += 7
    text(`${index + 1}. ${term.label || term.name || `Installment ${index + 1}`}`, 11, true)
    text(`Share: ${term.percentage == null ? 'Not available' : `${term.percentage}%`} | Due: ${formatDate(term.dueDate) || 'Not set'}`)
    text(`Amount: ${money(getTermAmount(term))} | Status: ${term.paymentReceived ? 'Received' : index === nextIndex ? 'Due next' : 'Upcoming'}`)
    const receipt = receipts[index]
    if (receipt) {
      text(`Receipt: ${receipt.receiptNumber}`)
      if (receipt.razorpayPaymentId) text(`Transaction: ${receipt.razorpayPaymentId}`)
      if (receipt.paymentDate) text(`Payment date: ${formatDate(receipt.paymentDate) || receipt.paymentDate}`)
    } else if (term.paymentReceived) {
      text('Receipt / transaction reference: Not available')
    }
    y += 5
  })
  y += 4
  text('Received amounts are fixed; unpaid amounts reflect the remaining balance. This statement is not a payment receipt.', 9)
  const pages = doc.getNumberOfPages()
  for (let page = 1; page <= pages; page++) {
    doc.setPage(page)
    doc.setTextColor(105, 105, 105)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.text(`Arelia | Payment statement | Page ${page} of ${pages}`, 18, 287)
  }
  const safeName = projectName.replace(/[^a-z0-9_-]+/gi, '-').slice(0, 80) || 'project'
  doc.save(`Arelia-${safeName}-statement.pdf`)
}
