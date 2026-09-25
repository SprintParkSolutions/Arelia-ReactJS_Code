@IsTest
private class ProspectProjectDetailsApiTest {
    private static Lead client() {
        Lead record = new Lead(FirstName = 'Portal', LastName = 'Client', Company = 'self',
            Email = 'projects@example.com', Phone = '9876543210',
            Enter_Password__c = 'Example123!', Confirm_password__c = 'Example123!');
        insert record;
        return record;
    }
    private static ProspectProjectDetailsApi.ProjectDetailsResponse submit(Id leadId, Boolean additional, String location) {
        RestContext.request = new RestRequest();
        RestContext.response = new RestResponse();
        RestContext.request.requestBody = Blob.valueOf(JSON.serialize(new Map<String, Object>{
            'leadId' => leadId, 'createNewProject' => additional, 'siteSpace' => '1200',
            'typeOfProject' => 'Home', 'projectScope' => 'Kitchen', 'planLevel' => 'Standard',
            'customerBudget' => '50000', 'siteLocation' => location, 'projectDescription' => 'Project brief'
        }));
        return ProspectProjectDetailsApi.updateProjectDetails();
    }
    @IsTest static void createsSeparateLeadAndPreservesOriginal() {
        Lead original = client();
        System.assertEquals(true, submit(original.Id, false, 'First site').success);
        Test.startTest();
        ProspectProjectDetailsApi.ProjectDetailsResponse saved = submit(original.Id, true, 'Second site');
        System.assertEquals(true, saved.success, saved.message);
        System.assertNotEquals(original.Id, saved.leadId);
        Lead additional = [SELECT Email, Enter_Password__c, Confirm_password__c, Portal_Account_Key__c,
            Site_Location__c, Project_Request_Submitted__c FROM Lead WHERE Id = :saved.leadId];
        System.assertEquals(original.Email, additional.Email);
        System.assertEquals(original.Enter_Password__c, additional.Enter_Password__c);
        System.assertEquals(original.Enter_Password__c, additional.Confirm_password__c);
        System.assertEquals(String.valueOf(original.Id), additional.Portal_Account_Key__c);
        System.assertEquals('Second site', additional.Site_Location__c);
        System.assertEquals(true, additional.Project_Request_Submitted__c);
        System.assertEquals('First site', [SELECT Site_Location__c FROM Lead WHERE Id = :original.Id].Site_Location__c);
        System.assertEquals(false, submit(original.Id, false, 'Overwrite').success);
        System.assertEquals(409, RestContext.response.statusCode);
        for (Id accountId : new List<Id>{original.Id, saved.leadId}) {
            RestContext.request = new RestRequest();
            RestContext.response = new RestResponse();
            RestContext.request.addParameter('leadId', String.valueOf(accountId));
            ProspectProjectDetailsApi.ProjectDetailsResponse loaded = ProspectProjectDetailsApi.getProjectDetails();
            System.assertEquals(true, loaded.success, loaded.message);
            System.assertEquals(2, loaded.projects.size());
        }
        Test.stopTest();
    }
    @IsTest static void invalidNewProjectDoesNotCreateLead() {
        Lead original = client();
        System.assertEquals(false, submit(original.Id, true, '').success);
        System.assertEquals(1, [SELECT COUNT() FROM Lead]);
    }
    @IsTest static void convertedClientUsesCurrentCredentials() {
        Lead original = client();
        System.assertEquals(true, submit(original.Id, false, 'Original site').success);
        update new Lead(Id = original.Id, Site_Visit_Manager_Approval__c = true, Approval_Status__c = 'Approved');
        Database.LeadConvert conversion = new Database.LeadConvert();
        conversion.setLeadId(original.Id);
        conversion.setOwnerId(UserInfo.getUserId());
        conversion.setConvertedStatus([SELECT MasterLabel FROM LeadStatus WHERE IsConverted = true LIMIT 1].MasterLabel);
        conversion.setDoNotCreateOpportunity(true);
        Database.LeadConvertResult converted = Database.convertLead(conversion);
        update new Contact(Id = converted.getContactId(), Email = 'current@example.com', Password__c = 'Current123!');
        ProspectProjectDetailsApi.ProjectDetailsResponse saved = submit(original.Id, true, 'New site');
        System.assertEquals(true, saved.success, saved.message);
        Lead additional = [SELECT Email, Enter_Password__c FROM Lead WHERE Id = :saved.leadId];
        System.assertEquals('current@example.com', additional.Email);
        System.assertEquals('Current123!', additional.Enter_Password__c);
    }
    @IsTest static void rejectsInvalidRequestsWithoutCreatingProjects() {
        Lead original = client();
        submit(original.Id, false, 'First site');
        Map<String, Object> valid = (Map<String, Object>)JSON.deserializeUntyped(RestContext.request.requestBody.toString());
        valid.put('createNewProject', true);
        Map<String, String> invalidValues = new Map<String, String>{
            'leadId' => 'not-an-id', 'typeOfProject' => 'Invalid', 'projectScope' => 'Invalid',
            'planLevel' => 'Invalid', 'customerBudget' => 'invalid'
        };
        for (String field : invalidValues.keySet()) {
            Map<String, Object> payload = valid.clone();
            payload.put(field, invalidValues.get(field));
            RestContext.response = new RestResponse();
            RestContext.request.requestBody = Blob.valueOf(JSON.serialize(payload));
            System.assertEquals(false, ProspectProjectDetailsApi.updateProjectDetails().success);
            System.assertEquals(400, RestContext.response.statusCode);
        }
        valid.put('customerBudget', '0');
        RestContext.request.requestBody = Blob.valueOf(JSON.serialize(valid));
        System.assertEquals(false, ProspectProjectDetailsApi.updateProjectDetails().success);
        RestContext.request.requestBody = null;
        System.assertEquals(false, ProspectProjectDetailsApi.updateProjectDetails().success);
        RestContext.request.requestBody = Blob.valueOf('{}');
        System.assertEquals(false, ProspectProjectDetailsApi.updateProjectDetails().success);
        RestContext.request = new RestRequest();
        System.assertEquals(false, ProspectProjectDetailsApi.getProjectDetails().success);
        RestContext.request.addParameter('leadId', 'not-an-id');
        System.assertEquals(false, ProspectProjectDetailsApi.getProjectDetails().success);
        System.assertEquals(1, [SELECT COUNT() FROM Lead]);
    }

}
