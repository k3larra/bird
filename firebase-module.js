import { initializeApp } from "https://www.gstatic.com/firebasejs/10.3.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.3.0/firebase-analytics.js";
import { getDatabase, ref, set, child, push, update,onValue} from "https://www.gstatic.com/firebasejs/10.3.0/firebase-database.js";
import { getAuth, GoogleAuthProvider, signInWithPopup} from "https://www.gstatic.com/firebasejs/10.3.0/firebase-auth.js"; 
//import { getAuth, GoogleAuthProvider, signInWithPopup} from "https://www.gstatic.com/firebasejs/9.5.0/firebase-auth-compat.js"
import {loggedIn}   from "./script.js";
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