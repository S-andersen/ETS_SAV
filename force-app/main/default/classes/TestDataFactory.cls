@isTest
public class TestDataFactory {
    
    public static void createTestRecordsForInterventions(Integer acct){

        //Create Accounts
		List<Account> accts =new List<Account>();
		for (Integer i =0; i <acct; i ++){
			Account a = new Account(Name ='TestAccount' +i, CustomerCode__c = '123456', BillingCity = 'Paris', BillingStreet = 'Rue Rivoli', BillingPostalCode = '75001', BillingCountry = 'France');
			accts.add(a);
		}
		insert accts;
    }

    //Create User 
    public static User generateUser(String name){
        Profile profileId = [SELECT Id FROM Profile WHERE Name = 'Standard User' LIMIT 1];
        
        User u = new User(
            Username = 'Testy' + name + '@ets.com',
            LastName = 'LastName',
            Email = 'test.email@ets.com',
            CompanyName = 'ETS',
            Title = 'Technicien',
            Alias = name,
            TimeZoneSidKey = 'America/Los_Angeles',
            EmailEncodingKey = 'UTF-8',
            LanguageLocaleKey = 'en_US',
            LocaleSidKey = 'en_US',
            ProfileId = profileId.Id 
        );
        insert u;
        return u;
    }

    //Create Intervention
    public static Intervention__c[] generateInterventionsForAccount(Integer numInterv){
        List<Intervention__c> intvs = new List<Intervention__c>();
        for(Integer i = 0; i < numInterv; i++){
          Intervention__c iv = new Intervention__c();
          iv.Account__c    = 'Account ' + i;
          iv.StartDate__c  = Date.today();
          iv.EndDate__c    = Date.today().addDays(1);
          iv.Appareil__c   = 'Appareil ';
          iv.Type__c       = 'Type'; 
          iv.Name          = 'Nom de lintervention ';
          iv.TemporaryVehicule__c = '2'; 
          iv.ConfirmedVehicle__c  = '3'; 
          iv.Qualification__c     = 'Qualification ';
          iv.DeliveryOrder__c     = 4;
          iv.DesiredQuantity__c   = 10000;
          iv.TemporaryTechnician__c     = 'Temp Tech ';
          iv.ValidateTechnician__c      = 'Tech Validé';
          iv.InterventionDescription__c = 'Descriptif Intervention ';  
          intvs.add(iv);
        }
        return intvs;
      }
}