import { getMetadata } from "./script.js";
import { setTraining_parameters, getTraining_parameters } from "./firebase-module.js";
import { auth ,getDatabase,ref,onValue} from "./firebase-module.js";
import { debug } from "./script.js";
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
      //getTraining_parameters();
      console.log("getMetadata()", getMetadata());
      const buttonDiv = document.getElementById("button_div");
      const modalContainer = document.createElement('div');
      modalContainer.innerHTML = html;
      buttonDiv.appendChild(modalContainer);
      document.getElementById("refresh_training_modal").addEventListener("click", refreshContent);
      document.getElementById("saveChanges_train").addEventListener("click", handleTrainModelButton);
      refreshContent();
    });

  //document.getElementById("image_data").appendChild(button);
}

function handleTrainModelButton(event) {
  event.preventDefault();
  getMetadata().ml_model = document.getElementById("model").value; // Set the value to the selected value in modelDropdown
  if (getMetadata().ml_model !== "Continue training") {
    getMetadata().ml_base_model = getMetadata().ml_model;
    getMetadata().ml_retrain_existing_model = false;
    getMetadata().ml_train_nbr = 0;
  } else {
    getMetadata().ml_retrain_existing_model = true;
  }
  getMetadata().ml_training_started_timestamp = 0;
  getMetadata().ml_training_finished_timestamp = 0;
  getMetadata().ml_train_ongoing = false;
  getMetadata().ml_train_finished = false;
  const descriptionInput = document.getElementById("description");
  const descriptionText = descriptionInput.value;
  console.log("descriptionText", descriptionText);
  getMetadata().ml_description = descriptionText;
  getMetadata().ml_train_nbr = getMetadata().ml_train_nbr + 1;
  getMetadata().uid = auth.currentUser.uid;
  getMetadata().ml_epochs = document.getElementById("epochs").value;
  getMetadata().ml_train = true;
  getMetadata().ml_train_status = "Send to training";
  /* getMetadata().training_started= unix_timestamp();
  getMetadata().epochs = document.getElementById("epochs").value;
  getMetadata().batch_size = document.getElementById("batch_size").value;
  getMetadata().learning_rate = document.getElementById("learning_rate").value;
  getMetadata().loss = document.getElementById("loss").value;
  getMetadata().optimizer = document.getElementById("optimizer").value;
  getMetadata().metrics = document.getElementById("metrics").value; */
  setTraining_parameters();
  trainingOngoing();
}

