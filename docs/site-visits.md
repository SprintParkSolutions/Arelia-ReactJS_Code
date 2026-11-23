# Site visit appointments and reports

The Site Visit Appointment & Report tab uses the three supplied Apex REST APIs. Appointment requests are checked on sign-in, every 30 seconds while the portal is visible, and when returning to the window. Clicking a notification opens the tab. Read notifications remain in All Notifications; history is stored per Lead in this browser. Different appointment date/time/status/sent-date combinations create separate notifications.

## Salesforce setup

Deploy these supplied classes and their metadata:
- ProspectSiteVisitRestController
- ProspectSiteVisitResponseRestController
- ProspectSiteVisitReportRestController

Enable access to all three Apex classes for the configured Salesforce Site profile, as you did for ProspectSupervisorInfoApi. The existing Salesforce base URL/site path configuration is reused.

No Salesforce records were changed during development. Apex deployment and live-org validation are still required. These classes retain the access model of your supplied Apex; Lead IDs in requests are not authentication tokens.

## Appointment response

Pending and Appointment Rescheduled appointments allow a client response.
- Approved: sets Appointment_Status__c to Approved and Appointment_Completed__c to true, retains Appointment_Date__c and Appointment_Time_Slots__c, clears temporary reschedule fields.
- Rescheduled: sets Appointment_Status__c to Rescheduled, writes Appointment_Rescheduled_Time__c (date) and Time_Slots__c (time slot), clears Appointment_Date__c and Appointment_Time_Slots__c. The supplied controller also sets Appointment_Completed__c to true for this action; that behavior is preserved.

The UI uses the time-slot list returned by Salesforce and disallows past requested dates. It displays the saved requested date/time for Rescheduled and confirmed date/time for Approved. API errors remain visible and failed submissions are not reported as successful.

## Reports

The report endpoint returns the latest final-submitted, management-approved report for the Lead. Both the server and frontend enforce these visibility flags. Attached documents download through the supplied report endpoint with leadId, reportId, and versionId; the server checks report ownership, approval, and file linkage. A missing report is distinct from missing endpoint/profile access.

## Validation

Frontend tests cover request payloads, error responses, report approval gating, appointment controls, and persistent read history. Run npm test and npm run build. Apex classes cannot be executed by the local frontend test runner; verify the deployed classes and any org-specific triggers/validation rules in a Salesforce sandbox.

A newly available management-approved report creates one report-ready notification per report ID. It opens the Site Visit Appointment & Report tab and remains in All Notifications after being read. Report checks use the same 30-second visible-window polling and focus refresh as appointments.
