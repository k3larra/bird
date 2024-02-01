import { get_all_data_reload_page } from "./firebase-module.js";
import { read_training_data } from "./firebase-module.js";
import { save_new_training_set_to_databasebase } from "./firebase-module.js";
import { downloadJson } from "./firebase-module.js";
import { update_training_set } from "./firebase-module.js";
import { getDatabase, auth } from "./firebase-module.js";
import { setAsDefaultTrainingSet } from "./firebase-module.js";
import { delete_training_set } from "./firebase-module.js";
import { train_model } from "./resources/modal_train.js";
import { predict_class } from "./resources/modal_predict.js";
import { IMAGEFOLDER } from "./firebase-module.js";
import { createAddImagesToTrainingdataButton, clearPredictedImages } from "./resources/create_elements.js";
import { createDropdownMenu } from "./resources/create_elements.js";
import { createRowInConceptList, edit_concepts } from "./resources/modal_concept.js";
import { firebase_save } from "./resources/modal_save.js";
import { firebase_save_as } from "./resources/modal_save_as.js";
export const debug = true;
/********************Ref to image folder  here************************** */
let unique_concepts = [] //This is central and needs some more protection....
let deleteModal = null;

let _metadata = null;
export function getMetadata() {
  return _metadata;
}
export function setMetadata(value) {
  // Add any additional logic or validation here
  _metadata = value;
}

let _birds = null;
export function getBirds() {
  return _birds;
}
export function setBirds(value) {
  // Add any additional logic or validation here
  _birds = value;
}

function updateUniqueConcepts() {
  unique_concepts = [];
  for (const [key, value] of Object.entries(getBirds().images)) {
    if (value.concept == "void") continue;
    if (unique_concepts.indexOf(value.concept) === -1) unique_concepts.push(value.concept);
  }
  return unique_concepts;
}

/* function findImageIndexWithPredictedConcept(pred_concept_name) {
  //Find all rows with concept_pred in column 1 in birds and return them
  let image_indexes_for_concept = []
  for (const [key, value] of Object.entries(getBirds().images)) {
    if (value.concept_pred == null) continue;
    if (value.concept_pred == "void") continue;
    if (value.concept_pred == pred_concept_name) {
      image_indexes_for_concept.push(key)
    }
  }
  return image_indexes_for_concept
} */

/**
 * Returns an object containing statistics about the images and concepts in the application.
 * @returns {Object} An object with the following properties:
 * - number_of_images: The total number of images in the application.
 * - number_of_concepts: The total number of unique concepts associated with the images.
 * - number_of_void_images: The number of images that have the concept "void" associated with them.
 * - [concept]: The number of images that have the specified concept associated with them. This property is repeated for each unique concept.
 */
export function getStatistics() {
  let a = updateUniqueConcepts();
  const statistics = {
    "number_of_images": Object.keys(getBirds().images).length,
    "number_of_concepts": unique_concepts.length,
    "number_of_void_images": findImageIndexWithConcept("concept", "void").length,
    //"number_of_predicted_images": findImageIndexWithPredictedConcept("concept_pred").length
  }
  //Add statistics for concepts
  //get the sum of all concepts in getBirds().images.concept
  unique_concepts.forEach((concept) => {
    statistics[concept] = findImageIndexWithConcept("concept", concept).length
  });
  //Add statistics for predicted concepts
  //check so entries in getBirds().images.concept_pred is not null
  //const unique_concepts = [...new Set(getBirds().images.map(item => item.concept_pred))];

  unique_concepts.forEach((concept) => {
    //console.log('findImageIndexWithConcept("concept_pred",concept)',  findImageIndexWithConcept("concept_pred",concept))
    statistics[concept + "_pred"] = findImageIndexWithConcept("concept_pred", concept).length
  });
  return statistics;
}

/**
 * Displays statistics about the birds.
 * @function
 * @returns {void}
 */
