import { LightningElement, wire, track, api } from "lwc";
import getInterventions from "@salesforce/apex/InterventionController.getInterventions";
import getDailyInterventions from "@salesforce/apex/DailyInterventionController.getDailyInterventions";
import getAppareilForAccount from "@salesforce/apex/InterventionController.getAppareilForAccount";
import { NavigationMixin } from "lightning/navigation";
import { updateRecord } from "lightning/uiRecordApi";

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
    @track PostingDate;
    @track dateDisplay

    async connectedCallback() {
        this.PostingDate = new Date();
        this.dateDisplay = this.PostingDate.toISOString();
        this.postingDateChange();
    }


    sortDirection = false;
    allInterventionsList;
    today;
    nrAppareils;
    intervention;
    lstAppareil;
    columns = COLUMNS;
    index;



    value = 'JOUR';
    listAlias = [{ name: "TT: ", nr: "0" }];



    @track dailyInterventions;
    @track rowCount;
    @track newValue;

    @api recordId;
    name;
    techInput;

    postingDateChange() {
        console.log('test');
        getDailyInterventions({ chosenDate: this.PostingDate })
            .then(res => {
                console.log('test 2 ' + res);
                if (res) {
                    this.allInterventionsList = res;
                    this.dailyInterventions = this.allInterventionsList;
                    this.rowCount = this.dailyInterventions.length;

                    console.log('this is the list:' + this.dailyInterventions);
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

    //this method allows the user to update the technicien field
    updateAlias(event) {

        let rowIndex = event.target.dataset.index;
        let newArray = [...this.dailyInterventions];


        console.log('listAlias' + this.listAlias);

        if (event.target.name === "techInput") {
            let updatedRow = { ...newArray[rowIndex], ['technicien']: event.target.value };
            newArray[rowIndex] = updatedRow;
        }

        this.dailyInterventions = newArray;

    }

    // handleClick(event){

    //   // example taken from here: https://blog.salesforcecasts.com/how-to-use-updaterecord-in-lwc/ 

    //   // const fields = {}; 

    //   // fields[ID_FIELD.fieldApiName] = this.recordId; 
    //   // fields[NAME_FIELD.fieldApiName] = this.name;

    //   // const recordInput = {
    //   //   fields: fields
    //   // }; 

    //   // updateRecord(recordInput).then((record) => {
    //   //   console.log(record);
    //   // });

    // }



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
        // getDailyInterventions({ chosenDate: this.PostingDate })
        //     .then(result => {
        //         this.allInterventionsList = result;
        //         this.dailyInterventions = this.allInterventionsList;
        //         this.rowCount = this.dailyInterventions.length;
        //         console.log(this.dailyInterventions);
        //     })
        //     .catch(error => {
        //         console.log(error);
        //     });

        console.log('current value of the input detail: ' + JSON.stringify(event.detail));

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

    // this method retrieves information of all daily interventions which are visible in the main UI table

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