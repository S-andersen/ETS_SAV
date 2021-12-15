import { LightningElement, wire, track, api } from "lwc";
import getInterventions from "@salesforce/apex/InterventionController.getInterventions";
import getDailyInterventions from "@salesforce/apex/DailyInterventionController.getDailyInterventions";
import getAppareilForAccount from "@salesforce/apex/InterventionController.getAppareilForAccount";
import { NavigationMixin } from "lightning/navigation";
import getTechnicians from "@salesforce/apex/TechnicianController.getTechnicians"
import saveConfirmedTechnicians from "@salesforce/apex/DailyInterventionController.saveConfirmedTechnicians";
import { updateRecord } from 'lightning/uiRecordApi';
import ID_FIELD from '@salesforce/schema/Intervention__c.id'; 
import TEMPORARYTECHNICIAN_FIELD from '@salesforce/schema/Intervention__c.TemporaryTechnician__c'; 
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

const COLUMNS = [
    { label: "Code", fieldName: "APCode__c", type: "text" },
    { label: "Nom", fieldName: "Name", type: "text" },
    { label: "Details", fieldName: "Type__c", type: "text" }
];

Date.prototype.addDays = function (days) {
    var date = new Date(this.valueOf());
    date.setDate(date.getDate() + days);
    return date;
};
Date.prototype.minusDays = function (days) {
    var date = new Date(this.valueOf());
    date.setDate(date.getDate() - days);
    return date;
};

export default class planificationSAV extends NavigationMixin(LightningElement) {

    @api recordId;
    

    @track PostingDate;
    @track dateDisplay;
    @track listAlias = [];
    @track dailyInterventions;
    @track rowCount;
    @track newValue;
    @track listTechAlias;

    sortDirection = false;
    allInterventionsList;
    today;
    nrAppareils;
    intervention;
    lstAppareil;
    columns = COLUMNS;
    index;
    aliasIndex;
    value = 'JOUR';
    name;
    techInput;

    // absents = 'DD';
   
    

    async connectedCallback() {
        this.PostingDate = new Date();
        this.dateDisplay = this.PostingDate.toISOString();
        this.postingDateChange();
        this.postingTechniciansAlias();
        console.log('absents: ' + absents);
    }

    countAlias(){
        var count = {};
        console.log('list daily: ' + JSON.stringify(this.dailyInterventions)); 
        
                    for (var element of this.dailyInterventions) {
                        console.log('element: ' + element); 
                        if (count[element.technicien]) {
                            count[element.technicien] +=1; 
                        } else {
                            count[element.technicien] = 1; 
                        }
                    }
                    console.log('count ' + JSON.stringify(count)); 
                    let test = [... this.listAlias];
                    let i = 0; 
        
                    for(i = 0; i< test.length; i++) {
                        if(count[test[i].alias]!=null){
                            let newRow = { ...test[i], ['nr']: count[test[i].alias] }; 
                            test[i] = newRow; 
                        } else {
                            let newRow = { ...test[i], ['nr']: 0}; 
                            test[i] = newRow; 
                        }
                    }
                    this.listAlias = test; 
 }
    
    postingTechniciansAlias(){
        console.log('enters postingTechniciansAlias'); 
        
        getTechnicians()
        .then(res => {
            console.log('res?: ' + res); 
            if(res) {
                this.listAlias = res;
            }
            this.countAlias(); 

        })
        .catch(error => {
            console.log(error);
        });   
    }
    
        //this method allows the user to update the technicien field
        updateAlias(event) {

        if(event.keyCode == 13){
            let rowIndex = event.target.dataset.index;
            let newArray = [...this.dailyInterventions];
                console.log('ENTER 13');
            
            console.log('listAlias' + JSON.stringify(this.listAlias));
    
            if (event.target.name === "techInput") {
                let updatedRow = { ...newArray[rowIndex], ['technicien']: event.target.value };
                newArray[rowIndex] = updatedRow;
            }
    
            this.dailyInterventions = newArray;
            this.countAlias(); 

            let techAlias = this.listAlias.find(techId => techId.alias == this.dailyInterventions[rowIndex].technicien);
            if(techAlias != undefined){
                const fields = {};
                fields[ID_FIELD.fieldApiName] = this.dailyInterventions[rowIndex].id; 
                fields[TEMPORARYTECHNICIAN_FIELD.fieldApiName] = techAlias.id; 

                event.target.style.background = '#ffffff';
                
                const recordInput = { fields }
    
                updateRecord(recordInput)
                .then(() => {})
                .catch(error => {})
                event.target.style.background = '#7fb467'; 
            } else{
                event.target.style.background = '#EC4134';  
            }
            
          }
        }
    
