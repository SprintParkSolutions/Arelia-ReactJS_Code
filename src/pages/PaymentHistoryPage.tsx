import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FiArrowLeft, FiFileText } from 'react-icons/fi'
import { useAuth } from '../context/AuthContext'
import { getPaymentHistory } from '../services/paymentApi'
import type { PaymentHistoryItem } from '../types/payment'
import { formatCurrency, formatDate } from '../utils/format'
import './PaymentShared.css'

export function PaymentHistoryPage() {
  const { client } = useAuth()
  const navigate = useNavigate()
  const contactId = client?.contactId || client?.leadId

  const [payments, setPayments] = useState<PaymentHistoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isCancelled = false

    async function loadHistory() {
      if (!contactId) {
        setIsLoading(false)
        return
      }
      setIsLoading(true)
      const result = await getPaymentHistory(contactId)
      if (!isCancelled) {
        setPayments(Array.isArray(result) ? result : [])
        setIsLoading(false)
      }
    }

    void loadHistory()
    return () => {
      isCancelled = true
    }
  }, [contactId])

  return (
    <div className="paymentPage">
      <div className="paymentPage__container">
        <div>
          <p className="paymentPage__eyebrow">Financial Records</p>
          <h1 className="paymentPage__title">Payment History</h1>
          <p className="paymentPage__lead">A complete record of every installment payment made on your projects.</p>
        </div>

        {isLoading ? (
          <p className="paymentLoading">Loading payment history...</p>
        ) : payments.length === 0 ? (
          <div className="paymentEmptyState">No payments have been recorded yet.</div>
        ) : (
          <div className="paymentHistoryList">
            {payments.map((payment) => {
              const isPaid = payment.status === 'Paid'
              return (
                <Link
                  key={payment.paymentTermId}
                  to={isPaid ? `/payment/receipt/${payment.paymentTermId}` : '#'}
                  className="paymentHistoryCard"
                  onClick={(event) => {
                    if (!isPaid) event.preventDefault()
                  }}
                  aria-disabled={!isPaid}
                >
                  <div className="paymentHistoryCard__main">
                    <h3>{payment.installmentLabel || 'Installment'}</h3>
                    <p>
                      {payment.projectName || 'Project'} · Due {formatDate(payment.dueDate) || 'Not set'}
                      {payment.paymentDate ? ` · Paid ${formatDate(payment.paymentDate)}` : ''}
                    </p>
                  </div>
                  <div className="paymentHistoryCard__meta">
                    <strong>{formatCurrency(payment.amount)}</strong>
                    <span className={`paymentStatusPill is-${(payment.status || 'pending').toLowerCase()}`}>
                      {payment.status || 'Pending'}
                    </span>
                    {isPaid ? (
                      <span className="paymentStatusPill is-paid">
                        <FiFileText aria-hidden="true" /> Receipt
                      </span>
                    ) : null}
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        <div className="paymentPage__actions">
          <button type="button" className="paymentButton paymentButton--ghost" onClick={() => navigate(-1)}>
            <FiArrowLeft aria-hidden="true" /> Back
          </button>
        </div>
      </div>
    </div>
  )
}
