import { LightningElement, wire, track } from "lwc";
import getInterventions from "@salesforce/apex/InterventionController.getInterventions";
import getDailyInterventions from "@salesforce/apex/DailyInterventionController.getDailyInterventions";
import getAppareilForAccount from "@salesforce/apex/InterventionController.getAppareilForAccount";
import { NavigationMixin } from "lightning/navigation";
import edit from '@salesforce/resourceUrl/edit';
import StayInTouchNote from "@salesforce/schema/User.StayInTouchNote";

const COLUMNS = [
  { label: "Code", fieldName: "APCode__c", type: "text" },
  { label: "Nom", fieldName: "Name", type: "text" },
  { label: "Details", fieldName: "Type__c", type: "text" }
];

export default class planificationSAV extends NavigationMixin(LightningElement) {


  sortDirection = false;
  allInterventionsList;
  today;
  nrAppareils;
  intervention;
  lstAppareil;
  columns = COLUMNS;
  index; 
  dateDisplay;
  currentDate;
  value = 'JOUR';

  @track dailyInterventions;
  @track rowCount;
  @track newValue; 
  
  handleRadioChange(event) {
    const selectedOption = event.target.value;
    
    if(selectedOption == 'AM'){
      this.dailyInterventions = this.allInterventionsList.filter(interv =>
        parseFloat(interv.interventionTime.replace(':', '.')) < 12.00);
      this.rowCount = this.dailyInterventions.length;   
    }

    if(selectedOption == 'PM'){
      console.log('PM click');
      this.dailyInterventions = this.allInterventionsList.filter(interv =>
        parseFloat(interv.interventionTime.replace(':', '.')) >= 12.00);
        this.rowCount = this.dailyInterventions.length;
    }

    if(selectedOption == 'JOUR'){
      console.log('JOUR click');
      this.dailyInterventions = this.allInterventionsList; 
      this.rowCount = this.dailyInterventions.length;
    }
}

  // This method retrieves the date in a french format
  connectedCallback() {
    this.setDate();
  }

  addDays() {
    this.setDate(1);
    let event = {'detail': {'value': this.dateDisplay}}
    this.handleDateChange(event);
  }

  removeDays() {
    this.setDate(-1);
    let event = {'detail': {'value': this.dateDisplay}}
    this.handleDateChange(event); 
  }

  setDate(days) {
    if (!days) {
      this.currentDate = new Date();
    } else {
      this.currentDate.setDate(this.currentDate.getDate() + days);
    }
    this.dateDisplay = this.currentDate.toISOString().split("T")[0];
  }

  // this method retrieves information of all daily interventions which are visible in the main UI table
  @wire(getDailyInterventions, {chosenDate: new Date()})
  result(res) {
    if (res.data) {
      this.allInterventionsList = res.data;
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

  handleDateChange(event){
    
    let testDateToday = event.detail.value; 

    getDailyInterventions({chosenDate: testDateToday})
      .then(result => {
        this.allInterventionsList = result;
        this.dailyInterventions = this.allInterventionsList;
        this.rowCount = this.dailyInterventions.length;
        console.log(this.dailyInterventions);
      })
      .catch(error => {
        console.log(error);
      });

        console.log('current value of the input detail: ' + JSON.stringify(event.detail));

  }

  
  //this method sorts the columns in the main data table 
  sortColumn(columnName){

    let key = columnName.target.title.toLowerCase(); 
    console.log('key: ' + key);
    this.sortDirection = !this.sortDirection;

   if(key == 'heure'){
    console.log('cas heure :');
    key = "interventionTime";

    this.dailyInterventions.sort((a, b) => {
      return this.sortDirection? parseFloat(a[key].replace(':', '.')) - parseFloat(b[key].replace(':', '.')) : 
      parseFloat(b[key].replace(':', '.')) - parseFloat(a[key].replace(':', '.'));
    }); 
   }  else {
      const dataType = typeof this.dailyInterventions[0][key];
      this.dailyInterventions = JSON.parse(JSON.stringify(this.dailyInterventions));

      this.dailyInterventions.sort((a, b) => {
        return this.sortDirection? a[key].localeCompare(b[key]) : b[key].localeCompare(a[key]) 
      }); 
  }
  }

  editTechnicien(event){


    let rowIndex = event.target.dataset.index;
    let previousValue = this.dailyInterventions[rowIndex].technicien;
    console.log('previous Value: ' + previousValue);
    let pressEnter = event.keyCode; 

    if (pressEnter == 13) { 
      event.preventDefault();
            this.template.querySelectorAll("[data-index='"+rowIndex+"']").forEach(element => {
        if(element.dataset.cell === 'cellTechnicien') {
          if(element.innerHTML.length == 2){
            let newValue = element.innerHTML; 
            console.log('new value: ' + newValue)
          } else{
            
            element.innerHTML = previousValue; 
            console.log('element prev value ' + element.innerHTML);
          }


        }
    }); 
    } else {

    
      console.log('do nothing!');
    }
  }

  handletech = '0 ';

    handleChange(e) {
        this.handletech = e.detail.value;
    }

  }