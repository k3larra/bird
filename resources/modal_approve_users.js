import {getDatabase, set, get, remove, ref, isUserAdmin,IMAGEFOLDER, readLocalJasonAndReturn,create_project } from "../firebase-module.js";
export function approve_users() {
    fetch('./resources/modal_approve_users.html')
      .then(response => response.text())
    .then(html => {
        const myModal_approve_users = document.getElementById("nav-bar");
        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = html;
        myModal_approve_users.appendChild(modalContainer);
        var myModalEl = document.getElementById('myModal_approve_users');
        myModalEl.addEventListener('shown.bs.modal', async function () {
            console.log(' approve users is shown');
            const isAdmin = await isUserAdmin();
            if (isAdmin){
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
    get(membershipRef).then(async (snapshot) => {
        if (snapshot.exists()) {
            //Also create default project here and add to the user
            var userData = snapshot.val();
            const jsonfile = await readLocalJasonAndReturn("birds.json");
            const keys = create_project(id,IMAGEFOLDER,jsonfile,true);
            console.log("keys.projectKey", keys.projectKey);
            console.log ("keys.trainingsetKey", keys.trainingsetKey);
            userData.current_project = keys.projectKey;
            const keyToFirstProject = keys.projectKey;
            userData.projects = {
                [keyToFirstProject]: true
            };
            
            userData.approved =true;
            console.log("User to move",userData);
            const userRef = ref(db, "users/"+ id);
            set(userRef, userData).then(() => {
                /* const jsonfile = await readLocalJasonAndReturn("jsonfile");
                const keys = create_project(id,IMAGEFOLDER,jsonfile);
                console.log("keys.projectKey", keys.trainingsetKey);
                console.log ("keys.trainingsetKey", keys.trainingsetKey); */
                remove(membershipRef);
                listUsersForApproval();
            }).catch((error) => {
                console.error('Error creating project:', error);
            });
            //listUsersForApproval();
            
        } else {
            console.log("No data available");
        } 
    }).catch((error) => {
        console.error(error);
    });
}
