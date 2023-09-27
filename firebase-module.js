import { initializeApp } from "https://www.gstatic.com/firebasejs/10.3.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.3.0/firebase-analytics.js";
import { getDatabase, ref, set, child, push, update,onValue} from "https://www.gstatic.com/firebasejs/10.3.0/firebase-database.js";
import { getAuth, GoogleAuthProvider, signInWithPopup} from "https://www.gstatic.com/firebasejs/10.3.0/firebase-auth.js"; 
//import { getAuth, GoogleAuthProvider, signInWithPopup} from "https://www.gstatic.com/firebasejs/9.5.0/firebase-auth-compat.js"
import {loggedIn, build_image_containers, select_training_data}   from "./script.js";
import { getBirds, setBirds } from './script.js';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA6FA3pnEQjidO0St7x4WBmoJegxihv5yU",
  authDomain: "bird-ad15f.firebaseapp.com",
  projectId: "bird-ad15f",
  storageBucket: "bird-ad15f.appspot.com",
  messagingSenderId: "314606902454",
  appId: "1:314606902454:web:9dc707088bc04c8867da17",
  measurementId: "G-8JP0B12H14",
  databaseURL: "https://bird-ad15f-default-rtdb.europe-west1.firebasedatabase.app/"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
//const database = getDatabase(app);
const auth = getAuth();

var user = auth.currentUser;

document.getElementById('signIn').addEventListener('click', _login);
 await auth.onAuthStateChanged(function(user) {
  console.log("user",user)
  if (user) {
    console.log("Logged in (onAuthStateChanged)",user.displayName);
    _setLoggedInVisibility(true,user);
    loggedIn(user);
  } else {
    console.log("Not logged in (onAuthStateChanged)");
    _setLoggedInVisibility(false,user);
  }
});

function _login(e) {
  e.preventDefault();
  var authData = auth.currentUser;
  console.log(authData)
  if (!authData) { //Sign in
    console.log("Signing in");
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth,provider).then(function(result) {
      var user = result.user;
      console.log("userInfo",user.displayName,user.email,user.uid);
      //_setLoggedInVisibility(true,user)
    }).catch((error)=>{
        console.log(error);
    });
  } else {
    console.log("Signing out");
    auth.signOut();
    //_setLoggedInVisibility(false,user)
  }
}

function _setLoggedInVisibility(loggedIn,user){
  console.log("_setLoggedInVisibility")
  if (loggedIn) {
    console.log("setting loggedin visibility" )
    document.getElementById("signIn").innerHTML = "Sign Out: "+user.displayName;
    //document.getElementById("not_logged_in").classList.remove=("_visible");
    //document.getElementById("not_logged_in").classList.add=("_collapse");
    document.getElementById("not_logged_in").style.visibility = "collapse";
    document.getElementById("image_data").style.display = "block";
    //document.getElementById("logged_in").classList.remove("_collapse");
    //document.getElementById("logged_in").classList.add("_visible");
    document.getElementById("logged_in").style.visibility = "visible";
    document.getElementById("admin_menu").classList.remove("disabled")
  }else{
    console.log("setting loggedOUT visibility" )
    document.getElementById("signIn").innerHTML = "Sign In";
    document.getElementById("image_data").style.display = "none";
    //document.getElementById("not_logged_in").classList.remove=("_collapse");
    //document.getElementById("not_logged_in").classList.add=("_visible");
    document.getElementById("not_logged_in").style.visibility = "visible";
    // document.getElementById("logged_in").classList.remove("_visible");
    // document.getElementById("logged_in").classList.add("_collapse");
    document.getElementById("logged_in").style.visibility = "collapse";
    document.getElementById("admin_menu").classList.add("disabled")
  }

} 

export {getDatabase, ref, set, child, push, update,user,onValue,auth};

/*Misc database functions*/
export function save_new_training_set_to_databasebase(userID, jsonfile) {
  const db = getDatabase();
  const key = push(child(ref(db), userID + "/trainingsets"), jsonfile).key;
  if (key) {
    //metadata
    const meta = {
      "description": jsonfile.description,
      "version": jsonfile.version,
      "title": jsonfile.title,
      "default": false
    };
    set(child(ref(db), userID + "/metadata/"+key), meta);
    console.log('Data has been successfully saved and key is: ', key);
    build_image_containers();
  } else {
    console.log('Something went wrong saving the data to the database.');
  }
  if (key) {
    return key;
  }else{
    return false;
  }
}

