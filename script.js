import { get_training_sets_metadata } from "./firebase-module.js"; predict_class
import { read_training_data } from "./firebase-module.js";
import { save_new_training_set_to_databasebase } from "./firebase-module.js";
import { downloadJson } from "./firebase-module.js";
import { update_training_set } from "./firebase-module.js";
import { getDatabase, set, user, auth } from "./firebase-module.js";
import { setDefaultProject } from "./firebase-module.js";
import { delete_training_set } from "./firebase-module.js";
import { train_model } from "./train_model.js";
import { predict_class } from "./predict.js";
export const debug = true;
const imageFolder = 'ottenbyresized/'
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
    "number_of_void_images": findImageIndexWithConcept("concept","void").length,
    //"number_of_predicted_images": findImageIndexWithPredictedConcept("concept_pred").length
  }
  //Add statistics for concepts
  //get the sum of all concepts in getBirds().images.concept
  unique_concepts.forEach((concept) => {
    statistics[concept] = findImageIndexWithConcept("concept",concept).length
  });
  //Add statistics for predicted concepts
  //check so entries in getBirds().images.concept_pred is not null
  //const unique_concepts = [...new Set(getBirds().images.map(item => item.concept_pred))];

  unique_concepts.forEach((concept) => {
    //console.log('findImageIndexWithConcept("concept_pred",concept)',  findImageIndexWithConcept("concept_pred",concept))
    statistics[concept+"_pred"] = findImageIndexWithConcept("concept_pred",concept).length
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
    text += "Number of human classified images: "+unique_concepts[concept] + ": " + statistics[unique_concepts[concept]] + "<br>";
  }
  for (const concept in unique_concepts) {
    text += "Number of machine predicted images: " + unique_concepts[concept] +": "+ statistics[unique_concepts[concept]+"_pred"] + "<br>";
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
    tooltip.style.display = 'none';
    tooltip.style.position = 'absolute';
    tooltip.style.backgroundColor = 'Whitesmoke';
    tooltip.style.border = '1px solid black';
    tooltip.style.color = 'white';
    tooltip.style.padding = '2px';
    tooltip.style.borderRadius = '4px';
    tooltip.classList.add('fw-normal', 'text-dark');
    tooltip.style.width = '100px';
    tooltip.style.left = '250px';
    tooltip.style.fontFamily = 'Helvetica Neue, Arial, sans-serif';
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
    const ul = document.querySelector('ul.dropdown-menu');
    ul.appendChild(li);
    ul.appendChild(li);
  });
  dropdown.addEventListener("click", dropdownListener);
}

function dropdownListener(event) {
  event.preventDefault()
  if (event.target.tagName === 'A') {
    const a = event.target;
    const key = a.dataset.id
    const title = a.innerHTML
    setDefaultProject(key);
  }
  if (event.target.tagName === 'BUTTON') {
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
  [...document.getElementsByClassName("btn-listener")].forEach((item) => {
    item.removeEventListener("click", handleChildClickButton);
  });
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
  createbuttons("Organise & reload", "Download")
  add_image_container_listener("void", imageContainer)
  //Create a container for each concept 
  try {
    getMetadata().concept.forEach((item) => {
      imageContainer = createContainer(item, "Images labelled " + item);
      populate_container(findImageIndexWithConcept("concept", item), item, imageContainer, false)
      
      populate_container(findImageIndexWithConcept("concept_pred", item), item, imageContainer, true)
      document.getElementById("image_data").appendChild(imageContainer);
      add_image_container_listener(item, imageContainer)
    });
  } catch (error) {
    console.log("No concepts found in metadata")
  }
  displayStatistics();
}

function populate_void_container(data, element) {
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
      rowElement = createRowInGrid(element);
      element.appendChild(rowElement);
      lastRow = row;
    }
    column = i % 12
    createImageItem(rowElement, data.images[item]["image_location"], data.images[item]["concept"], item, false);
    i++;
  });
}

function populate_container(data, concept, element, predicted_concept) {
  let row, lastRow = -1, column, i = 0;
  let rowElement;
  data.forEach((item) => {
    row = Math.trunc((i / 12));
    if (row > lastRow) {
      rowElement = createRowInGrid(element);
      element.appendChild(rowElement);
      lastRow = row;
    }
    column = i % 12
    createImageItem(rowElement, getBirds().images[item]["image_location"], getBirds().images[item]["concept"],item, predicted_concept);
    i++;
  });

}

