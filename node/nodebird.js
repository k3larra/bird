const http = require('http');
var admin = require("firebase-admin");
const functions = require('firebase-functions');
const { myFunction } = require('./functions/index');
const axios = require('axios');
const fs = require('fs');
const hostname = '127.0.0.1';
const port = 3000;
console.log("Node started on port 3000");

let text = '{ "employees" : [' +
'{ "firstName":"John" , "lastName":"Doe" },' +
'{ "firstName":"Anna" , "lastName":"Smith" },' +
'{ "firstName":"Peter" , "lastName":"Jones" } ]}';
let json_stuff = JSON.parse(text);

var serviceAccount = require("../secrets/bird-ad15f-firebase-adminsdk-hzlhg-4ccf1a7271.json");
const { log } = require('console');
admin.apps.forEach((app) => {
  console.log(app.name);
});

//if (!admin.apps.length) {
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://bird-ad15f-default-rtdb.europe-west1.firebasedatabase.app"
}, "picaPica");
//}
//Read from realtime database
var db = admin.database();
//var usersRef = db.ref("/users");
const uid = "vKFIvuQHJbMDmdaACZZMyRJXyMs1";
const projectref = "-Nn_rJ9jJK0wRatJRjgM";
const metadataref = "-Nm5imF8X6YIl1q6LIuQ"
//var metaDataRef = db.ref("/"+uid+"/metadata");

var clientRequestRef = db.ref('/projects/clientrequest');
/* ref.on('value', (snapshot) => {
  console.log('Value:', snapshot.val());
});
*/

clientRequestRef.on('child_added', (snapshot) => {
  console.log("metadata",snapshot.val().metadata);
  console.log("projectID",snapshot.val().projectID);
  let ml_train = snapshot.val()?.metadata?.ml_train;
  if (ml_train) {
    console.log("ml_train");
    train_model(snapshot.val());
  }
  let ml_delete = snapshot.val()?.metadata?.ml_delete;
  if (ml_delete) {
    console.log("ml_delete");
    delete_model(snapshot.val());
  }
  let ml_predict = snapshot.val()?.metadata?.ml_predict;
  if ( ml_predict) {
    console.log("ml_predict");
    // test if prediction is not running
    //if (snapshot.val().ml_predict_started_timestamp&&snapshot.val().ml_predict_finished_timestamp){
      if (snapshot.val().metadata.ml_predict_started_timestamp < snapshot.val().metadata.ml_predict_finished_timestamp) {
        predict(snapshot.val());
      }else{
        console.log("prediction already running");
      }
  }
  snapshot.ref.remove();
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