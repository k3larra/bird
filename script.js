import {get_training_sets_metadata} from "./firebase-module.js";
import {read_training_data} from "./firebase-module.js";
import {save_new_training_set_to_databasebase} from "./firebase-module.js";
import {downloadJson} from "./firebase-module.js";
import {update_training_set} from "./firebase-module.js";
import {getDatabase, set, user,auth} from "./firebase-module.js";
import {setDefaultProject} from "./firebase-module.js";
import {delete_training_set} from "./firebase-module.js";

const imageFolder = 'ottenbyresized/'
let unique_concepts = [] //This is central and needs some more protection....
let deleteModal=null;

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
  unique_concepts=[];
  for (const [key, value] of Object.entries(getBirds().images)) {
    if (value.concept == "void") continue;
    if (unique_concepts.indexOf(value.concept) === -1) unique_concepts.push(value.concept);
  }
  return unique_concepts;
}

/**
 * Returns an object containing statistics about the images and concepts in the application.
 * @returns {Object} An object with the following properties:
 * - number_of_images: The total number of images in the application.
 * - number_of_concepts: The total number of unique concepts associated with the images.
 * - number_of_void_images: The number of images that have the concept "void" associated with them.
 * - [concept]: The number of images that have the specified concept associated with them. This property is repeated for each unique concept.
 */
function getStatistics(){
  let a = updateUniqueConcepts();
  const statistics = {
    "number_of_images": Object.keys(getBirds().images).length,
    "number_of_concepts": unique_concepts.length,
    "number_of_void_images": findImageIndexWithConcept("void").length
  }
  unique_concepts.forEach((concept)=>{
    statistics[concept] = findImageIndexWithConcept(concept).length
  });
  return statistics;
}

/**
 * Displays statistics about the birds.
 * @function
 * @returns {void}
 */
function displayStatistics(){
  document.getElementById("header_1").innerHTML=getBirds().title+"...";
  const statistics = getStatistics();
  let text = getBirds().description+"<br>";
  text += "Version: "+getBirds().version+"<br>";
  text +="Number of images: "+statistics.number_of_images+"<br>";
  text += "Number of concepts: "+statistics.number_of_concepts+"<br>";
  text += "Number of unlabelled images: "+statistics.number_of_void_images+"<br>";
  for (const concept in unique_concepts) {  //Add also for unused concepts in getMetadata().concept ??
    text += unique_concepts[concept]+": "+statistics[unique_concepts[concept]]+"<br>";
  }
  document.getElementById("text_1").innerHTML =text;
}

//Set static texts from jsonfile, instead of hardcoding them (Not used at the moment);
async function populate() {
  let requestURL = 'resources/texts.json';
  let request = new Request(requestURL);
  let response = await fetch(request);
  const texts = await response.json();
  document.getElementById("header_1").innerHTML=texts.header_1;
  document.getElementById("text_1").innerHTML=texts.text_1;
  document.getElementById("link_1").innerHTML=texts.link_1.text;
  document.getElementById("link_1").setAttribute("href",texts.link_1.href);
  document.getElementById("text_2").innerHTML=texts.text_2;
}