function displayStatistics() {
  document.getElementById("header_1").innerHTML = getBirds().title + "...";
  const statistics = getStatistics();
  let text = getBirds().description + "<br>";
  text += "Version: " + getBirds().version + "<br>";
  text += "Number of images: " + statistics.number_of_images + "<br>";
  text += "Number of concepts: " + statistics.number_of_concepts + "<br>";
  text += "Number of unlabelled images: " + statistics.number_of_void_images + "<br>";
  for (const concept in unique_concepts) {  //Add also for unused concepts in getMetadata().concept ??
    text += "Number of human classified images: " + unique_concepts[concept] + ": " + statistics[unique_concepts[concept]] + "<br>";
  }
  for (const concept in unique_concepts) {
    text += "Number of machine predicted images: " + unique_concepts[concept] + ": " + statistics[unique_concepts[concept] + "_pred"] + "<br>";
  }
  document.getElementById("text_1").innerHTML = text;
}

//Set static texts from jsonfile, instead of hardcoding them (Not used at the moment);
async function populate() {
  let requestURL = 'resources/texts.json';
  let request = new Request(requestURL);
  let response = await fetch(request);
  const texts = await response.json();
  document.getElementById("header_1").innerHTML = texts.header_1;
  document.getElementById("text_1").innerHTML = texts.text_1;
  document.getElementById("link_1").innerHTML = texts.link_1.text;
  document.getElementById("link_1").setAttribute("href", texts.link_1.href);
  document.getElementById("text_2").innerHTML = texts.text_2;
}

export function select_training_data(metadata) {
  console.log("In select_training_data");
  const dropdown = document.getElementById("drop_training");
  dropdown.removeEventListener("click", dropdownListener);
  dropdown.removeEventListener("click", deleteListener);
  while (dropdown.firstChild) {
    dropdown.removeChild(dropdown.lastChild);
  }
  setBirds(null);
  setMetadata(null);
  fetch('./resources/delete_confirm.html')
    .then(response => response.text())
    .then(html => {
      const modalContainer = document.createElement('div');
      modalContainer.innerHTML = html;
      const headerElement = document.getElementsByTagName("header")[0];
      headerElement.appendChild(modalContainer);
    });
  metadata.forEach((doc) => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.classList.add('dropdown-item');
    a.value = '#';
    a.dataset.id = doc.key;
    a.textContent = doc.val().title;
    li.appendChild(a);
    li.style.display = "flex";
    const button = document.createElement('button');
    button.setAttribute('type', 'button');
    button.id = doc.key;
    button.classList.add('btn', 'btn-outline-danger', 'btn-sm');
    button.setAttribute('data-bs-toggle', 'modal');
    button.setAttribute('data-bs-target', '#myModal_delete_dataset');
    button.setAttribute('data-lhtitle', doc.val().title);
    button.setAttribute('data-lhdescription', doc.val().description);
    button.innerHTML = '<small>X</small>';
    button.style.display = 'inline-flex';
    const modal = document.getElementById('modalInput_delete_dataset');
    const tooltip = document.createElement('span');
    tooltip.textContent = 'Delete dataset: ' + doc.val().title;
    tooltip.classList.add('fw-normal', 'text-dark','_lh_tooltip_delete');
    button.addEventListener('mouseenter', () => {
      tooltip.style.display = 'inline';
    });
    button.addEventListener('mouseleave', () => {
      tooltip.style.display = 'none';
    });
    button.appendChild(tooltip);
    li.appendChild(button);
    if (doc.val().default) {
      li.style.backgroundColor = "Whitesmoke";
      setMetadata(doc.val());
      read_training_data(auth.currentUser.uid, doc.key);
    }
    const ul = document.getElementById("drop_training");
    ul.appendChild(li);
    ul.appendChild(li);
  });
  dropdown.addEventListener("click", dropdownListener);
}

function dropdownListener(event) {
  event.preventDefault()
  console.log("event.target.tagName", event.target.tagName);
  if (event.target.tagName === 'A') {
    const a = event.target;
    const key = a.dataset.id
    const title = a.innerHTML
    setAsDefaultTrainingSet(key);
  }
  if (event.target.tagName === 'BUTTON') {
    console.log("Button clicked");
    document.getElementById("delete_dataset_confirm").addEventListener("click", deleteListener);
    document.getElementById("modalTitle_delete").innerHTML += event.target.dataset.lhtitle;
    document.getElementById('modalSubtitle_delete_dataset').innerHTML = event.target.dataset.lhdescription;
    document.getElementById("delete_dataset_confirm").dataset.id = event.target.id;
  }
}

