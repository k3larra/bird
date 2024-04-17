const http = require('http');
var admin = require("firebase-admin");
const functions = require('firebase-functions');
//const { myFunction } = require('./functions/index'); //What???
const axios = require('axios');
const fs = require('fs');
const hostname = '127.0.0.1';
const port = 3000;
console.log("Node started on port 3000");
var serviceAccount = require("../secrets/bird-ad15f-firebase-adminsdk-hzlhg-4ccf1a7271.json");
const { log } = require('console');
const e = require('express');
if (!admin.apps.length) {
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://bird-ad15f-default-rtdb.europe-west1.firebasedatabase.app"
});
}
var db = admin.database();
//var usersRef = db.ref("/users");
/* const uid = "vKFIvuQHJbMDmdaACZZMyRJXyMs1";
const projectref = "-Nn_rJ9jJK0wRatJRjgM";
const metadataref = "-Nm5imF8X6YIl1q6LIuQ" */
//var metaDataRef = db.ref("/"+uid+"/metadata");
const usersRef = db.ref('users');
//A call to the database function to get projectID and metadataID (See the function in functions/index.js)
var clientRequestRef = db.ref('/projects/clientrequest');
/* ref.on('value', (snapshot) => {
  console.log('Value:', snapshot.val());
});
*/
//projID that runs on this server
const projectIDsToRunOnThisServer = ["-Nn_rJ9jJK0wRatJRjgM","-NuQJ83EyczWaSwgZxXc"];

clientRequestRef.on('child_added', (snapshot) => {
  //Code snippet for checking if projects should run on this server based on users????
/*   getUsersForProject(snapshot.val().projectID).then(owner => {
      if (owner.email === 'lars.rauer@gmail.com') {
        console.log("YES runhere");
      }else{
        console.log("NO");
      }
  }).catch(error => {
    console.error(error);
  }); */
  if (projectIDsToRunOnThisServer.includes(snapshot.val().projectID)) {
    console.log("Project runs on this server")
    let ml_train = snapshot.val() && snapshot.val().metadata && snapshot.val().metadata.ml_train;
    if (ml_train) {
      console.log("ml_train");
      train_model(snapshot.val());
    }
    let ml_delete = snapshot.val() && snapshot.val().metadata && snapshot.val().metadata.ml_delete;
    if (ml_delete) {
      console.log("ml_delete");
      delete_model(snapshot.val());
    }
    let ml_predict = snapshot.val() && snapshot.val().metadata && snapshot.val().metadata.ml_predict;
    if ( ml_predict) {
      console.log("ml_predict");
      // test if prediction is not alrady running
        if (snapshot.val().metadata.ml_predict_started_timestamp < snapshot.val().metadata.ml_predict_finished_timestamp) {
          predict(snapshot.val());
        }else{
          console.log("prediction already running");
        }
    }
    snapshot.ref.remove();
  }else{
    console.log("Project not to run on this server")
  }
}); 



function train_model(json_file){
  axios.post('http://127.0.0.1:5000/train_model', json_file)  
  .then((res) => {
    console.log(res.data.status)
    if (res.data.status === "running") {
      console.log("running")
    } else {
      console.log("fail")
      var trainingRef = db.ref("/projects/"+json_file.projectID+"/metadata/"+json_file.metadata.training_set_ref);
      trainingRef.child(json_file.training_set_ref).update({
        ml_train: false,
        ml_train_status: "fail"
      });
    }
  })
  .catch((error) => {
    console.error(error)
  })
}

function delete_model(json_file){
  axios.post('http://127.0.0.1:5000/delete_model', json_file)
  .then((res) => {
    console.log(res.data.status)
  })
  .catch((error) => {
    console.error(error)
  })
}

function predict(json_file){
  axios.post('http://127.0.0.1:5000/predict', json_file)
  .then((res) => {
    console.log(res.data.status)
  })
  .catch((error) => {
    console.error(error)
  })
}

//Helpers 

async function getUsersForProject(projectID) {
  let owner = null;
  await usersRef.once('value').then(snapshot => {
    snapshot.forEach(userSnapshot => {
      const user = userSnapshot.val();
      const projects = user.projects;
      Object.entries(projects).forEach(([key, value]) => {
        if (projectID === key) {
          owner = user;
        }
      });
    });
  });
  return owner;
}

// Call the function like this
const projectID = "your-project-id";
getUsersForProject(projectID).then(owner => {
  console.log(owner);
}).catch(error => {
  console.error(error);
});
