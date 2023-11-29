import { getMetadata } from "./script.js";
import { setTraining_parameters } from "./firebase-module.js";
import {auth} from "./firebase-module.js";

export function train_model() {
  const button = document.createElement("button");
  button.type = "button";
  button.id = "myInput_train";
  button.classList.add("btn", "btn-secondary", "btn-sm", "me-1");
  button.setAttribute("data-bs-toggle", "modal");
  button.setAttribute("data-bs-target", "#myModal_train");
  button.innerHTML = "Edit trains";
  const buttonDiv = document.getElementById("button_div");
  buttonDiv.appendChild(button);
  fetch('./resources/modal_train.html')
    .then(response => response.text())
    .then(html => {
      const buttonDiv = document.getElementById("button_div");
      const modalContainer = document.createElement('div');
      modalContainer.innerHTML = html;
      buttonDiv.appendChild(modalContainer);
      document.getElementById("saveChanges_train").addEventListener("click", handleTrainModelButton);

      // Add dropdown element to modal_train.html
      const dropdown = document.createElement("select");
      dropdown.id = "epochs";
      const values = [1, 2, 3, 4, 5, 10, 15, 20];
      values.forEach(value => {
        const option = document.createElement("option");
        option.value = value;
        option.text = value;
        dropdown.appendChild(option);
      });
      const dropdownContainer = document.getElementById("train_section");
      dropdownContainer.appendChild(dropdown);
    });

  //document.getElementById("image_data").appendChild(button);
}

function handleTrainModelButton(event) {
  event.preventDefault();
  getMetadata().ml_train =true;
  getMetadata().ml_model ="ResNet50";
  getMetadata().ml_epochs = document.getElementById("epochs").value;
  getMetadata().ml_training_started_timestamp =0;
  getMetadata().ml_training_ended_timestap = 0;
  getMetadata().ml_train_ongoing = false;
  getMetadata().ml_train_finished = false;
  getMetadata().ml_train_nbr = 0;
  getMetadata().uid = auth.currentUser.uid;
  /* getMetadata().training_started= unix_timestamp();
  getMetadata().epochs = document.getElementById("epochs").value;
  getMetadata().batch_size = document.getElementById("batch_size").value;
  getMetadata().learning_rate = document.getElementById("learning_rate").value;
  getMetadata().loss = document.getElementById("loss").value;
  getMetadata().optimizer = document.getElementById("optimizer").value;
  getMetadata().metrics = document.getElementById("metrics").value; */
  setTraining_parameters()
}
