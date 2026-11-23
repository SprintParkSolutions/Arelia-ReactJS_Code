# Payment Terms approvals

Deploy ProspectPaymentTermsMobileController.cls and metadata, plus ProspectPaymentTermsMobileControllerTest.cls and metadata. Grant the Salesforce Site guest profile access to the REST class. Run the Apex tests in your org, adapting test fixtures to any additional validation rules/required fields. No new field or trigger is needed.

The portal displays Payment_Term__c.Term_Label__c (falling back to Name), Percentage__c and Due_Date__c for the converted Lead's Opportunity. Open Review & Approvals > Payment Terms Approvals. Notifications link directly there.

Only Sent for Client Approval enables responses. Approval sets Opportunity.Payment_Terms_Status__c to Client Approved. Request changes requires comments and sets Client Requested Changes. Comments are saved in Payment_Term_Client_Remarks__c. Approval without comments clears previous remarks, matching the supplied queueable behavior. Submitted schedules remain read-only until explicitly re-sent.

The existing Salesforce sending workflow sets Sent for Client Approval. Reading the portal never changes status. Internal manager-review statuses and Not Sent are not exposed as client schedules.

The supplied REST class was adapted to save synchronously under an Opportunity row lock, with a status recheck. Submitting a response updates the Opportunity without an additional payment-line count check. Concurrent/repeated submissions cannot overwrite the recorded response. The provided PaymentTermsClientResponseQueueable is not called by this endpoint and was not changed; other legacy callers are outside this change. Existing Opportunity triggers still execute.

Notifications poll every 30 seconds while the portal is visible and on focus. History, read state and deletion are saved in browser storage. An observed Client Requested Changes -> Sent for Client Approval transition produces a fresh notification. A full response/resend cycle happening elsewhere while the portal is offline cannot be detected reliably without a server-side request identifier.

The existing Lead-ID-based API access contract is retained; this does not introduce session authentication. Clients must log in through the flow retaining their converted Lead ID.

Frontend regression tests cover schedule values, internal-status hiding, approvals, remarks, duplicate conflicts, notification history and observed resends. Apex tests were added but must be compiled and run in Salesforce. Confirm live status updates and any org-trigger behavior in your sandbox.
