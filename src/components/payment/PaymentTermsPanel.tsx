import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiCalendar, FiCheckCircle, FiCreditCard, FiDownload, FiHelpCircle, FiLayers } from 'react-icons/fi'
import type { PaymentTerm } from '../../services/salesforceApi'
import { formatCurrency, formatDate } from '../../utils/format'
import { getPaymentSummary, getTermAmount } from '../../utils/paymentSummary'
import './PaymentTermsPanel.css'

type Props = {
  terms: PaymentTerm[]
  projectName: string
  contractBudget?: number
  customerName?: string
  contactId?: string
  onSupport: () => void
}

export function PaymentTermsPanel({ terms, projectName, contractBudget, customerName, contactId, onSupport }: Props) {
  const navigate = useNavigate()
  const [downloading, setDownloading] = useState(false)
  const [downloadError, setDownloadError] = useState('')
  const summary = getPaymentSummary(terms, contractBudget)
  const amountsUnavailable = summary.total == null || terms.some(term => getTermAmount(term) == null)
  const progressLabel = summary.paidPercentage == null ? '\u2014' : Math.round(summary.paidPercentage).toString() + '%'
  const nextIndex = terms.findIndex(term => !term.paymentReceived)

  async function downloadStatement() {
    setDownloading(true)
    setDownloadError('')
    try {
      // Keep the PDF library out of the dashboard's initial bundle.
      const { downloadPaymentStatement } = await import('../../utils/paymentStatement')
      await downloadPaymentStatement({ terms, projectName, contractBudget, customerName, contactId })
    } catch {
      setDownloadError('Unable to download your statement. Please try again.')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <section className="paymentTerms" aria-labelledby="payment-terms-title">
      <header className="paymentTerms__header">
        <div>
          <p className="paymentTerms__breadcrumb">Project Tracking <span aria-hidden="true">/</span> Payments</p>
          <h2 id="payment-terms-title">Payments</h2>
          <p className="paymentTerms__lead">Track your installments and download receipts.</p>
          <p className="paymentTerms__project">{projectName}</p>
        </div>
        <button type="button" className="paymentTerms__button paymentTerms__button--outline" onClick={() => void downloadStatement()} disabled={downloading || amountsUnavailable}>
          <FiDownload aria-hidden="true" /> {downloading ? 'Preparing statement…' : 'Download statement'}
        </button>
      </header>
      {downloadError && <p className="paymentTerms__error" role="alert">{downloadError}</p>}
      {amountsUnavailable && <p className="paymentTerms__error" role="alert">Some recorded payment amounts are unavailable. Go to Support Cases to reconcile the payment schedule before making a payment.</p>}
      {summary.balance != null && summary.balance > 0 && terms.every(term => term.paymentReceived) && <p role="status">An additional balance remains. Please contact Support Cases to arrange a new installment.</p>}
      {summary.paid != null && summary.total != null && summary.paid > summary.total && <p role="status">Recorded payments exceed the current project value. Please contact Support Cases to reconcile the difference.</p>}
      <div className="paymentTerms__summaries">
        <article className="paymentTerms__summary">
          <FiLayers aria-hidden="true" />
          <div><h3>Total project value</h3><strong>{formatCurrency(summary.total)}</strong></div>
        </article>
        <article className="paymentTerms__summary">
          <FiCheckCircle aria-hidden="true" />
          <div><h3>Amount paid</h3><div className="paymentTerms__paid"><strong>{formatCurrency(summary.paid)}</strong><span className="paymentTerms__badge paymentTerms__badge--received">{summary.paidPercentage == null ? 'Paid total unavailable' : `${progressLabel} paid`}</span></div></div>
        </article>
        <article className="paymentTerms__summary">
          <FiCreditCard aria-hidden="true" />
          <div><h3>Balance remaining</h3><strong>{formatCurrency(summary.balance)}</strong></div>
        </article>
      </div>
      <section className="paymentTerms__schedule" aria-labelledby="payment-schedule-title">
        <header className="paymentTerms__scheduleHeader">
          <div className="paymentTerms__scheduleHeading">
            <h3 id="payment-schedule-title">Payment schedule</h3>
            <span>{summary.paidCount} of {terms.length} installments paid</span>
          </div>
          <div className="paymentTerms__progressRow">
            <progress value={summary.paidPercentage ?? 0} max={100} aria-label="Contract paid to date" />
            <strong>{progressLabel}</strong>
          </div>
        </header>
        <div className="paymentTerms__tableScroll" tabIndex={0} role="region" aria-label="Installment schedule">
          <table className="paymentTerms__table">
            <thead><tr><th scope="col">Installment</th><th scope="col">Share</th><th scope="col">Due date</th><th scope="col">Amount</th><th scope="col">Status</th><th scope="col">Action</th></tr></thead>
            <tbody>{terms.map((term, index) => {
              const isNext = index === nextIndex
              return (
                <tr key={term.id || `term-${index}`} className={isNext ? 'paymentTerms__nextRow' : undefined}>
                  <th scope="row"><span className={`paymentTerms__number ${isNext ? 'is-next' : ''}`}>{index + 1}</span><span>{term.label || term.name || `Installment ${index + 1}`}</span></th>
                  <td>{term.percentage == null ? '—' : `${term.percentage}%`}</td>
                  <td><span className="paymentTerms__date"><FiCalendar aria-hidden="true" />{formatDate(term.dueDate) || 'Not set'}</span></td>
                  <td className="paymentTerms__amount">{formatCurrency(getTermAmount(term))}</td>
                  <td><span className={`paymentTerms__badge paymentTerms__badge--${term.paymentReceived ? 'received' : isNext ? 'next' : 'upcoming'}`}>{term.paymentReceived ? 'Received' : isNext ? 'Due next' : 'Upcoming'}</span></td>
                  <td>{term.id && (term.paymentReceived || isNext) ? (
                    <button type="button" className={`paymentTerms__button ${term.paymentReceived ? 'paymentTerms__button--outline' : ''}`} disabled={getTermAmount(term) == null || (!term.paymentReceived && getTermAmount(term)! <= 0)} aria-label={`${term.paymentReceived ? 'View receipt for' : 'Pay'} ${term.label || term.name || `installment ${index + 1}`}`} onClick={() => navigate(term.paymentReceived ? `/payment/receipt/${term.id}` : `/payment/${term.id}`)}>
                      {term.paymentReceived ? 'View receipt' : 'Pay now'}
                    </button>
                  ) : <span className="paymentTerms__noAction">—</span>}</td>
                </tr>
              )
            })}</tbody>
          </table>
        </div>
        <p className="paymentTerms__allocationNote">Scheduled shares distribute the remaining balance across unpaid installments. Received amounts stay fixed.</p>
      </section>
      <p className="paymentTerms__help"><FiHelpCircle aria-hidden="true" /><span>Need help with a payment? <button type="button" onClick={onSupport}>Go to Support Cases</button></span></p>
    </section>
  )
}
