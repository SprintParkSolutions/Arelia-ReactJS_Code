@IsTest
private class ClientAgreementNotificationApiTest {
    private static ClientAgreementNotificationApi.NotificationResponse readNotice(Id leadId, Id opportunityId) {
        RestContext.request = new RestRequest();
        RestContext.request.httpMethod = 'GET';
        if (leadId != null) RestContext.request.addParameter('leadId', String.valueOf(leadId));
        if (opportunityId != null) RestContext.request.addParameter('opportunityId', String.valueOf(opportunityId));
        RestContext.response = new RestResponse();
        return ClientAgreementNotificationApi.getNotification();
    }
    @IsTest static void checkboxControlsNoticeAndOwnershipIsChecked() {
        Lead lead = new Lead(LastName='Agreement Client', Company='self',
            Email='agreement@example.com', Phone='9876543210',
            Enter_Password__c='Example123!', Confirm_password__c='Example123!');
        insert lead;
        System.assertEquals(false, readNotice(lead.Id, null).showNotification);
        Database.LeadConvert conversion = new Database.LeadConvert();
        conversion.setLeadId(lead.Id);
        conversion.setConvertedStatus([SELECT MasterLabel FROM LeadStatus WHERE IsConverted=true LIMIT 1].MasterLabel);
        conversion.setOpportunityName('Agreement project');
        Database.LeadConvertResult result = Database.convertLead(conversion);
        System.assert(result.isSuccess());
        update new Opportunity(Id=result.getOpportunityId(), Client_Agreement_Sent__c=false);
        System.assertEquals(false, readNotice(lead.Id, null).showNotification);
        update new Opportunity(Id=result.getOpportunityId(), Client_Agreement_Sent__c=true, Email__c='agreement@example.com');
        ClientAgreementNotificationApi.NotificationResponse notice = readNotice(lead.Id, null);
        System.assertEquals(true, notice.success);
        System.assertEquals(true, notice.showNotification);
        System.assertEquals(result.getOpportunityId(), notice.opportunityId);
        System.assert(notice.notificationMessage.contains('agreement@example.com'));
        System.assertEquals(false, readNotice(null, result.getOpportunityId()).success);
        System.assertEquals(400, RestContext.response.statusCode);
        // A mismatching record ID must not disclose another Opportunity.
        System.assertEquals(false, readNotice(lead.Id, result.getAccountId()).success);
        System.assertEquals(403, RestContext.response.statusCode);
    }
}
