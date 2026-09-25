@IsTest
private class DesignSiteNotificationApiTest {
    private static Architecture_Design__c fixture() {
        Contact client = new Contact(LastName = 'Design Client', Email = 'design-client@example.com');
        insert client;
        OpportunityStage stage = [SELECT MasterLabel FROM OpportunityStage WHERE IsActive = true LIMIT 1];
        Opportunity project = new Opportunity(Name = 'Design Review Test', StageName = stage.MasterLabel,
            CloseDate = Date.today().addDays(30), Primary_Contact__c = client.Id);
        insert project;
        Architecture_Design__c design = new Architecture_Design__c(Opportunity__c = project.Id, Status__c = 'Sent');
        if (!Architecture_Design__c.Name.getDescribe().isAutoNumber()) design.put('Name', 'Client design');
        insert design;
        return design;
    }
    private static Id clientId(Architecture_Design__c design) {
        return [SELECT Primary_Contact__c FROM Opportunity WHERE Id = :design.Opportunity__c].Primary_Contact__c;
    }
    private static void post(Architecture_Design__c design, Id contactId, String status, String comments) {
        RestContext.request = new RestRequest();
        RestContext.response = new RestResponse();
        RestContext.request.requestURI = '/services/apexrest/registration/opportunity/design-notification-approvals/';
        RestContext.request.httpMethod = 'POST';
        RestContext.request.requestBody = Blob.valueOf(JSON.serialize(new Map<String, Object>{
            'contactId' => contactId, 'opportunityId' => design.Opportunity__c,
            'designId' => design.Id, 'status' => status, 'comments' => comments
        }));
        ArchitectureDesignSiteNotificationApi.submitDecision();
    }
    private static void getFile(Architecture_Design__c design, Id contactId, Id versionId) {
        RestContext.request = new RestRequest();
        RestContext.response = new RestResponse();
        RestContext.request.requestURI = '/services/apexrest/registration/opportunity/design-notification-approvals/file';
        RestContext.request.httpMethod = 'GET';
        RestContext.request.addParameter('contactId', String.valueOf(contactId));
        RestContext.request.addParameter('opportunityId', String.valueOf(design.Opportunity__c));
        RestContext.request.addParameter('designId', String.valueOf(design.Id));
        RestContext.request.addParameter('versionId', String.valueOf(versionId));
        ArchitectureDesignSiteNotificationApi.getApprovals();
    }
    @IsTest static void approveOnceOnly() {
        Architecture_Design__c design = fixture();
        Id contactId = clientId(design);
        Test.startTest();
        post(design, contactId, 'Approved', '');
        System.assertEquals(200, RestContext.response.statusCode);
        post(design, contactId, 'Changes Requested', 'A second response');
        System.assertEquals(409, RestContext.response.statusCode);
        Test.stopTest();
        Architecture_Design__c saved = [SELECT Status__c, Comments__c FROM Architecture_Design__c WHERE Id = :design.Id];
        System.assertEquals('Approved', saved.Status__c);
        System.assertEquals('Approved By Client', saved.Comments__c);
    }
    @IsTest static void changesRequireComments() {
        Architecture_Design__c design = fixture();
        Id contactId = clientId(design);
        Test.startTest();
        post(design, contactId, 'Changes Requested', '   ');
        System.assertEquals(400, RestContext.response.statusCode);
        post(design, contactId, 'Changes Requested', '  Use lighter wood  ');
        System.assertEquals(200, RestContext.response.statusCode);
        post(design, contactId, 'Approved', '');
        System.assertEquals(409, RestContext.response.statusCode);
        Test.stopTest();
        System.assertEquals('Use lighter wood', [SELECT Comments__c FROM Architecture_Design__c WHERE Id = :design.Id].Comments__c);
    }
    @IsTest static void unrelatedContactCannotRespondEvenWithMatchingEmail() {
        Architecture_Design__c design = fixture();
        Contact stranger = new Contact(LastName = 'Unrelated', Email = 'same@example.com');
        insert stranger;
        update new Opportunity(Id = design.Opportunity__c, Email__c = stranger.Email);
        Test.startTest();
        post(design, stranger.Id, 'Approved', '');
        System.assertEquals(404, RestContext.response.statusCode);
        Test.stopTest();
        System.assertEquals('Sent', [SELECT Status__c FROM Architecture_Design__c WHERE Id = :design.Id].Status__c);
    }
    @IsTest static void filesRequireBothOwnershipAndDesignLink() {
        Architecture_Design__c design = fixture();
        Id contactId = clientId(design);
        ContentVersion linked = new ContentVersion(Title = 'Design', PathOnClient = 'Design.pdf',
            VersionData = Blob.valueOf('test pdf'), FirstPublishLocationId = design.Id);
        insert linked;
        ContentVersion unrelated = new ContentVersion(Title = 'Other', PathOnClient = 'Other.pdf', VersionData = Blob.valueOf('other'));
        insert unrelated;
        Contact stranger = new Contact(LastName = 'Unrelated');
        insert stranger;
        Test.startTest();
        getFile(design, contactId, linked.Id);
        System.assertEquals(200, RestContext.response.statusCode);
        getFile(design, contactId, unrelated.Id);
        System.assertEquals(404, RestContext.response.statusCode);
        getFile(design, stranger.Id, linked.Id);
        System.assertEquals(404, RestContext.response.statusCode);
        Test.stopTest();
    }
    @IsTest static void linkedConvertedProjectsAreAvailableAcrossContacts() {
        Lead first = new Lead(LastName = 'First Project', Company = 'First Company', Email = 'first-project@example.com',
            Project_Request_Submitted__c = true, Site_Visit_Manager_Approval__c = true, Approval_Status__c = 'Approved');
        insert first;
        Lead second = new Lead(LastName = 'Second Project', Company = 'Second Company', Email = 'second-project@example.com',
            Portal_Account_Key__c = String.valueOf(first.Id), Project_Request_Submitted__c = true,
            Site_Visit_Manager_Approval__c = true, Approval_Status__c = 'Approved');
        insert second;
        String convertedStatus = [SELECT MasterLabel FROM LeadStatus WHERE IsConverted = true LIMIT 1].MasterLabel;
        List<Database.LeadConvertResult> converted = new List<Database.LeadConvertResult>();
        for (Lead source : new List<Lead>{ first, second }) {
            Database.LeadConvert conversion = new Database.LeadConvert();
            conversion.setLeadId(source.Id);
            conversion.setOwnerId(UserInfo.getUserId());
            conversion.setConvertedStatus(convertedStatus);
            converted.add(Database.convertLead(conversion));
        }
        Architecture_Design__c design = new Architecture_Design__c(Opportunity__c = converted[1].getOpportunityId(), Status__c = 'Sent');
        if (!Architecture_Design__c.Name.getDescribe().isAutoNumber()) design.put('Name', 'Second project design');
        insert design;
        RestContext.request = new RestRequest();
        RestContext.response = new RestResponse();
        RestContext.request.requestURI = '/services/apexrest/registration/opportunity/design-notification-approvals/';
        RestContext.request.addParameter('contactId', String.valueOf(converted[0].getContactId()));
        ArchitectureDesignSiteNotificationApi.getApprovals();
        System.assertEquals(200, RestContext.response.statusCode);
        Map<String, Object> body = (Map<String, Object>)JSON.deserializeUntyped(RestContext.response.responseBody.toString());
        Map<String, Object> data = (Map<String, Object>)body.get('data');
        System.assertEquals(2, ((List<Object>)data.get('projects')).size());
        System.assertEquals(1, ((List<Object>)data.get('designs')).size());
        Contact unrelated = new Contact(LastName = 'Unrelated');
        insert unrelated;
        post(design, unrelated.Id, 'Approved', '');
        System.assertEquals(404, RestContext.response.statusCode);
        post(design, converted[0].getContactId(), 'Approved', '');
        System.assertEquals(200, RestContext.response.statusCode);
    }
}
