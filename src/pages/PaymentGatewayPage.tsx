import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { FiArrowLeft, FiLock } from 'react-icons/fi'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/toast/ToastContext'
import { PaymentModeModal } from '../components/payment/PaymentModeModal'
import {
  createPaymentOrder,
  getPaymentGatewayDetails,
  loadRazorpayCheckoutScript,
  submitOfflinePayment,
  verifyPayment,
} from '../services/paymentApi'
import type { PaymentGatewayDetails, RazorpaySuccessResponse } from '../types/payment'
import { formatCurrency, formatDate } from '../utils/format'
import './PaymentShared.css'

export function PaymentGatewayPage() {
  const { paymentTermId } = useParams<{ paymentTermId: string }>()
  const { client } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const contactId = client?.contactId || client?.leadId

  const [details, setDetails] = useState<PaymentGatewayDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isModeModalOpen, setIsModeModalOpen] = useState(false)
  const [isSubmittingOffline, setIsSubmittingOffline] = useState(false)
  const [offlinePaymentRecorded, setOfflinePaymentRecorded] = useState(false)

  useEffect(() => {
    let isCancelled = false

    async function loadDetails() {
      if (!paymentTermId) {
        setIsLoading(false)
        return
      }
      setIsLoading(true)
      const result = await getPaymentGatewayDetails(paymentTermId, contactId)
      if (!isCancelled) {
        setDetails(result)
        setIsLoading(false)
      }
    }

    void loadDetails()
    return () => {
      isCancelled = true
    }
  }, [paymentTermId, contactId])

  async function handleProceedToPay() {
    if (!paymentTermId) return
    setIsProcessing(true)

    const scriptLoaded = await loadRazorpayCheckoutScript()
    if (!scriptLoaded || !window.Razorpay) {
      showToast('Could not load the payment gateway. Please check your connection and try again.', 'error')
      setIsProcessing(false)
      return
    }

    const order = await createPaymentOrder(paymentTermId, contactId)
    if (!order.success || !order.orderId || !order.amount || !order.keyId) {
      showToast(order.message || 'Could not start the payment. Please try again.', 'error')
      setIsProcessing(false)
      return
    }

    const razorpay = new window.Razorpay({
      key: order.keyId,
      amount: order.amount,
      currency: order.currency || 'INR',
      order_id: order.orderId,
      name: 'ARELIA',
      description: details?.installmentLabel || 'Installment payment',
      prefill: {
        name: details?.customerName,
        email: details?.customerEmail,
        contact: details?.customerPhone,
      },
      theme: { color: '#c8a97e' },
      handler: (response: RazorpaySuccessResponse) => {
        void handleCheckoutSuccess(response)
      },
      modal: {
        ondismiss: () => {
          setIsProcessing(false)
          showToast('Payment cancelled.', 'info')
        },
      },
    })

    razorpay.open()
  }

  async function handleCheckoutSuccess(response: RazorpaySuccessResponse) {
    if (!paymentTermId) return

    const result = await verifyPayment({
      paymentTermId,
      razorpayOrderId: response.razorpay_order_id,
      razorpayPaymentId: response.razorpay_payment_id,
      razorpaySignature: response.razorpay_signature,
      contactId,
    })

    setIsProcessing(false)

    if (result.success) {
      navigate(`/payment/success/${paymentTermId}`)
    } else {
      navigate(`/payment/failed/${paymentTermId}`)
    }
  }

  function handleContinueOnline() {
    setIsModeModalOpen(false)
    void handleProceedToPay()
  }

  async function handleSubmitOffline(description: string) {
    if (!paymentTermId) return
    setIsSubmittingOffline(true)

    const result = await submitOfflinePayment({ paymentTermId, contactId, description })

    setIsSubmittingOffline(false)

    if (result.success) {
      setIsModeModalOpen(false)
      setOfflinePaymentRecorded(true)
      showToast(
        result.message || 'Your offline payment details have been recorded. Please contact your supervisor to complete the payment.',
        'success',
      )
    } else {
      showToast(result.message || 'Could not save your offline payment details. Please try again.', 'error')
    }
  }

  if (isLoading) {
    return (
      <div className="paymentPage">
        <div className="paymentPage__container">
          <p className="paymentLoading">Loading payment details...</p>
        </div>
      </div>
    )
  }

  if (!details) {
    return (
      <div className="paymentPage">
        <div className="paymentPage__container">
          <div className="paymentEmptyState">
            This payment link is invalid or no longer available. Please return to your dashboard and try again.
          </div>
          <div className="paymentPage__actions">
            <button type="button" className="paymentButton paymentButton--ghost" onClick={() => navigate(-1)}>
              <FiArrowLeft aria-hidden="true" /> Back
            </button>
          </div>
        </div>
      </div>
    )
  }

  const isPending = details.status === 'Pending'

  return (
    <div className="paymentPage">
      <div className="paymentPage__container">
        <button
          type="button"
          className="paymentPage__backButton"
          onClick={() => navigate(-1)}
          aria-label="Back"
        >
          <FiArrowLeft aria-hidden="true" />
        </button>

        <div>
          <p className="paymentPage__eyebrow">Secure Checkout</p>
          <h1 className="paymentPage__title">{details.installmentLabel || 'Installment Payment'}</h1>
          <p className="paymentPage__lead">
            Review your installment details below. You'll be redirected to Razorpay's secure checkout to complete
            payment.
          </p>
        </div>

        <div className="paymentCard">
          <div className="paymentDetailGrid">
            <div className="paymentDetailGrid__item">
              <span>Project Name</span>
              <strong>{details.projectName || '—'}</strong>
            </div>
            <div className="paymentDetailGrid__item">
              <span>Customer Name</span>
              <strong>{details.customerName || '—'}</strong>
            </div>
            <div className="paymentDetailGrid__item">
              <span>Installment</span>
              <strong>{details.installmentLabel || '—'}</strong>
            </div>
            <div className="paymentDetailGrid__item">
              <span>Due Date</span>
              <strong>{formatDate(details.dueDate) || 'Not set'}</strong>
            </div>
            <div className="paymentDetailGrid__item">
              <span>Payment Status</span>
              <span className={`paymentStatusPill is-${(details.status || 'pending').toLowerCase()}`}>
                {details.status || 'Pending'}
              </span>
            </div>
            <div className="paymentDetailGrid__item">
              <span>Total Amount</span>
              <strong>{formatCurrency(details.totalAmount)}</strong>
            </div>
            <div className="paymentDetailGrid__item">
              <span>Amount Due</span>
              <strong className="paymentAmount">{formatCurrency(details.amount)}</strong>
            </div>
          </div>
        </div>

        {isPending && offlinePaymentRecorded ? (
          <div className="paymentEmptyState">
            Your offline payment details have been recorded. Please contact your supervisor to complete this
            payment.
          </div>
        ) : isPending ? (
          <button type="button" className="paymentButton" onClick={() => setIsModeModalOpen(true)} disabled={isProcessing}>
            <FiLock aria-hidden="true" /> {isProcessing ? 'Processing…' : 'Proceed To Pay'}
          </button>
        ) : (
          <div className="paymentEmptyState">
            This installment has already been {details.status?.toLowerCase() || 'processed'} and cannot be paid again.
          </div>
        )}
      </div>

      <PaymentModeModal
        isOpen={isModeModalOpen}
        amountLabel={formatCurrency(details.amount)}
        isSubmitting={isSubmittingOffline}
        onClose={() => setIsModeModalOpen(false)}
        onContinueOnline={handleContinueOnline}
        onSubmitOffline={handleSubmitOffline}
      />
    </div>
  )
}
