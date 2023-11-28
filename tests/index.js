document.getElementById('signIn').addEventListener('click', login);
/*   firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
      console.log("Logged in");
      console.log(user.displayName,user.email,user.uid)
    } else {
      console.log("Not logged in");
    }
  }); */

  function login(e) {
    e.preventDefault();
    var authData = firebase.auth().currentUser;
    if (!authData) { //Sign in
      var provider = new firebase.auth.GoogleAuthProvider();
      firebase.auth().signInWithPopup(provider).then(function(result) {
        // This gives you a Google Access Token.
        var token = result.credential.accessToken;
        // The signed-in user info.
        var user = result.user;
        console.log(user.displayName,user.email,user.uid)
        }).catch((error)=>{
            console.log(error);
        }); ;
    } else {
      console.log("Signing out");
    }
  }