export function select_training_data(metadata) {
  console.log("In select_training_data");
  const dropdown = document.getElementById("drop_training");
  dropdown.removeEventListener("click",dropdownListener);
  dropdown.removeEventListener("click",deleteListener);
  let foundDefault = false;
  while (dropdown.firstChild) {
    dropdown.removeChild(dropdown.lastChild);
  }
  setBirds(null);
  setMetadata(null);
  fetch('./resources/delete_confirm.html')
  .then(response => response.text())
  .then(html => {
    //const buttonDiv = document.getElementById("button_div");
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = html;
    const headerElement = document.getElementsByTagName("header")[0];
    console.log("headerElement",headerElement);
    headerElement.appendChild(modalContainer);
    //const deleteModal = document.getElementById('myModal_delete_dataset');
    //console.log("myModal",deleteModal);
    //modalContainer.appendChild(deleteModal);
    //fix content
  });
  //document.addEventListener('DOMContentLoaded', function() {
  metadata.forEach((doc) => {
    const description = doc.val().description;
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.classList.add('dropdown-item');
    a.value = '#';
    a.dataset.id = doc.key;
    a.textContent = doc.val().title;
    li.appendChild(a);
    li.style.display = "flex";
   if(!doc.val().default){
      const button = document.createElement('button');
      button.setAttribute('type', 'button');
      button.id = doc.key;
      button.classList.add('btn','btn-outline-danger','btn-sm');
      button.setAttribute('data-bs-toggle', 'modal');
      button.setAttribute('data-toggle', 'tooltip'); // Enable tooltip
      button.setAttribute('data-title', 'Delete dataset: '+doc.val().title); // Set the tooltip message
      button.setAttribute('data-bs-target', '#myModal_delete_dataset');
      button.setAttribute('data-lhtitle', doc.val().title);
      button.setAttribute('data-lhdescription', doc.val().description);
      button.innerHTML = 'X';
      button.style.display = 'inline-flex';
      //button.innerHTML = '<span aria-hidden="true">&times;</span>';
      console.log("doc.val().title",doc.val().title);
      console.log("doc.val().description",doc.val().description);
      const modal = document.getElementById('modalInput_delete_dataset');
      console.log("modal",modal);
      li.appendChild(button);
       // or button.style.display = 'inline-flex';
      //document.addEventListener('DOMContentLoaded', function() {
      //button.addEventListener('click', () => {
      //  document.getElementById('myModal_delete_dataset').show();
      //});
    }
      //button.addEventListener('click',deleteListener);
      //button.setAttribute('aria-label', 'Close');
      
      //const span = document.createElement('span');
      //span.setAttribute('aria-hidden', 'true');
      //span.innerHTML = '&times;';
      //span.dataset.id = doc.key;
      //button.appendChild(span);
      /* button.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        var authData = auth.currentUser;
        delete_training_set(authData.uid,doc.key); //deletes a training set from the database
      }); */
/*           console.log("doc.val().title",doc.val().title);
        console.log("doc.val().description",doc.val().description);
        const header = document.getElementById('modalInput_delete_dataset');
        header.innerHTML=doc.val().title;
        document.getElementById('modalSubtitle_delete_dataset').innerHTML=doc.val().description;
        //buttonDiv.appendChild(modalContainer);
        //document.addEventListener('DOMContentLoaded', function() {
        //var myModal = document.getElementById('myModal_concept')
        //var myInput = document.getElementById('myInput_delete_dataset');
        //myInput.addEventListener('click', deleteListener);
        var myDeleteButton = document.getElementById('delete_dataset_confirm');
        myDeleteButton.dataset.id=doc.key;
        myDeleteButton.addEventListener('click', deleteListener); */

   //}  
    
    //drop_training
    if(doc.val().default){
      foundDefault = true;
      _metadata = doc.val();
      _metadata["training_set_ref"] = doc.key;
      setMetadata(_metadata);
      console.log("metadata: ",getMetadata());
      read_training_data(auth.currentUser.uid,doc.key);
    }
    
    const ul = document.querySelector('ul.dropdown-menu');
    ul.appendChild(li);
    console.log("ul",ul);
    console.log("li",li);
    ul.appendChild(li);
  });
  dropdown.addEventListener("click",dropdownListener);
}

function dropdownListener(event){
  event.preventDefault()
  if (event.target.tagName === 'A') {
    const a = event.target;
    const key = a.dataset.id
    const title = a.innerHTML
    setDefaultProject(key);
  }
  if(event.target.tagName === 'BUTTON'){
   /*  if (deleteModal==null){
      deleteModal= new bootstrap.Modal(document.getElementById('myModal_delete_dataset'));
      
    } */
    console.log("event.target",event.target.dataset);
    document.getElementById("delete_dataset_confirm").addEventListener("click",deleteListener);
    console.log("In dropdownListener Button",deleteModal);
    document.getElementById("modalTitle_delete").innerHTML=event.target.dataset.lhtitle;
    document.getElementById('modalSubtitle_delete_dataset').innerHTML=event.target.dataset.lhdescription;
    document.getElementById("delete_dataset_confirm").dataset.id=event.target.id;
    //deleteModal.show();
    
  }

}

