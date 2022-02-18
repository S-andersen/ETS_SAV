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
import getAbsentTechnicians from "@salesforce/apex/AbsenceController.getAbsentTechnicians";

const COLUMNS = [
    { label: "Type", fieldName: "Type__c", type: "text" },
    {
        label: "Energie", fieldName: "Energy__c", type: "text",
        cellAttributes: {
            class: { fieldName: 'energyColor' }
        }
    },
    { label: "Marque", fieldName: "Brand__c", type: "text" }
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
    @track listAbsentTechs = [];

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
    timeDiff;
    empty;
    absentIndex;
    absentTechnician;
    listAbsentTechs;


    async connectedCallback() {
        this.PostingDate = new Date();
        this.dateDisplay = this.PostingDate.toISOString();
        this.postingDateChange();
        this.postingTechniciansAlias();
    }

    countAlias() {
        var count = {};

        for (var element of this.dailyInterventions) {
            if (count[element.technicien]) {
                count[element.technicien] += 1;
            } else {
                count[element.technicien] = 1;
            }
        }
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
        getTechnicians()
            .then(res => {
                if (res) {
                    this.listAlias = res;
                }
                this.countAlias();

            })
            .catch(error => {
                console.log(error);
            });
    }

    postingAbsentTechnicians() {
        getAbsentTechnicians({ chosenDate: this.PostingDate.toISOString(), plage: this.value })
            .then(res => {
                if (res) {
                    this.listAbsentTechs = res;
                    this.absentTechnician = this.listAbsentTechs;
                }
            })
            .catch(error => {
                console.log('postingTechnician' + JSON.stringify(error));
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
                let techAbsent = this.absentTechnician.find(techId => techId.employee == tmpAlias);
                if(techAbsent != undefined){
                    event.target.style.background = '#f2cf5b';
                } else {
                    event.target.style.background = '#7fb467';
                    if (oldAlias != tmpAlias) {
                        const fields = {};
                        fields[ID_FIELD.fieldApiName] = this.dailyInterventions[rowIndex].id;
                        fields[TEMPORARYTECHNICIAN_FIELD.fieldApiName] = techAlias.id;
                        const recordInput = { fields }
                        updateRecord(recordInput)
                            .then(() => {
                            })
                            .catch(error => { })
                    }
                }

            } else {
                event.target.style.background = '#EC4134';
            }

        } else if (tmpAlias == '') {
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
        getDailyInterventions({ chosenDate: this.PostingDate, plage: this.value })
            .then(res => {
                console.log('test 2 ' + res);
                if (res) {
                    this.allInterventionsList = res.map(item => {
                        let qualifColor;
                        switch (item.qualification) {
                            case 'CHAUDIERE GAZ': qualifColor = "#f2cf5b"; break;
                            case 'CHAUDIERE FIOUL': qualifColor = "#38c393"; break;
                            case 'CHAUDIERE GRANULE': qualifColor = "#b9ac91"; break;
                            case 'POELE A GRANULE': qualifColor = "#b9ac91"; break;
                            case 'POMPE A CHALEUR EAU EAU': qualifColor = "#ff7b84"; break;
                            case 'ADOUCISSEUR': qualifColor = "#0079bc"; break;
                            case 'POMPE A CHALEUR AIR EAU': qualifColor = "#ff7b84"; break;
                            case 'CLIMATISATION MONOSPLIT': qualifColor = "#a094ed"; break;
                            case 'CLIMATISATION MULTISPLIT': qualifColor = "#a094ed"; break;
                            case 'SOLAIRE THERMIQUE': qualifColor = "#ff9a3c"; break;
                        }
                        return {
                            ...item,
                            'qualifColor': qualifColor
                        }
                    })
                    this.dailyInterventions = JSON.parse(JSON.stringify(this.allInterventionsList));
                    this.rowCount = this.dailyInterventions.length;
                    this.postingTechniciansAlias();
                    this.postingAbsentTechnicians();
                    this.countAlias();

                    getInterventions({ interventionId: this.dailyInterventions[0].id })
                        .then(result => {
                            let tmp = JSON.parse(JSON.stringify(result));
                            tmp.customerCode = tmp.Account__r.CustomerCode__c;
                            this.intervention = tmp;

                            getAppareilForAccount({ accountId: this.intervention.Account__c })
                                .then(result => {
                                    this.lstAppareil = this.getEnergyColor(result);
                                    this.nrAppareils = this.lstAppareil.length;
                                    this.empty = this.nrAppareils == 0 ? true : false;
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

    // this method updates and saves the technicians from temporary to confirmed on intervention object
    // by clicking the button 

    handleClick(event) {
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

    // this method selects and shows the table data upon the selection of AM/PM/JOUR 
    handleRadioChange(event) {
        this.value = event.target.value;
        this.postingDateChange();
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

    // this method allows the user to navigate to the Account page by clicking the icon
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

    // this method allows the user to navigate to the Intervention page by clicking the icon
    navigateToIntervention(e) {
        e.preventDefault();
        this[NavigationMixin.Navigate]({
            type: "standard__recordPage",
            attributes: {
                recordId: e.target.dataset.current,
                objectApiName: "Intervention__c",
                actionName: "view"
            }
        });
    }

    // this method updates the client and intervention card on the right hand side,
    // when a row in the main table has been clicked.
    showIntervention(event) {

        getInterventions({ interventionId: event.target.dataset.current })
            .then(result => {
                let tmp = JSON.parse(JSON.stringify(result));
                tmp.customerCode = tmp.Account__r.CustomerCode__c;
                this.intervention = tmp;

                getAppareilForAccount({ accountId: this.intervention.Account__c })
                    .then(result => {
                        this.lstAppareil = this.getEnergyColor(result);
                        this.nrAppareils = this.lstAppareil.length;
                    })
                    .catch(error => {
                        console.log(error);
                    });
            })
            .catch(error => {
                console.log(error);
            });
    }

    //this method conditions the background color on the Energy column in the smaller intervention table
    getEnergyColor(result) {
        return result.map(item => {
            let energyColor;
            switch (item.Energy__c) {
                case 'Gaz': energyColor = "slds-icon-standard-case slds-text-color_default"; break;
                case 'Electricité / Pompe à chaleur': energyColor = "slds-icon-custom-custom32 slds-text-color_default"; break;
                case 'Bois / Granule': energyColor = " slds-icon-standard-fulfillment-order slds-text-color_default"; break;
                case 'Fioul': energyColor = "slds-icon-standard-loop slds-text-color_default"; break;
                case 'Eau / Adoucisseur traitement eau': energyColor = "slds-icon-standard-flow slds-text-color_default"; break;
                case 'Ramonage': energyColor = "slds-icon-standard-group-loading slds-text-color_default"; break;
            }
            return {
                ...item,
                'energyColor': energyColor
            }
        });
    }

    //this method sorts the columns in the main data table ASC and DES
    sortColumn(columnName) {

        let key = columnName.target.title.toLowerCase();
        this.sortDirection = !this.sortDirection;
        this.dailyInterventions = JSON.parse(JSON.stringify(this.dailyInterventions));

        if (key == 'heure') {
            key = "interventionTime";

            this.dailyInterventions.sort((a, b) => {
                return this.sortDirection ? parseFloat(a[key].replace(':', '.')) - parseFloat(b[key].replace(':', '.')) :
                    parseFloat(b[key].replace(':', '.')) - parseFloat(a[key].replace(':', '.'));
            });
        } else if (key == 'solde') {
            this.dailyInterventions.sort((a, b) => {
                return this.sortDirection ? a[key] - b[key] : b[key] - a[key]
            });

        } else {
            this.dailyInterventions.sort((a, b) => {
                return this.sortDirection ? a[key].localeCompare(b[key]) : b[key].localeCompare(a[key])
            });
        }
    }
    //this method refreshes the component
    refreshComponent() {
        this.postingDateChange();
    }
}