function refreshContent() {
  async function waitForGetTrainingParameters() {
    await getTraining_parameters();
    // Your code that depends on the completion of getTraining_parameters
    const trainingTimeInMillis = getMetadata().ml_training_finished_timestamp - getMetadata().ml_training_started_timestamp;
    const trainingTimeInSeconds = Math.floor(trainingTimeInMillis / 1000);
    const minutes = Math.floor(trainingTimeInSeconds / 60);
    const seconds = trainingTimeInSeconds % 60;
    let trainingTime = `${minutes} minutes and ${seconds} seconds`;
    if (getMetadata().ml_train_ongoing) { trainingTime = "---working on it---" }
    let startedTrainingTime = new Date(getMetadata().ml_training_started_timestamp).toLocaleString();
    if (getMetadata().ml_training_started_timestamp <= 0) { startedTrainingTime = "Not started yet (or error)" }
    let finishedTrainingTime = new Date(getMetadata().ml_training_finished_timestamp).toLocaleString();
    if (getMetadata().ml_training_finished_timestamp <= 0) { finishedTrainingTime = "Not finished yet (or error)" }

    //const trainContent = document.getElementById("train_content");
    const trainContent = document.getElementById("train_section");
    while (trainContent.firstChild) {
      trainContent.removeChild(trainContent.firstChild);
    }
    const trainContentText = document.createElement("p");
    trainContent.appendChild(trainContentText);
    trainContentText.innerHTML = "<b> <i>Title:</i> " + getMetadata().title + "</b>" + "</br>"
      + "<i>Description:</i> " + getMetadata().description + "</br>"
      + "<i>Base model:</i> " + getMetadata().ml_base_model + "</br>"
      + "<i>Training nbr:</i> " + getMetadata().ml_train_nbr + "</br>"
      + "<i>Training started:</i> " + startedTrainingTime + "</br>"
      + "<i>Training ended:</i> " + finishedTrainingTime + "</br>"
      + "<i>Training status:</i> " + getMetadata().ml_train_status + "</br>"
      + "<i>Training description:</i> " + getMetadata().ml_description + "</br>"
      + "<i>Current epoch:</i> " + getMetadata().ml_epoch + "</br>"
      + "Training over " + getMetadata().ml_epochs + " epochs and lasted for " + trainingTime + "</br>";
    if (debug) {
      trainContentText.innerHTML += "---------</br><i>Training set ref:</i> " + getMetadata().training_set_ref + "</br>" +
        "<i>ML model filename:</i> " + getMetadata().ml_model_filename + "</br>" +
        "<i>ml_train:</i> " + getMetadata().ml_train + "</br>" +
        "<i>ml_train_status:</i> " + getMetadata().ml_train_status + "</br>" +
        "<i>ml_train_ongoing:</i> " + getMetadata().ml_train_ongoing + "</br>" +
        "<i>ml_train_finished:</i> " + getMetadata().ml_train_finished + "</br>" +
        "<i>ml_retrain_existing_model:</i> " + getMetadata().ml_retrain_existing_model + "</br>";
    }
    //Add a <hr> element to trainContent
    const hr = document.createElement("hr");
    trainContent.appendChild(hr);
    const parameterList = document.createElement("ul");
    parameterList.className = "list-group";
    parameterList.id = "train_list";
    //trainContent.appendChild(parameterList);
    trainContent.appendChild(parameterList);
    // Add dropdown elements to modal_train.html
    //const parameterList = document.getElementById("train_list");
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

    if (getMetadata().ml_train_nbr > 0 && getMetadata().ml_model_filename) {
      modelDropdown.value = "Continue training";
    } else {
      modelDropdown.value = "ResNet50";
      modelDropdown.removeChild(modelDropdown.lastChild);
    }

    modelListItem.appendChild(modelDropdown);
    modelListItem.style.width = "100%"; // Set the width to 100%
    modelListItem.style.marginTop = "10px"; // Add margin top
    parameterList.appendChild(modelListItem);

    const descriptionLabel = document.createElement("label");
    descriptionLabel.innerHTML = "Update description for this training: &nbsp;";
    descriptionLabel.style.marginTop = "10px";
    trainContent.appendChild(descriptionLabel);
    const descriptionInput = document.createElement("textarea");
    descriptionInput.id = "description";
    if (getMetadata().ml_description && getMetadata().ml_description.trim() !== "") {
      descriptionInput.innerHTML = getMetadata().ml_description;
    } else {
      descriptionInput.placeholder = "Description of this training";
    }
    descriptionInput.maxLength = 100;
    descriptionInput.rows = 5;
    descriptionInput.style.marginTop = "10px";
    descriptionInput.style.width = "100%"; // Set the width to 100%
    trainContent.appendChild(descriptionInput);
    //trainingOngoing()
  }

  waitForGetTrainingParameters();

}

// Listen for changes to the ml_ongoing property
function trainingOngoing() {
  const db = getDatabase();
  const metadataRef = ref(db, auth.currentUser.uid + "/metadata/" + getMetadata().training_set_ref);

  onValue(metadataRef, (snapshot) => {
    refreshContent();
    const data = snapshot.val();
    let previousValue = false;
    const currentValue = data.ml_train_ongoing;
    console.log("DATA", data.ml_train_ongoing);
    console.log("getMetadata().ml_train_ongoing", getMetadata().ml_train_ongoing);
    if (data.ml_train && !data.ml_train_ongoing) {
      // The ml_ongoing property changed from true to false
      console.log("training started");
      document.getElementById("saveChanges_train").disabled = true;
      // Perform any actions you need to do here
    } else if (!data.ml_train_ongoing&&data.ml_train_finished) {
      // The ml_ongoing property changed from false to true
      console.log("ml_ongoing changed from false to true");
      document.getElementById("saveChanges_train").disabled = false;
    }
    previousValue = getMetadata().ml_train_ongoing;
  });
}