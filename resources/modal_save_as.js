import { getMetadata, getBirds } from "../script.js";
import { handleModalFocus } from "../script.js";
import { auth, getDatabase, save_new_training_set_to_databasebase, setAsDefaultTrainingSet} from "../firebase-module.js";

export function firebase_save_as() {
  const button = document.createElement('button');
  button.type = 'button';
  button.id = 'myInput_saveAs';
  button.className = 'btn btn-outline-dark btn-sm me-1';
  button.setAttribute('data-bs-toggle', 'modal');
  button.setAttribute('data-bs-target', '#myModal_saveAs');
  button.innerHTML = 'Save as new dataset';
  const buttonDiv = document.getElementById("button_div");
  buttonDiv.appendChild(button);
  //document.getElementById('button_div').appendChild(myInput);
  fetch('./resources/modal_save_as.html')
    .then(response => response.text())
    .then(html => {
      const buttonDiv = document.getElementById("button_div");
      const modalContainer = document.createElement('div');
      modalContainer.innerHTML = html;
      buttonDiv.appendChild(modalContainer);
      var myInput = document.getElementById('myInput_saveAs');
      document.getElementById('myModal_saveAs').addEventListener('shown.bs.modal', handleModalFocus);
      myInput.innerHTML = "Save as new dataset";
      const modalSubtitle = document.getElementById("modalSubtitle_saveAs");
      modalSubtitle.innerHTML = "Old version no: " + getMetadata().version;
      const title = document.getElementById("modalTitle_saveAs");
      title.innerHTML = getMetadata().title;
      title.setAttribute("contenteditable", true); // make h5 editable
      title.classList.add('p-2');
      title.style.border = '1px dotted black';
      title.addEventListener("click", function () {
        title.setAttribute("contenteditable", true);
      });
      title.addEventListener("blur", function () {
        title.setAttribute("contenteditable", false);
      });
      const description = document.getElementById("modalInput_saveAs");
      description.innerHTML = getMetadata().description;
      description.setAttribute("contenteditable", true); // make h5 editable
      description.classList.add('p-2');
      description.style.border = '1px dotted black';
      description.addEventListener("click", function () {
        description.setAttribute("contenteditable", true);
      });
      description.addEventListener("blur", function () {
        description.setAttribute("contenteditable", false);
      });
      document.getElementById("saveChanges_saveAs").addEventListener("click", (event) => {  
        event.preventDefault();
        const title = document.getElementById("modalTitle_saveAs").innerHTML;
        const description = document.getElementById("modalInput_saveAs").innerHTML;
        getBirds().title = title;
        getBirds().description = description;
        getBirds().version = 1;
        var authData = auth.currentUser;
        const db = getDatabase();
        const key = save_new_training_set_to_databasebase(authData.uid, getBirds());
        if (key) {
          setAsDefaultTrainingSet(authData.uid, key);
        }
      });
    });
}


