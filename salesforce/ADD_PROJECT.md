# Add Project deployment

Deploy `objects/Lead/fields/Portal_Account_Key__c.field-meta.xml` together with
`ProspectProjectDetailsApi`, `ProspectProjectDetailsApiTest`,
`ProspectLeadLoginRestController`, and `ProspectLeadLoginRestControllerTest`.
Run both Apex test classes in the target org before releasing the frontend.
The Salesforce site profile must retain access to the REST controllers.

The Profile & Overview button opens a blank Project Details form. A POST with
`createNewProject: true` creates a submitted Lead in one operation, copying
credentials on the server (using current Contact credentials for converted clients).
The original Lead remains unchanged. The account key groups all new project Leads;
GET returns their separate briefs, including on subsequent logins. Existing
unlinked duplicate Leads are not automatically associated by email.

Deploy the backend and field before the frontend. Salesforce duplicate rules and
validation rules must allow these intentional additional Leads; blocking validation
errors are returned to the form. No live Salesforce deployment is performed by the
frontend build.
