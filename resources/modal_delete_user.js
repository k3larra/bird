import {getDatabase, deleteUserAndProjects, get, ref, isUserAdmin} from "../firebase-module.js";
export function modal_delete_users() {
    fetch('./resources/modal_delete_user.html')
      .then(response => response.text())
    .then(html => {
        const navBarElement = document.getElementById("nav-bar");
        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = html;
        navBarElement.appendChild(modalContainer);
        var myModalEl = document.getElementById('myModal_delete_users');
        //console.log("myModalEl",myModalEl);
        myModalEl.addEventListener('shown.bs.modal', async function () {
            console.log(' delete users is shown');
            const isAdmin = await isUserAdmin();
            if (isAdmin){
                listUsersForDelete();
            }
        });
    });
}


  function listUsersForDelete() {
    console.log("listUsersForDelete");
    var listdiv = document.getElementById("delete_users_list");
    while (listdiv.hasChildNodes()) {
        listdiv.removeChild(listdiv.firstChild);
    }
    const db = getDatabase();
    const usersRef = ref(db, "users/");
    get(usersRef).then((snapshot) => {
        console.log("HEPP");
        if (snapshot.exists()) {
            var data = snapshot.val();
            console.log("data",data);
            var keys = Object.keys(data);
            for (var i = 0; i < keys.length; i++) {
                console.log("data[keys[i]].name",data[keys[i]].name);
                if(data[keys[i]].role !== "admin"){ //don't show admin users
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
                    button.innerHTML = "View user info";
                    button.setAttribute("id", k);
                    button.addEventListener("click", show_user_data);
                    div.appendChild(button);
                    button = document.createElement("button");
                    button.type = "button";
                    button.classList.add("btn", "btn-secondary", "btn-sm");
                    button.innerHTML = "Delete";
                    button.setAttribute("id", k);
                    //button.addEventListener("click", delete_user);
                    button.addEventListener('click', function(event) {
                        var result = confirm("Do you really want to delete this user?");
                        if (result) {
                            // User confirmed, delete the user
                            console.log("delete user", this.id);
                            delete_user(event);
                        }
                    });
                    div.appendChild(button);
                    listdiv.appendChild(div);
                }
            }
        } else {
            console.log("No data available");
        }
    }).catch((error) => {
        console.error(error);
    });
  }


function delete_user(e) {
    var id = e.target.id;
    console.log("id",id);
    var db = getDatabase();
    const usersRef = ref(db,"users/" + id);
    get(usersRef).then(async (snapshot) => {
        if (snapshot.exists()) {
            console.log("delete snapshot.val()",snapshot.val());
            deleteUserAndProjects(id);
            var div = e.target.parentNode;
            div.parentNode.removeChild(div);
        } else {
            console.log("No data available");
        } 
    }).catch((error) => {
        console.error(error);
    });
}

function show_user_data(e) {
    var id = e.target.id;
    //Find sorrounding div
    var div = e.target.parentNode;
    console.log("div",div);    
    console.log("id",id);
    var db = getDatabase();
    const usersRef = ref(db,"users/" + id);
    get(usersRef).then(async (snapshot) => {
        if (snapshot.exists()) {
            console.log("show snapshot.val()",snapshot.val());
            //Expand row and show this data
        } else {
            console.log("No data available");
        } 
    }).catch((error) => {
        console.error(error);
    });
}   