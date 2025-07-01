public with sharing class S3BundleController {
    public S3BundleController() {

    }

    @AuraEnabled (cacheable =true)
    public static List<PricebookEntry> getS3Products() {
        return [Select Id, Product2.Id, Product2.Name From PricebookEntry Where Product2.Family = 'S3 Bundle'];
    }

    @AuraEnabled (cacheable =true)
    public static List<QuoteLineItem> getS3QuoteLine(String quoteId) {
        return [Select Id, Product2Id, Product2.Name, Quantity, Region__c, Rate__c, Desired_Rate__c From QuoteLineItem 
         Where QuoteId =: quoteId and Product2.Family = 'S3 Bundle' ORDER BY Product2Id, Region__c];
    }
}