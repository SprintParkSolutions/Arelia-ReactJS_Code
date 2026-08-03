import { BASE_URL, SITE_PATH, parseResponse, asRecord, asString, asNumber, asBoolean } from './salesforceApi'
import type {
  PaymentGatewayDetails,
  CreateOrderResponse,
  VerifyPaymentPayload,
  VerifyPaymentResponse,
  PaymentHistoryItem,
  ReceiptData,
  OfflinePaymentPayload,
  OfflinePaymentResponse,
} from '../types/payment'

const PAYMENT_BASE_URL = `${BASE_URL}${SITE_PATH}/services/apexrest/payment`

function buildQuery(params: Record<string, string | undefined>): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value)
  }
  const query = search.toString()
  return query ? `?${query}` : ''
}

function normalizeGatewayDetails(rawData: unknown): PaymentGatewayDetails | null {
  const data = asRecord(rawData)
  if (!data || data.success === false) return null

  const paymentTermId = asString(data.paymentTermId)
  if (!paymentTermId) return null

  return {
    paymentTermId,
    projectName: asString(data.projectName),
    customerName: asString(data.customerName),
    customerEmail: asString(data.customerEmail),
    customerPhone: asString(data.customerPhone),
    installmentLabel: asString(data.installmentLabel),
    percentage: asNumber(data.percentage),
    amount: asNumber(data.amount),
    totalAmount: asNumber(data.totalAmount),
    dueDate: asString(data.dueDate),
    status: asString(data.status) as PaymentGatewayDetails['status'],
  }
}

function normalizeHistoryItem(rawItem: unknown): PaymentHistoryItem | undefined {
  const item = asRecord(rawItem)
  if (!item) return undefined
  const paymentTermId = asString(item.paymentTermId)
  if (!paymentTermId) return undefined

  return {
    paymentTermId,
    projectName: asString(item.projectName),
    installmentLabel: asString(item.installmentLabel),
    amount: asNumber(item.amount),
    percentage: asNumber(item.percentage),
    status: asString(item.status),
    dueDate: asString(item.dueDate),
    paymentDate: asString(item.paymentDate),
    razorpayPaymentId: asString(item.razorpayPaymentId),
  }
}

function normalizeReceipt(rawReceipt: unknown): ReceiptData | null {
  const receipt = asRecord(rawReceipt)
  if (!receipt) return null
  const receiptNumber = asString(receipt.receiptNumber)
  if (!receiptNumber) return null

  return {
    receiptNumber,
    projectName: asString(receipt.projectName),
    customerName: asString(receipt.customerName),
    customerEmail: asString(receipt.customerEmail),
    installmentLabel: asString(receipt.installmentLabel),
    percentage: asNumber(receipt.percentage),
    amount: asNumber(receipt.amount),
    currency: asString(receipt.currency),
    paymentDate: asString(receipt.paymentDate),
    razorpayOrderId: asString(receipt.razorpayOrderId),
    razorpayPaymentId: asString(receipt.razorpayPaymentId),
    status: asString(receipt.status),
  }
}

export async function getPaymentGatewayDetails(
  paymentTermId: string,
  contactId?: string,
): Promise<PaymentGatewayDetails | null> {
  try {
    const query = buildQuery({ paymentTermId, contactId })
    const response = await fetch(`${PAYMENT_BASE_URL}/details${query}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })
    const data = await parseResponse(response)
    return normalizeGatewayDetails(data)
  } catch (error) {
    console.error('Error fetching payment gateway details:', error)
    return null
  }
}

export async function createPaymentOrder(
  paymentTermId: string,
  contactId?: string,
): Promise<CreateOrderResponse> {
  try {
    const response = await fetch(`${PAYMENT_BASE_URL}/createOrder`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentTermId, contactId }),
    })
    const data = await parseResponse(response)
    const record = asRecord(data)
    if (!record) {
      return { success: false, message: 'Unexpected response while creating the payment order.' }
    }
    return {
      success: asBoolean(record.success) ?? false,
      message: asString(record.message),
      orderId: asString(record.orderId),
      amount: asNumber(record.amount),
      currency: asString(record.currency),
      keyId: asString(record.keyId),
    }
  } catch (error) {
    console.error('Error creating payment order:', error)
    return { success: false, message: 'Could not reach the payment server. Please try again.' }
  }
}

export async function verifyPayment(payload: VerifyPaymentPayload): Promise<VerifyPaymentResponse> {
  try {
    const response = await fetch(`${PAYMENT_BASE_URL}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await parseResponse(response)
    const record = asRecord(data)
    if (!record) {
      return { success: false, message: 'Unexpected response while verifying the payment.' }
    }
    return {
      success: asBoolean(record.success) ?? false,
      message: asString(record.message),
      transactionStatus: asString(record.transactionStatus),
      paymentDate: asString(record.paymentDate),
    }
  } catch (error) {
    console.error('Error verifying payment:', error)
    return { success: false, message: 'Could not reach the payment server. Please try again.' }
  }
}

export async function submitOfflinePayment(payload: OfflinePaymentPayload): Promise<OfflinePaymentResponse> {
  try {
    const response = await fetch(`${PAYMENT_BASE_URL}/offline`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await parseResponse(response)
    const record = asRecord(data)
    if (!record) {
      return { success: false, message: 'Unexpected response while saving your offline payment details.' }
    }
    return {
      success: asBoolean(record.success) ?? false,
      message: asString(record.message),
    }
  } catch (error) {
    console.error('Error submitting offline payment details:', error)
    return { success: false, message: 'Could not reach the payment server. Please try again.' }
  }
}

export async function getPaymentHistory(contactId: string): Promise<PaymentHistoryItem[] | null> {
  try {
    const query = buildQuery({ contactId })
    const response = await fetch(`${PAYMENT_BASE_URL}/history${query}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })
    const data = await parseResponse(response)
    const record = asRecord(data)
    if (!record || record.success === false) return null
    const payments = Array.isArray(record.payments) ? record.payments : []
    return payments.map(normalizeHistoryItem).filter(Boolean) as PaymentHistoryItem[]
  } catch (error) {
    console.error('Error fetching payment history:', error)
    return null
  }
}

export async function getPaymentReceipt(
  paymentTermId: string,
  contactId?: string,
): Promise<ReceiptData | null> {
  try {
    const query = buildQuery({ paymentTermId, contactId })
    const response = await fetch(`${PAYMENT_BASE_URL}/receipt${query}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })
    const data = await parseResponse(response)
    const record = asRecord(data)
    if (!record || record.success === false) return null
    return normalizeReceipt(record.receipt)
  } catch (error) {
    console.error('Error fetching payment receipt:', error)
    return null
  }
}

const RAZORPAY_CHECKOUT_SCRIPT_SRC = 'https://checkout.razorpay.com/v1/checkout.js'

let razorpayScriptPromise: Promise<boolean> | null = null

export function loadRazorpayCheckoutScript(): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false)
  if (window.Razorpay) return Promise.resolve(true)

  if (!razorpayScriptPromise) {
    razorpayScriptPromise = new Promise((resolve) => {
      const existing = document.querySelector(
        `script[src="${RAZORPAY_CHECKOUT_SCRIPT_SRC}"]`,
      )
      if (existing) {
        existing.addEventListener('load', () => resolve(true))
        existing.addEventListener('error', () => resolve(false))
        return
      }

      const script = document.createElement('script')
      script.src = RAZORPAY_CHECKOUT_SCRIPT_SRC
      script.async = true
      script.onload = () => resolve(true)
      script.onerror = () => resolve(false)
      document.body.appendChild(script)
    })
  }

  return razorpayScriptPromise
}
