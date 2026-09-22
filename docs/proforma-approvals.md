# Proforma Invoice approvals

The portal lists Sent, Approved and Changes Requested invoices under Review & Approvals > Proforma Invoice Approvals. Clients can open invoice attachments, download files, approve once, or request changes with required comments.

Only Proforma_Invoice__c.Status__c and Client_Comments__c are changed. Opportunity fields are not updated. Sending an invoice remains the existing Salesforce workflow: it sets Status__c to Sent.

## Salesforce deployment

Deploy ProspectProformaInvoiceMobileController.cls and its metadata, together with ProspectProformaInvoiceMobileControllerTest.cls and metadata. Run the Apex tests in your Salesforce org and adapt fixtures to any org-specific required fields or validation rules. Apex compilation and org tests have not been run locally.

Enable access to this REST class on the Salesforce Site guest profile used by VITE_SALESFORCE_SITE_URL. Keep your existing ProformaInvoiceMobileTrigger and ProformaInvoiceTriggerHandler; their token creation, emails and other workflows remain in place.

The updated REST controller adds GET ?leadId=...&list=true. Exact invoice and file requests retain invoiceId + secureToken checks and verify the invoice belongs to the converted Lead's Opportunity. POST locks the invoice, rechecks ownership/token and requires persisted status Sent. It saves synchronously, replacing this endpoint's queueable call, so simultaneous/repeated decisions cannot overwrite a recorded response. The supplied ProformaClientResponseQueueable is not modified; other callers of that legacy queueable are outside this change.

## Notifications and sessions

The open portal checks for invoices every 30 seconds and on focus. Each Sent invoice gets one notification linking to its invoice card. Read notifications remain in All Notifications; deletion persists. Notification history is browser-local and scoped by Lead ID. Tokens are not stored in notification history.

This API uses the supplied converted Lead ID / invoice token access model, not a new authenticated Salesforce session. Listing still uses Lead ID as in the supplied latest-invoice endpoint. Clients need the prospect login response retaining their converted Lead ID; a contact-only login without a Lead ID cannot use this endpoint.

## Verification

Frontend tests cover parsing, decisions, required comments, conflicts, scoped file URLs, invoice viewing and notification persistence. Confirm in a Salesforce sandbox: send an invoice, receive the portal notification, view/download linked files, approve or request changes, then verify repeat submissions fail and unrelated Opportunity access is rejected. Existing org-trigger email behavior also needs sandbox verification.