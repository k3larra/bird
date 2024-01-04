import { initializeApp } from "https://www.gstatic.com/firebasejs/10.3.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.3.0/firebase-analytics.js";
import { getDatabase, ref, set, get, child, push, update,onValue, remove} from "https://www.gstatic.com/firebasejs/10.3.0/firebase-database.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword} from "https://www.gstatic.com/firebasejs/10.3.0/firebase-auth.js"; 
import { serverTimestamp } from "https://www.gstatic.com/firebasejs/10.3.0/firebase-firestore.js";
//import { getAuth, GoogleAuthProvider, signInWithPopup} from "https://www.gstatic.com/firebasejs/9.5.0/firebase-auth-compat.js"
import {loggedIn, build_image_containers, select_training_data, getMetadata, setMetadata}   from "./script.js";
import { getBirds, setBirds } from './script.js';
import { approve_users } from "./resources/modal_approve_users.js";
import { modal_login } from "./resources/modal_login_email.js";
//import { get } from "https://cdn.jsdelivr.net/npm/lodash@4.17.21/lodash.min.js";
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

export {getDatabase, ref, get, set, child, push, update,user,onValue,auth,remove};
// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
//const database = getDatabase(app);
const auth = getAuth();

var user = auth.currentUser;
approve_users(); //Add the approve modal to the admin menu
modal_login(); //Add the login modal to menu
document.getElementById('signIn').addEventListener('click', _login);

await auth.onAuthStateChanged(function(user) {
  if (user) {
    _isMember(user)
  } else {
    console.log("Not logged in (onAuthStateChanged)");
    _setLoggedInVisibility(false,user,false);
  }
});

/* function createUsers(){ 
  console.log("In createUsers");
  const db = getDatabase();
  const usersRef = ref(db, "users/");
  const users = {
    "user1": {
      "role": "admin",
      "projects": ["project1"],
      "approved": true,
      "name": "admin",
      "email": "l@a.se"
    },
    "user2": {
      "role": "user",
      "projects": ["project1"],
      "approved": true,
      "name": "user",
      "email": "l@b.se"
    }
  };
  set(usersRef, users);
}  */

export function isUserAdmin() {
  return new Promise((resolve, reject) => {
    console.log("In isUserAdmin");
    const db = getDatabase();
    const usersRef = ref(db, "users/" + auth.currentUser.uid);
    onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      console.log("got data", data);
      if (data.role == "admin") {
        console.log("User is admin");
        resolve(true);
      } else {
        console.log("User is not admin");
        resolve(false);
      }
    }, {
      onlyOnce: true
    }, (error) => {
      console.log("Error in onValue:", error);
      reject(error);
    });
  });
}

function createmembershipRequests(){ 
  console.log("In createMemRequestUsers");
  const db = getDatabase();
  const usersRef = ref(db, "membershipRequests/"+ auth.currentUser.uid);
  var entrypoint = {
    role: "user",
    approved: false, //change to false if approvement is needed
    projects: ["project1"],
    name: auth.currentUser.displayName,
    email: auth.currentUser.email
  };
  console.log("entrypoint",entrypoint);
  set(usersRef, entrypoint);
}

function _isMember(user){
  const db = getDatabase();
  const usersRef = ref(db, "users/" + user.uid);
  //const usersRef = ref(db, "users/");
  console.log(usersRef,"usersRef")
  onValue(usersRef, (snapshot) => {
    // Your code logic here
    const data = snapshot.val();
    console.log("got data",data);
    if (data){
      console.log("Logged in (onAuthStateChanged)",user.displayName);
      _setLoggedInVisibility(true,user,false);
      loggedIn(user);
    }else{
      createmembershipRequests();
      _setLoggedInVisibility(true,user,true);
    }
  }, {
    onlyOnce: true
  }, (error) => {
    console.log("Error in onValue:", error);
  });
    
}

export function _login(e, email, password) {
  e.preventDefault();
  var authData = auth.currentUser;
  console.log(authData)
  if (!authData) { //Sign in
    console.log("Signing in");
    if (email && password) {
      // Sign in with email and password
      signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
          var user = userCredential.user;
          user.displayName = "John Doe"; // Set the displayName property
          console.log("userInfo", user.displayName, user.email, user.uid);
        })
        .catch((error) => {
          console.log(error);
        });
    } else {
      // Sign in with Google
      const provider = new GoogleAuthProvider();
      signInWithPopup(auth, provider)
        .then((result) => {
          var user = result.user;
          console.log("userInfo", user.displayName, user.email, user.uid);
        })
        .catch((error) => {
          console.log(error);
        });
    }
  } else {
    console.log("Signing out");
    auth.signOut();
  }
}

