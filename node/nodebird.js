const http = require('node:http');
var admin = require("firebase-admin");
const axios = require('axios');
const fs = require('fs');
const hostname = '127.0.0.1';
const port = 3000;


let text = '{ "employees" : [' +
'{ "firstName":"John" , "lastName":"Doe" },' +
'{ "firstName":"Anna" , "lastName":"Smith" },' +
'{ "firstName":"Peter" , "lastName":"Jones" } ]}';
let json_stuff = JSON.parse(text);

var serviceAccount = require("./bird-ad15f-firebase-adminsdk-7jzl9-2c0d5612c3.json");

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


usersRef.once("value", function(snapshot) {
  console.log(snapshot.val());
  sendJsonToFlask(snapshot.val());
});

metaDataRef.on("child_added", function(snapshot) {
  console.log("child added",snapshot.val());
  //get the title
});

metaDataRef.on("child_changed", function(snapshot) {
  console.log("child changed",snapshot.val());
  if(snapshot.val().description=="PikaPika"){
    console.log(snapshot.val().training_set_ref);

    trainingsetRef.child(snapshot.val().training_set_ref).once("value", function(snapshot) {
      console.log(snapshot.val().description);
      console.log(snapshot.val().images[0]);
      //print all image_location in snapshot.val[images] where concept is not "void"
      /* snapshot.val().images.forEach(element => {
        if(element.concept !="void"){
          console.log(element.image_location);
        }
      }); */
      callTrain("id",true);
      sendJsonToFlask(snapshot.val())
    });
  }
});

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

function sendJsonToFlask(json_file){
  axios.post('http://127.0.0.1:5000/json_endpoint', json_file)
  .then((res) => {
    console.log(res.data)
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