    postingDateChange() {
        console.log('test');
        getDailyInterventions({ chosenDate: this.PostingDate }) 
            .then(res => {
                console.log('test 2 ' + res);
                if (res) {
                    this.allInterventionsList = res;
                    this.dailyInterventions = this.allInterventionsList;
                    this.rowCount = this.dailyInterventions.length;
                    this.postingTechniciansAlias(); 
                    this.countAlias(); 

                    getInterventions({ interventionId: this.dailyInterventions[0].id })
                        .then(result => {
                            let tmp = JSON.parse(JSON.stringify(result));
                            tmp.customerCode = tmp.Account__r.CustomerCode__c;
                            this.intervention = tmp;
                            console.log(this.intervention);

                            getAppareilForAccount({ accountId: this.intervention.Account__c })
                                .then(result => {
                                    this.lstAppareil = result;
                                    this.nrAppareils = this.lstAppareil.length;
                                    console.log(this.lstAppareil);
                                })
                                .catch(error => {
                                    console.log(error);
                                });
                        })
                        .catch(error => {
                            console.log(error);
                        });
                }
            })
            .catch(error => {
                console.log(error);
            })
    }

// this method updates the technicians from temporary to confirmed on intervention object
// by clicking the button 

    handleClick(event){
        console.log('SAVE button clicked'); 
        saveConfirmedTechnicians({interventionsToUpdate : this.dailyInterventions})
        .then(()=> {this.dispatchEvent(
            new ShowToastEvent({
       title: 'Modifications validées',
       variant: 'success'
   })
);})
        .catch(error => {this.dispatchEvent(
            new ShowToastEvent({
                title: 'Une erreur est survenue',
                variant: 'error'
            })
        );}); 

    }



    handleRadioChange(event) {
        const selectedOption = event.target.value;


        if (selectedOption == 'AM') {
            this.dailyInterventions = this.allInterventionsList.filter(interv =>
                parseFloat(interv.interventionTime.replace(':', '.')) < 12.00);
            this.rowCount = this.dailyInterventions.length;
        }

        if (selectedOption == 'PM') {
            console.log('PM click');
            this.dailyInterventions = this.allInterventionsList.filter(interv =>
                parseFloat(interv.interventionTime.replace(':', '.')) >= 12.00);
            this.rowCount = this.dailyInterventions.length;
        }

        if (selectedOption == 'JOUR') {
            console.log('JOUR click');
            this.dailyInterventions = this.allInterventionsList;
            this.rowCount = this.dailyInterventions.length;
        }
    }

    handleDateChange(event) {

        this.PostingDate = new Date(event.target.value);
        this.dateDisplay = this.PostingDate.toISOString();
        this.postingDateChange()
    }

    addDays() {
        this.PostingDate = this.PostingDate.addDays(1);
        this.dateDisplay = this.PostingDate.toISOString();
        this.postingDateChange();
    }

    removeDays() {
        this.PostingDate = this.PostingDate.minusDays(1);
        this.dateDisplay = this.PostingDate.toISOString();
        this.postingDateChange();
    }

    // this method retrieves allows the user to navigate to the Account page by clicking the search icon
    navigateToAccount() {
        this[NavigationMixin.Navigate]({
            type: "standard__recordPage",
            attributes: {
                recordId: this.intervention.Account__c,
                objectApiName: "Account",
                actionName: "view"
            }
        });
    }

    // this method retrieves allows the user to navigate to the Intervention page by clicking the search icon
    navigateToIntervention() {
        this[NavigationMixin.Navigate]({
            type: "standard__recordPage",
            attributes: {
                recordId: this.intervention,
                objectApiName: "Intervention__c",
                actionName: "view"
            }
        });
    }

    // this method updates the client and intervention card on the right hand side,
    // when the client code in the main table has been clicked.
    // By default the first intervention in the main table is shown.
    showIntervention(event) {
        console.log("intervention Id:" + event.target.dataset.current);

        getInterventions({ interventionId: event.target.dataset.current })
            .then(result => {
                let tmp = JSON.parse(JSON.stringify(result));
                tmp.customerCode = tmp.Account__r.CustomerCode__c;
                this.intervention = tmp;
                console.log(this.intervention);

                getAppareilForAccount({ accountId: this.intervention.Account__c })
                    .then(result => {
                        this.lstAppareil = result;
                        this.nrAppareils = this.lstAppareil.length;
                        console.log(this.lstAppareil);
                    })
                    .catch(error => {
                        console.log(error);
                    });
            })
            .catch(error => {
                console.log(error);
            });
    }


    //this method sorts the columns in the main data table 
    sortColumn(columnName) {

        let key = columnName.target.title.toLowerCase();
        console.log('key: ' + key);
        this.sortDirection = !this.sortDirection;

        if (key == 'heure') {
            console.log('cas heure :');
            key = "interventionTime";

            this.dailyInterventions.sort((a, b) => {
                return this.sortDirection ? parseFloat(a[key].replace(':', '.')) - parseFloat(b[key].replace(':', '.')) :
                    parseFloat(b[key].replace(':', '.')) - parseFloat(a[key].replace(':', '.'));
            });
        } else {
            const dataType = typeof this.dailyInterventions[0][key];
            this.dailyInterventions = JSON.parse(JSON.stringify(this.dailyInterventions));

            this.dailyInterventions.sort((a, b) => {
                return this.sortDirection ? a[key].localeCompare(b[key]) : b[key].localeCompare(a[key])
            });
        }
    }
}