function deleteListener(event) {
  event.stopPropagation();
  event.preventDefault();
  console.log("In deleteListener");
  var uid = auth.currentUser.uid;
  delete_training_set(uid, event.target.dataset.id); //deletes a training set from the database
}

export function build_image_containers() {
  console.log("In build_image_containers");
  //Delete all children of main and their listners
  //First make sure that all listeners are removed
  //using the spread operator to convert the HTMLCollection to an array 
 /*  [...document.getElementsByClassName("btn-listener")].forEach((item) => {
    item.removeEventListener("click", handleButtonClicks);
  }); */
  [...document.getElementsByClassName("modal")].forEach((item) => {
    item.remove;
  });
  const image_data_article = document.getElementById("image_data");
  while (image_data_article.firstChild) {
    image_data_article.lastChild.removeEventListener("click", function () { });
    image_data_article.removeChild(image_data_article.lastChild);
  }
  let imageContainer = createContainer("void", "Label training data using the concepts created above");
  populate_void_container(getBirds(), imageContainer)
  document.getElementById("image_data").appendChild(imageContainer);
  createbuttons()
  add_image_container_listener(imageContainer)
  //Create a container for each concept 
  //console.log("getMetadata().concept", getMetadata().concept);
  try {
    getMetadata().concept.forEach((item) => {
      imageContainer = createContainer(item, "Images labelled " + item);
      populate_container(findImageIndexWithConcept("concept", item,0), item, imageContainer, false)
      populate_container(findImageIndexWithConcept("concept_pred", item,0), item, imageContainer, true)
      document.getElementById("image_data").appendChild(imageContainer);
      add_image_container_listener(imageContainer)
    });
  } catch (error) {
    console.log("No concepts found in metadata")
  }
  displayStatistics();
}

function populate_void_container(data, container) {
  const maxNumbrItems = 72;
  let row, lastRow = -1, column, i = 0;
  let rowElement;
  let randomNumbers = [];
  while (randomNumbers.length < maxNumbrItems) {
    let r = Math.floor(Math.random() * Object.keys(data.images).length) + 1;
    //Here check if data.images[r].concept is not equal to "void" then get new number
    //Check if concept is not null or void and if so skip it
    try {
      if (data.images[r].concept != "void") continue;

      /* if (data.images[r]["image_location"].includes("/_")) {
        console.log("Skipping image with _ in name", data.images[r]["image_location"])
        continue
      }; */
    } catch (error) { continue; }
    if (randomNumbers.indexOf(r) === -1) randomNumbers.push(r);
  }
  randomNumbers.forEach((item) => {
    row = Math.trunc((i / 12));
    if (row > lastRow) {
      rowElement = createRowInGrid(container);
      container.appendChild(rowElement);
      lastRow = row;
    }
    column = i % 12
    //createImageItem(rowElement, data.images[item]["image_location"], data.images[item]["concept"], item, false);
    createImageItem(rowElement, data.images[item], item, false, "void");
    i++;
  });
}

export function populate_container(data, predicted_concept_true_value, container, is_predicted_concept) {
  //console.log("In populate_container");
  const surrounding_div = document.createElement("div");
  const header = document.createElement("div")
  header.classList.add("lh_small-font", "bg-light") // Added "mr-2" class for margin right
  if (!is_predicted_concept) {
    surrounding_div.id = "image_div";
    header.innerHTML = "Images labelled: " + predicted_concept_true_value;
  } else {
    surrounding_div.id = "pred_image_div";
    header.innerHTML = "Images predicted as: " + predicted_concept_true_value;
    header.appendChild(createDropdownMenu(predicted_concept_true_value));
    const mouseOverText = "Add images to training set. <br>Only images marked with the concept <b> " +
      predicted_concept_true_value + " </b> will be added." +
      "<br> Click on the image to change the predicted class.";
    createAddImagesToTrainingdataButton("Add to training set", mouseOverText, header);
    clearPredictedImages(header)
  }
  surrounding_div.appendChild(header);
  let row, lastRow = -1, column, i = 0;
  let rowElement;
  data.forEach((item) => {
    row = Math.trunc((i / 12));
    if (row > lastRow) {
      rowElement = createRowInGrid(surrounding_div);
      surrounding_div.appendChild(rowElement);
      lastRow = row;
    }
    column = i % 12
    /* if(is_predicted_concept){
      console.log(getBirds().images[item])
    } */
    //createImageItem(rowElement, getBirds().images[item]["image_location"], getBirds().images[item]["concept"],item, predicted_concept, concept );
    createImageItem(rowElement, getBirds().images[item], item, is_predicted_concept, predicted_concept_true_value);
    i++;
  });
  container.appendChild(surrounding_div);
}

