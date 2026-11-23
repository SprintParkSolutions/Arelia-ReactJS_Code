@IsTest
private class ProspectPaymentTermsMobileControllerTest {
    private static Lead client() {
        Lead lead = new Lead(LastName='Payment Client', Company='self',
            Email='payment@example.com', Phone='9876543210',
            Enter_Password__c='Example123!', Confirm_password__c='Example123!');
        insert lead;
        Database.LeadConvert conversion = new Database.LeadConvert();
        conversion.setLeadId(lead.Id);
        conversion.setConvertedStatus([SELECT MasterLabel FROM LeadStatus WHERE IsConverted=true LIMIT 1].MasterLabel);
        conversion.setOpportunityName('Payment test project');
        System.assert(Database.convertLead(conversion).isSuccess());
        lead = [SELECT Id, ConvertedOpportunityId FROM Lead WHERE Id=:lead.Id];
        update new Opportunity(Id=lead.ConvertedOpportunityId, Payment_Terms_Status__c='Sent for Client Approval');
        Payment_Term__c term = new Payment_Term__c(Opportunity__c=lead.ConvertedOpportunityId,
            Percentage__c=25, Due_Date__c=Date.today().addDays(10));
        if (!Payment_Term__c.Name.getDescribe().isAutoNumber()) term.Name='Booking';
        insert term;
        return lead;
    }
    private static void respond(Lead lead, Id opportunityId, String action, String comments) {
        RestContext.request=new RestRequest();
        RestContext.request.httpMethod='POST';
        RestContext.request.requestURI='/services/apexrest/registration/lead/payment-terms/';
        RestContext.request.requestBody=Blob.valueOf(JSON.serialize(new Map<String,Object>{
            'leadId'=>lead.Id, 'opportunityId'=>opportunityId, 'action'=>action, 'comments'=>comments
        }));
        RestContext.response=new RestResponse();
        ProspectPaymentTermsMobileController.submitClientResponse();
    }
    private static Map<String,Object> readTerms(Lead lead) {
        RestContext.request=new RestRequest();
        RestContext.request.httpMethod='GET';
        RestContext.request.addParameter('leadId',String.valueOf(lead.Id));
        RestContext.response=new RestResponse();
        ProspectPaymentTermsMobileController.getPaymentTerms();
        System.assertEquals(200,RestContext.response.statusCode);
        return (Map<String,Object>)JSON.deserializeUntyped(RestContext.response.responseBody.toString());
    }
    @IsTest static void returnsScheduleAndHidesInternalReviews() {
        Lead lead=client();
        Map<String,Object> response=readTerms(lead);
        System.assertEquals(true,response.get('paymentTermsAvailable'));
        Map<String,Object> payment=(Map<String,Object>)response.get('paymentTerms');
        List<Object> terms=(List<Object>)payment.get('terms');
        System.assertEquals(1,terms.size());
        Map<String,Object> term=(Map<String,Object>)terms[0];
        System.assertEquals(25,term.get('percentage'));
        System.assertEquals(String.valueOf(Date.today().addDays(10)),term.get('dueDate'));
        System.assertNotEquals(null,term.get('label'));
        update new Opportunity(Id=lead.ConvertedOpportunityId,Payment_Terms_Status__c='Sent for Manager Approval');
        System.assertEquals(false,readTerms(lead).get('paymentTermsAvailable'));
    }
    @IsTest static void approvalCannotBeOverwrittenAndClearsOldRemarks() {
        Lead lead=client();
        update new Opportunity(Id=lead.ConvertedOpportunityId, Payment_Term_Client_Remarks__c='Earlier request');
        respond(lead,lead.ConvertedOpportunityId,'APPROVE',null);
        System.assertEquals(200,RestContext.response.statusCode);
        respond(lead,lead.ConvertedOpportunityId,'REQUEST_CHANGES','Overwrite');
        System.assertEquals(409,RestContext.response.statusCode);
        Opportunity saved=[SELECT Payment_Terms_Status__c,Payment_Term_Client_Remarks__c FROM Opportunity WHERE Id=:lead.ConvertedOpportunityId];
        System.assertEquals('Client Approved',saved.Payment_Terms_Status__c);
        System.assertEquals(null,saved.Payment_Term_Client_Remarks__c);
    }
    @IsTest static void changesRequireCommentsAndCanBeResent() {
        Lead lead=client();
        respond(lead,lead.ConvertedOpportunityId,'REQUEST_CHANGES',' ');
        System.assertEquals(400,RestContext.response.statusCode);
        respond(lead,lead.ConvertedOpportunityId,'REQUEST_CHANGES',' Change date ');
        System.assertEquals(200,RestContext.response.statusCode);
        Opportunity saved=[SELECT Payment_Terms_Status__c,Payment_Term_Client_Remarks__c FROM Opportunity WHERE Id=:lead.ConvertedOpportunityId];
        System.assertEquals('Client Requested Changes',saved.Payment_Terms_Status__c);
        System.assertEquals('Change date',saved.Payment_Term_Client_Remarks__c);
        update new Opportunity(Id=lead.ConvertedOpportunityId,Payment_Terms_Status__c='Sent for Client Approval');
        respond(lead,lead.ConvertedOpportunityId,'APPROVE',null);
        System.assertEquals(200,RestContext.response.statusCode);
    }
    @IsTest static void changeRequestDoesNotDependOnPaymentLineCount() {
        Lead lead = client();
        delete [SELECT Id FROM Payment_Term__c WHERE Opportunity__c=:lead.ConvertedOpportunityId];
        respond(lead, lead.ConvertedOpportunityId, 'REQUEST_CHANGES', ' First: 35, Second: 35, Third: 30 ');
        System.assertEquals(200, RestContext.response.statusCode);
        Opportunity saved = [SELECT Payment_Terms_Status__c, Payment_Term_Client_Remarks__c
            FROM Opportunity WHERE Id=:lead.ConvertedOpportunityId];
        System.assertEquals('Client Requested Changes', saved.Payment_Terms_Status__c);
        System.assertEquals('First: 35, Second: 35, Third: 30', saved.Payment_Term_Client_Remarks__c);
        respond(lead, lead.ConvertedOpportunityId, 'REQUEST_CHANGES', 'Duplicate');
        System.assertEquals(409, RestContext.response.statusCode);
    }
    @IsTest static void rejectsUnrelatedOpportunity() {
        Lead lead=client();
        Lead other=client();
        respond(lead,other.ConvertedOpportunityId,'APPROVE',null);
        System.assertEquals(403,RestContext.response.statusCode);
    }
}
