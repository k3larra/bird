import { getMetadata, getStatistics} from "./script.js";
import { setTraining_parameters, getTraining_parameters } from "./firebase-module.js";
import { auth ,getDatabase,ref,onValue} from "./firebase-module.js";
import { debug } from "./script.js";

export function predict() {
  const button = document.createElement("button");
  button.type = "button";
  button.id = "myInput_predict";
  button.classList.add("btn", "btn-secondary", "btn-sm", "me-1");
  button.setAttribute("data-bs-toggle", "modal");
  button.setAttribute("data-bs-target", "#myModal_predict");
  button.innerHTML = "Predict";
  const buttonDiv = document.getElementById("button_div");
  buttonDiv.appendChild(button);

  fetch('./resources/modal_predict.html')
    .then(response => response.text())
    .then(html => {
      //getTraining_parameters();
      console.log("getMetadata()", getMetadata());
      const buttonDiv = document.getElementById("button_div");
      const modalContainer = document.createElement('div');
      modalContainer.innerHTML = html;
      buttonDiv.appendChild(modalContainer);
      //document.getElementById("refresh_predicting_modal").addEventListener("click", refreshContent);
      document.getElementById("saveChanges_predict").addEventListener("click", handlePredictModelButton);
      refreshContent();
    });

  //document.getElementById("image_data").appendChild(button);
}

function handlePredictModelButton(event) {
  event.preventDefault();
  getMetadata().ml_predict = true;
  getMetadata().ml_predict_started_timestamp = 0;
  getMetadata().ml_predict_finished_timestamp = 0;
  getMetadata().ml_pred_concept ="concept"
  getMetadata().ml_predict_nbr = document.getElementById("images_nbr").value;
  getMetadata().ml_predict_erase = document.getElementById("erase_predictions").checked;

 /*  getMetadata().ml_model = document.getElementById("model").value; // Set the value to the selected value in modelDropdown
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
  getMetadata().ml_train_status = "Send to training";*/
  /* getMetadata().training_started= unix_timestamp();
  getMetadata().epochs = document.getElementById("epochs").value;
  getMetadata().batch_size = document.getElementById("batch_size").value;
  getMetadata().learning_rate = document.getElementById("learning_rate").value;
  getMetadata().loss = document.getElementById("loss").value;
  getMetadata().optimizer = document.getElementById("optimizer").value;
  getMetadata().metrics = document.getElementById("metrics").value; */
  setTraining_parameters(); //should be renamed to set_parameters
  //predictionOngoing(); 
}

function refreshContent() {
  async function waitForGetTrainingParameters() {
    await getTraining_parameters();
    // Your code that depends on the completion of getTraining_parameters
    //const trainContent = document.getElementById("train_content");
    console.log("What");
    const trainContent = document.getElementById("predict_section");
    while (trainContent.firstChild) {
      trainContent.removeChild(trainContent.firstChild);
    }
    const infoText = document.createElement("p");
    trainContent.appendChild(infoText);
    infoText.innerHTML = "<b> <i>Title:</i> " + getMetadata().title + "</b><br>";
    infoText.innerHTML += "<i>Description:</i> " + getMetadata().description+"<br>";
    infoText.innerHTML += "<i>Number of images in dataset:</i> " + getStatistics().number_of_images+ "<br>";
    infoText.innerHTML += "<i>Number of user classified images:</i> " + (getStatistics().number_of_images- getStatistics().number_of_void_images)+ "<br>";
    for (const conceptNbr in getMetadata().concept) {  //Add also for unused concepts in getMetadata().concept ??
      let conceptName = getMetadata().concept[conceptNbr];
      infoText.innerHTML += conceptName+": "+getStatistics()[conceptName]+"<br>";
    }
    infoText.innerHTML += "<i>Number of non classified images:</i> " + (getStatistics().number_of_void_images)+ "<br>";
    if (getMetadata().ml_train_nbr > 0 && getMetadata().ml_model_filename) {
      infoText.innerHTML += "<i>Training description:</i> " + getMetadata().ml_description+"<br>";
      infoText.innerHTML += "<i>Base model:</i> " + getMetadata().ml_base_model + "<br>";
      infoText.innerHTML += "<i>Training nbr:</i> " + getMetadata().ml_train_nbr + "<br>";
      infoText.innerHTML += "<i>Number of predicted images:</i> " + getStatistics().number_of_predicted_images + "<br>";
      
      console.log("getStatistics()", getStatistics());
    }else{
      infoText.innerHTML += "No training has been done yet<br>"
    }
    
    if (!getMetadata().ml_train_finished && !getMetadata().ml_train_ongoing && getMetadata().ml_predict) {
      infoText.innerHTML += "Wait for training or ongoing prediction to finish before starting a new prediction session<br>";
      //set saveChanges_predict button to disabled 
      document.getElementById("saveChanges_predict").disabled = true;
    } else {
      document.getElementById("saveChanges_predict").disabled = false;
    }
    const hr = document.createElement("hr");
    trainContent.appendChild(hr);
    // Add input field for "images nbr"
    const imagesNbrLabel = document.createElement("label");
    imagesNbrLabel.innerHTML = "Number of images to predict classes for: ";
    const imagesNbrInput = document.createElement("input");
    imagesNbrInput.type = "number";
    imagesNbrInput.id = "images_nbr";
    imagesNbrInput.name = "images_nbr";
    imagesNbrInput.value = 100;
    trainContent.appendChild(imagesNbrLabel);
    trainContent.appendChild(imagesNbrInput);
    trainContent.appendChild(document.createElement("br"));
    //ad a radiobutton so the user can chose to erase previous predictions or not
    const erasePredictionsLabel = document.createElement("label");
    erasePredictionsLabel.innerHTML = "Erase previous predictions: &nbsp;";
    const erasePredictionsInput = document.createElement("input");
    erasePredictionsInput.type = "checkbox";
    erasePredictionsInput.id = "erase_predictions";
    erasePredictionsInput.name = "erase_predictions";
    erasePredictionsInput.value = "erase_predictions";
    trainContent.appendChild(erasePredictionsLabel);
    trainContent.appendChild(erasePredictionsInput);
    //predictionOngoing()
  }

  waitForGetTrainingParameters();

}

// Listen for changes to the ml_ongoing property
function predictionOngoing() {
  const db = getDatabase();
  const metadataRef = ref(db, auth.currentUser.uid + "/metadata/" + getMetadata().training_set_ref);

  onValue(metadataRef, (snapshot) => {
    refreshContent();
    const data = snapshot.val();
    console.log("data", data);
    /* let previousValue = false;
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
    previousValue = getMetadata().ml_train_ongoing; */
  });
}