export function clear_and_populate_pred_container(data, predicted_concept_true_value, pred_image_div) {
  console.log("In clear_and_populate_pred_container");
  console.log("pred_image_div", pred_image_div);
  while (pred_image_div.firstChild) {
    pred_image_div.removeChild(pred_image_div.firstChild);
  }
  populate_container(data, predicted_concept_true_value, pred_image_div, true);
}

function add_image_container_listener(imageContainer) {
  imageContainer.addEventListener('click', function (event) {
    event.preventDefault(); //Stop reloading
    if (event.target.tagName === 'IMG') {
      const clickedImage = event.target;
      //console.log("clickedImage", clickedImage);
      const tooltiptext_e = clickedImage.nextElementSibling;
      const index = getMetadata().concept.indexOf(tooltiptext_e.textContent);
      const pred = tooltiptext_e.nextElementSibling;
      if(pred){
        //console.log("predicted", tooltiptext_e.textContent);
        //console.log("getMetadata()", getMetadata());
        if(tooltiptext_e.textContent == ""){
          tooltiptext_e.textContent =pred.getAttribute('data-hidden-field')
          event.target.classList.add("border-success");
          event.target.classList.remove("border-danger");
        }else{
          tooltiptext_e.textContent = "";
          event.target.classList.remove("border-success");
          event.target.classList.add("border-danger");
        }
        changePredConcept(clickedImage.getAttribute('data-image-index'), tooltiptext_e.textContent)
      }else{
        if (index == -1) {
          tooltiptext_e.textContent = getMetadata().concept[0];
        } else if (index == getMetadata().concept.length - 1) {
          tooltiptext_e.textContent = "";
        } else {
          tooltiptext_e.textContent = getMetadata().concept[index + 1];
        }
        let path = clickedImage.src.split(IMAGEFOLDER)[1]
        path = decodeURIComponent(path);
        changeConcept(clickedImage.getAttribute('data-image-index'), tooltiptext_e.textContent)
      }
    }
  });
}

export function changeConcept(index, concept) {
  if (concept == "") concept = "void";
  getBirds().images[index].concept = concept;
}

export function changePredConcept(index, pred_concept) {
  if (pred_concept == "") pred_concept = "void";
  //console.log("Before getBirds().images[index].concept_pred", getBirds().images[index].concept_pred);
  getBirds().images[index].concept_pred = pred_concept;
  //console.log("getBirds().images[index].concept", getBirds().images[index]);
}

/*Create containers and content*/
function createContainer(id, header) {
  const section = document.createElement("section")
  section.classList.add("container", "overflow-auto", "border", "border-2", "rounded-3", "p-1", "m-1", "bg-light", "bg-gradient")
  section.id = id
  section.style = "max-width: 960px; max-height: 240px;"
  return section;
}

function createRowInGrid(e) {
  const row_e = document.createElement('div');
  row_e.classList.add("row", "flex-nowrap", "g-0");
  return row_e;
}

