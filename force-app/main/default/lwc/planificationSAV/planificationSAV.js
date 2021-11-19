import { LightningElement, wire, track } from "lwc";
import getInterventions from "@salesforce/apex/InterventionController.getInterventions";
import getDailyInterventions from "@salesforce/apex/DailyInterventionController.getDailyInterventions";
import getAppareilForAccount from "@salesforce/apex/InterventionController.getAppareilForAccount";
import { NavigationMixin } from "lightning/navigation";

const COLUMNS = [
  { label: "Code", fieldName: "APCode__c", type: "text" },
  { label: "Nom", fieldName: "Name", type: "text" },
  { label: "Details", fieldName: "Type__c", type: "text" }
];

export default class planificationSAV extends NavigationMixin(LightningElement) {


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
  

  // this method updates the table based on which radio button is checked 
  get options(){
    return [
      {label: 'JOUR', value: 'JOUR'},
      {label: 'AM', value: 'AM'},
      {label: 'PM', value: 'PM'}
    ];
  }

  @track optionJOUR = true;
  @track optionAM = false;
  @track optionPM = false; 
   

  handleRadioChange(event) {
    const selectedOption = event.detail.value;

    if(selectedOption == 'AM'){
      this.optionAM = true;
      this.dailyInterventions = this.allInterventionsList.filter(interv =>
        parseFloat(interv.interventionTime.replace(':', '.')) < 12.00);
      this.rowCount = this.dailyInterventions.length;   
     

    }else{
      this.optionAM = false;
    }

    if(selectedOption == 'PM'){
      console.log('PM click');
      this.optionPM = true;
      this.dailyInterventions = this.allInterventionsList.filter(interv =>
        parseFloat(interv.interventionTime.replace(':', '.')) >= 12.00);
        this.rowCount = this.dailyInterventions.length;
    }else{
      this.optionPM = false;
    }

    if(selectedOption == 'JOUR'){
      console.log('JOUR click');
      this.optionJOUR = true; 
      this.dailyInterventions = this.allInterventionsList; 
      this.rowCount = this.dailyInterventions.length;

    }else{
      this.optionJOUR = false;
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
   
}