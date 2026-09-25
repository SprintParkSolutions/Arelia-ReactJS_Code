@IsTest
private class ProspectLeadLoginRestControllerTest {
    private static final String PASSWORD = 'Example123!';
    private static final String CONTACT_PASSWORD = 'Contact456!';

    private static Lead createLead(String email) {
        Lead record = new Lead(
            FirstName = 'Portal', LastName = 'Client', Company = 'self',
            Email = email, Phone = '9876543210',
            Enter_Password__c = PASSWORD, Confirm_password__c = PASSWORD
        );
        Database.DMLOptions options = new Database.DMLOptions();
        options.DuplicateRuleHeader.allowSave = true;
        Database.SaveResult saved = Database.insert(record, options);
        System.assert(saved.isSuccess(), 'Test client must be created.');
        return record;
    }

    private static Database.LeadConvertResult convertLead(Lead record) {
        update new Lead(Id = record.Id, Project_Request_Submitted__c = true,
            Site_Visit_Manager_Approval__c = true, Approval_Status__c = 'Approved');
        LeadStatus convertedStatus = [SELECT MasterLabel FROM LeadStatus WHERE IsConverted = true LIMIT 1];
        Database.LeadConvert conversion = new Database.LeadConvert();
        conversion.setLeadId(record.Id);
        conversion.setOwnerId(UserInfo.getUserId());
        conversion.setConvertedStatus(convertedStatus.MasterLabel);
        conversion.setOpportunityName('Portal login regression');
        Database.LeadConvertResult result = Database.convertLead(conversion);
        System.assert(result.isSuccess(), 'Test Lead must convert successfully.');
        update new Contact(Id = result.getContactId(), Password__c = CONTACT_PASSWORD);
        return result;
    }

    private static ProspectLeadLoginRestController.LoginResponse login(String email, String password) {
        RestContext.request = new RestRequest();
        RestContext.request.requestURI = '/services/apexrest/registration/lead/login';
        RestContext.request.httpMethod = 'POST';
        RestContext.request.requestBody = Blob.valueOf(JSON.serialize(
            new Map<String, Object>{ 'email' => email, 'password' => password }
        ));
        RestContext.response = new RestResponse();
        return ProspectLeadLoginRestController.loginProspect();
    }

    @IsTest static void additionalProjectKeepsOriginalIdentity() {
        Lead original = createLead('multiple@example.com');
        Test.setCreatedDate(original.Id, DateTime.now().addDays(-1));
        Lead additional = createLead(original.Email);
        update new Lead(Id = additional.Id, Portal_Account_Key__c = String.valueOf(original.Id));
        System.assertEquals(original.Id, login(original.Email, PASSWORD).leadId);
    }

    @IsTest static void additionalProjectKeepsConvertedIdentity() {
        Lead original = createLead('converted-multiple@example.com');
        Test.setCreatedDate(original.Id, DateTime.now().addDays(-1));
        Database.LeadConvertResult converted = convertLead(original);
        Lead additional = createLead(original.Email);
        update new Lead(Id = additional.Id, Portal_Account_Key__c = String.valueOf(original.Id),
            Enter_Password__c = CONTACT_PASSWORD, Confirm_password__c = CONTACT_PASSWORD);
        ProspectLeadLoginRestController.LoginResponse result = login(original.Email, CONTACT_PASSWORD);
        System.assertEquals(original.Id, result.leadId);
        System.assertEquals(converted.getContactId(), result.contactId);
    }

    @IsTest static void unconvertedLeadStillLogsIn() {
        Lead record = createLead('prospect@example.com');
        Test.startTest();
        ProspectLeadLoginRestController.LoginResponse result = login(record.Email, PASSWORD);
        System.assertEquals(true, result.success);
        System.assertEquals(record.Id, result.leadId);
        System.assertEquals(false, login(record.Email, 'Incorrect1!').success);
        System.assertEquals(401, RestContext.response.statusCode);
        Test.stopTest();
    }

    @IsTest static void convertedClientUsesCurrentContactEmail() {
        Lead record = createLead('original@example.com');
        Database.LeadConvertResult converted = convertLead(record);
        update new Contact(Id = converted.getContactId(), Email = 'updated@example.com', FirstName = 'Updated', Phone = '9876543211');
        update new Opportunity(Id = converted.getOpportunityId(), Email__c = 'updated@example.com');
        Test.startTest();
        ProspectLeadLoginRestController.LoginResponse result = login(' UPDATED@example.com ', CONTACT_PASSWORD);
        System.assertEquals(true, result.success);
        System.assertEquals(record.Id, result.leadId, 'Keep the existing portal identity.');
        System.assertEquals(converted.getContactId(), result.contactId);
        System.assertEquals('updated@example.com', result.email);
        System.assertEquals('Updated Client', result.fullName);
        System.assertEquals('9876543211', result.phone);
        System.assertEquals(false, login('original@example.com', CONTACT_PASSWORD).success, 'Old Lead email must not be a login alias.');
        System.assertEquals(false, login('updated@example.com', 'Incorrect1!').success);
        System.assertEquals(false, login('updated@example.com', PASSWORD).success, 'Do not accept the old Lead password.');
        System.assertEquals(false, login('updated@example.com', CONTACT_PASSWORD.toLowerCase()).success, 'Contact password is case-sensitive.');
        Test.stopTest();
    }

    @IsTest static void contactEmailIsAuthoritativeAndRelationshipIsRequired() {
        Lead record = createLead('before@example.com');
        Database.LeadConvertResult converted = convertLead(record);
        update new Contact(Id = converted.getContactId(), Email = 'current@example.com');
        update new Opportunity(Id = converted.getOpportunityId(), Email__c = 'project-only@example.com');
        insert new Contact(LastName = 'Unrelated', Email = 'unrelated@example.com', Password__c = CONTACT_PASSWORD);
        Test.startTest();
        System.assertEquals(true, login('current@example.com', CONTACT_PASSWORD).success);
        System.assertEquals(false, login('project-only@example.com', CONTACT_PASSWORD).success);
        System.assertEquals(false, login('unrelated@example.com', CONTACT_PASSWORD).success);
        System.assertEquals(false, login('before@example.com', CONTACT_PASSWORD).success);
        Test.stopTest();
    }

    @IsTest static void convertedClientWithoutEmailChangeStillLogsIn() {
        Lead record = createLead('unchanged@example.com');
        convertLead(record);
        Test.startTest();
        System.assertEquals(true, login('unchanged@example.com', CONTACT_PASSWORD).success);
        Test.stopTest();
    }
    @IsTest static void changedContactPasswordAndMissingPassword() {
        Lead record = createLead('password-change@example.com');
        Database.LeadConvertResult converted = convertLead(record);
        update new Contact(Id = converted.getContactId(), Password__c = 'Changed789!');
        Test.startTest();
        System.assertEquals(true, login(record.Email, 'Changed789!').success);
        System.assertEquals(false, login(record.Email, CONTACT_PASSWORD).success);
        System.assertEquals(false, login(record.Email, PASSWORD).success);
        update new Contact(Id = converted.getContactId(), Password__c = null);
        System.assertEquals(false, login(record.Email, 'Changed789!').success);
        System.assertEquals(false, login(record.Email, PASSWORD).success, 'Missing Contact password must not fall back to the Lead.');
        Test.stopTest();
    }
}