function add_image_container_listener(id, imageContainer) {
  imageContainer.addEventListener('click', function (event) {
    event.preventDefault(); //Stop reloading
    if (event.target.tagName === 'IMG') {
      const clickedImage = event.target;
      const tooltiptext_e = clickedImage.nextElementSibling;
      const index = getMetadata().concept.indexOf(tooltiptext_e.textContent);
      if (index == -1) {
        tooltiptext_e.textContent = getMetadata().concept[0];
      } else if (index == getMetadata().concept.length - 1) {
        tooltiptext_e.textContent = "";
      } else {
        tooltiptext_e.textContent = getMetadata().concept[index + 1];
      }
      let path = clickedImage.src.split(imageFolder)[1]
      path = decodeURIComponent(path);
      changeConcept(clickedImage.getAttribute('data-image-index'), tooltiptext_e.textContent)
      //findImageIndexWithConcept(tooltiptext_e.textContent) or?
    }
  });
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

function createImageItem(e, path, concept, index, predicted_concept) {
  const row_e = document.createElement('div');
  row_e.classList.add("col-1", "col-pixel-width-80", "image-container", "_tooltip");
  const image_e = document.createElement('img');
  if(predicted_concept){
    image_e.classList.add("img-thumbnail", "p-0", "border", "border-danger"); // Add "border" and "border-danger" classes
  }else{
    image_e.classList.add("img-thumbnail", "p-0"); 
  }
  image_e.src = imageFolder + path;
  image_e.setAttribute('data-image-index', index);
  const tooltip_e = document.createElement('span');
  tooltip_e.classList.add("_tooltiptext")
  tooltip_e.classList.add("visible")
  if (concept != "void") tooltip_e.textContent = concept;
  row_e.appendChild(image_e);
  row_e.appendChild(tooltip_e);
  e.appendChild(row_e)
}

function handleModalFocus(event) {
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
  if (event.target.id == "myModal_discard_changes") {
    document.getElementById('myInput_discard_changes').focus();
  }
}


function handleChildClickButton(event) {
  event.preventDefault();
  console.log("In handleChildClick");
  if (event.target.id == "addConcept") {
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
    const list = document.getElementById("concept_list");
    list.appendChild(createRowInConceptList(newConcept));
    input.value = "";
  }
  if (event.target.id == "saveChanges_save") {
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
  }
  if (event.target.id == "saveChanges_saveAs") {
    const title = document.getElementById("modalTitle_saveAs").innerHTML;
    const description = document.getElementById("modalInput_saveAs").innerHTML;
    getBirds().title = title;
    getBirds().description = description;
    getBirds().version = 1;
    var authData = auth.currentUser;
    const db = getDatabase();
    const key = save_new_training_set_to_databasebase(authData.uid, getBirds());
    if (key) {
      setDefaultProject(authData.uid, key);
    }
  }
  if (event.target.id == "discard_changes") {
    console.log("In discard changes");
    get_training_sets_metadata(auth.currentUser.uid);
  }

}

function createRowInConceptList(newConcept) {
  const li = document.createElement('li');
  li.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-center');
  const input2 = document.createElement('input');
  input2.classList.add('form-control', 'me-1');
  input2.setAttribute('type', 'text');
  //set content in input2
  input2.value = newConcept;
  //set not editable
  input2.setAttribute("readonly", true);
  input2.setAttribute("disabled", true);
  li.appendChild(input2);
  const span = document.createElement('span');
  span.classList.add('badge', 'bg-secondary', 'rounded-pill');
  span.innerHTML = '&#8942;'; // Add kebab icon
  li.appendChild(span);
  return li;
}
function createbuttons(text1, text4) {
  console.log("In createbuttons");
  const buttonDiv = document.createElement("div")
  buttonDiv.classList.add("container", "overflow-auto", "border", "border-2", "rounded-3", "p-1", "m-1", "bg-light", "bg-gradient", "d-flex", "justify-content-center")
  buttonDiv.id = "button_div"
  document.getElementById("image_data").appendChild(buttonDiv);
  let button = document.createElement("button")
  button.type = "button"
  button.classList.add("btn", "btn-secondary", "btn-sm", "me-1")
  button.textContent = text1 //"Organise & reload"
  buttonDiv.appendChild(button)
  button.addEventListener("click", (event) => {
    event.preventDefault();
    build_image_containers();
  });
  button = document.createElement("button")
  button.type = "button"
  button.classList.add("btn", "btn-secondary", "btn-sm", "me-1")
  button.textContent = text4 //"Download"
  buttonDiv.appendChild(button)
  button.addEventListener("click", (event) => {
    event.preventDefault()
    downloadJson(getBirds());
  });
  document.getElementById("image_data").appendChild(buttonDiv);
  edit_concepts();
  firebase_save();
  firebase_save_as();
  discard_changes();
  train_model();
  predict_class();
}

function changeConcept(index, concept) {
  if (concept == "") concept = "void";
  getBirds().images[index].concept = concept;
}

function findImageIndexWithConcept(search_key, concept) {
  //Find all rows with concept in column 1 in birds and return them
  let image_indexes_for_concept = []
  //console.log("getBirds().images[643]", getBirds().images[643])
  for (const [key, value] of Object.entries(getBirds().images)) {
    if (search_key === "concept") { //Yes I know....
      if (value.concept == null) continue;
      if (value.concept == concept) {
        image_indexes_for_concept.push(key)
      }
    }
    if (search_key === "concept_pred") {
      //console.log("value.concept_pred", value.concept_pred)
      if (value.concept_pred == null) continue;
      if (value.concept_pred == concept) {
        image_indexes_for_concept.push(key)
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

function edit_concepts() {
  var myInput = document.getElementById('myInput_concept');
  var myModal = document.getElementById('myModal_concept');
  if (myModal != null && myInput != null) {
    myModal.remove();
    myInput.remove();
  }
  fetch('./resources/modal_concept.html')
    .then(response => response.text())
    .then(html => {
      const buttonDiv = document.getElementById("button_div");
      const modalContainer = document.createElement('div');
      modalContainer.innerHTML = html;
      buttonDiv.appendChild(modalContainer);
      var myInput = document.getElementById('myInput_concept');
      myInput.innerHTML = "Edit concepts";
      document.getElementById("addConcept").addEventListener("click", handleChildClickButton);
      //clean up concept list
      const conceptList = document.getElementById("concept_list")
      const conceptInput = document.getElementById("conceptInput");
      conceptInput.value = "";
      while (conceptList.firstChild) {
        conceptList.removeChild(conceptList.lastChild);
      }
      try {
        getMetadata().concept.forEach((item) => {
          //list.appendChild();
          const conceptRow = createRowInConceptList(item);
          conceptList.appendChild(conceptRow);
        });
        //Show a menu when clicking on the kebab icon
        conceptList.addEventListener("click", (event) => {
          event.preventDefault()
          if (event.target.tagName === 'SPAN') {
            const kebab = event.target;
            const concept = kebab.parentElement.textContent;
            //remove all other menus
            const menus = document.getElementsByClassName('menu_class');
            [...menus].forEach((item) => {
              item.remove();
            });
            //show a hovering meny with edit and delete
            const menu = document.createElement('div');
            menu.classList.add('list-group', 'position-absolute', 'd-flex', 'flex-column', 'align-items-end', "menu_class");
            menu.style.left = event.clientX;
            menu.style.top = event.clientY;
            menu.style.zIndex = 1;
            menu.style.width = '100px';
            menu.style.backgroundColor = 'Whitesmoke';
            menu.style.border = '1px solid black';
            menu.style.color = 'white';
            menu.style.padding = '2px';
            menu.style.borderRadius = '4px';
            menu.classList.add('fw-normal', 'text-dark');
            menu.style.fontFamily = 'Helvetica Neue, Arial, sans-serif';
            const edit = document.createElement('a');
            edit.classList.add('list-group-item', 'list-group-item-action');
            edit.textContent = 'Edit';
            menu.appendChild(edit);
            const del = document.createElement('a');
            del.classList.add('list-group-item', 'list-group-item-action');
            del.textContent = 'Delete';
            menu.appendChild(del);
            //conceptList.appendChild(menu);
            kebab.appendChild(menu);
            //add event listener to edit
            edit.addEventListener("click", (event) => {
              event.preventDefault();
              console.log("In edit");
              const editButton = event.target;
              const input = editButton.parentElement.parentElement.previousSibling;
              const oldconcept = input.value;
              input.removeAttribute("readonly");
              input.removeAttribute("disabled");
              input.focus();
              input.addEventListener("blur", function () {
                input.setAttribute("readonly", true);
                input.setAttribute("disabled", true);
                //const oldconcept = input.value;
                const newConcept = input.value.charAt(0).toUpperCase() + input.value.slice(1).toLowerCase()
                if (newConcept == "") return;
                console.log("not empty");
                if (getMetadata().concept.includes(newConcept)) {
                  console.log("Concept already exists");
                  //input.value = newConcept;
                  return;
                }
                console.log("Note exists in metadata");
                //remove concept from the array getMetadata().concept
                getMetadata().concept = getMetadata().concept.filter(item => item !== oldconcept);
                input.value = newConcept;
                console.log("getMetadata().concept", getMetadata().concept);
                getMetadata().concept.push(newConcept);
                console.log("getMetadata().concept", getMetadata().concept);
                //change concept with old value to new value on all images
                getBirds().images.forEach((item) => {
                  if (item.concept == oldconcept) item.concept = newConcept;
                });

              });
              input.addEventListener("keydown", (event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  input.setAttribute("readonly", true);
                  input.setAttribute("disabled", true);
                  input.blur();
                }
              });
              kebab.removeChild(menu);
            });
            //add event listener to delete
            del.addEventListener("click", (event) => {
              event.preventDefault()
              console.log("In delete");
              const deleteButton = event.target;
              const input = deleteButton.parentElement.parentElement.previousSibling;
              const result = input.value;
              console.log("result", result);
              clear_concept(input.value)
              console.log("getMetadata().concept", getMetadata().concept);
              //delete row from <ul> list
              const list = input.parentElement.parentElement;
              console.log("list", list);
              list.removeChild(input.parentElement);
              kebab.removeChild(menu);
            });
          }
        });
        //add hover effect on li when hovering over
        conceptList.addEventListener("mouseover", (event) => {
          event.preventDefault()
          if (event.target.tagName === 'LI') {
            event.target.classList.add('list-group-item-secondary');
          }
        });
        //remove hover effect on li when hovering over
        conceptList.addEventListener("mouseout", (event) => {
          event.preventDefault()
          if (event.target.tagName === 'LI') {
            event.target.classList.remove('list-group-item-secondary');
          }
        });
      } catch (error) {
        console.log("No concepts found in metadata")
      }
      document.getElementById("saveChanges_concept").addEventListener("click", (event) => {
        event.preventDefault();
        console.log("In saveChanges_concept");
        //repace all conept inon images that are not in the metadata concept list with "void"
        getBirds().images.forEach((item) => {
          if (!getMetadata().concept.includes(item.concept)) item.concept = "void";
        });
        //rebuild image containers
        build_image_containers();
      });
    });
}

function firebase_save() {
  fetch('./resources/modal_save.html')
    .then(response => response.text())
    .then(html => {
      const buttonDiv = document.getElementById("button_div");
      const modalContainer = document.createElement('div');
      modalContainer.innerHTML = html;
      buttonDiv.appendChild(modalContainer);
      var myInput = document.getElementById('myInput_save')
      myInput.innerHTML = "Save changes to server";
      const modalSubtitle = document.getElementById("modalSubtitle_save");
      modalSubtitle.innerHTML = "Version: " + getMetadata().version;
      const title = document.getElementById("modalTitle_save");
      title.innerHTML = getMetadata().title;
      title.setAttribute("contenteditable", true); // make h5 editable
      title.addEventListener("click", function () {
        title.setAttribute("contenteditable", true);
      });
      title.addEventListener("blur", function () {
        title.setAttribute("contenteditable", false);
      });
      const description = document.getElementById("modalInput_save")
      description.innerHTML = getMetadata().description;
      description.setAttribute("contenteditable", true); // make h5 editable
      description.addEventListener("click", function () {
        description.setAttribute("contenteditable", true);
      });
      description.addEventListener("blur", function () {
        description.setAttribute("contenteditable", false);
      });
      document.getElementById("saveChanges_save").addEventListener("click", handleChildClickButton);
    });
}

function firebase_save_as() {
  fetch('./resources/modal_save_as.html')
    .then(response => response.text())
    .then(html => {
      const buttonDiv = document.getElementById("button_div");
      const modalContainer = document.createElement('div');
      modalContainer.innerHTML = html;
      buttonDiv.appendChild(modalContainer);
      var myInput = document.getElementById('myInput_saveAs')
      document.getElementById('myModal_saveAs').addEventListener('shown.bs.modal', handleModalFocus);
      myInput.innerHTML = "Save as new dataset";
      const modalSubtitle = document.getElementById("modalSubtitle_saveAs");
      modalSubtitle.innerHTML = "Version: " + getMetadata().version;
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
      const description = document.getElementById("modalInput_saveAs")
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
      document.getElementById("saveChanges_saveAs").addEventListener("click", handleChildClickButton);
    });
}

function discard_changes() {
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
      document.getElementById("discard_changes").addEventListener("click", handleChildClickButton);
    });
}

/**
 * Clears the concept of all images matching the given concept.
 * Removes the concept from the array of concepts in the metadata.
 * @param {string} concept - The concept to clear.
 */
function clear_concept(concept) {
  getBirds().images.forEach((item) => {
    if (item.concept == concept) item.concept = "void";
  });
  //remove concept from the array getMetadata().concept
  getMetadata().concept = getMetadata().concept.filter(item => item !== concept);
}



export function loggedIn(user) {
  if (user) {
    console.log("Logged in (onAuthStateChanged)", user.displayName);
    get_training_sets_metadata(user.uid);
    collapsable();
  } else {
    console.log("Not logged in (onAuthStateChanged)");
  }
}