export function update_training_set(userID, training_set_ref, jsonfile) {
  const db = getDatabase();
  // let v = parseInt(jsonfile.version);
  // jsonfile.version = (v + 1).toString();
  // console.log("version", jsonfile.version)
  update(child(ref(db), userID + "/trainingsets/" + training_set_ref), jsonfile).then(() => {
    console.log('Data has been successfully updated in the database');
    build_image_containers();
  })
    .catch((error) => {
      console.error('Error updating data:', error);
    });
  const meta = {
    "description": jsonfile.description,
    "version": jsonfile.version,
    "title": jsonfile.title
  };
  update(child(ref(db), userID + "/metadata/" + training_set_ref), meta).then(() => {
    console.log('Metadata has been successfully updated in the database');
    get_training_sets_metadata(userID)
    //build_image_containers();
  })
    .catch((error) => {
      console.error('Error updating Metadata:', error);
    });
}

//create a function that collects a list of trainingset from firebase
//this is where all the training sets are stored and can be selected from
/**
 * Retrieves training sets metadata for a given user ID from Firebase Realtime Database.
 * @param {string} userID - The ID of the user whose training sets metadata is to be retrieved.
 */
export function get_training_sets_metadata(userID) {
  const db = getDatabase();
  const trainingSetRef = ref(db, userID + "/metadata");
  onValue(trainingSetRef, (snapshot) => {
    select_training_data(snapshot);
    // snapshot.forEach((doc) => {
    //   const description = doc.val().description;
    //   console.log("Key: ",doc.key)
    //   console.log("TITLE: ",doc.val().title)
    //   console.log("description: ", description);
    //   console.log("versrion: ",doc.val().version)
    // });

    //const data = snapshot.val();
    //console.log(data);
    //birds=data;
    //build_image_containers();
  }, {
    onlyOnce: true
  });
}
export function downloadJson(birds) {
  //var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(birds));
  var dataStr = JSON.stringify(birds);
  const blob = new Blob([dataStr], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = "try.json";
  a.click();
  URL.revokeObjectURL(url);
}


export function setDefaultProject(key) {
  console.log("set_defaultProject", key );
  const db = getDatabase();
  var authData = auth.currentUser;
  const trainingSetRef = ref(db, authData.uid + "/metadata");
  onValue(trainingSetRef, (snapshot) => {
    snapshot.forEach((doc) => {
      if (doc.key == key) {
        const meta = {
          "description": doc.val().description,
          "version": doc.val().version,
          "title": doc.val().title,
          "default": true
        };
        update(child(ref(db), authData.uid + "/metadata/" + key), meta).then(() => {
          console.log('Metadata has been successfully updated in the database');
          get_training_sets_metadata(authData.uid)
          //build_image_containers();
        })
          .catch((error) => {
            console.error('Error updating Metadata:', error);
          });
      } else {  //set all other to false
        const meta = {
          "description": doc.val().description,
          "version": doc.val().version,
          "title": doc.val().title,
          "default": false
        };
        update(child(ref(db), authData.uid + "/metadata/" + doc.key), meta).then(() => {
          console.log('Metadata has been successfully updated in the database');
          get_training_sets_metadata(authData.uid)
          //build_image_containers();
        })
          .catch((error) => {
            console.error('Error updating Metadata:', error);
          });
      }
      
    });
    get_training_sets_metadata(authData.uid);
    //const data = snapshot.val();
    //console.log(data);
    //birds=data;
    //build_image_containers();
  }, {
    onlyOnce: true
  });
}

export function read_training_data(userID, training_set_ref) {
  const db = getDatabase();
  const starCountRef = ref(db, userID + "/trainingsets/" + training_set_ref);
  onValue(starCountRef, (snapshot) => {
    const data = snapshot.val();
    setBirds(data);
    build_image_containers();
  }, {
    onlyOnce: true
  });

}
// 