function createImageItem(element, image_data, item, is_predicted_concept, predicted_concept_true_value) {
  const path = image_data["image_location"];
  const concept = image_data["concept"];
  const pred_concept = image_data["concept_pred"];
  const pred_percent = image_data["concept_pred_probability"];
  const row_e = document.createElement('div');
  row_e.classList.add("col-1", "col-pixel-width-80", "image-container", "_tooltip");
  const image_e = document.createElement('img');
  if (is_predicted_concept) {
    image_e.classList.add("img-thumbnail", "p-0", "border", "border-1", "border-success"); // Add "border" and "border-danger" classes
  } else {
    image_e.classList.add("img-thumbnail", "p-0");
  }
  image_e.src = IMAGEFOLDER + path;
  image_e.setAttribute('data-image-index', item);
  //show current concept as tooltip
  const tooltip_e = document.createElement('span');
  tooltip_e.classList.add("_tooltiptext")
  tooltip_e.classList.add("visible")
  if (concept != "void") tooltip_e.textContent = concept;
  if (is_predicted_concept) {
    tooltip_e.textContent = predicted_concept_true_value; //perhaps give other backgound colour to predicted concept
  }
  row_e.appendChild(image_e);
  row_e.appendChild(tooltip_e);
  if (is_predicted_concept) {
    const tooltip_e2 = document.createElement('span');
    tooltip_e2.setAttribute('data-hidden-field', predicted_concept_true_value);
    tooltip_e2.classList.add("_lh_tooltip_predinfo")
    tooltip_e2.classList.add("visible")
    tooltip_e2.textContent = pred_percent + " %";
    row_e.appendChild(tooltip_e2);
  }
  element.appendChild(row_e)
}

/*Is this needed?*/
export function handleModalFocus(event) {
  event.preventDefault();
  if (event.target.id == "myModal_concept") {
    document.getElementById('myInput_concept').focus();
  }
  if (event.target.id == "myModal_save") {
    document.getElementById('myInput_save').focus();
  }
  if (event.target.id == "myModal_saveAs") {
    document.getElementById('myInput_saveAs').focus();
  }
/*   if (event.target.id == "myModal_discard_changes") {
    document.getElementById('myInput_discard_changes').focus();
  } */
}


/* export function handleButtonClicks(event) {
  event.preventDefault();
  console.log("In handleChildClick"); */
  /* if (event.target.id == "addConcept") {
    const input = document.getElementById("conceptInput")
    const newConcept = input.value.charAt(0).toUpperCase() + input.value.slice(1).toLowerCase()
    console.log("newConcept", newConcept);
    if (newConcept == "") return;
    if (getMetadata().concept.includes(newConcept)) {
      console.log("Concept already exists");
      return;
    }
    if (getMetadata().concept == null) {
      getMetadata().concept = []
    };
    getMetadata().concept.push(newConcept);
    console.log("getMetadata().concept", getMetadata().concept);
    const list = document.getElementById("concept_list");
    list.appendChild(createRowInConceptList(newConcept));
    input.value = "";
  } */
/*   if (event.target.id == "saveChanges_save") {
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
  } */

  /* if (event.target.id == "saveChanges_saveAs") {
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
  } */
 /*  if (event.target.id == "discard_changes") {
    console.log("In discard changes");
    get_all_data_reload_page(auth.currentUser.uid);
  } */

//}

