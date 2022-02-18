@isTest private class AbsenceControllerTest {

    @isTest
    static void checkTechnicianAbsences(){
        User user1 = TestDataFactory.generateUser('user1');
        Absence__c abs = new Absence__c (Name = 'Testing Absent Tech', Employee__c = user1.Id, Type_of_absence__c = 'RTT', Absence_start_date__c = System.now(), Absence_end_date__c = System.now()+3);
        insert abs;
        Test.startTest();
        AbsenceController.Wrapper resultDuringAbsence = AbsenceController.getAbsentTechnicians(String.valueOfGmt(System.now()+1), 'AM')[0];
        System.assert(resultDuringAbsence.employee == user1.Alias, 'The user should be in the list');
        List<AbsenceController.Wrapper> resultOutsideAbsence = AbsenceController.getAbsentTechnicians(String.valueOfGmt(System.now()+10), 'PM');
        System.assert(resultOutsideAbsence.size() <= 0, 'The user should not be in the list');
        Test.stopTest();
    }
}