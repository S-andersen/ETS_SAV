import { LightningElement, wire, track, api } from "lwc";
import getInterventions from "@salesforce/apex/InterventionController.getInterventions";
import getDailyInterventions from "@salesforce/apex/DailyInterventionController.getDailyInterventions";
import getAppareilForAccount from "@salesforce/apex/InterventionController.getAppareilForAccount";
import { NavigationMixin } from "lightning/navigation";
import getTechnicians from "@salesforce/apex/TechnicianController.getTechnicians"
import saveConfirmedTechnicians from "@salesforce/apex/DailyInterventionController.saveConfirmedTechnicians";
import { updateRecord } from 'lightning/uiRecordApi';
import ID_FIELD from '@salesforce/schema/Intervention__c.Id';
import TEMPORARYTECHNICIAN_FIELD from '@salesforce/schema/Intervention__c.TemporaryTechnician__c';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
// import { getPicklistValues } from 'lightning/uiObjectInfoApi';
// import TYPE_FIELD from '@salesforce/schema/Intervention__c.Type__c';

const COLUMNS = [
    { label: "Type", fieldName: "Type__c", type: "text"},
    { label: "Energie", fieldName: "Energy__c", type: "text",
      cellAttributes: {
          class:{fieldName:'energyColor'}
      }},
    { label: "Autre Energie", fieldName: "OtherEnergy__c", type: "text" }
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
    
    @track rowCount;
    @track newValue;
    @track listTechAlias;

    sortDirection = false;
    dailyInterventions;
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
    absent = "DD";
    timeDiff; 



    async connectedCallback() {
        this.PostingDate = new Date();
        this.dateDisplay = this.PostingDate.toISOString();
        this.postingDateChange();
        this.postingTechniciansAlias();
        console.log('absents: ' + absents);
    }

    // //this method retrieves the picklist values of the intervention type
    // @wire (getPicklistValues, {
    //     recordTypeId: '012000000000000AAA', // Default record type Id
    //     fieldApiName: TYPE_FIELD
    // })

    countAlias() {
        var count = {};
        console.log('list daily: ' + JSON.stringify(this.dailyInterventions));

        for (var element of this.dailyInterventions) {
            console.log('element: ' + element);
            if (count[element.technicien]) {
                count[element.technicien] += 1;
            } else {
                count[element.technicien] = 1;
            }
        }
        console.log('count ' + JSON.stringify(count));
        let test = [... this.listAlias];
        let i = 0;

        for (i = 0; i < test.length; i++) {
            if (count[test[i].alias] != null) {
                let newRow = { ...test[i], ['nr']: count[test[i].alias] };
                test[i] = newRow;
            } else {
                let newRow = { ...test[i], ['nr']: 0 };
                test[i] = newRow;
            }
        }
        this.listAlias = test;
    }

    postingTechniciansAlias() {
        console.log('enters postingTechniciansAlias');

        getTechnicians()
            .then(res => {
                console.log('res?: ' + res);
                if (res) {
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
        let tmpAlias = event.target.value;
        let rowIndex = event.target.dataset.index;
        let oldAlias = this.dailyInterventions[rowIndex].technicien;
        event.target.style.background = '#FF000000';
        if (tmpAlias.length > 0) {
            if (event.target.name == "techInput") {
                this.dailyInterventions[rowIndex].technicien = tmpAlias;
            }

            this.countAlias();

            let techAlias = this.listAlias.find(techId => techId.alias == tmpAlias);
            if (techAlias != undefined) {
                event.target.style.background = '#7fb467';
                if (oldAlias != tmpAlias) {
                    const fields = {};
                    fields[ID_FIELD.fieldApiName] = this.dailyInterventions[rowIndex].id;
                    fields[TEMPORARYTECHNICIAN_FIELD.fieldApiName] = techAlias.id;
                    const recordInput = { fields }
                    console.log('test update alias');
                    updateRecord(recordInput)
                        .then(() => {
                        })
                        .catch(error => { })
                }

            } else {
                event.target.style.background = '#EC4134';
            }

        }
        else if (tmpAlias == '') {
            this.dailyInterventions[rowIndex].technicien = tmpAlias;
            const fields = {};
            fields[ID_FIELD.fieldApiName] = this.dailyInterventions[rowIndex].id;
            fields[TEMPORARYTECHNICIAN_FIELD.fieldApiName] = null;
            const recordInput = { fields }

            updateRecord(recordInput)
                .then(() => {

                })
                .catch(error => {
                    console.log(error);
                })

        }
    }

    postingDateChange() {
        console.log('test');
        getDailyInterventions({ chosenDate: this.PostingDate })
            .then(res => {
                console.log('test 2 ' + res);
                if (res) {
                    this.allInterventionsList = res;
                    this.dailyInterventions = JSON.parse(JSON.stringify(this.allInterventionsList));
                    console.log(this.dailyInterventions);
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
                                    this.lstAppareil = this.getEnergyColor(result); 
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

    handleClick(event) {
        console.log('SAVE button clicked');
        saveConfirmedTechnicians({ interventionsToUpdate: this.dailyInterventions })
            .then(() => {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Modifications validées',
                        variant: 'success'
                    })
                );
            })
            .catch(error => {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Une erreur est survenue',
                        variant: 'error'
                    })
                );
            });

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
                recordId: this.intervention.id,
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
                        this.lstAppareil = this.getEnergyColor(result);
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

    getEnergyColor(result){
        return result.map(item => {
            let energyColor; 
            switch(item.Energy__c){
                case 'Gaz': energyColor = "slds-icon-standard-case slds-text-color_default"; break;
                case 'Electricité / Pompe à chaleur': energyColor = "slds-icon-custom-custom32 slds-text-color_default"; break;
                case 'Bois / Granule': energyColor = " slds-icon-standard-fulfillment-order slds-text-color_default"; break;
                case 'Fioul': energyColor = "slds-icon-standard-loop slds-text-color_default"; break;
                case 'Eau / Adoucisseur traitement eau': energyColor = "slds-icon-standard-flow slds-text-color_default"; break;
                case 'Ramonage': energyColor = "slds-icon-standard-group-loading slds-text-color_default"; break;
                
            }
            return {...item, 
                'energyColor':energyColor
            }
        });
    }


    //this method sorts the columns in the main data table 
    sortColumn(columnName) {

        let key = columnName.target.title.toLowerCase();
        console.log('key: ' + key);
        this.sortDirection = !this.sortDirection;

        if (key == 'heure') {
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