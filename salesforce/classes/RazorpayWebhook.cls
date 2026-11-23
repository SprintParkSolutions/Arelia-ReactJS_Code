/**
 * Original supplied webhook behavior: matches the active Razorpay order ID.
 * X-Razorpay-Signature validation is the server-to-server security boundary.
 */
@RestResource(urlMapping='/payment/webhook')
global without sharing class RazorpayWebhook {
    @HttpPost
    global static void handleWebhook() {
        RestRequest req = RestContext.request;
        RestResponse res = RestContext.response;
        String rawBody = req.requestBody != null ? req.requestBody.toString() : '';
        String signature = req.headers.get('X-Razorpay-Signature');
        if (!PaymentUtil.verifyWebhookSignature(rawBody, signature)) {
            res.statusCode = 400;
            res.responseBody = Blob.valueOf('{"status":"invalid signature"}');
            return;
        }
        try {
            Map<String, Object> payload = (Map<String, Object>) JSON.deserializeUntyped(rawBody);
            String eventName = (String) payload.get('event');
            Map<String, Object> payloadData = (Map<String, Object>) payload.get('payload');
            if (eventName == 'payment.captured' || eventName == 'order.paid') {
                Map<String, Object> paymentEntity = extractEntity(payloadData, 'payment');
                if (paymentEntity != null) {
                    String orderId = (String) paymentEntity.get('order_id');
                    String paymentId = (String) paymentEntity.get('id');
                    Payment_Term__c term = findByOrderId(orderId);
                    if (term != null) {
                        PaymentService.PaymentTermDetail detail = PaymentService.getPayableTerm(term.Id, null);
                        Blob receiptPdf;
                        try {
                            receiptPdf = ReceiptArtifactService.renderReceiptPdf(detail, orderId, paymentId);
                        } catch (Exception ex) {
                            System.debug(LoggingLevel.ERROR, 'Could not render receipt PDF: ' + ex.getMessage());
                        }
                        Boolean newlyPaid = PaymentService.markPaymentSuccess(term.Id, orderId, paymentId, signature, detail.amount);
                        if (receiptPdf != null) {
                            ReceiptArtifactService.attachReceiptArtifacts(term.Id, detail, orderId, paymentId, receiptPdf);
                        }
                        if (newlyPaid) {
                            String paymentDateLabel = Datetime.now().format('dd MMM yyyy, hh:mm a');
                            PaymentSuccessEmailService.sendPaymentSuccessEmails(detail, paymentId, paymentDateLabel, term.Project__r.Client__c, receiptPdf);
                        }
                    }
                }
            } else if (eventName == 'payment.failed') {
                Map<String, Object> paymentEntity = extractEntity(payloadData, 'payment');
                if (paymentEntity != null) {
                    String orderId = (String) paymentEntity.get('order_id');
                    Payment_Term__c term = findByOrderId(orderId);
                    if (term != null) PaymentService.markPaymentFailed(term.Id, orderId);
                }
            } else if (eventName == 'refund.created') {
                Map<String, Object> refundEntity = extractEntity(payloadData, 'refund');
                if (refundEntity != null) {
                    String paymentId = (String) refundEntity.get('payment_id');
                    Payment_Term__c term = findByPaymentId(paymentId);
                    if (term != null) PaymentService.markPaymentRefunded(term.Razorpay_Order_Id__c);
                }
            }
            res.statusCode = 200;
            res.responseBody = Blob.valueOf('{"status":"ok"}');
        } catch (Exception ex) {
            System.debug(LoggingLevel.ERROR, 'RazorpayWebhook processing error: ' + ex.getMessage());
            res.statusCode = 200;
            res.responseBody = Blob.valueOf('{"status":"received"}');
        }
    }

    private static Map<String, Object> extractEntity(Map<String, Object> payloadData, String key) {
        if (payloadData == null || !payloadData.containsKey(key)) return null;
        Map<String, Object> wrapper = (Map<String, Object>) payloadData.get(key);
        return wrapper != null ? (Map<String, Object>) wrapper.get('entity') : null;
    }

    private static Payment_Term__c findByOrderId(String orderId) {
        if (String.isBlank(orderId)) return null;
        List<Payment_Term__c> terms = [
            SELECT Id, Razorpay_Order_Id__c, Project__r.Client__c
            FROM Payment_Term__c WHERE Razorpay_Order_Id__c = :orderId LIMIT 1
        ];
        return terms.isEmpty() ? null : terms[0];
    }

    private static Payment_Term__c findByPaymentId(String paymentId) {
        if (String.isBlank(paymentId)) return null;
        List<Payment_Term__c> terms = [
            SELECT Id, Razorpay_Order_Id__c FROM Payment_Term__c
            WHERE Razorpay_Payment_Id__c = :paymentId LIMIT 1
        ];
        return terms.isEmpty() ? null : terms[0];
    }
}
