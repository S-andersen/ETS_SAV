public with sharing class DailyInterventionController {
   
    @AuraEnabled(cacheable=true)
    public static List<Wrapper> getDailyInterventions(String chosenDate) {
        System.debug('chosenDate: ' + chosenDate);
        System.debug('date format: ' + date.valueOf(chosenDate));


        List<Intervention__c> interventions = [SELECT Id, Account__r.CustomerCode__c, Name, Account__r.BillingPostalCode, Account__r.AccountingBalance__c, StartDate__c, Type__c, Qualification__c, TemporaryTechnician__r.Name, InterventionDescription__c
            FROM Intervention__c
            WHERE StartDate__c >= :date.valueOf(chosenDate) AND StartDate__c < :date.valueOf(chosenDate).addDays(1)
            WITH SECURITY_ENFORCED 
        ];
        System.debug('lets see our string chosenDate:' + chosenDate);

        List<Wrapper> response = new List<Wrapper>();
        for(Intervention__c intervention: interventions){
            Wrapper wrapper = new Wrapper();
            wrapper.id = intervention.id;
            wrapper.client = intervention.Account__r.CustomerCode__c;
            wrapper.nom = intervention.Name;
            wrapper.cp = intervention.Account__r.BillingPostalCode;
            wrapper.solde = intervention.Account__r.AccountingBalance__c;
            wrapper.interventionDate = intervention.StartDate__c.format('dd/MM/yyyy');
            wrapper.interventionTime = intervention.StartDate__c.format('HH:mm');
            wrapper.type = intervention.Type__c;
            wrapper.qualification = intervention.Qualification__c;
            wrapper.technicien = intervention.TemporaryTechnician__r.Name;
            wrapper.description = intervention.InterventionDescription__c;
            response.add(wrapper);
        }
        System.debug('see the response?' + response);
        return response;
    }

    public class Wrapper{
        @AuraEnabled
        public String id{get;set;}
        @AuraEnabled
        public String client{get;set;}
        @AuraEnabled
        public String nom{get;set;}
        @AuraEnabled
        public String cp{get;set;}
        @AuraEnabled
        public Decimal solde{get;set;}
        @AuraEnabled
        public String interventionDate{get;set;}
        @AuraEnabled
        public String interventionTime{get;set;}
        @AuraEnabled
        public String type{get;set;}
        @AuraEnabled
        public String qualification{get;set;}
        @AuraEnabled
        public String technicien{get;set;}
        @AuraEnabled
        public String description{get;set;}
    }
}