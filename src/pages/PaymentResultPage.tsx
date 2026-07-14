import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { FiArrowLeft, FiCheckCircle, FiFileText, FiRefreshCw, FiXCircle } from 'react-icons/fi'
import { useAuth } from '../context/AuthContext'
import { getPaymentGatewayDetails } from '../services/paymentApi'
import type { PaymentGatewayDetails } from '../types/payment'
import { formatCurrency } from '../utils/format'
import './PaymentShared.css'

type PaymentResultPageProps = {
  status: 'success' | 'failed'
}

export function PaymentResultPage({ status }: PaymentResultPageProps) {
  const { paymentTermId } = useParams<{ paymentTermId: string }>()
  const { client } = useAuth()
  const navigate = useNavigate()
  const contactId = client?.contactId || client?.leadId

  const [details, setDetails] = useState<PaymentGatewayDetails | null>(null)

  useEffect(() => {
    let isCancelled = false

    async function loadDetails() {
      if (!paymentTermId) return
      const result = await getPaymentGatewayDetails(paymentTermId, contactId)
      if (!isCancelled) setDetails(result)
    }

    void loadDetails()
    return () => {
      isCancelled = true
    }
  }, [paymentTermId, contactId])

  const isSuccess = status === 'success'

  return (
    <div className="paymentPage">
      <div className="paymentPage__container">
        <div className={`paymentResultIcon ${isSuccess ? 'is-success' : 'is-failed'}`}>
          {isSuccess ? <FiCheckCircle aria-hidden="true" /> : <FiXCircle aria-hidden="true" />}
        </div>

        <div>
          <p className="paymentPage__eyebrow">{isSuccess ? 'Payment Confirmed' : 'Payment Issue'}</p>
          <h1 className="paymentPage__title">{isSuccess ? 'Payment Successful' : 'Payment Failed'}</h1>
          <p className="paymentPage__lead">
            {isSuccess
              ? 'Your installment payment has been received and recorded against your project.'
              : 'We could not confirm this payment. If an amount was debited, it will be refunded automatically, or please contact support.'}
          </p>
        </div>

        {details ? (
          <div className="paymentCard">
            <div className="paymentDetailGrid">
              <div className="paymentDetailGrid__item">
                <span>Project</span>
                <strong>{details.projectName || '—'}</strong>
              </div>
              <div className="paymentDetailGrid__item">
                <span>Installment</span>
                <strong>{details.installmentLabel || '—'}</strong>
              </div>
              <div className="paymentDetailGrid__item">
                <span>Amount</span>
                <strong className="paymentAmount">{formatCurrency(details.amount)}</strong>
              </div>
              <div className="paymentDetailGrid__item">
                <span>Status</span>
                <span className={`paymentStatusPill is-${(details.status || 'pending').toLowerCase()}`}>
                  {details.status || 'Pending'}
                </span>
              </div>
            </div>
          </div>
        ) : null}

        <div className="paymentPage__actions">
          {isSuccess ? (
            <button
              type="button"
              className="paymentButton"
              onClick={() => navigate(`/payment/receipt/${paymentTermId}`)}
            >
              <FiFileText aria-hidden="true" /> View Receipt
            </button>
          ) : (
            <button type="button" className="paymentButton" onClick={() => navigate(`/payment/${paymentTermId}`)}>
              <FiRefreshCw aria-hidden="true" /> Try Again
            </button>
          )}
          <button type="button" className="paymentButton paymentButton--ghost" onClick={() => navigate(-1)}>
            <FiArrowLeft aria-hidden="true" /> Back
          </button>
        </div>
      </div>
    </div>
  )
}
