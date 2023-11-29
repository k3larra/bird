const http = require('node:http');
var admin = require("firebase-admin");
const axios = require('axios');
const fs = require('fs');
const hostname = '127.0.0.1';
const port = 3000;
console.log("started");

let text = '{ "employees" : [' +
'{ "firstName":"John" , "lastName":"Doe" },' +
'{ "firstName":"Anna" , "lastName":"Smith" },' +
'{ "firstName":"Peter" , "lastName":"Jones" } ]}';
let json_stuff = JSON.parse(text);

var serviceAccount = require("../secrets/bird-ad15f-firebase-adminsdk-hzlhg-4ccf1a7271.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://bird-ad15f-default-rtdb.europe-west1.firebasedatabase.app"
});

//Read from realtime database
var db = admin.database();
var usersRef = db.ref("/users");
const uid = "vKFIvuQHJbMDmdaACZZMyRJXyMs1";
var metaDataRef = db.ref("/"+uid+"/metadata");
var trainingsetRef = db.ref("/"+uid+"/trainingsets");




// usersRef.once("value", function(snapshot) {
//   console.log(snapshot.val());
//   sendJsonToFlask(snapshot.val());
// });

// metaDataRef.on("child_added", function(snapshot) {
//   console.log("child added",snapshot.val());
//   //get the title
// });

metaDataRef.on("child_changed", function(snapshot) {
  //console.log("child changed",snapshot.val());
  if (snapshot.val().ml_train) {
    trainingsetRef.child(snapshot.val().training_set_ref).once("value", function(snapshot2) {
      // Find all images with concept not "void"
      const json_file = {
        images: []
      };
      snapshot2.val().images.forEach(element => {
        if (element.concept !== "void") {
          //console.log(element);
          json_file.images.push(element);
        }
      });
      json_file.training_set_ref = snapshot.val().training_set_ref;
      json_file.ml_epochs = snapshot.val().ml_epochs;
      json_file.uid = snapshot.val().uid;
      json_file.ml_model = snapshot.val().ml_model;
      console.log(json_file.uid);
      console.log(json_file.images.length);
      //Save json file
      fs.writeFile('json_file.json', JSON.stringify(json_file), function (err) {
        if (err) throw err;
        console.log('Saved!');
      });
      // callTrain("id", true);
      train(json_file);
    });
  }
});

function train(json_file){
  axios.post('http://127.0.0.1:5000/json_endpoint', json_file)
  .then((res) => {
    console.log(res.data.status)
    if (res.data.status === "running") {
      console.log("success")
      // metaDataRef.child(json_file.training_set_ref).update({
      //   ml_train: false,
      //   ml_train_ongoing: true,
      //   ml_train_status: "running",
      //   ml_training_started_timestamp:admin.database.ServerValue.TIMESTAMP
      // });
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

function callTrain(id,retrain){
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
}








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