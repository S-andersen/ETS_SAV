public with sharing class AbsenceController {
    
    @AuraEnabled(cacheable=true)
    public static List<Wrapper> getAbsentTechnicians(String chosenDate, String plage){
        Date d = Date.valueOf(chosenDate);
        DateTime dt;
        String whereclause = 'Absence_start_date__c <= :dt AND Absence_end_date__c >= :dt';

        if(plage.equals('AM')){
            dt = getDatetimeWithOutoffSet(DateTime.newInstance(d.year(), d.month(), d.day(), 10 , 0 , 0));
        }
        else if(plage.equals('PM')){
            dt = getDatetimeWithOutoffSet(DateTime.newInstance(d.year(), d.month(), d.day(), 16 , 0 , 0));
        }
        else {
            whereclause = 'Absence_start_date__c <= :d AND Absence_end_date__c >= :d';
        }
        List<Absence__c> listAbsentTechs = Database.query('SELECT Id, Employee__r.Alias, Absence_end_date__c, Absence_start_date__c, Type_of_absence__c ' + 
                        'FROM Absence__c ' +
                        'WHERE ' + whereclause + ' ' +
                        'ORDER BY Type_of_absence__c'
                       );
        List<Wrapper> response = new List<Wrapper>();
        for(Absence__c absentee: listAbsentTechs){
            Wrapper wrapper = new Wrapper();
            wrapper.id = absentee.Id;
            wrapper.employee = absentee.Employee__r.Alias;
            wrapper.type = absentee.Type_of_absence__c;
            response.add(wrapper);
        }
        return response;
    }
    
    public class Wrapper{  
        @AuraEnabled
        public String id{get;set;}
        @AuraEnabled
        public String employee{get;set;}
        @AuraEnabled
        public String type{get;set;}
    }

    public static Datetime getDatetimeWithoffSet(Datetime dt) {
        Integer offset = UserInfo.getTimezone().getOffset(dt);
        return dt.addSeconds(offset / 1000);
    }
    public static Datetime getDatetimeWithOutoffSet(Datetime dt) {
        Integer offset = UserInfo.getTimezone().getOffset(dt);
        return dt.addSeconds(-(offset / 1000));
    }
}