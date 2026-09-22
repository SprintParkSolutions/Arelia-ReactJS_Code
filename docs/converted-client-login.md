# Converted-client login email

## Cause and fix
The supplied login class searched only Lead.Email and Lead.Enter_Password__c. Updating the converted Contact and Opportunity did not update that login lookup.

ProspectLeadLoginRestController now uses:
- Unconverted Lead: Lead.Email and Lead.Enter_Password__c.
- Converted Lead: current Contact.Email, matched through Lead.ConvertedContactId, and Contact.Password__c.

Contact.Email is the authoritative login address after conversion. Opportunity.Email__c is project data, not an additional login alias. Once Contact.Email changes, the converted Lead's old email is no longer accepted for that account. No Lead, Contact, or Opportunity records are modified by login.

The response still returns the original leadId so existing portal requests continue working. Name, email and phone come from the matched Contact for converted clients. No frontend changes or endpoint changes are needed. Existing password extraction is retained. Converted clients require an exact, case-sensitive Contact.Password__c match; there is no fallback to the old Lead password.

## Deployment and validation
Deploy ProspectLeadLoginRestController.cls and its metadata, plus ProspectLeadLoginRestControllerTest.cls and its metadata. Retain the existing Salesforce Site profile access to ProspectLeadLoginRestController.

Run ProspectLeadLoginRestControllerTest in the target sandbox before production deployment. The tests create their own Lead conversions and may need additional fixture fields if your org has custom required fields or validation rules.

Tests cover unconverted accounts, conversion without an email change, updated Contact/Opportunity email, old-email rejection, incorrect passwords, and rejection of unrelated Contact or Opportunity-only email addresses.

Apex tests have been added but have not been executed in Salesforce here. Verify the deployed endpoint with a converted test client, its updated Contact email, and its current Contact.Password__c password. This change applies to /registration/lead/login; the separate /mobileLogin and password-reset controllers were not supplied and are unchanged.

Additional regression cases cover a Contact password different from the Lead password, password changes after conversion, case sensitivity, and a missing Contact password.