function deleteListener(event){
  event.stopPropagation();
  event.preventDefault();
  var uid = auth.currentUser.uid;
  console.log("id",uid);
  console.log("dataset_id",event.target.dataset.id);
  delete_training_set(uid,event.target.dataset.id); //deletes a training set from the database
}

export function build_image_containers(){
  console.log("In build_image_containers");
  //Delete all children of main and their listners
  //First make sure that all listeners are removed
  //using the spread operator to convert the HTMLCollection to an array 
  [...document.getElementsByClassName("btn-listener")].forEach((item)=>{
    item.removeEventListener("click", handleChildClickButton);
  });
  [...document.getElementsByClassName("modal")].forEach((item)=>{
    item.remove;
  });
  /* var buttonDiv = document.getElementById("button_div");
  if (buttonDiv!=null){
  buttonDiv.innerHTML = "";
  } */
  const image_data_article = document.getElementById("image_data");
  while (image_data_article.firstChild) {
    image_data_article.lastChild.removeEventListener("click", function(){});
    image_data_article.removeChild(image_data_article.lastChild);
  } 
  let imageContainer = createContainer("void","Label training data using the concepts created above");
  populate_void_container(getBirds(),imageContainer)
  document.getElementById("image_data").appendChild(imageContainer);
  createbuttons("Organise & reload","Download")
  add_image_container_listener("void",imageContainer)
  //Create a container for each concept 
  try {
    getMetadata().concept.forEach((item)=>{
      imageContainer = createContainer(item,"Images labelled "+item);
      populate_container(findImageIndexWithConcept(item),item,imageContainer)
      document.getElementById("image_data").appendChild(imageContainer);
      add_image_container_listener(item,imageContainer)
    });
  } catch (error) {       
    console.log("No concepts found in metadata")
  }
  displayStatistics();
}

function populate_void_container(data,element) {
  const maxNumbrItems = 72;
  let row,lastRow=-1,column,i=0;
  let rowElement;
  let randomNumbers = [];
  while (randomNumbers.length < maxNumbrItems) {
    let r = Math.floor(Math.random() * Object.keys(data.images).length) + 1;
    //Here check if data.images[r].concept is not equal to "void" then get new number
    //Check if concept is not null or void and if so skip it
    try {
      if (data.images[r].concept != "void") continue;
      
      if (data.images[r]["image_location"].includes("/_")) {
        console.log("Skipping image with _ in name", data.images[r]["image_location"])
        continue
      };
    } catch (error) { continue; }
    if (randomNumbers.indexOf(r) === -1) randomNumbers.push(r);
  }
  randomNumbers.forEach((item)=>{
    row=Math.trunc((i/12));
    if (row>lastRow){
      rowElement = createRowInGrid(element);
      element.appendChild(rowElement);
      lastRow=row;
    }
    column=i%12
    createImageItem(rowElement,data.images[item]["image_location"],data.images[item]["concept"],item);
    i++;
  });
}

function populate_container(data,concept,element) {
  let row,lastRow=-1,column,i=0;
  let rowElement;
  //iterate over data
  data.forEach((item)=>{
    row=Math.trunc((i/12));
    if (row>lastRow){
      rowElement = createRowInGrid(element);
      element.appendChild(rowElement);
      lastRow=row;
    }
    column=i%12
    createImageItem(rowElement,getBirds().images[item]["image_location"],getBirds().images[item]["concept"],item);
    i++;
  });
 
}

