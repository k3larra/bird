import { initializeApp } from "https://www.gstatic.com/firebasejs/10.3.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.3.0/firebase-analytics.js";
import { getDatabase, ref, set, get, child, push, update, onValue, remove } from "https://www.gstatic.com/firebasejs/10.3.0/firebase-database.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.3.0/firebase-auth.js";
import { serverTimestamp } from "https://www.gstatic.com/firebasejs/10.3.0/firebase-firestore.js";
//import { getAuth, GoogleAuthProvider, signInWithPopup} from "https://www.gstatic.com/firebasejs/9.5.0/firebase-auth-compat.js"
import { loggedIn, build_image_containers, select_training_data, getMetadata, setMetadata } from "./script.js";
import { getBirds, setBirds } from './script.js';
import { approve_users } from "./resources/modal_approve_users.js";
import { modal_login_email } from "./resources/modal_login_email.js";
import { modal_delete_users } from "./resources/modal_delete_user.js";
//import { get } from "https://cdn.jsdelivr.net/npm/lodash@4.17.21/lodash.min.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optiona
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

export { getDatabase, ref, get, set, child, push, update, onValue, auth, remove };
// Initialize Firebase
const app = initializeApp(firebaseConfig);
//const analytics = getAnalytics(app);
const auth = getAuth();

//var user = auth.currentUser;
approve_users(); //Add the approve modal to the admin menu
modal_login_email(); //Add the login modal to menu
modal_delete_users(); //Add the delete user modal to menu

document.getElementById('signIn').addEventListener('click', _login);
document.getElementById('createEmptyProject').addEventListener('click', async function (event) {
  event.preventDefault();
  console.log("createEmptyProject");
  const json = await readLocalJasonAndReturn("birds.json");
  console.log("json", json.version);
  const projkey = create_project("kalleAnc", IMAGEFOLDER, json, true)
  console.log("projkey", projkey);
});

document.getElementById('deleteUser').addEventListener('click', async function (event) {
  event.preventDefault();
  console.log("Delete ");
  deleteUserAndProjects("dM6pljVwbzM0QJc6Eh9HstrfJF42");
});

document.getElementById('removeProject').addEventListener('click', function (event) {
  event.preventDefault();
  console.log("removeProject");
  deleteProject("-NpUD7phM_J36p_F1Y-m")
});

document.getElementById('testFunction').addEventListener('click', function (event) {
  event.preventDefault();
  console.log("Current project is: ", getCurrentProject());
});

//Constants
export const IMAGEFOLDER = 'ottenbyresized/';
export let currentproject = null;

await auth.onAuthStateChanged(function (user) {
  if (user) {
    _isMember(user)
  } else {
    console.log("Not logged in (onAuthStateChanged)");
    _setLoggedInVisibility(false, user, false);
  }
});

