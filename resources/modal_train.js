import { getMetadata, getStatistics } from "../script.js";
import { setTraining_parameters, getTraining_parameters, currentproject } from "../firebase-module.js";
import { auth, getDatabase, ref, onValue } from "../firebase-module.js";
import { debug } from "../script.js";
let previousValue = true;
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
      document.getElementById("refresh_training_modal").addEventListener("click", refreshTrainContent);
      document.getElementById("saveChanges_train").addEventListener("click", handleTrainModelButton);
      var myModalEl = document.getElementById('myModal_train');
      myModalEl.addEventListener('shown.bs.modal', function () {
        trainingOngoing();
      });
    });
}

function handleTrainModelButton(event) {
  event.preventDefault();
  console.log("IN handleTrainModelButton");
  document.getElementById("saveChanges_train").disabled = true; //Disable this directely to avoid double commands
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

}

function refreshTrainContent() {
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
    console.log("getMetadata()", getMetadata());
    trainContentText.innerHTML = "<b> <i>Title:</i> " + getMetadata().title + "</b>" + "</br>"
      + "<i>Description:</i> " + getMetadata().description + "</br>"
    if (getMetadata().ml_model_filename || getMetadata().ml_train_ongoing || getMetadata().ml_train_finished) {
      trainContentText.innerHTML += "<i>Base model:</i> " + getMetadata().ml_base_model + "</br>"
        + "<i>Training nbr:</i> " + getMetadata().ml_train_nbr + "</br>"
        + "<i>Training started:</i> " + startedTrainingTime + "</br>"
        + "<i>Training ended:</i> " + finishedTrainingTime + "</br>"
        + "<i>Training status:</i> " + getMetadata().ml_train_status + "</br>"
        + "<i>Training description:</i> " + getMetadata().ml_description + "</br>"
        + "<i>Current epoch:</i> " + getMetadata().ml_epoch + "</br>"
        + "Training over " + getMetadata().ml_epochs + " epochs and lasted for " + trainingTime + "</br>";
    } else {
      trainContentText.innerHTML += "No training has been done yet</br>"
    }
    if (debug) {
      trainContentText.innerHTML += "-----Debug info----</br><i>Training set ref:</i> " + getMetadata().training_set_ref + "</br>" +
        "<i>ML model filename:</i> " + getMetadata().ml_model_filename + "</br>" +
        "<i>ml_train:</i> " + getMetadata().ml_train + "</br>" +
        "<i>ml_train_status:</i> " + getMetadata().ml_train_status + "</br>" +
        "<i>ml_train_ongoing:</i> " + getMetadata().ml_train_ongoing + "</br>" +
        "<i>ml_train_finished:</i> " + getMetadata().ml_train_finished + "</br>" +
        "<i>ml_retrain_existing_model:</i> " + getMetadata().ml_retrain_existing_model + "</br>"+
        "<i>ml_predict_ongoing:</i> " + getMetadata().ml_predict + "</br>";
      const resetButton = document.createElement("button");
      resetButton.type = "button";
      resetButton.id = "reset_train";
      resetButton.classList.add("btn", "btn-warning", "btn-sm", "me-1");
      resetButton.innerHTML = "Reset training";
      trainContent.appendChild(resetButton);
      document.getElementById("reset_train").addEventListener("click", resetTraining);
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
    dropdown.value = 5;
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
    let modelValues = ["ResNet50", "EfficientNet_V2_S", "Continue training"];

    modelValues.forEach(value => {
      const option = document.createElement("option");
      option.value = value;
      option.text = value;
      modelDropdown.appendChild(option);
    });

    if (getMetadata().ml_train_nbr > 0 && getMetadata().ml_model_filename && !getMetadata().concept_array_changed) {
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
    descriptionInput.maxLength = 1000;
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
  console.log("Number clasified images (all,void)" + getStatistics().number_of_images + ":" + getStatistics().number_of_void_images);
  const numberClassifiedImages = getStatistics().number_of_images - getStatistics().number_of_void_images;
  if (numberClassifiedImages < 2) {
    alert("You need to classify at least 2 images before you can start training");
    return;
  }
  const db = getDatabase();
  //currentproject
  const metadataRef = ref(db, "/projects/" + currentproject + "/metadata/" + getMetadata().training_set_ref);
  //const metadataRef = ref(db, auth.currentUser.uid + "/metadata/" + getMetadata().training_set_ref);
  onValue(metadataRef, (snapshot) => {
    console.log("In trainingOngoing");
    const data = snapshot.val(); 
    /* if (typeof data.ml_train === 'undefined') {
      document.getElementById("saveChanges_train").disabled = false;
      document.getElementById("modal_train_info").innerHTML = "";
      deactivateSpinner();
    }  */

    refreshTrainContent();
    if (!data.ml_train_ongoing && data.ml_train_finished) { //No ongoing training 
      document.getElementById("saveChanges_train").disabled = false;
      document.getElementById("modal_train_info").innerHTML = "";
      deactivateSpinner();
    } else if (data.ml_train_ongoing && !data.ml_train_finished ) { //Training started and not finished
      // The ml_ongoing property changed from true to false
      console.log("training started");
      document.getElementById("modal_train_info").innerHTML = "Training ongoing";
      document.getElementById("saveChanges_train").disabled = true;
      activateSpinner();
    } 
    
    if (typeof data.concept_array_changed !== 'undefined' && data.concept_array_changed && !data.ml_train_ongoing) {
      console.log("concept changed, disable training button");
      document.getElementById("modal_train_info").innerHTML = "You need to retrain with a new base model since you changed the concept array</br> Save changes on the main screen before you retrain";
      document.getElementById("saveChanges_train").disabled = false;
      deactivateSpinner();
    }

    //Predictions
    if (typeof data.ml_predict === 'undefined'|| data.ml_predict) {
      console.log("prediction ongoing, disable training button");
      document.getElementById("saveChanges_train").disabled = true;
      document.getElementById("modal_train_info").innerHTML = "Prediction ongoing, no training is possible at the same time.";
    }
    
    //Indicate training finished after concept changes.
    if (!previousValue && getMetadata().ml_train_finished) {
      console.log("Training ongoing changed from " + previousValue + " to " + getMetadata().ml_train_finished);
      getMetadata().concept_array_changed = false;
      document.getElementById("modal_train_info").innerHTML = "";
      setTraining_parameters();
    }
    previousValue = getMetadata().ml_train_finished;
    
  });
}

function resetTraining(event) {
  event.preventDefault();
  console.log("IN resetTraining");
  getMetadata().ml_train = false;
  getMetadata().ml_train_status = "Reset training";
  getMetadata().ml_train_ongoing = false;
  getMetadata().ml_train_finished = true;
  setTraining_parameters();
  refreshTrainContent();
}

function activateSpinner() {
  var spinner = document.getElementById('train_button_spinner');
  spinner.classList.remove('d-none');
}

function deactivateSpinner() {
  var spinner = document.getElementById('train_button_spinner');
  spinner.classList.add('d-none');
}