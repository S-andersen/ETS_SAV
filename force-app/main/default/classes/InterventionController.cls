public class InterventionController {

    @AuraEnabled(cacheable=true)
    public static Intervention__c getInterventions(Id interventionId) {
        try{
        return[
            SELECT Id, Commentaires__c, Account__c, Account__r.CustomerCode__c, Name, Account__r.Phone, Appareil__r.Name, InterventionDescription__c,
                   Account__r.BillingStreet, Account__r.BillingPostalCode, Account__r.BillingCity, 
                   Account__r.BillingCountry, Account__r.AdditionalBillingAddress__c, Account__r.RiskCode__c,
            (SELECT Id, Name FROM Materiels_Fournis__r) 
            FROM Intervention__c
            WHERE Id = :interventionId
        ];
    }
    catch( Exception e ){
        throw new AuraHandledException(e.getMessage());
    }   
    }
    @AuraEnabled(cacheable=true)
    public static List<Appareil__c> getAppareilForAccount(Id accountId){
        return [SELECT Id, Type__c, Energy__c, Brand__c  
        FROM Appareil__c 
        WHERE Compte__c = :accountId 
        WITH SECURITY_ENFORCED
        ];
    }
}