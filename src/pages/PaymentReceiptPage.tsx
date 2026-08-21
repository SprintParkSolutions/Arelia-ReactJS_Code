import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { FiArrowLeft, FiPrinter } from 'react-icons/fi'
import { useAuth } from '../context/AuthContext'
import { getPaymentReceipt } from '../services/paymentApi'
import type { ReceiptData } from '../types/payment'
import { formatCurrency, formatDateTime } from '../utils/format'
import './PaymentShared.css'

export function PaymentReceiptPage() {
  const { paymentTermId } = useParams<{ paymentTermId: string }>()
  const { client } = useAuth()
  const navigate = useNavigate()
  const contactId = client?.contactId || client?.leadId

  const [receipt, setReceipt] = useState<ReceiptData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isCancelled = false

    async function loadReceipt() {
      if (!paymentTermId) {
        setIsLoading(false)
        return
      }
      setIsLoading(true)
      const result = await getPaymentReceipt(paymentTermId, contactId)
      if (!isCancelled) {
        setReceipt(result)
        setIsLoading(false)
      }
    }

    void loadReceipt()
    return () => {
      isCancelled = true
    }
  }, [paymentTermId, contactId])

  if (isLoading) {
    return (
      <div className="paymentPage">
        <div className="paymentPage__container">
          <p className="paymentLoading">Loading receipt...</p>
        </div>
      </div>
    )
  }

  if (!receipt) {
    return (
      <div className="paymentPage">
        <div className="paymentPage__container">
          <div className="paymentEmptyState">
            No receipt is available for this installment yet. Receipts are generated once a payment is confirmed.
          </div>
          <div className="paymentPage__actions paymentPage__noPrint">
            <button type="button" className="paymentButton paymentButton--ghost" onClick={() => navigate(-1)}>
              <FiArrowLeft aria-hidden="true" /> Back
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="paymentPage">
      <div className="paymentPage__container">
        <div className="paymentPage__noPrint">
          <p className="paymentPage__eyebrow">Payment Receipt</p>
          <h1 className="paymentPage__title">{receipt.installmentLabel || 'Installment Receipt'}</h1>
        </div>

        <div className="paymentCard">
          <div className="paymentReceipt__brand">
            <img
              src="/images/Logos/Arelia_Logo.webp"
              alt="ARELIA"
              style={{ height: '2.2rem', objectFit: 'contain' }}
            />
            <strong style={{ display: 'block', marginTop: '0.6rem', color: '#e7bd72' }}>Payment Receipt</strong>
          </div>

          <div className="paymentDetailGrid" style={{ marginTop: '1.4rem' }}>
            <div className="paymentDetailGrid__item">
              <span>Receipt / Transaction ID</span>
              <strong>{receipt.receiptNumber}</strong>
            </div>
            <div className="paymentDetailGrid__item">
              <span>Customer</span>
              <strong>{receipt.customerName || '—'}</strong>
            </div>
            <div className="paymentDetailGrid__item">
              <span>Project</span>
              <strong>{receipt.projectName || '—'}</strong>
            </div>
            <div className="paymentDetailGrid__item">
              <span>Installment</span>
              <strong>{receipt.installmentLabel || '—'}</strong>
            </div>
            <div className="paymentDetailGrid__item">
              <span>Payment Date</span>
              <strong>{formatDateTime(receipt.paymentDate) || '—'}</strong>
            </div>
            <div className="paymentDetailGrid__item">
              <span>Status</span>
              <span className={`paymentStatusPill is-${(receipt.status || 'paid').toLowerCase()}`}>
                {receipt.status || 'Paid'}
              </span>
            </div>
            <div className="paymentDetailGrid__item">
              <span>Amount Paid</span>
              <strong className="paymentAmount">{formatCurrency(receipt.amount)}</strong>
            </div>
            <div className="paymentDetailGrid__item">
              <span>Razorpay Order ID</span>
              <strong>{receipt.razorpayOrderId || '—'}</strong>
            </div>
          </div>
        </div>

        <div className="paymentPage__actions paymentPage__noPrint">
          <button type="button" className="paymentButton" onClick={() => window.print()}>
            <FiPrinter aria-hidden="true" /> Print / Save as PDF
          </button>
          <button type="button" className="paymentButton paymentButton--ghost" onClick={() => navigate(-1)}>
            <FiArrowLeft aria-hidden="true" /> Back
          </button>
        </div>
      </div>
    </div>
  )
}
