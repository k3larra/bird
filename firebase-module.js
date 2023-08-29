import { initializeApp } from "https://www.gstatic.com/firebasejs/10.3.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.3.0/firebase-analytics.js";
import { getDatabase, ref, set} from "https://www.gstatic.com/firebasejs/10.3.0/firebase-database.js";
import { getAuth, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup} from "https://www.gstatic.com/firebasejs/10.3.0/firebase-auth.js";      

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
const database = getDatabase(app);
const auth = getAuth();
//Test
function writeUserData(userId, name, email, imageUrl) {
    const db = getDatabase();
    set(ref(db, 'users/' + userId), {
      username: name,
      email: email,
      profile_picture : imageUrl
    });
  }

/* createUserWithEmailAndPassword(auth, "k3larra@hotmail.com", "tjohej")
.then((userCredential) => {
    // Signed in 
    const user = userCredential.user;
    // ...
})
.catch((error) => {
    const errorCode = error.code;
    const errorMessage = error.message;
    // ..
}); */
writeUserData("334","ARS","email@a.se","a.b.se")
//createUserWithEmailAndPassword(auth, "k3larra@hotmail.com", "tjohej")
console.log(auth.currentUser)
// Using a popup.
const provider = new GoogleAuthProvider();
document.getElementById('signIn').addEventListener('click', login);
function login(e) {
    e.preventDefault();
    signInWithPopup(auth,provider).then(function(result) {
    // This gives you a Google Access Token.
    var token = result.credential.accessToken;
    // The signed-in user info.
    var user = result.user;
    }).catch((error)=>{
        console.log(error);
    });
}
/* login()
function login() {
    //e.preventDefault();
    var authData = auth.currentUser;
    if (!authData) { //Sign in
      var provider = new GoogleAuthProvider();
      signInWithPopup(provider);
    } else {
      console.log("Signing out");
      document.getElementById("signIn").innerHTML = "Sign In";
      firebase.auth().signOut();
      document.getElementById("not-logged-in").style.display = "block";
      document.getElementById("informed-concent").style.display = "block";
      document.getElementById("loggedIn").style.display = "none";
      document.getElementById("studySelect").style.visibility = "hidden";
      location.reload();
    }
} */
export {app,database,auth};