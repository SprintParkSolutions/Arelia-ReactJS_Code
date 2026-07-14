export type PaymentGatewayDetails = {
  paymentTermId: string
  projectName?: string
  customerName?: string
  customerEmail?: string
  customerPhone?: string
  installmentLabel?: string
  percentage?: number
  amount?: number // rupees
  totalAmount?: number // rupees
  dueDate?: string
  status?: 'Pending' | 'Paid' | 'Failed' | 'Refunded'
}

export type PaymentMode = 'Online' | 'Offline'

export type OfflinePaymentPayload = {
  paymentTermId: string
  contactId?: string
  description: string
}

export type OfflinePaymentResponse = {
  success: boolean
  message?: string
}

export type CreateOrderResponse = {
  success: boolean
  message?: string
  orderId?: string
  amount?: number // paise
  currency?: string
  keyId?: string
}

export type VerifyPaymentPayload = {
  paymentTermId: string
  razorpayOrderId: string
  razorpayPaymentId: string
  razorpaySignature: string
  contactId?: string
}

export type VerifyPaymentResponse = {
  success: boolean
  message?: string
  transactionStatus?: string
  paymentDate?: string
}

export type PaymentHistoryItem = {
  paymentTermId: string
  projectName?: string
  installmentLabel?: string
  amount?: number // rupees
  percentage?: number
  status?: string
  dueDate?: string
  paymentDate?: string
  razorpayPaymentId?: string
}

export type ReceiptData = {
  receiptNumber: string
  projectName?: string
  customerName?: string
  customerEmail?: string
  installmentLabel?: string
  percentage?: number
  amount?: number
  currency?: string
  paymentDate?: string
  razorpayOrderId?: string
  razorpayPaymentId?: string
  status?: string
}

export type RazorpaySuccessResponse = {
  razorpay_payment_id: string
  razorpay_order_id: string
  razorpay_signature: string
}

export type RazorpayCheckoutOptions = {
  key: string
  amount: number
  currency: string
  order_id: string
  name: string
  description?: string
  prefill?: { name?: string; email?: string; contact?: string }
  theme?: { color?: string }
  handler: (response: RazorpaySuccessResponse) => void
  modal?: { ondismiss?: () => void }
}

export type RazorpayCheckoutInstance = {
  open: () => void
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayCheckoutOptions) => RazorpayCheckoutInstance
  }
}
