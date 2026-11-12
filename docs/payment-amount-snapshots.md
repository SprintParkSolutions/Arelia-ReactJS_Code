# Preserve completed installment amounts

The supplied PaymentService calculated every installment, receipt and history item as the latest Supervisor_Estimated_Budget__c multiplied by Percentage__c. The frontend repeated that calculation. Neither could preserve a completed payment after a budget change.

## Result

For a project increased from INR 85,000 to INR 95,000 with INR 17,000 and INR 25,500 already received, paid amounts remain unchanged, amount paid is INR 42,500, and balance is INR 52,500. The two unpaid 25% milestones receive INR 26,250 each. Progress is actual money received / current total (about 44.74%), rather than the sum of historical milestone percentages.

PaymentScheduleCalculator distributes the remaining balance in proportion to unpaid milestone percentages. Cumulative rounding allocates every paise deterministically in due-date/ID order. Both increases and decreases affect unpaid terms only. Paid_Amount__c stores actual historical receipts. Missing history produces unavailable amounts; it is never inferred from the latest budget, a screenshot or browser storage.

PaymentTermRestService returns amount, paidAmount and totalAmount. The UI and PDF use those values. PaymentService shares the same allocation across schedule, details, receipts and history.

## Deployment and reconciliation

These are local source changes, not deployed Salesforce changes. The existing org classes PaymentException, PaymentUtil, ReceiptArtifactService and PaymentSuccessEmailService remain dependencies and were not supplied in this repository.

1. In a Salesforce sandbox, deploy the two currency fields under objects/Payment_Term__c/fields.
2. Before enabling the revised endpoints, reconcile every already-paid term from verified bank/Razorpay transaction records or an original, verified receipt artifact. Populate Paid_Amount__c with the actual amount received. Never use the revised budget percentage. Payment descriptions may help identify a transaction but should not be parsed automatically as authoritative amounts. In the user's example the expected historical values are 17000 and 25500; verify these against the original transactions and use the actual record IDs from Salesforce when backfilling. No reconciliation DML has been run by this change.
3. Deploy PaymentScheduleCalculator, PaymentService, PaymentTermRestService, RazorpayController, PaymentAmountSnapshotHandler and matching class metadata. Update the existing AreliaPaymentNotificationTrigger as shown below; there is no separate PaymentAmountSnapshot trigger. If that separate trigger was previously deployed, deactivate or delete it in Salesforce to avoid duplicate validation.
4. Add Amount Received to the internal payment form and give the appropriate internal staff field access. An offline settlement must explicitly supply the actual received amount along with the paid status; selecting Offline in the portal still only records a payment intention. No guest CRUD/FLS grants are added.
5. Existing in-flight Razorpay orders created before Order_Amount__c existed require reconciliation against the actual provider order amount. Populate the matching snapshot only after verification; do not derive it from the new budget. Unresolved orders fail closed.
6. Inspect the org's webhook and any other direct writers. All successful online settlement paths must use PaymentService.markPaymentSuccess and a server-recorded order snapshot. If the webhook renders a receipt/email from getPayableTerm, change it to getPaymentVerificationDetail(termId, contactId, orderId) so it uses the original order amount. The supplied RazorpayWebhook has been restored to its original behavior as requested; any future integration must be reviewed separately.
7. Run PaymentScheduleCalculatorTest and the org's existing payment/controller/webhook tests in the sandbox. Apex compilation, DML integrations, site permissions, org validation rules and coverage must be verified there. Then deploy the frontend with the revised endpoint; do not ship it separately against the old amount-less response.
8. Confirm the exact example above in the schedule, downloaded PDF, receipt endpoint, history, details and the Razorpay order. Test a budget change between order creation and verification, duplicate verification/webhook delivery, manual offline settlement, missing legacy amounts, decimal balances, multiple projects and simultaneous order requests.

## Payment order behavior

createOrder records Order_Amount__c and Razorpay_Order_Id__c only after the callout. Verification stores that snapshot as Paid_Amount__c, ignoring a recalculated amount argument. An already-paid term cannot be overwritten by duplicate success or late failure.

An existing open order is reused only if its amount still matches the current schedule. If the budget changed, creation is blocked pending reconciliation of that open order. This is the behavior restored when the replacement-order changes were undone.

The supplied RazorpayService and RazorpayWebhook are restored to their original behavior. There is no automatic replacement-order lookup or retained-order history feature. No Salesforce deployment, field deletion or record update was performed by this local rollback.

The snapshot handler permits manual corrections to an existing paid amount. It rejects negative amounts and requires an actual amount when newly marking an installment paid. Automatic project-budget recalculation still leaves recorded paid amounts unchanged.

If all milestones are already paid and a budget increase leaves a balance, add a new unpaid milestone through the existing Salesforce workflow. The UI reports that outstanding balance instead of rewriting history. An overpayment is preserved and flagged for support. Refund accounting remains outside this budget-change fix; verify the org's refund workflow separately.

## Verification performed locally

Frontend regression tests cover authoritative API amount parsing, historical amounts after a budget change, unknown legacy data, actual paid progress, paise, schedule rendering and PDF output. Apex tests cover allocation, exact balance totals, missing historical amounts, budget decreases, order snapshot lookup and snapshot validation. Apex tests must still be compiled and run in Salesforce.

## Existing trigger integration

Update the existing Salesforce trigger to run snapshot validation before writes and retain notification handling after updates:

```apex
trigger AreliaPaymentNotificationTrigger on Payment_Term__c (
    before insert,
    before update,
    after update
) {
    if (Trigger.isBefore) {
        PaymentAmountSnapshotHandler.validate(
            Trigger.new,
            Trigger.isUpdate ? Trigger.oldMap : null
        );
    }
    if (Trigger.isAfter && Trigger.isUpdate) {
        AreliaPaymentNotificationHandler.handleAfterUpdate(
            Trigger.new,
            Trigger.oldMap
        );
    }
}
```

The existing notification trigger and handler are not stored in this repository. Apply this integration to their existing Salesforce source; removing the local standalone trigger does not delete a deployed trigger.