function add_image_container_listener(id,imageContainer){
  // const imageContainer = document.getElementById(id);
  imageContainer.addEventListener('click', function(event) {
    event.preventDefault(); //Stop reloading
    if (event.target.tagName === 'IMG') {
      const clickedImage = event.target;
      const tooltiptext_e = clickedImage.nextElementSibling;
      const index = getMetadata().concept.indexOf(tooltiptext_e.textContent);
      if (index == -1){
        tooltiptext_e.textContent=getMetadata().concept[0];
      } else if (index == getMetadata().concept.length-1){
        tooltiptext_e.textContent="";
      } else {
        tooltiptext_e.textContent=getMetadata().concept[index+1];
      }
      let path = clickedImage.src.split(imageFolder)[1]
      //replace all letter 'a' with blank in path
      path = decodeURIComponent(path);
      changeConcept(clickedImage.getAttribute('data-image-index'),tooltiptext_e.textContent)
      findImageIndexWithConcept(tooltiptext_e.textContent)
    }
  });
  
}

/*Create containers and content*/
function createContainer(id,header){
  const section = document.createElement("section")
  section.classList.add("container","overflow-auto","border" ,"border-2","rounded-3","p-1","m-1","bg-light","bg-gradient")
  section.id=id
  section.style="max-width: 960px; max-height: 240px;"
  return section;
}

function createRowInGrid(e){
  const row_e = document.createElement('div');
  row_e.classList.add("row","flex-nowrap","g-0");
  return row_e;
}

function createImageItem(e,path,concept,index){
  const row_e = document.createElement('div');
  row_e.classList.add("col-1","col-pixel-width-80","image-container","_tooltip");
  const image_e = document.createElement('img');
  image_e.classList.add("img-thumbnail","p-0");
  image_e.src=imageFolder+path;
  image_e.setAttribute('data-image-index',index);
  const tooltip_e = document.createElement('span');
  tooltip_e.classList.add("_tooltiptext")
  tooltip_e.classList.add("visible")
  if (concept != "void") tooltip_e.textContent=concept; 
  row_e.appendChild(image_e);
  row_e.appendChild(tooltip_e);
  e.appendChild(row_e)
}

function handleModalFocus(event) {
  event.preventDefault();
  if (event.target.id == "myModal_concept") {
    document.getElementById('myInput_concept').focus();
  }
  if(event.target.id == "myModal_save"){
    document.getElementById('myInput_save').focus();
  }
  if(event.target.id == "myModal_saveAs"){
    document.getElementById('myInput_saveAs').focus();
  }
  if(event.target.id == "myModal_discard_changes"){
    document.getElementById('myInput_discard_changes').focus();
  }
}


function handleChildClickButton(event) {
  event.preventDefault();
  console.log("In handleChildClick");
  if (event.target.id == "addConcept") {
    //console.log("in edit Concepts");
    const input = document.getElementById("conceptInput")
    const option = document.createElement("option")
    const dropdown = document.getElementById("inputGroupSelect03")
    if (input.value == "") return
    for (let i = 0; i < dropdown.length; i++) {
      if (dropdown[i].value == input.value) return
    };
    var ret = "";
    input.value, ret = input.value.charAt(0).toUpperCase() + input.value.slice(1).toLowerCase()
    //unique_concepts.push(ret)
    console.log("getMetadata()", getMetadata())
    if (getMetadata().concept == null) {
      getMetadata().concept = []
    };
    getMetadata().concept.push(ret);
    if (input.value.length > 10) {
      input.value = input.value.slice(0, 10) + "..."
    }
    option.value = ret
    option.text = input.value
    input.value = ""
    dropdown.appendChild(option)
  }
  if (event.target.id == "saveChanges_save") {
    //console.log("firebase_save");
    const title = document.getElementById("modalTitle_save").innerHTML;
    const description = document.getElementById("modalInput_save").innerHTML;
    //console.log("In SAVE")
    //console.log(document.getElementById("modalInput_save").innerHTML);
    //console.log(document.getElementById("modalTitle_save").innerHTML);
    getMetadata().title = title;
    getMetadata().description = description;
    getBirds().title = title;
    getBirds().description = description;

    let v = parseInt(getBirds().version);
    getBirds().version = (v + 1).toString();
    getMetadata().version = (v + 1).toString();
    //console.log("version", getMetadata().version)
    var authData = auth.currentUser;
    const db = getDatabase();
    //console.log("authData: ", authData.uid)
    if (authData) {
      update_training_set(authData.uid, getMetadata(), getBirds())
    }
  }
  if(event.target.id == "saveChanges_saveAs"){
    //console.log("in firebase_save_as");
    const title = document.getElementById("modalTitle_saveAs").innerHTML;
    const description = document.getElementById("modalInput_saveAs").innerHTML;
    //getMetadata().title = title;
    //getMetadata().description = description;
    getBirds().title = title;
    getBirds().description = description;
    getBirds().version = 1;
    //getMetadata().version = 1;
    var authData = auth.currentUser;
    const db = getDatabase();
    console.log("authData: ", authData.uid)
      const key = save_new_training_set_to_databasebase(authData.uid, getBirds());
      if (key) {
        setDefaultProject(authData.uid, key);
      }
  }
  if (event.target.id == "discard_changes") {
    console.log("In discard changes");
    get_training_sets_metadata(auth.currentUser.uid);
    //build_image_containers();
  }

}

