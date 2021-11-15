public with sharing class DateController {
        @AuraEnabled(cacheable=true)
    public static void getTodaysDate(){ 
        Date todaysDate;
        todaysDate = Date.today();
    }    
}


// @AuraEnabled(cacheable=true)
    // public static void getTodaysDate() {
    //     Date dt = Date.newInstance(2021, 11, 12);
    //     System.debug(dt.format('dd/MM/yyyy'));
    //     return dt.format('dd/MM/yyyy');  

    // }