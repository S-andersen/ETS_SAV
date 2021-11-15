/*
    @description       : This controller is used to fetch information on all client interventions display in in the main UI table
    @author            : 02/11/2021 by SANDERSEN
    @last modified on  : 02/11/2021
    @last modified by  : SANDERSEN
*/



public with sharing class ClientInterventionController {
    @AuraEnabled(cacheable=true)

    public static List<Wrapper> getClientInterventions() {
        List<Intervention__c> result = [
            SELECT Account__r.CustomerCode__c, Name, Account__r.ShippingPostalCode, Account__r.AccountingBalance__c, StartDate__c, Type__c, Qualification__c, ValidateTechnician__c, InterventionDescription__c
            FROM Intervention__c
            WITH SECURITY_ENFORCED
        ];
        List<Wrapper> wrapperList = new List<Wrapper>();
        for(Intervention__c clientIntervention: result){
            Wrapper wrapper = new Wrapper();
            wrapper.customerCode = clientIntervention.Account__r.CustomerCode__c;
            wrapper.name = clientIntervention.name;
            wrapper.shippingPostalCode = clientIntervention.Account__r.shippingPostalCode;
            wrapper.accountingBalance = clientIntervention.Account__r.accountingBalance__c;
            wrapper.startDate = clientIntervention.StartDate__c; 
            wrapper.type = clientIntervention.type__c;
            wrapper.interventionQualification = clientIntervention.Qualification__c;
            wrapper.interventionValidateTechnician = clientIntervention.ValidateTechnician__c;
            wrapper.interventionDescription = clientIntervention.InterventionDescription__c;
            wrapperList.add(wrapper);
        }
        return wrapperList;
    }

    public class Wrapper{
        @AuraEnabled
        public String customerCode {set;get;}
        @AuraEnabled
        public String name {set;get;}
        @AuraEnabled
        public String shippingPostalCode {set;get;}
        @AuraEnabled
        public Double accountingBalance {set;get;}
        @AuraEnabled
        public Datetime startDate {set;get;}
        @AuraEnabled
        public String type {set;get;}
        @AuraEnabled
        public String interventionQualification {set;get;}
        @AuraEnabled
        public String interventionValidateTechnician {set;get;}
        @AuraEnabled
        public String interventionDescription {set;get;}
    }
}
