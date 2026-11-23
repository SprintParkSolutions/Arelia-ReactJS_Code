# Architecture design approvals

## Frontend
Review & Approve > 3D Design Approvals lists designs returned for the signed-in Contact. Sent designs allow approval or a change request; comments are required for changes. Approval has a confirmation step. Completed responses are read-only. The frontend prevents duplicate clicks and refreshes after a conflict or save.

Files use the design API's file route with Contact, Opportunity, Design, and ContentVersion IDs. The client UI offers Download only; download saves a blob with a filename.

Polling runs on sign-in, every 30 seconds while visible, and on focus. Each sent design produces one browser-persisted notification per Contact/design. Read and dismissed state is retained. Clicking opens the 3D Design Approvals sub-tab and highlights that design.

## Apex and identity
Deploy ArchitectureDesignSiteNotificationApi and its metadata, plus the updated ProspectLeadLoginRestController. The login response now includes the authenticated converted Contact ID alongside the existing Lead ID. Existing users must sign out/in after deployment to get the Contact ID.

The supplied Architecture API was adjusted to:
- Lock the Design row with FOR UPDATE before checking Sent and saving the decision.
- Verify Primary_Contact__c or the Lead's ConvertedContactId/ConvertedOpportunityId relationship for list, decision, and file requests. Matching email alone does not grant access.
- Exclude unsent designs from lists and file access.
- Disable caching of API/file responses.

Grant access to the new Apex class for the configured Salesforce Site profile. The API retains the supplied contactId-based ownership model: ownership checks do not authenticate the caller. Production access must bind that Contact to a server-validated session or token; a client-supplied Contact ID alone is not a credential.

Existing ArchitectureDesignTrigger/ArchitectureDesignTriggerHandler remain in Salesforce; they are not replaced. Approval invokes the existing update trigger and its management email workflow. No live Salesforce mutations or emails were performed during implementation.

## Confirmed decision field mapping
The confirmed fields are Architecture_Design__c.Status__c (Sent, Approved, Changes Requested) and Architecture_Design__c.Comments__c. Approval saves Approved; requesting changes saves Changes Requested and the client comments. The design remains linked through Opportunity__c. The supplied handler sends management emails; no separate Opportunity field update is implemented because no Opportunity fields were specified.

## Tests
Frontend regression tests cover payloads, comments, read-only decisions, notification history, and the Contact login response. Apex regression tests cover one-time decisions, required comments, unrelated Contacts (including matching emails), and file linkage. Apex tests need to be run in a Salesforce sandbox; org-specific required fields and validation rules may require fixture adjustments.

## Manager approval notification
The existing ArchitectureDesignSiteNotificationApi now returns Manager_Approval__c as managerApproval. Deploy the updated class to enable this notification. A true checkbox produces one additional final-internal-approval notification per Contact/design, prefixed with the design Name (AD-xxxx). It uses the existing 30-second visible-window polling and focus refresh, opens the relevant design, and preserves read/deleted history separately from the original review request. Already-approved designs also notify when first observed; no duplicate is created on later polls or sign-ins in the same browser.