function createbuttons() {
  console.log("In createbuttons");
  //check if "button_div" exists and if so remove it
  let buttonDiv = document.getElementById("button_div");
  if (buttonDiv != null) {
    buttonDiv.remove();
  }
  buttonDiv = document.createElement("div")
  buttonDiv.classList.add("container", "overflow-auto", "border", "border-2", "rounded-3", "p-1", "m-1", "bg-light", "bg-gradient", "d-flex", "justify-content-center")
  buttonDiv.id = "button_div"
  document.getElementById("image_data").appendChild(buttonDiv);
  //Reorganise button
  let button = document.createElement("button")
  button.type = "button"
  button.classList.add("btn", "btn-outline-secondary", "btn-sm", "me-1")
  button.textContent = "Reorganise"
  buttonDiv.appendChild(button)
  button.addEventListener("click", (event) => {
    event.preventDefault();
    tooltip1.hide();
    build_image_containers();
  });
  const tooltip1 = new bootstrap.Tooltip(button, {
    customClass: '_lh_tooltip_standard',
    html: true,
    title: "Moves all images with a concept to the corresponding container. <br>Images without a concept are moved to the top container.",
    placement: 'top'
  })
  edit_concepts();
  predict_class();
  train_model();
  //Reload button
  button = document.createElement("button")
  button.type = "button"
  button.classList.add("btn", "btn-outline-dark", "btn-sm", "ms-2", "me-1")
  button.textContent = "Reload" //"reload"
  buttonDiv.appendChild(button)
  button.addEventListener("click", (event) => {
    event.preventDefault();
    tooltip2.hide();
    //read_training_data(auth.currentUser.uid, getMetadata().training_set_ref);
    get_all_data_reload_page(auth.currentUser.uid);
  });
  const tooltip2 = new bootstrap.Tooltip(button, {
    customClass: '_lh_tooltip_standard',
    html: true,
    title: "Reverts all local changes and reloads server data",
    placement: 'top'
  });

  firebase_save();
  firebase_save_as();
  //download button Not needed?? since download JSON is more a Admin thing perhaps add for admins only
/*   button = document.createElement("button")
  button.type = "button"
  button.classList.add("btn", "btn-secondary", "btn-sm", "me-1")
  button.textContent = "Download" //"Download"
  buttonDiv.appendChild(button)
  button.addEventListener("click", (event) => {
    event.preventDefault()
    tooltip3.hide();
    downloadJson(getBirds());
  });
  const tooltip3 = new bootstrap.Tooltip(button, {
    customClass: '_lh_tooltip_standard',
    html: true,
    title: "Downloads the training data as a json file. <br>Use this if you want to save the training data locally.",
    placement: 'top'
  }); */
  //discard_changes(); //Not needed ?? since we have reload button
  
  
  
  
}

export function findImageIndexWithConcept(search_key, concept,pred_percent) {
  let image_indexes_for_concept = []
  for (const [key, value] of Object.entries(getBirds().images)) {
    if (search_key === "concept") { //Yes I know....
      if (value.concept == null) continue;
      if (value.concept == concept) {
        image_indexes_for_concept.push(key)
      }
    }
    if (search_key === "concept_pred") {
      if (value.concept_pred == null) continue;
      if (value.concept_pred == "void") continue;
      if (value.concept == concept) { value.concept_pred == ""; continue; }  //The image is selected for training
      if (value.concept_pred_probability <= pred_percent) continue;
      if (value.concept_pred == concept) {
        image_indexes_for_concept.push(key)
/*         console.log("value.concept_pred", value.concept_pred)
        console.log("key", key) */
      }
    }
  }
  return image_indexes_for_concept
}

function collapsable() {
  const header_1 = document.getElementById("header_1");
  const content = header_1.nextElementSibling;
  header_1.addEventListener('click', function () {
    if (content.style.display === 'none' || content.style.display === '') {
      content.style.display = 'block';
    } else {
      content.style.display = 'none';
    }
  });
}

/* function discard_changes() {
  fetch('./resources/discard_changes.html')
    .then(response => response.text())
    .then(html => {
      const buttonDiv = document.getElementById("button_div");
      const modalContainer = document.createElement('div');
      modalContainer.innerHTML = html;
      buttonDiv.appendChild(modalContainer);
      var myInput = document.getElementById('myInput_discard_changes');
      var myModal = document.getElementById('myModal_discard_changes');
      document.getElementById('myModal_discard_changes').addEventListener('shown.bs.modal', handleModalFocus);
      myInput.innerHTML = "Discard changes";
      document.getElementById("discard_changes").addEventListener("click", handleButtonClicks);
    });
} */

/**
 * Clears the concept of all images matching the given concept.
 * Removes the concept from the array of concepts in the metadata.
 * @param {string} concept - The concept to clear.
 */
export function clear_concept(concept) {
  getBirds().images.forEach((item) => {
    if (item.concept == concept) item.concept = "void";
  });
  //remove concept from the array getMetadata().concept
  getMetadata().concept = getMetadata().concept.filter(item => item !== concept);
}

export function loggedIn(user) {
  if (user) {
    console.log("Logged in (onAuthStateChanged)", user.displayName);
    get_all_data_reload_page(user.uid);
    collapsable();
  } else {
    console.log("Not logged in (onAuthStateChanged)");
  }
}

