/**
 * @description       : 
 * @author            : SANDERSEN
 * @last modified on  : 20/12/2021
 * @last modified by  : SANDERSEN
**/
public with sharing class DailyInterventionController {
   
    @AuraEnabled(cacheable=false)
    public static List<Wrapper> getDailyInterventions(String chosenDate) {



        List<Intervention__c> interventions = [SELECT Id, Account__r.Name, Account__r.CustomerCode__c, Name, Account__r.BillingPostalCode, Account__r.BillingStreet, 
                                                      Account__r.BillingCity, Account__r.AccountingBalance__c, TemporaryTechnician__r.Alias,
                                                      StartDate__c, Type__c, Qualification__c, TemporaryTechnician__c, InterventionDescription__c, EndDate__c,  
            (SELECT Id, Field, OldValue, NewValue FROM Histories WHERE Field = 'StartDate__c')
            FROM Intervention__c
            WHERE StartDate__c >= :date.valueOf(chosenDate) AND StartDate__c < :date.valueOf(chosenDate).addDays(1)
            ORDER BY StartDate__c
            // WITH SECURITY_ENFORCED 
        ];
        System.debug('lets see our string chosenDate:' + chosenDate);

        List<Wrapper> response = new List<Wrapper>();
        for(Intervention__c intervention: interventions){
            Wrapper wrapper = new Wrapper();
            wrapper.id = intervention.id;
            wrapper.client = intervention.Account__r.CustomerCode__c;
            wrapper.nom = intervention.Account__r.Name;
            wrapper.cp = intervention.Account__r.BillingPostalCode;
            wrapper.city = intervention.Account__r.BillingCity;
            wrapper.street = intervention.Account__r.BillingStreet;
            wrapper.solde = intervention.Account__r.AccountingBalance__c;
            wrapper.balance = checkNegativeBalance(intervention.Account__r.AccountingBalance__c);
            wrapper.interventionDate = intervention.StartDate__c.format('dd/MM/yyyy');
            wrapper.interventionTime = intervention.StartDate__c.format('HH:mm');
            wrapper.interventionEndTime = intervention.EndDate__c.format('HH:mm');
            wrapper.type = intervention.Type__c;
            wrapper.qualification = intervention.Qualification__c;
            wrapper.technicien = intervention.TemporaryTechnician__c != null ? intervention.TemporaryTechnician__r.Alias : '';
            wrapper.description = intervention.InterventionDescription__c;
            wrapper.isDateChange = intervention.Histories.size() > 0 ? true : false;
            wrapper.timeDiff = checkInterventionTime(intervention.StartDate__c, intervention.EndDate__c); 
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
        public String city{get;set;}
        @AuraEnabled 
        public String street{get;set;}
        @AuraEnabled
        public Decimal solde{get;set;}
        @AuraEnabled
        public String interventionDate{get;set;}
        @AuraEnabled
        public String interventionTime{get;set;}
        @AuraEnabled
        public String interventionEndTime{get;set;}
        @AuraEnabled
        public String type{get;set;}
        @AuraEnabled
        public String qualification{get;set;}
        @AuraEnabled
        public String technicien{get;set;}
        @AuraEnabled
        public String description{get;set;}
        @AuraEnabled
        public Boolean isDateChange{get;set;}
        @AuraEnabled 
        public Boolean timeDiff{get;set;}
        @AuraEnabled 
        public Boolean balance{get;set;}
    }


    @AuraEnabled
    public static void saveConfirmedTechnicians(List<Wrapper> interventionsToUpdate){
        try{ 
            System.debug('save method*****');
            System.debug('controller ***' + interventionsToUpdate);

            set<Id> intervId = new set<Id>(); 

            for(wrapper wr : interventionsToUpdate){
                intervId.add(wr.id);

                System.debug(wr.technicien); 
            }
            map<Id, intervention__c> mapId = new map<Id, intervention__c> (
                [SELECT Id, TemporaryTechnician__c, ValidateTechnician__c 
                FROM Intervention__c 
                WHERE Id 
                IN : intervId]);     
                System.debug('mapId:*** ' + mapId); 
            
            for(intervention__c interv : mapId.values()){
                interv.ValidateTechnician__c = interv.TemporaryTechnician__c; 
            }
            update mapId.values(); 

        } catch(AuraException e) {
            throw new AuraHandledException(e.getMessage());
        }

    }

    public static Boolean checkInterventionTime(DateTime startTime, Datetime endTime){
        Integer elapsedHours = endTime.hour() - startTime.hour(); 
        System.debug(elapsedHours);
       return elapsedHours >= 4 ? true:false; 
    }

    public static Boolean checkNegativeBalance(Decimal balance){
        Decimal negativeBalance = balance; 

        System.debug(negativeBalance); 
        return negativeBalance < 0 ? true:false; 
    }
}