/* function createUsers(){ 
  console.log("In createUsers");
  const db = getDatabase();
  const usersRef = ref(db, "users/");
  const users = {
    "user1": {
      "role": "admin",
      "projects": ["project1","project2"],
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
      console.log(" isUserAdmin got data", data);
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

function createmembershipRequests() {
  console.log("In createMemRequestUsers");
  const db = getDatabase();
  const usersRef = ref(db, "membershipRequests/" + auth.currentUser.uid);
  var entrypoint = {
    role: "user",
    approved: false, //change to false if approvement is needed
    projects: [],
    name: auth.currentUser.displayName,
    email: auth.currentUser.email
  };
  console.log("entrypoint", entrypoint);
  set(usersRef, entrypoint);
}

async function _isMember(user) {
  console.log("In _isMember")
  const db = getDatabase();
  const usersRef = ref(db, "users/" + user.uid);
  //const usersRef = ref(db, "users/");
  console.log("usersRef", usersRef);
  console.log("_isMember user", user);
  onValue(usersRef, async (snapshot) => {
    // Your code logic here
    const data = snapshot.val();
    console.log("_isMember user", user);
    console.log("_isMember got data about user", data);
    if (data) {
      console.log("_isMember user", user);
      console.log("_isMember got data about user", data);
      if (!user.displayName) {
        console.log("user.displayName", user.displayName);
        user.displayName = data.name;
      }
      console.log("_isMember Logged in (onAuthStateChanged)", user.displayName);
      currentproject = await getCurrentProject();
      console.log("currentproject", currentproject);
      //currentproject = getCurrentProject();
      _setLoggedInVisibility(true, user, false);
      loggedIn(user);
    } else {
      createmembershipRequests();
      _setLoggedInVisibility(true, user, true);
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

async function _setLoggedInVisibility(loggedIn, user, awaitingApproval) {
  console.log("_setLoggedInVisibility")
  if (loggedIn) {
    if (!awaitingApproval) {  //Regular user
      console.log("setting loggedin visibility user")
      document.getElementById("signIn").innerHTML = "Sign Out: " + user.displayName;
      document.getElementById("not_logged_in").classList.add("collapse"); //hide the public div
      document.getElementById("logged_in").classList.remove("collapse");
      document.getElementById("training_data_menu").classList.remove("collapse");
      document.getElementById("alt_menu").classList.remove("collapse");
      const isAdmin = await isUserAdmin();
      if (isAdmin) {
        console.log("adding loggedin visibility admin")
        document.getElementById("admin_menu").classList.remove("disabled");
        document.getElementById("admin_menu").classList.remove("collapse");
      }
    } else {
      document.getElementById("signIn").innerHTML = "Awaiting approval for: " + user.displayName;
    }
  } else {
    console.log("setting loggedOUT visibility")
    document.getElementById("signIn").innerHTML = "Sign In";
    document.getElementById("not_logged_in").classList.remove("collapse");
    document.getElementById("logged_in").classList.add("collapse");
    document.getElementById("training_data_menu").classList.add("collapse")
    document.getElementById("admin_menu").classList.add("collapse")
    document.getElementById("alt_menu").classList.add("collapse");
  }
}



/*Misc database functions*/
export function save_new_training_set_to_databasebase(userID, jsonfile) {
  const db = getDatabase();
  //const currentproject = getCurrentProject();
  const key = push(child(ref(db), "/projects/" + currentproject + "/trainingsets"), jsonfile).key;
  if (key) {
    //metadata
    //console.log("METADATA jsonfile", jsonfile)
    console.log("metadata in save new...", getMetadata())
    /*  const meta = {
       "description": jsonfile.description,
       "version": jsonfile.version,
       "title": jsonfile.title,
       "default": false,
       "training_set_ref": key,
       "concept": getMetadata().concept
     }; */

    const meta = {
      "concept": getMetadata().concept,
      "default": false,
      "description": "Separating bird species images",
      "ml_base_model": "ResNet50",
      "ml_description": jsonfile.description,
      "ml_epoch": "",
      "ml_epochs": "",
      "ml_model": "",
      "ml_model_filename": "",
      "ml_pred_concept": "",
      "ml_predict": false,
      "ml_predict_erase": false,
      "ml_predict_finished_timestamp": 0,
      "ml_predict_nbr": "",
      "ml_predict_started_timestamp": 0,
      "ml_retrain_existing_model": false,
      "ml_train": false,
      "ml_train_finished": true,
      "ml_train_nbr": 0,
      "ml_train_ongoing": false,
      "ml_train_status": "",
      "ml_training_finished_timestamp": 0,
      "ml_training_started_timestamp": 0,
      "title": jsonfile.title,
      "training_set_ref": key,
      "uid": userID,
      "version": "0"
    };
    console.log("meta", meta);
    set(child(ref(db), "/projects/" + currentproject + "/metadata/" + key), meta);
    console.log('Data has been successfully saved and key is: ', key);
    //build_image_containers();
  } else {
    console.log('Something went wrong saving the data to the database.');
  }
  if (key) {
    return key;
  } else {
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
//here the redundant info in jsonfile title and version is not opdated!!!
export function update_training_set(userID, meta, jsonfile) {
  const db = getDatabase();
  //const currentproject = getCurrentProject();
  /* console.log("jsonfile.title", jsonfile.version, jsonfile.title, jsonfile.description); */
  update(child(ref(db), "/projects/" + currentproject + "/trainingsets/" + meta.training_set_ref), jsonfile)
    .then(() => {
      console.log('Data has been successfully updated in the database');
      /*console.log("Update path metadata"+"/projects/"+currentproject + "/metadata/" + meta.training_set_ref);
      console.log("meta",meta); */
      return update(child(ref(db), "/projects/" + currentproject + "/metadata/" + meta.training_set_ref), meta);
    })
    .then(() => {
      console.log('Metadata has been successfully updated in the database');
      //get_all_data_reload_page(userID);
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
/********************Ref to project here************************** */
export function get_all_data_reload_page(userID) {
  const db = getDatabase();
  //const currentproject = getCurrentProject();
  console.log("currentprojectr-", "/projects/" + currentproject + "/metadata");
  console.log("auth.currentUser.uid", auth.currentUser.uid);
  const trainingSetRef = ref(db, "/projects/" + currentproject + "/metadata");
  get(trainingSetRef).then((snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      console.log("get_all_data_reload_page got data", data);
      select_training_data(snapshot);
    } else {
      console.log("No data available");
    }
  }).catch((error) => {
    console.error(error);
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

/********************Ref to project here************************** */
/**A potential problem here is that if there are many persons on a project only one can be as default, could be conflicting..... */
export function setAsDefaultTrainingSet(key) {
  console.log("set_defaultProject", key);
  const db = getDatabase();
  //const currentproject = getCurrentProject();
  var authData = auth.currentUser;
  const trainingSetRef = ref(db, "/projects/" + currentproject + "/metadata/");
  onValue(trainingSetRef, (snapshot) => {
    snapshot.forEach((doc) => {
      if (doc.key == key) {
        const meta = {
          "description": doc.val().description,
          "version": doc.val().version,
          "title": doc.val().title,
          "default": true
        };
        update(child(ref(db), "/projects/" + currentproject + "/metadata/" + key), meta).then(() => {
          console.log('Metadata has been successfully updated in the database');
        }).catch((error) => {
          console.error('Error updating Metadata:', error);
        });
      } else {  //set all other to false
        const meta = {
          "description": doc.val().description,
          "version": doc.val().version,
          "title": doc.val().title,
          "default": false
        };
        update(child(ref(db), "/projects/" + currentproject + "/metadata/" + doc.key), meta).then(() => {
          console.log('Metadata has been successfully updated in the database');
        })
          .catch((error) => {
            console.error('Error updating Metadata:', error);
          });
      }

    });
    get_all_data_reload_page(authData.uid);
  }, {
    onlyOnce: true
  });
}


export function delete_training_set(userID, training_set_ref) {
  const db = getDatabase();
  //////////const trainingSetRef = ref(db, userID + "/trainingsets/" + training_set_ref);
  //const currentproject = getCurrentProject();
  const trainingSetRef = ref(db, "/projects/" + currentproject + "/trainingsets/" + training_set_ref);
  const metadataRef = ref(db, "/projects/" + currentproject + "/metadata/" + training_set_ref);
  update(metadataRef, { "ml_delete": true }).then(() => {
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
  get_all_data_reload_page(userID)
}


export function read_training_data(userID, training_set_ref) {
  const db = getDatabase();
  //////////const starCountRef = ref(db, userID + "/trainingsets/" + training_set_ref);
  //const currentproject = getCurrentProject();
  const starCountRef = ref(db, "/projects/" + currentproject + "/trainingsets/" + training_set_ref);
  onValue(starCountRef, (snapshot) => {
    const data = snapshot.val();
    setBirds(data);
    build_image_containers();
  }, {
    onlyOnce: true
  });

}

export function setTraining_parameters() {
  console.log("In SET Training getMetadata()", getMetadata());
  const db = getDatabase();
  //const currentproject = getCurrentProject();
  /////////const metadataRef = ref(db, auth.currentUser.uid + "/metadata/" + getMetadata().training_set_ref);
  const metadataRef = ref(db, "/projects/" + currentproject + "/metadata/" + getMetadata().training_set_ref);
  //getMetadata().ended= timestamp;
  update(metadataRef, getMetadata()).then(() => {
    console.log('Metadata has been successfully updated in the database');
    //get_training_sets_metadata(userID)
  })
    .catch((error) => {
      console.error('Error updating Metadata:', error);
    });
}

export function getTraining_parameters() {
  console.log("In getTraining_parameters");
  const db = getDatabase();
  //const currentproject = getCurrentProject();
  ////////////////const metadataRef = ref(db, auth.currentUser.uid + "/metadata/" + getMetadata().training_set_ref);
  const metadataRef = ref(db, "/projects/" + currentproject + "/metadata/" + getMetadata().training_set_ref);
  onValue(metadataRef, (snapshot) => {
    const data = snapshot.val();
    //console.log("got metaddata",data);
    setMetadata(data);
    return getMetadata();
  }, {
    onlyOnce: true
  });
}

/*Handling projects, a project is a collection of training sets
All projects has a common json file and shares an image repository.
Th JSON file has all paths to images.
projectmetadata contains paths to raw images and resized images*/
export function create_project(userID, resizedimageFolder, jsonfile, set_as_defaultProject) {
  console.log("In create_project");
  const db = getDatabase();
  //const projectRef = ref(db,"/projects/");
  const projectdata = {
    "access": [userID],
    proj_meta_data: {
      "resizedimagefolder": resizedimageFolder,
      "imagefolder": "voided",
      "description": "Bird data from Ottenby bird station",
      "training_set_ref": ""
    }
  };
  const projectKeyValue = push(child(ref(db), "/projects/"), projectdata).key;
  console.log("key", projectKeyValue);
  //trainin_set_ref is really the project key and should be renamed......IS CONFUSING
  set(ref(db, "/projects/" + projectKeyValue + "/proj_meta_data/training_set_ref"), projectKeyValue);
  const trainingsetdata = {
    "description": jsonfile.description,
    "version": jsonfile.version,
    "title": jsonfile.title,
    "images": jsonfile.images
  };
  const trainingsetKeyValue = push(child(ref(db), "/projects/" + projectKeyValue + "/trainingsets"), trainingsetdata).key;
  /*   const metadataOld = {
      "description": jsonfile.description,
      "version": jsonfile.version,
      "title": "VoidEED",
      "default":set_as_defaultProject,
      "training_set_ref": trainingsetKeyValue,
      "concept": []
    }; */
  const metadata = {
    "concept": [],
    "default": set_as_defaultProject,
    "description": jsonfile.description,
    "ml_base_model": "",
    "ml_description": "",
    "ml_epoch": "",
    "ml_epochs": "",
    "ml_model": "",
    "ml_model_filename": "",
    "ml_pred_concept": "",
    "ml_predict": false,
    "ml_predict_erase": false,
    "ml_predict_finished_timestamp": 0,
    "ml_predict_nbr": "",
    "ml_predict_started_timestamp": 0,
    "ml_retrain_existing_model": false,
    "ml_train": false,
    "ml_train_finished": true,
    "ml_train_nbr": 0,
    "ml_train_ongoing": false,
    "ml_train_status": "",
    "ml_training_finished_timestamp": 0,
    "ml_training_started_timestamp": 0,
    "title": jsonfile.title,
    "training_set_ref": trainingsetKeyValue,
    "uid": userID,
    "version": jsonfile.version
  };
  set(ref(db, "/projects/" + projectKeyValue + "/metadata/" + trainingsetKeyValue), metadata);
  console.log('projectKeyValue ', projectKeyValue);
  console.log('trainingsetKeyValue ', trainingsetKeyValue);
  console.log('metadata ', metadata);
  return { projectKey: projectKeyValue, trainingsetKey: trainingsetKeyValue };
}

function deleteProject(projectID) {
  console.log("In removeproject");
  const db = getDatabase();
  const projectRef = ref(db, "/projects/" + projectID);
  remove(projectRef)
    .then(() => {
      console.log('Node deleted successfully');
    })
    .catch((error) => {
      console.error('Failed to delete node: ', error);
    });
}

export function deleteUserAndProjects(userID) {
  console.log("In deleteUser");
  const db = getDatabase();
  const userRef = ref(db, "/users/" + userID);
  get(userRef).then((snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      console.log("deleteUserAndProjects got data", data);
      if (data.projects) {
        const projects = data.projects;
        const numProjects = Object.keys(projects).length; // Get the number of key-value pairs
        console.log("Number of projects:", numProjects);
        Object.entries(projects).forEach(([projectKeyIdkey, placeholderboolean]) => {
          // Here you can access the key and project values
          //the key carries the value and 
          console.log("removing", projectKeyIdkey);
          deleteProject(projectKeyIdkey);
        });
      }
      remove(userRef)
        .then(() => {
          console.log('Node deleted successfully');
        })
        .catch((error) => {
          console.error('Failed to delete node: ', error);
        });
    }
  });
  remove(userRef).then(() => {
    console.log('Node deleted successfully');
  }).catch((error) => {
    console.error('Failed to delete node: ', error);
  });
}

function findCurrentProject() {
  console.log("In findCurrentProject");
  const db = getDatabase();
  const current_project_id = ref(db, "/users/" + auth.currentUser.uid + "/current_project/");
  return new Promise((resolve, reject) => {
    onValue(current_project_id, (snapshot) => {
      const data = snapshot.val();
      console.log("got data findCurrentProject", data);
      resolve(data);
    }, {
      onlyOnce: true
    });
  });
}

async function getCurrentProject() {
  console.log("In getCurrentProject");
  try {
    const currentProject = await findCurrentProject();
    console.log("Current project is: ", currentProject);
    return currentProject;
  } catch (error) {
    console.error("Failed to get current project: ", error);
    return null;

  }
}

//call readLocalJasonAndReturn and wait for the json to return


export async function readLocalJasonAndReturn(filename) {
  try {
    const response = await fetch('ottenbyresized/' + filename);
    if (!response.ok) {
      throw new Error("HTTP error " + response.status);
    }
    const json = await response.json();
    console.log(json.description);
    return json;
  } catch (error) {
    console.log("An error occurred while fetching the JSON file.", error);
  }
}

/* export function readLocalJasonAndReturn(filename) {
  fetch('ottenbyresized/'+filename)
  .then(response => {
    if (!response.ok) {
      throw new Error("HTTP error " + response.status);
    }
    return response.json();
  })
  .then(json => {
    //console.log(json.version);
    console.log(json.description);
    //const db = getDatabase();
    //update(child(ref(db), "/projects/default/"), json);
    return json;
  })
  .catch(function() {
    console.log("An error occurred while fetching the JSON file.");
  });
} */


/*  const projectRef = ref(db, user.uid + "/projects/");
 const project = {
   "project1": {
     "imageFolder": imageFolder,
     "projectmetadata": "projectmetadata.json",
     "trainingsets": "trainingsets.json"
   }
 };
 set(projectRef, project); 
}*/

/* function add_user(projectID,userID){
  console.log("In add_user");
  const db = getDatabase();
  const projectRef = ref(db, userID + "/projects/" + projectID);
  const project = {
    "imageFolder": "ottenbyresized/",
    "projectmetadata": "projectmetadata.json",
    "trainingsets": "trainingsets.json"
  };
  set(projectRef, project);
}

//Set default project for user

function set_image_folder_resized(projectID,userID,imageFolder){
  console.log("In set_image_folder_resized");
  const db = getDatabase();
  const projectRef = ref(db, userID + "/projects/" + projectID);
  const project = {
    "imageFolder": imageFolder,
    "projectmetadata": "projectmetadata.json",
    "trainingsets": "trainingsets.json"
  };
  update(projectRef, project);
}

function set_image_folder_raw(projectID,userID,imageFolder){
  console.log("In set_image_folder_raw");
  const db = getDatabase();
  const projectRef = ref(db, userID + "/projects/" + projectID);
  const project = {
    "imageFolder": imageFolder,
    "projectmetadata": "projectmetadata.json",
    "trainingsets": "trainingsets.json"
  };
  update(projectRef, project);
} 

function set_project_title(projectID,title){
  console.log("In set_project_title");
  const db = getDatabase();
  const projectRef = ref(db, auth.currentUser.uid + "/projects/" + projectID);
  const project = {
    "title": title,
    "imageFolder": "ottenbyresized/",
    "projectmetadata": "projectmetadata.json",
    "trainingsets": "trainingsets.json"
  };
  update(projectRef, project);
}

function set_project_description(projectID,description){
  console.log("In set_project_description");
  const db = getDatabase();
  const projectRef = ref(db, auth.currentUser.uid + "/projects/" + projectID);
  const project = {
    "description": description,
    "imageFolder": "ottenbyresized/",
    "projectmetadata": "projectmetadata.json",
    "trainingsets": "trainingsets.json"
  };
  update(projectRef, project);
}
 */
