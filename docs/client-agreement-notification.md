# Client Agreement notification

Deploy ClientAgreementNotificationApi and ClientAgreementNotificationApiTest with their metadata. Enable the Site guest profile's Apex class access. No new fields or triggers are required. Run the Apex tests in Salesforce; local checks do not compile Apex or validate org-specific triggers.

GET /services/apexrest/client-portal/client-agreement-notification?leadId=... resolves the converted Opportunity from the Lead. The supplied API was changed to require leadId. An optional opportunityId must match that converted Opportunity. Existing consumers that send only opportunityId must supply leadId. This retains the portal's existing Lead-ID access model and does not add session authentication.

The notification uses the supplied API message and email fallback. It is informational: clicking marks it read without redirecting. The portal polls every 30 seconds while visible and on focus. It creates one notification per Opportunity when Client_Agreement_Sent__c is true, including on first login after sending. Read history and explicit deletions persist in the same browser. No email is sent by this integration.