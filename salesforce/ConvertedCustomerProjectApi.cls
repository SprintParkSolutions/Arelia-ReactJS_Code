@RestResource(urlMapping='/converted-customer/project/*')
global without sharing class ConvertedCustomerProjectApi {
    @HttpGet
    global static void getProject() {
        RestRequest request = RestContext.request;
        RestResponse response = RestContext.response;
        response.addHeader('Content-Type', 'application/json');

        try {
            Id contactId = parseId(request.params.get('contactId'), '003');
            Id opportunityId = parseId(request.params.get('opportunityId'), '006');
            Opportunity project = resolveOpportunity(contactId, opportunityId);
            if (project == null) {
                write(response, 404, new Map<String, Object>{
                    'success' => false,
                    'message' => 'No Opportunity is associated with this Contact.'
                });
                return;
            }

            String path = request.requestURI == null ? '' : request.requestURI.toLowerCase();
            if (path.endsWith('/site-visits')) {
                write(response, 200, siteVisitPayload(project, contactId));
            } else {
                write(response, 200, projectPayload(project));
            }
        } catch (Exception error) {
            write(response, 400, new Map<String, Object>{
                'success' => false,
                'message' => error.getMessage()
            });
        }
    }

    private static Opportunity resolveOpportunity(Id contactId, Id opportunityId) {
        String fields = 'Id, Name, AccountId, ContactId, Primary_Contact__c, Email__c, ' +
            'Lead_Name__c, Lead_Phone__c, Site_Space__c, Type_of_Project__c, ' +
            'Project_Type__c, Project_Scope__c, Plan_Level__c, Budget__c, ' +
            'Estimated_Budget__c, Site_Location__c, Project_Description__c, ' +
            'Appointment_Confirmation_Type__c, Appointment_Confirmed__c, ' +
            'Appointment_Date__c, Appointment_Status__c, Appointment_Time_Slots__c, ' +
            'Appointment_Rescheduled_Date__c, Rescheduled_Time_Slots__c, ' +
            'Site_Visit_Manager_Approval__c, Site_Visit_Status__c, Supervisor_Name__c, ' +
            'Supervisor_User__c, Supervisor_User_Email__c, Supervisor_User_Phone__c, ' +
            'Project_Estimated_Completion_Months__c, Supervisor_Estimated_Budget__c';

        if (opportunityId != null) {
            List<Opportunity> rows = Database.query(
                'SELECT ' + fields + ' FROM Opportunity WHERE Id = :opportunityId LIMIT 1'
            );
            return rows.isEmpty() ? null : rows[0];
        }
        if (contactId == null) return null;

        List<Lead> converted = [
            SELECT ConvertedOpportunityId
            FROM Lead
            WHERE IsConverted = true AND ConvertedContactId = :contactId
            ORDER BY ConvertedDate DESC
            LIMIT 1
        ];
        if (!converted.isEmpty() && converted[0].ConvertedOpportunityId != null) {
            Id convertedOpportunityId = converted[0].ConvertedOpportunityId;
            List<Opportunity> rows = Database.query(
                'SELECT ' + fields + ' FROM Opportunity WHERE Id = :convertedOpportunityId LIMIT 1'
            );
            if (!rows.isEmpty()) return rows[0];
        }

        List<Opportunity> direct = Database.query(
            'SELECT ' + fields + ' FROM Opportunity ' +
            'WHERE Primary_Contact__c = :contactId OR ContactId = :contactId ' +
            'ORDER BY IsClosed ASC, LastModifiedDate DESC LIMIT 1'
        );
        return direct.isEmpty() ? null : direct[0];
    }

    private static Map<String, Object> projectPayload(Opportunity project) {
        return new Map<String, Object>{
            'success' => true,
            'projectSubmitted' => true,
            'opportunityId' => project.Id,
            'projectName' => project.Name,
            'firstName' => project.Lead_Name__c,
            'phone' => project.Lead_Phone__c,
            'email' => project.Email__c,
            'siteSpace' => project.Site_Space__c,
            'typeOfProject' => project.Type_of_Project__c,
            'projectType' => project.Project_Type__c,
            'projectScope' => project.Project_Scope__c,
            'planLevel' => project.Plan_Level__c,
            'customerBudget' => project.Budget__c == null ? project.Estimated_Budget__c : project.Budget__c,
            'siteLocation' => project.Site_Location__c,
            'projectDescription' => project.Project_Description__c
        };
    }

    private static Map<String, Object> siteVisitPayload(Opportunity project, Id contactId) {
        List<Map<String, Object>> reports = querySiteVisitReports(project.Id, contactId);
        return new Map<String, Object>{
            'success' => true,
            'message' => reports.isEmpty()
                ? 'No Site Visit Report is linked to this Contact, its converted Leads, or Opportunities.'
                : 'Site Visit Report loaded.',
            'opportunityId' => project.Id,
            'appointmentAvailable' => project.Appointment_Date__c != null || project.Appointment_Status__c != null,
            'actionRequired' => project.Appointment_Confirmed__c != true,
            'appointmentConfirmed' => project.Appointment_Confirmed__c == true,
            'appointmentDate' => project.Appointment_Date__c,
            'appointmentTimeSlot' => project.Appointment_Time_Slots__c,
            'appointmentStatus' => project.Appointment_Status__c,
            'requestedDate' => project.Appointment_Rescheduled_Date__c,
            'requestedTimeSlot' => project.Rescheduled_Time_Slots__c,
            'siteVisitStatus' => project.Site_Visit_Status__c,
            'managementApproval' => project.Site_Visit_Manager_Approval__c,
            'supervisorName' => project.Supervisor_Name__c,
            'reports' => reports,
            'reportAvailable' => !reports.isEmpty(),
            'report' => reports.isEmpty() ? null : reports[0]
        };
    }

    // Finds the Site Visit Report child and its Opportunity lookup without
    // hard-coding an org-specific custom object or lookup API name.
    private static List<Map<String, Object>> querySiteVisitReports(Id opportunityId, Id contactId) {
        Schema.DescribeSObjectResult objectDescribe = Site_Visit_Report__c.SObjectType.getDescribe();
        Map<String, Schema.SObjectField> fields = objectDescribe.fields.getMap();
        List<String> selectedFields = new List<String>{
            'Id', 'Name', 'Opportunity__c', 'Lead__c', 'CreatedDate'
        };
            for (String candidate : new List<String>{
                'Site_Visit_Type__c', 'Project_Stage__c', 'Site_Visit_Date__c',
                'Site_Visit_Time_Slot__c', 'Site_Address__c', 'Description__c',
                'Status__c', 'Final_Submitted__c', 'Management_Approval__c',
                'Total_Estimated_Cost__c', 'Estimated_Completion_Date__c'
            }) if (fields.containsKey(candidate)) selectedFields.add(candidate);

        Set<Id> convertedLeadIds = new Set<Id>();
        Set<Id> relatedOpportunityIds = new Set<Id>{ opportunityId };
        List<Lead> sourceLeads = contactId == null
            ? [SELECT Id, ConvertedOpportunityId FROM Lead
               WHERE IsConverted = true AND ConvertedOpportunityId = :opportunityId]
            : [SELECT Id, ConvertedOpportunityId FROM Lead
               WHERE IsConverted = true AND ConvertedContactId = :contactId];
        for (Lead sourceLead : sourceLeads) {
            convertedLeadIds.add(sourceLead.Id);
            if (sourceLead.ConvertedOpportunityId != null) {
                relatedOpportunityIds.add(sourceLead.ConvertedOpportunityId);
            }
        }

        if (contactId != null) {
            for (Opportunity relatedProject : [
                SELECT Id FROM Opportunity
                WHERE Primary_Contact__c = :contactId OR ContactId = :contactId
            ]) relatedOpportunityIds.add(relatedProject.Id);
        }

        List<SObject> rows = Database.query(
            'SELECT ' + String.join(selectedFields, ',') +
            ' FROM Site_Visit_Report__c' +
            ' WHERE Opportunity__c IN :relatedOpportunityIds' +
            (convertedLeadIds.isEmpty() ? '' : ' OR Lead__c IN :convertedLeadIds') +
            ' ORDER BY CreatedDate DESC'
        );
        List<Map<String, Object>> results = new List<Map<String, Object>>();
        for (SObject row : rows) {
                Map<String, Object> item = (Map<String, Object>)JSON.deserializeUntyped(JSON.serialize(row));
                item.put('reportId', row.get('Id'));
                item.put('reportName', row.get('Name'));
                item.put('opportunityId', row.get('Opportunity__c'));
                item.put('leadId', row.get('Lead__c'));
                copyAlias(item, row, fields, 'Site_Visit_Type__c', 'siteVisitType');
                copyAlias(item, row, fields, 'Project_Stage__c', 'projectStage');
                copyAlias(item, row, fields, 'Site_Visit_Date__c', 'siteVisitDate');
                copyAlias(item, row, fields, 'Site_Visit_Time_Slot__c', 'siteVisitTimeSlot');
                copyAlias(item, row, fields, 'Site_Address__c', 'siteAddress');
                copyAlias(item, row, fields, 'Description__c', 'description');
                copyAlias(item, row, fields, 'Status__c', 'status');
                copyAlias(item, row, fields, 'Final_Submitted__c', 'finalSubmitted');
                copyAlias(item, row, fields, 'Management_Approval__c', 'managementApproval');
                copyAlias(item, row, fields, 'Total_Estimated_Cost__c', 'totalEstimatedCost');
                copyAlias(item, row, fields, 'Estimated_Completion_Date__c', 'estimatedCompletionDate');
                results.add(item);
        }
        return results;
    }

    private static void copyAlias(
        Map<String, Object> target,
        SObject source,
        Map<String, Schema.SObjectField> fields,
        String fieldName,
        String alias
    ) {
        if (fields.containsKey(fieldName)) target.put(alias, source.get(fieldName));
    }

    private static Id parseId(String value, String prefix) {
        if (String.isBlank(value) || !value.startsWith(prefix)) return null;
        return (Id)value;
    }

    private static void write(RestResponse response, Integer statusCode, Object payload) {
        response.statusCode = statusCode;
        response.responseBody = Blob.valueOf(JSON.serialize(payload));
    }
}