async function _setLoggedInVisibility(loggedIn,user,awaitingApproval){
  console.log("_setLoggedInVisibility")
  if (loggedIn) { 
    if(!awaitingApproval){  //Regular user
      console.log("setting loggedin visibility" )
      document.getElementById("signIn").innerHTML = "Sign Out: "+user.displayName;
      document.getElementById("not_logged_in").classList.add("collapse"); //hide the public div
      document.getElementById("logged_in").classList.remove("collapse");
      document.getElementById("training_data_menu").classList.remove("collapse");
      const isAdmin = await isUserAdmin();
      if (isAdmin) {
        document.getElementById("admin_menu").classList.remove("disabled");
        document.getElementById("admin_menu").classList.remove("collapse");
      } 
    }else{
      document.getElementById("signIn").innerHTML = "Awaiting approval for: "+user.displayName;
    }
  }else{
    console.log("setting loggedOUT visibility" )
    document.getElementById("signIn").innerHTML = "Sign In";
    document.getElementById("not_logged_in").classList.remove("collapse");
    document.getElementById("logged_in").classList.add("collapse");
    document.getElementById("training_data_menu").classList.add("collapse")
    document.getElementById("admin_menu").classList.add("collapse")
  }
} 



/*Misc database functions*/
export function save_new_training_set_to_databasebase(userID, jsonfile) {
  const db = getDatabase();
  const key = push(child(ref(db), userID + "/trainingsets"), jsonfile).key;
  if (key) {
    //metadata
    //console.log("METADATA jsonfile", jsonfile)
    const meta = {
      "description": jsonfile.description,
      "version": jsonfile.version,
      "title": jsonfile.title,
      "default": false,
      "training_set_ref": key,
      "concept": getMetadata().concept
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

/**
 * Updates the training set data and metadata in the database.
 * 
 * @param {string} userID - The ID of the user.
 * @param {object} meta - The metadata object.
 * @param {object} jsonfile - The JSON file containing the training set data.
 * @returns {void}
 */
export function update_training_set(userID, meta, jsonfile) {
  const db = getDatabase();
  
  update(child(ref(db), userID + "/trainingsets/" + meta.training_set_ref), jsonfile)
    .then(() => {
      console.log('Data has been successfully updated in the database');
      return update(child(ref(db), userID + "/metadata/" + meta.training_set_ref), meta);
    })
    .then(() => {
      console.log('Metadata has been successfully updated in the database');
      get_training_sets_metadata(userID);
    })
    .catch((error) => {
      console.error('Error updating data:', error);
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
  //try
  /* var authData = auth.currentUser;
  delete_training_set(authData.key, "-NfLoDusAbfTn8qV8mT8") */
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
        })
          .catch((error) => {
            console.error('Error updating Metadata:', error);
          });
      }
      
    });
    get_training_sets_metadata(authData.uid);
  }, {
    onlyOnce: true
  });
}

export function delete_training_set(userID, training_set_ref) {
  const db = getDatabase();
  const trainingSetRef = ref(db, userID + "/trainingsets/" + training_set_ref);
  const metadataRef = ref(db, userID + "/metadata/" + training_set_ref);
  const ml_delete = { "ml_delete": true };
  update(metadataRef,{ "ml_delete": true } ).then(() => {
    console.log('Delete added to metadata');
    //get_training_sets_metadata(userID)
  });
  set(trainingSetRef, null).then(() => {
    console.log('Data has been successfully deleted from the database');
  })
    .catch((error) => {
      console.error('Error deleting data:', error);
    });
  set(metadataRef, null).then(() => {
    console.log('Metadata has been successfully deleted from the database');
    //get_training_sets_metadata(userID)
  })
    .catch((error) => {
      console.error('Error deleting Metadata:', error);
    });
  get_training_sets_metadata(userID)
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

export function setTraining_parameters(){
  console.log("In SET Training getMetadata()",getMetadata());
  const db = getDatabase();
  const metadataRef = ref(db, auth.currentUser.uid + "/metadata/" + getMetadata().training_set_ref);
  //getMetadata().ended= timestamp;
    update(metadataRef, getMetadata()).then(() => {
      console.log('Metadata has been successfully updated in the database');
      //get_training_sets_metadata(userID)
    })
      .catch((error) => {
        console.error('Error updating Metadata:', error);
      });
}

export function getTraining_parameters(){
  console.log("In getTraining_parameters");
  const db = getDatabase();
  const metadataRef = ref(db, auth.currentUser.uid + "/metadata/" + getMetadata().training_set_ref);
  onValue(metadataRef, (snapshot) => {
    const data = snapshot.val();
    console.log("got metaddata",data);
    setMetadata(data);
    return getMetadata();
  }, {
    onlyOnce: true
  });
} 




