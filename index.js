// See https://github.com/dialogflow/dialogflow-fulfillment-nodejs
// for Dialogflow fulfillment library docs, samples, and to report issues
'use strict';
 
const functions = require('firebase-functions');
const {WebhookClient} = require('dialogflow-fulfillment');
const {Card, Suggestion} = require('dialogflow-fulfillment');
const axios = require('axios');
 
process.env.DEBUG = 'dialogflow:debug'; // enables lib debugging statements
 
exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {
  const agent = new WebhookClient({ request, response });
  console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers));
  console.log('Dialogflow Request body: ' + JSON.stringify(request.body));
 
  function welcome(agent) {
    agent.add(`Welcome to my agent!`);
  }
 
  function fallback(agent) {
      return new Promise((resolve, reject) => {
        const queryText = request.body.queryResult.queryText;
        axios.post('https://sheetdb.io/api/v1/bf9nit1p6ah6y?sheet=Failures', {
            "data": {
              "Created":new Date(),
              "User Content": queryText
            }
        });
  
        agent.add(`I didn't understand`);
        agent.add(`I'm sorry, can you try again?`);
      });
  }
  
 function appointment(agent) {
    	const doctor=agent.parameters.doctor;
      	const appDate=agent.parameters.appDate;
      	const patientName=agent.parameters.patientName;
  	const phoneNumber=agent.parameters.phoneNumber;
    
    return new Promise((resolve, reject) => {
      axios.get(`https://sheetdb.io/api/v1/bf9nit1p6ah6y/search?Doctor=*${doctor.name}*`).then(function(res) {
      	let doctor = res.data[0];
        
        if (doctor) {
          axios.post('https://sheetdb.io/api/v1/bf9nit1p6ah6y?sheet=Appointment', {
            "data": {
              "EntryTime": new Date(),
              "Doctor": doctor.Doctor,
              "Patient": patientName,
              "PatientContact": phoneNumber,
              "ScheduleDate": appDate,
              "isScheduled": "N"
            }
          });
          
          agent.add("Ok your appointment is set up for you");
        } else {
          agent.add(`Unfortuneatly we did not find ${doctor} in our doctors`);
        }
        
        resolve();
      });
    });
  }

  
  // Run the proper function handler based on the matched Dialogflow intent name
  let intentMap = new Map();
  intentMap.set('Default Welcome Intent', welcome);
  intentMap.set('Default Fallback Intent', fallback);
  intentMap.set('AppIntent', appointment);
  
  agent.handleRequest(intentMap);
});
