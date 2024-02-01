import { getMetadata, getStatistics} from "../script.js";
import { setTraining_parameters, getTraining_parameters } from "../firebase-module.js";
import { auth ,getDatabase,ref,onValue,get_all_data_reload_page} from "../firebase-module.js";
import { debug } from "../script.js";

export function predict_class() {
  const button = document.createElement("button");
  button.type = "button";
  button.id = "myInput_predict";
  button.classList.add("btn", "btn-secondary", "btn-sm", "ms-2", "me-1");
  button.setAttribute("data-bs-toggle", "modal");
  button.setAttribute("data-bs-target", "#myModal_predict");
  button.innerHTML = "Predict";
  const buttonDiv = document.getElementById("button_div");
  buttonDiv.appendChild(button);

  fetch('./resources/modal_predict.html')
    .then(response => response.text())
    .then(html => {
      //getTraining_parameters();
      //console.log("getMetadata()", getMetadata());
      const buttonDiv = document.getElementById("button_div");
      const modalContainer = document.createElement('div');
      modalContainer.innerHTML = html;
      buttonDiv.appendChild(modalContainer);
      //document.getElementById("refresh_predicting_modal").addEventListener("click", refreshContent);
      //document.getElementById("saveChanges_predict").removeEventListener("click", handlePredictModelButton);
      document.getElementById("saveChanges_predict").addEventListener("click", handlePredictModelButton);
      //refreshPredictContent();
      var myModalEl = document.getElementById('myModal_predict');
      myModalEl.addEventListener('shown.bs.modal', function () {
        predictionOngoing();
      });
    });
    
  //document.getElementById("image_data").appendChild(button);
}

function handlePredictModelButton(event) {
  event.preventDefault();
  if (!getMetadata().ml_train_ongoing && !getMetadata().ml_predict) {
    console.log("IN handlePredictModelButton");
    getMetadata().ml_predict = true;
    getMetadata().ml_predict_started_timestamp = 0;
    getMetadata().ml_predict_finished_timestamp = 1;
    getMetadata().ml_pred_concept ="concept"
    getMetadata().ml_predict_nbr = document.getElementById("images_nbr").value;
    getMetadata().ml_predict_erase = document.getElementById("erase_predictions").checked;
    setTraining_parameters(); //should be renamed to set_parameters
  } else {
    console.log("Wait for training or ongoing prediction to finish before starting a new prediction session");
  } 
}

function refreshPredictContent() {
  async function waitForGetTrainingParameters() {
    await getTraining_parameters();
    // Your code that depends on the completion of getTraining_parameters
    //const trainContent = document.getElementById("train_content");
    const predictContent = document.getElementById("predict_section");
    while (predictContent.firstChild) {
      predictContent.removeChild(predictContent.firstChild);
    }
    const infoText = document.createElement("p");
    predictContent.appendChild(infoText);
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

    if (debug) {
      console.log("getMetadata()", getMetadata());
      const resetPredictButton = document.createElement("button");
      resetPredictButton.type = "button";
      resetPredictButton.id = "reset_predict";
      resetPredictButton.classList.add("btn", "btn-secondary", "btn-sm", "me-1");
      resetPredictButton.innerHTML = "Reset predict";
      predictContent.appendChild(resetPredictButton);
      document.getElementById("reset_predict").addEventListener("click", function () {
        getMetadata().ml_predict = false;
        getMetadata().ml_predict_started_timestamp = 0;
        getMetadata().ml_predict_finished_timestamp = 1;
        setTraining_parameters(); //should be renamed to set_parameters
      });
    }
    
    
    const hr = document.createElement("hr");
    predictContent.appendChild(hr);
    // Add input field for "images nbr"
    const imagesNbrLabel = document.createElement("label");
    imagesNbrLabel.innerHTML = "Number of images to predict classes for: ";
    const imagesNbrInput = document.createElement("input");
    imagesNbrInput.type = "number";
    imagesNbrInput.id = "images_nbr";
    imagesNbrInput.name = "images_nbr";
    imagesNbrInput.value = 2;
    predictContent.appendChild(imagesNbrLabel);
    predictContent.appendChild(imagesNbrInput);
    predictContent.appendChild(document.createElement("br"));
    //ad a radiobutton so the user can chose to erase previous predictions or not
    const erasePredictionsLabel = document.createElement("label");
    erasePredictionsLabel.innerHTML = "Erase previous predictions: &nbsp;";
    const erasePredictionsInput = document.createElement("input");
    erasePredictionsInput.type = "checkbox";
    erasePredictionsInput.id = "erase_predictions";
    erasePredictionsInput.name = "erase_predictions";
    erasePredictionsInput.value = "erase_predictions";
    predictContent.appendChild(erasePredictionsLabel);
    predictContent.appendChild(erasePredictionsInput);
  }

  waitForGetTrainingParameters();

}

// Listen for changes to the ml_ongoing property
function predictionOngoing() {
  console.log("In predictionOngoing1");
  const db = getDatabase();
  const trainingDataRef = ref(db, auth.currentUser.uid + "/metadata/" + getMetadata().training_set_ref);
  onValue(trainingDataRef, (snapshot) => {
    console.log("In predictionOngoing2");
    //const data = snapshot.val();
    // Check if the modal is visible
      refreshPredictContent();
      if (!getMetadata().ml_train_ongoing && getMetadata().ml_predict) {
        //set saveChanges_predict button to disabled 
        document.getElementById("saveChanges_predict").disabled = true;
      } else if (!getMetadata().ml_train_ongoing && !getMetadata().ml_predict){
        //relode all containers from firebase
        document.getElementById("saveChanges_predict").disabled = false;
        //get_all_data_reload_page(auth.currentUser.uid);
      }
  });
}