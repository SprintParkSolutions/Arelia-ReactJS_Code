# Project details
Lead accounts load GET /registration/lead/project-details?leadId=... after sign-in.
Only a confirmed projectSubmitted: false response triggers the clickable reminder
in the dashboard and notification list. Clicking it selects Project Details.
Failed requests show a retry state; they do not imply the form was never submitted.

The seven required fields and the three picklists follow ProspectProjectDetailsApi.
POST sends the signed-in leadId and project fields to update the existing Lead.
After confirmed submission the form is read-only and the reminder disappears.
Returning visits fetch the saved Salesforce values. A 409 already-submitted
response locks the form and reloads Salesforce data instead of overwriting it.
Existing Contact accounts retain their project overview and do not receive the
Lead-only submission reminder.

The supplied Apex endpoint must be deployed and exposed on the configured Salesforce
site. No Apex deployment, live record modification, or authenticated live API
verification was performed as part of this frontend implementation.
## Approval notifications
Deploy salesforce/classes/ProspectProjectDetailsApi.cls to expose approvalStatus
from Lead.Approval_Status__c in GET responses. This update reads the picklist only;
the website cannot set or change approvals. No deployment was performed locally.
The portal checks immediately, every 30 seconds while visible, and on tab focus.
Approved creates one notification per Lead, including when first observed on a
later sign-in. Pending, Rejected, failed responses, or absent status do not create
an approval notification. Read/deleted state persists per Lead in this browser.
Clicking the approval notification marks it read without changing the active tab. The approval message appears only in notifications. Read history remains in All Notifications.