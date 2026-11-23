# Supervisor information
Deploy salesforce/classes/ProspectSupervisorInfoApi.cls and its metadata to the org
used by VITE_SALESFORCE_SITE_URL. Expose the class to the configured Salesforce
Site using the same access arrangement as the existing Lead REST APIs.

GET /services/apexrest/registration/lead/supervisor?leadId=00Q...
returns success, leadId, assigned, supervisorUserId, supervisorUser,
supervisorUserEmail and supervisorUserPhone. Supervisor_User__c is treated as a
User lookup (as in the supplied email handler); its related Name is displayed.
Email and phone come from the exact Lead fields supplied by the user.

The portal polls every 30 seconds while visible and checks on focus. First observed
assignment creates one persistent notification per Lead. Clicking it opens Supervisor
Information. Read history remains in All Notifications, including across reloads.
Contact-only accounts do not call the Lead endpoint. API failures do not count as
an assignment. The email handler and email-trigger behavior are unchanged.

This class follows the existing without-sharing, Lead-ID API contract. That contract
does not itself authenticate Lead ownership; enforce account authorization at the
server before exposing private contact information to untrusted callers.
No Salesforce deployment, actual email sending, or live-org testing was performed.
