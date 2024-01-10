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

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://bird-ad15f-default-rtdb.europe-west1.firebasedatabase.app"
});

//Read from realtime database
var db = admin.database();
//var usersRef = db.ref("/users");
const uid = "vKFIvuQHJbMDmdaACZZMyRJXyMs1";
const projectref = "-Nn_rJ9jJK0wRatJRjgM";
const metadataref = "-Nm5imF8X6YIl1q6LIuQ"
//var metaDataRef = db.ref("/"+uid+"/metadata");

var metaDataRef = db.ref('/projects/clientrequest');
/* ref.on('value', (snapshot) => {
  console.log('Value:', snapshot.val());
});
*/

metaDataRef.on('child_added', (snapshot) => {
  console.log('Child added:', snapshot.val());
  snapshot.ref.remove();
}); 

/* metaDataRef.on('child_changed', (snapshot) => {
  console.log('Child changed:', snapshot.val());
  //remove child
   snapshot.ref.remove();  
}); */

/* ref.on('child_removed', (snapshot) => {
  console.log('Child removed:', snapshot.val());
});

ref.on('child_moved', (snapshot) => {
  console.log('Child moved:', snapshot.val());
}); */
//var metaDataRef = db.ref("/projects/"+projectref+"/metadata");
//var metaDataRef = db.ref("/projects/"+projectref+"/metadata/");
//var trainingsetRef = db.ref("/"+uid+"/trainingsets"); 

/* exports.myFunction = functions.database.ref('/projects/{projectID}/metadata/{metadataID}/ml_train')
    .onWrite((snapshot, context) => {
      console.log("trigged");
      console.log("snapshot",snapshot);
      const userId = context.params.projectID;
      const postId = context.params.metadataID;
      // ...
    });  */



/* metaDataRef.on("child_changed", function(snapshot) {
  console.log("child changed",snapshot.val());
  if (snapshot.val().ml_train) {
    console.log("ml_train",snapshot.val().ml_train);
    const projectId = snapshot.key; // Get the content of the wildcard *
    console.log("Project ID:", projectId);
    console.log("Metadata val:", snapshot.val());
    //train(snapshot.val());
  }
  if (snapshot.val().ml_delete) {
    console.log("ml_delete", snapshot.val().ml_delete);
    //delete_model(snapshot.val());
  }
  if (snapshot.val().ml_predict) {
    console.log("ml_predict", snapshot.val().ml_predict);
    // test if prediction is not running
    //if (snapshot.val().ml_predict_started_timestamp&&snapshot.val().ml_predict_finished_timestamp){
      if (snapshot.val().ml_predict_started_timestamp < snapshot.val().ml_predict_finished_timestamp) {
        //predict(snapshot.val());
      }else{
        console.log("prediction already running");
      }
  }
}); */

function train(json_file){
  axios.post('http://127.0.0.1:5000/train_model', json_file)  
  .then((res) => {
    console.log(res.data.status)
    if (res.data.status === "running") {
      console.log("success")
    } else {
      console.log("fail")
      metaDataRef.child(json_file.training_set_ref).update({
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

// function train(json_file){
//   axios.post('http://127.0.0.1:5000/json_endpoint', json_file)
//   .then((res) => {
//     console.log(res.data.status)
//     if (res.data === "success") {
//       //console.log("success")
//       metaDataRef.child(training_set_ref).update({
//         ml_train: false,
//         ml_train_ongoing: true,
//         ml_train_status: "success"
//         //ml_training_started_timestamp: firebase.database.ServerValue.TIMESTAMP
//       });
//     } else {
//       //console.log("fail")
//       metaDataRef.child(training_set_ref).update({
//         ml_train: false,
//         ml_train_status: "fail"
//       });
//     }
//       //console.log("fail")
//       metaDataRef.child(training_set_ref).update({
//         ml_train: false,
//         ml_train_status: "fail"
//       });
//     }
//   })
//   .catch((error) => {
//     console.error(error)
//   })
// }

/* function callTrain(id,retrain){
  http.get('http://127.0.0.1:5000/retrain?userId='+id, (resp) => {
            let data = '';
            resp.on('data', (chunk) => {
                data += chunk;
            });
            // The whole response has been received. Print out the result.
            resp.on('end', () => {
                console.log(data);
            });
        } ).on("error", (err) => {
            console.log("Error: " + err.message);
        });
}

function trainOld(json_file,uid,training_set_ref,ml_epochs){
  axios.post('http://127.0.0.1:5000/json_endpoint?uid='+uid+"&training_set_ref="+training_set_ref+"&ml_epochs="+ml_epochs, json_file)
  .then((res) => {
    console.log(res.data)
    if (res.data === "success") {
      //console.log("success")
      metaDataRef.child(training_set_ref).update({
        ml_train: false,
        ml_train_status: "success"
      });
    } else {
      //console.log("fail")
      metaDataRef.child(training_set_ref).update({
        ml_train: false,
        ml_train_status: "fail"
      });
    }
  })
  .catch((error) => {
    console.error(error)
  })
} */

// usersRef.once("value", function(snapshot) {
//   console.log(snapshot.val());
//   sendJsonToFlask(snapshot.val());
// });

// metaDataRef.on("child_added", function(snapshot) {
//   console.log("child added",snapshot.val());
//   //get the title
// });

/* const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('Hello World\n');
  ref.once("value", function(snapshot) {
    console.log(snapshot.val());
  });
});
server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
}); */