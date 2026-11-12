@IsTest
private class PaymentScheduleCalculatorTest {
    private static Id key(Integer number) {
        return Id.valueOf(Payment_Term__c.SObjectType.getDescribe().getKeyPrefix() + String.valueOf(number).leftPad(12, '0'));
    }
    private static List<PaymentScheduleCalculator.Line> schedule() {
        return new List<PaymentScheduleCalculator.Line>{
            new PaymentScheduleCalculator.Line(key(1), 20, true, 17000),
            new PaymentScheduleCalculator.Line(key(2), 30, true, 25500),
            new PaymentScheduleCalculator.Line(key(3), 25, false, null),
            new PaymentScheduleCalculator.Line(key(4), 25, false, null)
        };
    }
    @IsTest static void preservesPaymentsAndDistributesIncrease() {
        Map<Id, Decimal> beforeChange = PaymentScheduleCalculator.allocate(85000, schedule());
        Map<Id, Decimal> afterChange = PaymentScheduleCalculator.allocate(95000, schedule());
        System.assertEquals(17000, afterChange.get(key(1)));
        System.assertEquals(25500, afterChange.get(key(2)));
        System.assertEquals(beforeChange.get(key(1)), afterChange.get(key(1)));
        System.assertEquals(beforeChange.get(key(2)), afterChange.get(key(2)));
        System.assertEquals(26250, afterChange.get(key(3)));
        System.assertEquals(26250, afterChange.get(key(4)));
    }
    @IsTest static void decreasesBudgetWithoutChangingPaidRows() {
        Map<Id, Decimal> amounts = PaymentScheduleCalculator.allocate(75000, schedule());
        System.assertEquals(17000, amounts.get(key(1)));
        System.assertEquals(25500, amounts.get(key(2)));
        System.assertEquals(16250, amounts.get(key(3)));
        System.assertEquals(16250, amounts.get(key(4)));
    }
    @IsTest static void usesRemainingWeightsAndBalancesPaise() {
        List<PaymentScheduleCalculator.Line> lines = new List<PaymentScheduleCalculator.Line>{
            new PaymentScheduleCalculator.Line(key(1), 20, true, 17),
            new PaymentScheduleCalculator.Line(key(2), 30, false, null),
            new PaymentScheduleCalculator.Line(key(3), 25, false, null),
            new PaymentScheduleCalculator.Line(key(4), 25, false, null)
        };
        Map<Id, Decimal> amounts = PaymentScheduleCalculator.allocate(100.01, lines);
        System.assertEquals(31.13, amounts.get(key(2)));
        System.assertEquals(25.94, amounts.get(key(3)));
        System.assertEquals(25.94, amounts.get(key(4)));
        System.assertEquals(100.01, amounts.get(key(1)) + amounts.get(key(2)) + amounts.get(key(3)) + amounts.get(key(4)));
    }
    @IsTest static void missingLegacyAmountDoesNotInventHistory() {
        List<PaymentScheduleCalculator.Line> lines = schedule();
        lines[0].paidAmount = null;
        Map<Id, Decimal> amounts = PaymentScheduleCalculator.allocate(95000, lines);
        System.assertEquals(null, amounts.get(key(1)));
        System.assertEquals(25500, amounts.get(key(2)));
        System.assertEquals(null, amounts.get(key(3)));
        System.assertEquals(null, amounts.get(key(4)));
    }
    @IsTest static void allPaidAndOverpaidKeepRecordedValues() {
        List<PaymentScheduleCalculator.Line> lines = schedule();
        lines[2].paid = true; lines[2].paidAmount = 21250;
        lines[3].paid = true; lines[3].paidAmount = 21250;
        Map<Id, Decimal> amounts = PaymentScheduleCalculator.allocate(95000, lines);
        System.assertEquals(21250, amounts.get(key(3)));
        System.assertEquals(21250, amounts.get(key(4)));
        amounts = PaymentScheduleCalculator.allocate(40000, schedule());
        System.assertEquals(17000, amounts.get(key(1)));
        System.assertEquals(25500, amounts.get(key(2)));
        System.assertEquals(0, amounts.get(key(3)));
        System.assertEquals(0, amounts.get(key(4)));
    }
    @IsTest static void handlesUnknownAndZeroBudgetsAndWeights() {
        Map<Id, Decimal> amounts = PaymentScheduleCalculator.allocate(null, schedule());
        System.assertEquals(17000, amounts.get(key(1)));
        System.assertEquals(null, amounts.get(key(3)));
        List<PaymentScheduleCalculator.Line> lines = new List<PaymentScheduleCalculator.Line>{
            new PaymentScheduleCalculator.Line(key(1), 0, false, null),
            new PaymentScheduleCalculator.Line(key(2), 100, false, null)
        };
        amounts = PaymentScheduleCalculator.allocate(0, lines);
        System.assertEquals(0, amounts.get(key(1)));
        System.assertEquals(0, amounts.get(key(2)));
        lines[1].percentage = null;
        System.assertEquals(null, PaymentScheduleCalculator.allocate(100, lines).get(key(2)));
    }
    @IsTest static void settlementUsesOrderSnapshotNotCurrentBudget() {
        Payment_Term__c term = new Payment_Term__c(Razorpay_Order_Id__c = 'order_original', Order_Amount__c = 17000);
        System.assertEquals(17000, PaymentService.getRecordedOrderAmount(term, 'order_original'));
        Boolean rejected = false;
        try { PaymentService.getRecordedOrderAmount(term, 'order_other'); }
        catch (PaymentException ex) { rejected = true; }
        System.assert(rejected);
        term.Order_Amount__c = null;
        rejected = false;
        try { PaymentService.getRecordedOrderAmount(term, 'order_original'); }
        catch (PaymentException ex) { rejected = true; }
        System.assert(rejected);
    }
    @IsTest static void snapshotValidationAllowsBackfillAndCorrections() {
        Id termId = key(1);
        Payment_Term__c oldTerm = new Payment_Term__c(Id = termId, Payment_Received__c = true);
        Payment_Term__c backfilled = new Payment_Term__c(Id = termId, Payment_Received__c = true, Paid_Amount__c = 17000);
        PaymentAmountSnapshotHandler.validate(new List<Payment_Term__c>{backfilled}, new Map<Id, Payment_Term__c>{termId => oldTerm});
        System.assertEquals(false, backfilled.hasErrors());
        Payment_Term__c changed = new Payment_Term__c(Id = termId, Payment_Received__c = true, Paid_Amount__c = 19000);
        PaymentAmountSnapshotHandler.validate(new List<Payment_Term__c>{changed}, new Map<Id, Payment_Term__c>{termId => backfilled});
        System.assertEquals(false, changed.hasErrors());
        Payment_Term__c missing = new Payment_Term__c(Payment_Received__c = true);
        PaymentAmountSnapshotHandler.validate(new List<Payment_Term__c>{missing}, null);
        System.assertEquals(true, missing.hasErrors());
    }
}
