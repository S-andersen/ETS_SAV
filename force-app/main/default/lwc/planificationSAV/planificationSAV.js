import { LightningElement, wire, track } from 'lwc';
import getInterventions from '@salesforce/apex/InterventionController.getInterventions';
import getDailyInterventions from '@salesforce/apex/DailyInterventionController.getDailyInterventions';
import getAppareilForAccount from '@salesforce/apex/InterventionController.getAppareilForAccount';
import { NavigationMixin } from 'lightning/navigation';


const COLUMNS = [
    { label: 'Code', fieldName: 'APCode__c', type: 'text' },
    { label: 'Nom', fieldName: 'Name', type: 'text' },
    { label: 'Details', fieldName: 'Type__c', type: 'text' }
]; 

var interventionIdExemple = 'a019E00000CsXRZQA3';
export default class planificationSAV extends NavigationMixin(LightningElement){


today;
rowCount;
nrAppareils;
intervention;
lstAppareil;
columns = COLUMNS;

@track
dailyInterventions;

dateDisplay;
currentDate;

    connectedCallback(){
        this.setDate();
    }

    addDays(){
        this.setDate(1);
    }

    removeDays(){
        this.setDate(-1);
    }

    setDate(days){
        if(!days){
            this.currentDate = new Date();
        }
        else{
            this.currentDate.setDate(this.currentDate.getDate() + days);
        }
        this.dateDisplay = this.currentDate.toISOString().split('T')[0];
    }

@wire(getDailyInterventions)
result(res){
    if(res.data){
        this.dailyInterventions = res.data;
        this.rowCount = this.dailyInterventions.length;
        console.log(res.data);
    }
}

    @wire(getInterventions, {interventionId : interventionIdExemple})
    interventions({data, error}){
        console.log(data);
        if(data){
            let tmp = JSON.parse(JSON.stringify(data));
            tmp.customerCode = tmp.Account__r.CustomerCode__c;
            this.intervention = tmp;
            console.log(this.intervention);

            getAppareilForAccount({accountId : this.intervention.Account__c})
            .then(result => {
                this.lstAppareil = result;
                this.nrAppareils = this.lstAppareil.length; 
                console.log(this.lstAppareil);
            })
            .catch(error => {
                console.log(error);
            });
        }else if(error){
            console.log(error);
            this.intervention = undefined;
        }
    };

    navigateToAccount(){
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: {
                recordId: this.intervention.Account__c,
                objectApiName: 'Account',
                actionName: 'view'
            },
        });
    }

    

}