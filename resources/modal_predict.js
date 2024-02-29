import { getMetadata, getStatistics } from "../script.js";
import { setTraining_parameters, getTraining_parameters, currentproject } from "../firebase-module.js";
import { getDatabase, ref, onValue } from "../firebase-module.js";
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
    getMetadata().ml_pred_concept = "concept"
    getMetadata().ml_predict_nbr = document.getElementById("images_nbr").value;
    if (document.getElementById("erase_predictions") !== null) {
      getMetadata().ml_predict_erase = document.getElementById("erase_predictions").checked;
    } else { getMetadata().ml_predict_erase = false }
    setTraining_parameters(); //should be renamed to set_parameters
  } else {
    console.log("Wait for training or ongoing prediction to finish before starting a new prediction session");
  }
}

function refreshPredictContent() {
  async function waitForGetPredictParameters() {
    await getTraining_parameters();
    const predictContent = document.getElementById("predict_section");
    while (predictContent.firstChild) {
      predictContent.removeChild(predictContent.firstChild);
    }
    //console.log("refreshPredictContent getStatistics()", getStatistics());
    const infoText = document.createElement("p");
    predictContent.appendChild(infoText);
    infoText.innerHTML = "<b> <i>Title:</i> " + getMetadata().title + "</b><br>";
    infoText.innerHTML += "<i>Description:</i> " + getMetadata().description + "<br>";
    infoText.innerHTML += "<i>Number of images in dataset:</i> " + getStatistics().number_of_images + "<br>";
    infoText.innerHTML += "<i>Number of user classified images:</i> " + (getStatistics().number_of_images - getStatistics().number_of_void_images) + "<br>";
    for (const conceptNbr in getMetadata().concept) {  //Add also for unused concepts in getMetadata().concept ??
      let conceptName = getMetadata().concept[conceptNbr];
      infoText.innerHTML += conceptName + ": " + getStatistics()[conceptName] + "<br>";
    }
    infoText.innerHTML += "<i>Number of non classified images:</i> " + (getStatistics().number_of_void_images) + "<br>";
    if (getMetadata().ml_train_nbr > 0 && getMetadata().ml_model_filename) {
      infoText.innerHTML += "<i>Training description:</i> " + getMetadata().ml_description + "<br>";
      infoText.innerHTML += "<i>Base model:</i> " + getMetadata().ml_base_model + "<br>";
      infoText.innerHTML += "<i>Training nbr:</i> " + getMetadata().ml_train_nbr + "<br>";
      infoText.innerHTML += "<i>Number of predicted images:</i> " + getStatistics().number_of_predicted_images + "<br>";
      for (const conceptNbr in getMetadata().concept) {
        let conceptName = getMetadata().concept[conceptNbr];
        infoText.innerHTML += conceptName + ": " + getStatistics()[conceptName + "_pred"] + "<br>";
      }

    } else {
      infoText.innerHTML += "No training has been done yet<br>"
    }

    if (debug) {
      infoText.innerHTML += "----debug info----<br>"
      //console.log("getMetadata()", getMetadata());
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
    imagesNbrInput.value = 100;
    predictContent.appendChild(imagesNbrLabel);
    predictContent.appendChild(imagesNbrInput);
    predictContent.appendChild(document.createElement("br"));
    //ad a radiobutton so the user can chose to erase previous predictions or not
    if (getStatistics().number_of_predicted_images > 0) {
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
  }
  waitForGetPredictParameters();
}

// Listen for changes to the ml_ongoing property
function predictionOngoing() {
  console.log("In predictionOngoing1 metadata", getMetadata());
  if (getMetadata().ml_model_filename) {
    const db = getDatabase();
    const trainingDataRef = ref(db, "/projects/" + currentproject + "/metadata/" + getMetadata().training_set_ref);
    var predictionWasOngoing = false;
    onValue(trainingDataRef, (snapshot) => {
      console.log("In predictionOngoing");
      const data = snapshot.val();
      refreshPredictContent();
      if (typeof data.concept_array_changed !== 'undefined' && data.concept_array_changed) {
        console.log("concept changed, disable training button");
        document.getElementById("modal_pred_info").innerHTML = "Concept array changed retraining needed";
        document.getElementById("saveChanges_predict").disabled = true;
        deactivateSpinner();
      } else {
        if (!document.getElementById("saveChanges_predict")) {
          return;
        }
        if (!data.ml_train_ongoing && !data.ml_predict) { //God to go
          //console.log("Prediction or training ongoing");
          document.getElementById("saveChanges_predict").disabled = false;
          deactivateSpinner();
          document.getElementById("modal_pred_info").innerHTML = "";
          //get_all_data_reload_page(auth.currentUser.uid);         
        } else if (data.ml_train_ongoing || data.ml_predict) {
          //set saveChanges_predict button to disabled 
          document.getElementById("saveChanges_predict").disabled = true;
          if (data.ml_predict) {
            console.log("Prediction ongoing!!!");
            document.getElementById("modal_pred_info").innerHTML = "Prediction ongoing, prediction button disabled";
            activateSpinner();
          }
          if (data.ml_train_ongoing) {
            console.log("Training ongoing!!!");
            document.getElementById("modal_pred_info").innerHTML = "Training ongoing, prediction button disabled";
            deactivateSpinner();
          }
        }
        //Check if the change in data was from ongoing prediction to not ongoing prediction
        if (predictionWasOngoing && !data.ml_predict) {
          console.log("Prediction finished");
          //get_all_data_reload_page(auth.currentUser.uid);
          const button = document.getElementById("reload_button")
          if (button) {
            button.textContent = "Reload page to see predictions";
            button.classList.remove("btn-outline-dark");
            button.classList.add("btn-success");
          }
        }
        predictionWasOngoing = data.ml_predict;
      }
    });
  } else {
    console.log("You need to train a model first in order to make predictions.");
    document.getElementById("modalPredict_info").innerHTML = "You need to train a model first in order to make predictions.";
    document.getElementById("modal_pred_info").innerHTML = "No trained model exists, prediction button disabled";
    document.getElementById("saveChanges_predict").disabled = true;
  }
}

function activateSpinner() {
  var spinner = document.getElementById('predict_button_spinner');
  spinner.classList.remove('d-none');
}

function deactivateSpinner() {
  var spinner = document.getElementById('predict_button_spinner');
  spinner.classList.add('d-none');
}