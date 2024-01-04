import {getDatabase, set, get, remove, ref, isUserAdmin } from "../firebase-module.js";
export function approve_users() {
    fetch('./resources/modal_approve_users.html')
      .then(response => response.text())
    .then(html => {
        const myModal_approve_users = document.getElementById("nav-bar");
        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = html;
        myModal_approve_users.appendChild(modalContainer);
        var myModalEl = document.getElementById('myModal_approve_users');
        myModalEl.addEventListener('shown.bs.modal', function () {
            console.log(' approve users is shown');
            if (isUserAdmin()){
                listUsersForApproval();
            }
        });
    });
}


  function listUsersForApproval() {
    console.log("listUsersForApproval");
    var listdiv = document.getElementById("approve_users_list");
    while (listdiv.hasChildNodes()) {
        listdiv.removeChild(listdiv.firstChild);
    }
    const db = getDatabase();
    const requestMembershipRef = ref(db, "membershipRequests/");
    get(requestMembershipRef).then((snapshot) => {
        if (snapshot.exists()) {
            var data = snapshot.val();
            console.log("data",data);
            var keys = Object.keys(data);
            for (var i = 0; i < keys.length; i++) {
                var k = keys[i];
                var name = data[k].name;
                var email = data[k].email;
                var div = document.createElement("div");
                div.classList.add("d-flex", "justify-content-between", "mb-2");
                var span = document.createElement("span");
                span.innerHTML = name + ", " + email 
                div.appendChild(span);
                var button = document.createElement("button");
                button.type = "button";
                button.classList.add("btn", "btn-secondary", "btn-sm");
                button.innerHTML = "Approve";
                button.setAttribute("id", k);
                button.addEventListener("click", approve_user);
                div.appendChild(button);
                listdiv.appendChild(div);
            }
        } else {
            console.log("No data available");
        }
    }).catch((error) => {
        console.error(error);
    });
  }


function approve_user(e) {
    var id = e.target.id;
    console.log("id",id);
    var db = getDatabase();
    const membershipRef = ref(db,"membershipRequests/" + id);
    get(membershipRef).then((snapshot) => {
        if (snapshot.exists()) {
            var data = snapshot.val();
            data.approved =true;
            console.log("User to move",data);
            const userRef = ref(db, "users/"+ id);
            set(userRef, data);
            remove(membershipRef);
            listUsersForApproval();
        } else {
            console.log("No data available");
        } 
    }).catch((error) => {
        console.error(error);
    });
}
