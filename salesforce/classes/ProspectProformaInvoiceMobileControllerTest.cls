@IsTest
private class ProspectProformaInvoiceMobileControllerTest {
    private static Lead client() {
        Lead lead = new Lead(LastName='Invoice Client', Company='self',
            Email='invoice@example.com', Phone='9876543210',
            Enter_Password__c='Example123!', Confirm_password__c='Example123!');
        insert lead;
        Database.LeadConvert conversion = new Database.LeadConvert();
        conversion.setLeadId(lead.Id);
        conversion.setConvertedStatus([SELECT MasterLabel FROM LeadStatus WHERE IsConverted=true LIMIT 1].MasterLabel);
        conversion.setOpportunityName('Invoice test project');
        Database.LeadConvertResult result = Database.convertLead(conversion);
        System.assert(result.isSuccess());
        return [SELECT Id, ConvertedOpportunityId FROM Lead WHERE Id=:lead.Id];
    }
    private static Proforma_Invoice__c invoice(Lead lead) {
        Proforma_Invoice__c record = new Proforma_Invoice__c(
            Opportunity__c=lead.ConvertedOpportunityId, Status__c='Sent',
            Secure_Token__c='InvoiceTestToken123');
        if (!Proforma_Invoice__c.Name.getDescribe().isAutoNumber()) record.Name='Test invoice';
        insert record;
        return [SELECT Id, Secure_Token__c FROM Proforma_Invoice__c WHERE Id=:record.Id];
    }
    private static void respond(Lead lead, Proforma_Invoice__c record, String action, String comments, String token) {
        RestContext.request=new RestRequest();
        RestContext.request.httpMethod='POST';
        RestContext.request.requestURI='/services/apexrest/registration/lead/proforma-invoice/';
        RestContext.request.requestBody=Blob.valueOf(JSON.serialize(new Map<String,Object>{
            'leadId'=>lead.Id, 'invoiceId'=>record.Id, 'secureToken'=>token,
            'action'=>action, 'comments'=>comments
        }));
        RestContext.response=new RestResponse();
        ProspectProformaInvoiceMobileController.submitProformaResponse();
    }
    @IsTest static void approvalIsSavedOnlyOnce() {
        Lead lead=client();
        Proforma_Invoice__c record=invoice(lead);
        respond(lead,record,'APPROVE','Accepted',record.Secure_Token__c);
        System.assertEquals(200,RestContext.response.statusCode);
        respond(lead,record,'REQUEST_CHANGES','Overwrite',record.Secure_Token__c);
        System.assertEquals(409,RestContext.response.statusCode);
        Proforma_Invoice__c saved=[SELECT Status__c,Client_Comments__c FROM Proforma_Invoice__c WHERE Id=:record.Id];
        System.assertEquals('Approved',saved.Status__c);
        System.assertEquals('Accepted',saved.Client_Comments__c);
    }
    @IsTest static void changesRequireComments() {
        Lead lead=client();
        Proforma_Invoice__c record=invoice(lead);
        respond(lead,record,'REQUEST_CHANGES',' ',record.Secure_Token__c);
        System.assertEquals(400,RestContext.response.statusCode);
        respond(lead,record,'REQUEST_CHANGES',' Revise total ',record.Secure_Token__c);
        System.assertEquals(200,RestContext.response.statusCode);
        Proforma_Invoice__c saved=[SELECT Status__c,Client_Comments__c FROM Proforma_Invoice__c WHERE Id=:record.Id];
        System.assertEquals('Changes Requested',saved.Status__c);
        System.assertEquals('Revise total',saved.Client_Comments__c);
    }
    @IsTest static void wrongTokenAndUnrelatedOpportunityAreRejected() {
        Lead lead=client();
        Proforma_Invoice__c record=invoice(lead);
        respond(lead,record,'APPROVE',null,'wrong-token');
        System.assertEquals(403,RestContext.response.statusCode);
        Lead other=client();
        respond(other,record,'APPROVE',null,record.Secure_Token__c);
        System.assertEquals(403,RestContext.response.statusCode);
        System.assertEquals('Sent',[SELECT Status__c FROM Proforma_Invoice__c WHERE Id=:record.Id].Status__c);
    }
    @IsTest static void listIncludesSentInvoices() {
        Lead lead=client();
        Proforma_Invoice__c record=invoice(lead);
        RestContext.request=new RestRequest();
        RestContext.request.httpMethod='GET';
        RestContext.request.addParameter('leadId',String.valueOf(lead.Id));
        RestContext.request.addParameter('list','true');
        RestContext.response=new RestResponse();
        ProspectProformaInvoiceMobileController.getProformaInvoice();
        System.assertEquals(200,RestContext.response.statusCode);
        Map<String,Object> body=(Map<String,Object>)JSON.deserializeUntyped(RestContext.response.responseBody.toString());
        List<Object> invoices=(List<Object>)body.get('invoices');
        System.assertEquals(1,invoices.size());
        System.assertEquals(String.valueOf(record.Id),((Map<String,Object>)invoices[0]).get('invoiceId'));
    }
}