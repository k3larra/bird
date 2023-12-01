import { getMetadata } from "./script.js";
import { setTraining_parameters } from "./firebase-module.js";
import { auth } from "./firebase-module.js";

export function train_model() {
  const button = document.createElement("button");
  button.type = "button";
  button.id = "myInput_train";
  button.classList.add("btn", "btn-secondary", "btn-sm", "me-1");
  button.setAttribute("data-bs-toggle", "modal");
  button.setAttribute("data-bs-target", "#myModal_train");
  button.innerHTML = "Train model";
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
      const trainingTimeInMillis = getMetadata().ml_training_finished_timestamp - getMetadata().ml_training_started_timestamp;
      const trainingTimeInSeconds = Math.floor(trainingTimeInMillis / 1000);
      const minutes = Math.floor(trainingTimeInSeconds / 60);
      const seconds = trainingTimeInSeconds % 60;
      const trainingTime = `${minutes} minutes and ${seconds} seconds`;

      const lastTrainingTime = new Date(getMetadata().ml_training_finished_timestamp*1000).toLocaleString();
      document.getElementById("infoText").innerHTML = "Base model: " + getMetadata().ml_base_model+"</br>"
      + "Training nbr: " + getMetadata().ml_train_nbr+"</br>"
      + "Training started: " + new Date(getMetadata().ml_training_started_timestamp).toLocaleString()+"</br>"
      + "Training ended: " + new Date(getMetadata().ml_training_finished_timestamp).toLocaleString()+"</br>"+"</br>"
      + "Training ongoing: " + getMetadata().ml_train_ongoing+"</br>"
      + "Description: " + getMetadata().ml_description+"</br>"
      + "Last training was " + getMetadata().ml_epochs + " epochs and lasted for " + trainingTime+"</br>";
      // Add dropdown elements to modal_train.html
      const parameterList = document.getElementById("train_list");
      parameterList.style.listStyleType = "none";
      // Add radio button element to modal_train.html
      const ephocsListItem = document.createElement("li");
      const dropLabel = document.createElement("label");
      dropLabel.innerHTML = "Ephocs to train: &nbsp;";
      ephocsListItem.appendChild(dropLabel);
      const dropdown = document.createElement("select");
      dropdown.id = "epochs";
      const values = [1, 2, 3, 4, 5, 10, 15, 20];
      values.forEach(value => {
        const option = document.createElement("option");
        option.value = value;
        option.text = value;
        dropdown.appendChild(option);
      });
      ephocsListItem.appendChild(dropdown);
      ephocsListItem.style.width = "100%"; // Set the width to 100%
      ephocsListItem.style.marginTop = "10px"; // Add margin top
      parameterList.appendChild(ephocsListItem);

      const descriptionInput = document.createElement("textarea");
      descriptionInput.id = "description";
      if (getMetadata().ml_description && getMetadata().ml_description.trim() !== "") {
        descriptionInput.placeholder = getMetadata().ml_description;
      } else {
        descriptionInput.placeholder = "Description of this training";
      }
      descriptionInput.maxLength = 100;
      descriptionInput.rows = 5;
      descriptionInput.style.marginTop = "10px";
      descriptionInput.style.width = "100%"; // Set the width to 100%
      document.getElementById("train_section").appendChild(descriptionInput);

      const modelListItem = document.createElement("li");
      const modelLabel = document.createElement("label");
      modelLabel.innerHTML = "Model: &nbsp;";
      modelListItem.appendChild(modelLabel);
      const modelDropdown = document.createElement("select");
      modelDropdown.id = "model";
      const modelValues = ["ResNet50", "EfficientNet_V2_S", "Continue training"];

      modelValues.forEach(value => {
        const option = document.createElement("option");
        option.value = value;
        option.text = value;
        modelDropdown.appendChild(option);
      });

      if (getMetadata().ml_train_nbr > 0) {
        modelDropdown.value = "Continue training";
      }else{
        modelDropdown.value = "ResNet50";
        modelDropdown.removeChild(modelDropdown.lastChild);
      }

      modelListItem.appendChild(modelDropdown);
      modelListItem.style.width = "100%"; // Set the width to 100%
      modelListItem.style.marginTop = "10px"; // Add margin top
      parameterList.appendChild(modelListItem);
      
    });
    
  //document.getElementById("image_data").appendChild(button);
}

function handleTrainModelButton(event) {
  event.preventDefault();
  getMetadata().ml_model = document.getElementById("model").value; // Set the value to the selected value in modelDropdown
  if (getMetadata().ml_model !== "Continue training") {
    getMetadata().ml_base_model= getMetadata().ml_model;
    getMetadata().ml_retrain_existing_model = true;
  }else{
    getMetadata().ml_retrain_existing_model = false;
    getMetadata().ml_train_nbr = 0;
  }
  getMetadata().ml_training_started_timestamp = 0;
  getMetadata().ml_training_finished_timestamp = 0;
  getMetadata().ml_train_ongoing = false;
  getMetadata().ml_train_finished = false;
  getMetadata().ml_description = document.getElementById("description").value;
  getMetadata().ml_train_nbr = getMetadata().ml_train_nbr + 1;
  getMetadata().uid = auth.currentUser.uid;
  getMetadata().ml_epochs = document.getElementById("epochs").value;

  console.log("getMetadata()", getMetadata());
  /* getMetadata().training_started= unix_timestamp();
  getMetadata().epochs = document.getElementById("epochs").value;
  getMetadata().batch_size = document.getElementById("batch_size").value;
  getMetadata().learning_rate = document.getElementById("learning_rate").value;
  getMetadata().loss = document.getElementById("loss").value;
  getMetadata().optimizer = document.getElementById("optimizer").value;
  getMetadata().metrics = document.getElementById("metrics").value; */
  //setTraining_parameters();
}
