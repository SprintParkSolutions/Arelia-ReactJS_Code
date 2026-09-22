@IsTest
private class ProspectBudgetReviewMobileControllerTest {
    private static Lead client() {
        Lead lead = new Lead(LastName='Budget Client', Company='self',
            Email='budget@example.com', Phone='9876543210',
            Enter_Password__c='Example123!', Confirm_password__c='Example123!');
        insert lead;
        Database.LeadConvert conversion = new Database.LeadConvert();
        conversion.setLeadId(lead.Id);
        conversion.setConvertedStatus([SELECT MasterLabel FROM LeadStatus WHERE IsConverted=true LIMIT 1].MasterLabel);
        conversion.setOpportunityName('Budget test project');
        System.assert(Database.convertLead(conversion).isSuccess());
        lead = [SELECT Id, ConvertedOpportunityId FROM Lead WHERE Id=:lead.Id];
        update new Opportunity(Id=lead.ConvertedOpportunityId, Budget__c=100000,
            Supervisor_Estimated_Budget__c=120000,
            Budget_Review_Status__c='Sent for Client Approval');
        return lead;
    }
    private static void respond(Lead lead, Id opportunityId, String action, String comments) {
        RestContext.request=new RestRequest();
        RestContext.request.httpMethod='POST';
        RestContext.request.requestURI='/services/apexrest/registration/lead/budget-review/';
        RestContext.request.requestBody=Blob.valueOf(JSON.serialize(new Map<String,Object>{
            'leadId'=>lead.Id, 'opportunityId'=>opportunityId, 'action'=>action, 'comments'=>comments
        }));
        RestContext.response=new RestResponse();
        ProspectBudgetReviewMobileController.submitBudgetResponse();
    }
    private static Map<String,Object> readBudget(Lead lead) {
        RestContext.request=new RestRequest();
        RestContext.request.httpMethod='GET';
        RestContext.request.addParameter('leadId',String.valueOf(lead.Id));
        RestContext.response=new RestResponse();
        ProspectBudgetReviewMobileController.getBudgetReview();
        System.assertEquals(200,RestContext.response.statusCode);
        return (Map<String,Object>)JSON.deserializeUntyped(RestContext.response.responseBody.toString());
    }
    @IsTest static void readsCustomerAndSupervisorBudgets() {
        Lead lead=client();
        Map<String,Object> budget=(Map<String,Object>)readBudget(lead).get('budget');
        System.assertEquals(100000,budget.get('customerBudget'));
        System.assertEquals(120000,budget.get('finalBudget'));
        System.assert(budget.containsKey('estimatedDuration'));
        // A budget without a matching duration must not select the revisit estimate.
        update new Opportunity(Id=lead.ConvertedOpportunityId, Re_Visit_Site_Supervisor_Estimate_Budget__c=150000);
        budget=(Map<String,Object>)readBudget(lead).get('budget');
        System.assertEquals(120000,budget.get('finalBudget'));

        Schema.DescribeFieldResult durationField = Opportunity.SObjectType.getDescribe().fields.getMap()
            .get('ReVisit_Site_Estimated_Completion_Months__c').getDescribe();
        Object duration = '4';
        if (durationField.getType() == Schema.DisplayType.Picklist) {
            for (Schema.PicklistEntry entry : durationField.getPicklistValues()) {
                if (entry.isActive()) { duration = entry.getValue(); break; }
            }
        } else if (durationField.getType() == Schema.DisplayType.Double ||
                   durationField.getType() == Schema.DisplayType.Integer) {
            duration = Decimal.valueOf('4');
        }
        Opportunity change = new Opportunity(Id=lead.ConvertedOpportunityId);
        change.put('ReVisit_Site_Estimated_Completion_Months__c', duration);
        update change;
        budget=(Map<String,Object>)readBudget(lead).get('budget');
        System.assertEquals(150000,budget.get('finalBudget'));
        System.assertEquals(String.valueOf(duration),String.valueOf(budget.get('estimatedDuration')));

        update new Opportunity(Id=lead.ConvertedOpportunityId, Re_Visit_Site_Supervisor_Estimate_Budget__c=0);
        budget=(Map<String,Object>)readBudget(lead).get('budget');
        System.assertEquals(0,budget.get('finalBudget'), 'Zero is a populated revisit estimate.');

        // A duration without a matching budget also falls back to the original pair.
        update new Opportunity(Id=lead.ConvertedOpportunityId, Re_Visit_Site_Supervisor_Estimate_Budget__c=null);
        budget=(Map<String,Object>)readBudget(lead).get('budget');
        System.assertEquals(120000,budget.get('finalBudget'));
        Object originalDuration = [SELECT Project_Estimated_Completion_Months__c FROM Opportunity
            WHERE Id=:lead.ConvertedOpportunityId].get('Project_Estimated_Completion_Months__c');
        System.assertEquals(String.valueOf(originalDuration),String.valueOf(budget.get('estimatedDuration')));
    }
    @IsTest static void approvalCannotBeOverwritten() {
        Lead lead=client();
        respond(lead,lead.ConvertedOpportunityId,'APPROVE','Accepted');
        System.assertEquals(200,RestContext.response.statusCode);
        respond(lead,lead.ConvertedOpportunityId,'REQUEST_CHANGES','Overwrite');
        System.assertEquals(409,RestContext.response.statusCode);
        Opportunity saved=[SELECT Budget_Review_Status__c,Budget_Review_Client_Remarks__c FROM Opportunity WHERE Id=:lead.ConvertedOpportunityId];
        System.assertEquals('Client Approved',saved.Budget_Review_Status__c);
        System.assertEquals('Accepted',saved.Budget_Review_Client_Remarks__c);
    }
    @IsTest static void changesRequireComments() {
        Lead lead=client();
        respond(lead,lead.ConvertedOpportunityId,'REQUEST_CHANGES',' ');
        System.assertEquals(400,RestContext.response.statusCode);
        respond(lead,lead.ConvertedOpportunityId,'REQUEST_CHANGES',' Reduce estimate ');
        System.assertEquals(200,RestContext.response.statusCode);
        Opportunity saved=[SELECT Budget_Review_Status__c,Budget_Review_Client_Remarks__c FROM Opportunity WHERE Id=:lead.ConvertedOpportunityId];
        System.assertEquals('Client Requested Changes',saved.Budget_Review_Status__c);
        System.assertEquals('Reduce estimate',saved.Budget_Review_Client_Remarks__c);
    }
    @IsTest static void unsentAndOtherOpportunityAreBlocked() {
        Lead lead=client();
        Lead other=client();
        respond(lead,other.ConvertedOpportunityId,'APPROVE',null);
        System.assertEquals(403,RestContext.response.statusCode);
        update new Opportunity(Id=lead.ConvertedOpportunityId,Budget_Review_Status__c='Not Sent');
        System.assertEquals(false,readBudget(lead).get('budgetAvailable'));
        respond(lead,lead.ConvertedOpportunityId,'APPROVE',null);
        System.assertEquals(409,RestContext.response.statusCode);
    }
}