function createbuttons(text1,text4){
  console.log("In createbuttons");
  const buttonDiv = document.createElement("div")
  buttonDiv.classList.add("container","overflow-auto","border" ,"border-2","rounded-3","p-1","m-1","bg-light","bg-gradient","d-flex", "justify-content-center")
  buttonDiv.id  = "button_div"
  document.getElementById("image_data").appendChild(buttonDiv);
  let button = document.createElement("button")
  button.type="button"
  button.classList.add("btn","btn-secondary","btn-sm","me-1")
  button.textContent=text1 //"Organise & reload"
  buttonDiv.appendChild(button)
  //parent.appendChild(div)
  button.addEventListener("click",(event)=>{
    event.preventDefault()
    build_image_containers()
  });
  button = document.createElement("button")
  button.type="button"
  button.classList.add("btn","btn-secondary","btn-sm","me-1")
  button.textContent=text4 //"Download"
  buttonDiv.appendChild(button)
      button.addEventListener("click",(event)=>{
        event.preventDefault()
        downloadJson(getBirds());
      });
  document.getElementById("image_data").appendChild(buttonDiv);
  edit_concepts();
  firebase_save();
  firebase_save_as(); 
  discard_changes();
}

function changeConcept(index,concept){
  if (concept == "") concept = "void";  
  getBirds().images[index].concept = concept;
}

function findImageIndexWithConcept(concept){
  //Find all rows with concept in column 1 in birds and return them
  let image_indexes_for_concept = []
  for (const [key, value] of Object.entries(getBirds().images)) {
    if (value.concept == concept){
      image_indexes_for_concept.push(key)
    }
  }
  return image_indexes_for_concept
}

function collapsable(){
  const header_1 = document.getElementById("header_1");
  const content = header_1.nextElementSibling;
  header_1.addEventListener('click', function () {
    if (content.style.display === 'none' || content.style.display === '') {
      content.style.display = 'block';
      //header_1.innerHTML = header_1.innerHTML;
    } else {
      content.style.display = 'none';
      //header_1.innerHTML = "Select and label training data...";
    }
  });
}

