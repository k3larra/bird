import { getMetadata, getBirds } from "../script.js";
import { auth, getDatabase, update_training_set } from "../firebase-module.js";
export function firebase_save() {
    const button = document.createElement('button');
    button.type = 'button';
    button.id = 'myInput_save';
    button.className = 'btn btn-outline-dark btn-sm me-1';
    button.setAttribute('data-bs-toggle', 'modal');
    button.setAttribute('data-bs-target', '#myModal_save');
    button.innerHTML = 'Save to server';
    button.addEventListener('click', function () {
        button.classList.add('btn-outline-dark');
        button.classList.remove('btn-success');
        button.textContent = "Save to server";
    });
    const buttonDiv = document.getElementById("button_div");
    buttonDiv.appendChild(button);
    fetch('./resources/modal_save.html')
        .then(response => response.text())
        .then(html => {
            const buttonDiv = document.getElementById("button_div");
            const modalContainer = document.createElement('div');
            modalContainer.innerHTML = html;
            buttonDiv.appendChild(modalContainer);
            //var myInput = document.getElementById('myInput_save');
            //myInput.innerHTML = "Save changes to server";
            const modalSubtitle = document.getElementById("modalSubtitle_save");
            modalSubtitle.innerHTML = "Version: " + getMetadata().version;
            const title = document.getElementById("modalTitle_save");
            console.log('getMetadata()', getMetadata());
            title.innerHTML = getMetadata().title;
            title.setAttribute("contenteditable", true); // make h5 editable
            title.addEventListener("click", function () {
                title.setAttribute("contenteditable", true);
            });
            title.addEventListener("blur", function () {
                title.setAttribute("contenteditable", false);
            });
            const description = document.getElementById("modalInput_save");
            description.innerHTML = getMetadata().description;
            description.setAttribute("contenteditable", true); // make h5 editable
            description.addEventListener("click", function () {
                description.setAttribute("contenteditable", true);
            });
            description.addEventListener("blur", function () {
                description.setAttribute("contenteditable", false);
            });
            document.getElementById("saveChanges_save").addEventListener("click", (event) => {
                event.preventDefault();
                const title = document.getElementById("modalTitle_save").innerHTML;
                const description = document.getElementById("modalInput_save").innerHTML;
                getMetadata().title = title;
                getMetadata().description = description;
                getBirds().title = title;
                getBirds().description = description;

                let v = parseInt(getBirds().version);
                getBirds().version = (v + 1).toString();
                getMetadata().version = (v + 1).toString();
                var authData = auth.currentUser;
                const db = getDatabase();
                if (authData) {
                    update_training_set(authData.uid, getMetadata(), getBirds())
                }
            });
        });
}
