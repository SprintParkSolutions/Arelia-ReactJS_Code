# Multi-project 3D design approvals

Deploy ArchitectureDesignSiteNotificationApi and DesignSiteNotificationApiTest before releasing the frontend. The existing Portal_Account_Key__c Lead field is required. The test class was renamed to fit Salesforce's identifier length limit.

The API includes Opportunities belonging to the Contact directly or through converted Leads in the same portal account group. The same relationship checks protect listing, decisions and downloads. Projects without published designs remain selectable. Unconverted Leads do not yet have an Opportunity for 3D designs.

The frontend uses shared navigation with site visits, polls all returned designs, and opens the matching project from a notification. Navigation is hidden for a single project. Notification read/dismissal history remains stored per Contact and design.