function edit_concepts(){
  var myInput = document.getElementById('myInput_concept');
  var myModal = document.getElementById('myModal_concept');
  console.log("EXIST myModal",myModal);
  console.log("EXIST myInput",myInput);
  if(myModal != null&&myInput != null){
    myModal.remove();
    myInput.remove();
  }
  fetch('./resources/modal_concept.html')
  .then(response => response.text())
  .then(html => {
    const buttonDiv = document.getElementById("button_div");
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = html;
    console.log("modalContainer",modalContainer);
    buttonDiv.appendChild(modalContainer);
    console.log("perent",parent);
    //document.addEventListener('DOMContentLoaded', function() {
    //var myModal = document.getElementById('myModal_concept')
    var myInput = document.getElementById('myInput_concept');
    //console.log("myModal",myModal);
    console.log("myInput",myInput);
    /* myModal.addEventListener('shown.bs.modal', function () {
        myInput.focus()
    }); */
    myInput.innerHTML = "Edit concepts";
    const dropdown = document.getElementById("inputGroupSelect03")
    //document.getElementById("concept_section").style.display = "none"; //REMOVE LATER
    //clear dropdown and populate with unique concepts
    //Here is a flat concept hierachy were all concepts need to be excluding and not ovelapping.
    while (dropdown.firstChild) {
      dropdown.removeChild(dropdown.lastChild);
    }
    //unique_concepts.forEach((item)=>{
    try {
      getMetadata().concept.forEach((item)=>{
        const option = document.createElement("option")
        option.value = item
        option.text = item
        dropdown.appendChild(option)
      });
    } catch (error) { 
      console.log("No concepts found in metadata")
    }
    document.getElementById("addConcept").addEventListener("click",handleChildClickButton);
/*     button.addEventListener("click",(event)=>{
      event.preventDefault();
      console.log("in edit Concepts");
      const input = document.getElementById("conceptInput")
      const option = document.createElement("option")
      if (input.value == "") return
      for (let i=0; i<dropdown.length; i++){
        if (dropdown[i].value == input.value) return
      };
      var ret="";
      input.value,ret = input.value.charAt(0).toUpperCase() + input.value.slice(1).toLowerCase()
      //unique_concepts.push(ret)
      console.log("getMetadata()",getMetadata())
      getMetadata().concept.push(ret);
      if (input.value.length > 10) input.value = input.value.slice(0,10) + "..."
      option.value = ret
      option.text = input.value
      input.value = ""
      dropdown.appendChild(option)
    }); */
  
    dropdown.addEventListener("click",(event)=>{
      event.preventDefault()
      const input = document.getElementById("conceptInput")
      const result = dropdown.value
    });
  //});
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
      //document.addEventListener('DOMContentLoaded', function () {
        //var myModal = document.getElementById('myModal_save')
        var myInput = document.getElementById('myInput_save')
        //console.log("myModal",myModal);
      console.log("myInput",myInput);
        /* myModal.addEventListener('shown.bs.modal', function () {
          myInput.focus()
        }); */
        myInput.innerHTML = "Save changes to server";
        //document.getElementById("saveChanges").innerHTML = "Update dataset on server";
        const modalSubtitle = document.getElementById("modalSubtitle_save");
        modalSubtitle.innerHTML = "Version: " + getMetadata().version;
        const title = document.getElementById("modalTitle_save");
        title.innerHTML = getMetadata().title;
        title.setAttribute("contenteditable", true); // make h5 editable
        title.addEventListener("click", function () {
          title.setAttribute("contenteditable", true);
          //title.focus();
        });
        title.addEventListener("blur", function () {
          title.setAttribute("contenteditable", false);
        });
        const description = document.getElementById("modalInput_save")
        description.innerHTML = getMetadata().description;
        description.setAttribute("contenteditable", true); // make h5 editable
        description.addEventListener("click", function () {
          description.setAttribute("contenteditable", true);
          //title.focus();
        });
        description.addEventListener("blur", function () {
          description.setAttribute("contenteditable", false);
        });
        document.getElementById("saveChanges_save").addEventListener("click",handleChildClickButton);
        /* document.getElementById("saveChanges_save").addEventListener("click", (event) => {
          event.preventDefault()
          console.log("firebase_save");
          const title = document.getElementById("modalTitle_save").innerHTML;
          const description = document.getElementById("modalInput_save").innerHTML;
          console.log("In SAVE")
          console.log(document.getElementById("modalInput_save").innerHTML);
          console.log(document.getElementById("modalTitle_save").innerHTML);
          getMetadata().title = title;
          getMetadata().description = description;
          getBirds().title = title;
          getBirds().description = description;

          let v = parseInt(getBirds().version);
          getBirds().version = (v + 1).toString();
          getMetadata().version = (v + 1).toString();
          console.log("version", getMetadata().version)
          var authData = auth.currentUser;
          const db = getDatabase();
          console.log("authData: ", authData.uid)
          if (authData) {
            update_training_set(authData.uid, getMetadata(), getBirds())
          }
        }); */
      //});
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
      //document.addEventListener('DOMContentLoaded', function() {
      //var myModal = document.getElementById('myModal_saveAs')
      var myInput = document.getElementById('myInput_saveAs')
      //console.log("myModal",myModal);
      console.log("myInput",myInput);
      document.getElementById('myModal_saveAs').addEventListener('shown.bs.modal', handleModalFocus);
      /* myModal.addEventListener('shown.bs.modal', function () {
        myInput.focus()
      }); */
      myInput.innerHTML = "Save as new dataset";
      const modalSubtitle = document.getElementById("modalSubtitle_saveAs");
      modalSubtitle.innerHTML = "Version: " + getMetadata().version;
      const title = document.getElementById("modalTitle_saveAs");
      title.innerHTML = getMetadata().title;
      title.setAttribute("contenteditable", true); // make h5 editable
      title.addEventListener("click", function () {
        title.setAttribute("contenteditable", true);
      });
      title.addEventListener("blur", function () {
        title.setAttribute("contenteditable", false);
      });
      const description = document.getElementById("modalInput_saveAs")
      description.innerHTML = getMetadata().description;
      description.setAttribute("contenteditable", true); // make h5 editable
      description.addEventListener("click", function () {
        description.setAttribute("contenteditable", true);
      });
      description.addEventListener("blur", function () {
        description.setAttribute("contenteditable", false);
      });
      document.getElementById("saveChanges_saveAs").addEventListener("click",handleChildClickButton);
      /* document.getElementById("saveChanges_saveAs").addEventListener("click", (event) => {
        event.preventDefault()
        console.log("in firebase_save_as");
        const title = document.getElementById("modalTitle_saveAs").innerHTML;
        const description = document.getElementById("modalInput_saveAs").innerHTML;
        getMetadata().title = title;
        getMetadata().description = description;
        getBirds().title = title;
        getBirds().description = description;
        getBirds().version = 1;
        getMetadata().version = 1;
        var authData = auth.currentUser;
        const db = getDatabase();
        console.log("authData: ", authData.uid)
          const key = save_new_training_set_to_databasebase(authData.uid, getBirds());
          if (key) {
            setDefaultProject(authData.uid, key);
          }
      }); */
    //});
    });
}

