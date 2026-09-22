# Budget Review approvals

Deploy ProspectBudgetReviewMobileController.cls and its metadata plus ProspectBudgetReviewMobileControllerTest.cls and metadata. Run the Apex tests in your org; fixtures may need org-specific required fields and validation rules. Grant the existing Salesforce Site guest profile access to this REST class.

## Fields and behavior

- Customer Budget: Opportunity.Budget__c.
- Supervisor Budget and Estimated Duration use the re-visit pair only when both Re_Visit_Site_Supervisor_Estimate_Budget__c and ReVisit_Site_Estimated_Completion_Months__c are populated (zero counts as populated). If either is missing, both values use the original estimate pair.
- Original estimate pair: Supervisor_Estimated_Budget__c and Project_Estimated_Completion_Months__c. Numeric values display with months; text/picklist values retain their units.
- Client approval: Budget_Review_Status__c = Client Approved.
- Change request: Budget_Review_Status__c = Client Requested Changes, with required text in Budget_Review_Client_Remarks__c.
- Approval comments are optional and stored when supplied.
- Only Sent for Client Approval accepts a response. Not Sent reviews are hidden; other statuses show read-only details.
- The existing Salesforce sending workflow must set Sent for Client Approval. Reading the portal never sets that status.
- The POST resolves the converted Lead's Opportunity, verifies the requested Opportunity, locks the row and saves synchronously. This endpoint does not invoke BudgetReviewClientResponseQueueable; the supplied queueable is unchanged.
- Existing Opportunity triggers still run when the status changes.

The portal polls every 30 seconds while visible and on focus. Browser-local tracking creates a new notification when an observed non-pending status returns to Sent for Client Approval. Successful portal responses update this observed status immediately. Read history and deletions persist across reloads in the same browser. No new Salesforce field or trigger is required.

A complete response/resend cycle that occurs elsewhere while the portal is offline cannot be detected reliably if it sees Sent both before and after. Clearing browser storage also clears tracking. Existing legacy notification history is retained.

The API retains the supplied Lead-ID-based access contract. It is not a new authenticated-session mechanism. Converted client login must retain leadId.

## Validation

Frontend tests cover fallback/zero amounts, duration, approve/change requests, missing remarks, duplicate conflicts, unsent/completed states, and notification history. Apex regression tests cover budget selection, duplicate responses, remarks, and unrelated Opportunity rejection. Apex compilation and live Salesforce tests still need to run in your org.