function discard_changes(){
  fetch('./resources/discard_changes.html')
  .then(response => response.text())
  .then(html => {
    const buttonDiv = document.getElementById("button_div");
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = html;
    console.log("modalContainer",modalContainer);
    buttonDiv.appendChild(modalContainer);
    //document.addEventListener('DOMContentLoaded', function() {
      var myInput = document.getElementById('myInput_discard_changes');
      var myModal = document.getElementById('myModal_discard_changes');
      console.log("myModal",myModal);
      console.log("myInput",myInput);
     /*  myModal.addEventListener('shown.bs.modal', function () {
          myInput.focus()
      }); */
      document.getElementById('myModal_discard_changes').addEventListener('shown.bs.modal', handleModalFocus);
      myInput.innerHTML = "Discard changes";
      console.log("Before event listener");
      document.getElementById("discard_changes").addEventListener("click",handleChildClickButton);
      /* document.getElementById("discard_changes").addEventListener("click",(event)=>{
        event.preventDefault();
        console.log("In discard changes");
        get_training_sets_metadata(auth.currentUser.uid);
        //build_image_containers();
      }); */
    });
  //});
}

function clear_concept(concept){
/*   console.log ("getMeta",getMetadata());
  let clear = getMetadata().concept;
  //let clear = updateUniqueConcepts();
  console.log ("clear",clear);
  if (clear.length == 0) return;
  clear.forEach((item)=>{
    clear_concept(item);
  }); */
  getBirds().images.forEach((item)=>{
    if (item.concept == concept) item.concept = "void";
  });
  //remove concept from the array getMetadata().concept
  getMetadata().concept = getMetadata().concept.filter(item => item !== concept);
}



export function loggedIn(user){
  if(user){
    console.log("Logged in (onAuthStateChanged)",user.displayName);
    get_training_sets_metadata(user.uid);
    //populate_json();
    //listeners()
    collapsable();
  }else{
    console.log("Not logged in (onAuthStateChanged)");
  }
}

