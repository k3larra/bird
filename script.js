import { get_training_sets_metadata } from "./firebase-module.js";
import { read_training_data } from "./firebase-module.js";
import { save_new_training_set_to_databasebase } from "./firebase-module.js";
import { downloadJson } from "./firebase-module.js";
import { update_training_set } from "./firebase-module.js";
import {getDatabase, set, user,auth} from "./firebase-module.js";
import {setDefaultProject} from "./firebase-module.js";

let testjson=  {"description": "Training data for the Crafoord Crafoord AI project",
"version": "1.0",
"images": {
    "0": {
        "image_location": "ACSCI\\HÖST\\10\\CP 41137 ACSCI 10 2011-10-02\\DSC_7901.JPG",
        "concept": "bird"
    },
    "1": {
        "image_location": "ACSCI\\HÖST\\10\\CP 41137 ACSCI 10 2011-10-02\\DSC_7902.JPG",
        "concept": "horse"
    },
    "2": {
        "image_location": "ACSCI\\HÖST\\10\\CP 41137 ACSCI 10 2011-10-02\\DSC_7903.JPG",
        "concept": "dude"
    },
    "3": {
        "image_location": "ACSCI\\HÖST\\10\\CP 41137 ACSCI 10 2011-10-02\\DSC_7904.JPG",
        "concept": "void"
    },
    "4": {
        "image_location": "ACSCI\\HÖST\\10\\CP 41137 ACSCI 10 2011-10-02\\DSC_7906.JPG",
        "concept": "donkey"
    }
  }
}

///////////////////////////////////////////////////////////
const jsonFilePath = './ottenbyresized/birds.json'
const imageFolder = 'ottenbyresized/'
const unique_concepts = [] //This is central aand needs some more protection....

let _metadata = null;
export function getMetadata() {
  return _metadata;
}
export function setMetadata(value) {
  // Add any additional logic or validation here
  _metadata = value;
  console.log(getMetadata());
}

let _birds = null;
export function getBirds() {
  return _birds;
}
export function setBirds(value) {
  // Add any additional logic or validation here
  _birds = value;
  console.log(getStatistics());
}


function updateUniqueConcepts() {
  for (const [key, value] of Object.entries(getBirds().images)) {
    if (value.concept == "void") continue;
    if (unique_concepts.indexOf(value.concept) === -1) unique_concepts.push(value.concept);
  }
  return unique_concepts;
}

function getStatistics(){
  updateUniqueConcepts();
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
  for (const concept in unique_concepts) {
    text += unique_concepts[concept]+": "+statistics[unique_concepts[concept]]+"<br>";
  }
  
  document.getElementById("text_1").innerHTML =text;
}

//Set static texts (Not used at the moment)
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



async function populate_json() {
  // fetch(jsonFilePath)
  // .then(response => {
  //     if (!response.ok) {throw new Error("Network error");}
  //     return response.json(); 
  // }).then(data => 
  //     birds = data;
  //     build_image_containers();
  // })
  // .catch(error => {console.error("Fetch problem:", error);});
  // build_image_containers();
  get_training_sets_metadata("vKFIvuQHJbMDmdaACZZMyRJXyMs1")
  //read_training_data("vKFIvuQHJbMDmdaACZZMyRJXyMs1","-NeS3F4ipXpjEBnuEAqa");
}

export function select_training_data(metadata,uid) {
  const dropdown = document.getElementById("drop_training")
  while (dropdown.firstChild) {
    dropdown.removeChild(dropdown.lastChild);
  }
  metadata.forEach((doc) => {
    const description = doc.val().description;
    console.log("Key: ",doc.key);
    console.log("TITLE: ",doc.val().title);
    console.log("description: ", description);
    console.log("version: ",doc.val().version);
    console.log("default: ",doc.val().default);
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.classList.add('dropdown-item');
    a.value = '#';
    a.dataset.id = doc.key;
    a.textContent = doc.val().title+":"+doc.val().default;
    li.appendChild(a);
    const ul = document.querySelector('ul.dropdown-menu');
    ul.appendChild(li);
    //drop_training
    if(doc.val().default){
      // read_training_data(uid,doc.key);
      _metadata = doc.val();
      _metadata["training_set_ref"] = doc.key;
      setMetadata(_metadata);
      read_training_data("vKFIvuQHJbMDmdaACZZMyRJXyMs1",doc.key);
    }
   
  });
  
  dropdown.addEventListener("click",(event)=>{  
    event.preventDefault()
    const a = event.target;
    const key = a.dataset.id
    const title = a.innerHTML
    console.log(key,title)
    // read_training_data(uid,doc.key);
    read_training_data("vKFIvuQHJbMDmdaACZZMyRJXyMs1",key);
    setDefaultProject(key);
  });
  // fetch('./resources/modal.html')
  // .then(response => response.text())
  // .then(html => {
  //   const modalContainer = document.createElement('div');
  //   modalContainer.innerHTML = html;
  //   document.body.appendChild(modalContainer);
  //   var myModal = document.getElementById('exampleModal')
  //   var myInput = document.getElementById('myInput')
  //   myModal.addEventListener('shown.bs.modal', function () {
  //       myInput.focus()
  //   })
  // });
  // console.log("metadata: ",metadata)
  // for (const key in metadata) {
  //   if (Object.hasOwnProperty.call(metadata, key)) {
  //     const value = metadata[key];
  //     console.log(key, value);
  //   }
  // }
}

export function build_image_containers(){
  //Delete all children of main and their listners
  const image_data_article = document.getElementById("image_data");
  while (image_data_article.firstChild) {
    image_data_article.lastChild.removeEventListener("click", function(){});
    image_data_article.removeChild(image_data_article.lastChild);
  } 
  updateUniqueConcepts();
  const dropdown = document.getElementById("inputGroupSelect03")
  document.getElementById("concept_section").style.display = "none"; //REMOVE LATER
  //clear dropdown and populate with unique concepts
  //Here is a flat concept hierachy were all concepts need to be excluding and not ovelapping.
  while (dropdown.firstChild) {
    dropdown.removeChild(dropdown.lastChild);
  }
  unique_concepts.forEach((item)=>{
    const option = document.createElement("option")
    option.value = item
    option.text = item
    dropdown.appendChild(option)
  });
  //Create and populate a container for all "void" images (Does not belong to any used concept)
 
  let imageContainer = createContainer("void","Label training data using the concepts created above");
  populate_void_container(getBirds(),imageContainer)
  document.getElementById("image_data").appendChild(imageContainer);
  createbuttons("Organise & reload","Save","Save as...","Download")
  
  add_image_container_listener("void",imageContainer)
  //Create a container for each concept 
  unique_concepts.forEach((item)=>{
    imageContainer = createContainer(item,"Images labelled "+item);
    populate_container(findImageIndexWithConcept(item),item,imageContainer)
    document.getElementById("image_data").appendChild(imageContainer);
    add_image_container_listener(item,imageContainer)
  });
  displayStatistics();
}

function populate_void_container(data,element) {
  const maxNumbrItems = 36;
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
      const index = unique_concepts.indexOf(tooltiptext_e.textContent);
      //console.log("Index:"+index+" length:"+unique_concepts.length+" unique_concepts:"+unique_concepts)
      if (index == -1){
        tooltiptext_e.textContent=unique_concepts[0];
      } else if (index == unique_concepts.length-1){
        tooltiptext_e.textContent="";
      } else {
        tooltiptext_e.textContent=unique_concepts[index+1];
      }
      let path = clickedImage.src.split(imageFolder)[1]
      //replace all letter 'a' with blank in path
      path = decodeURIComponent(path);
      changeConcept(clickedImage.getAttribute('data-image-index'),tooltiptext_e.textContent)
      findImageIndexWithConcept(tooltiptext_e.textContent)
    }
  });
  
}
/*************/
function listeners(){
  //dropdown
  const button = document.getElementById("addConcept")
  const dropdown = document.getElementById("inputGroupSelect03")
  button.addEventListener("click",(event)=>{
    event.preventDefault()
    const input = document.getElementById("conceptInput")
    const option = document.createElement("option")
    if (input.value == "") return
    for (let i=0; i<dropdown.length; i++){
      if (dropdown[i].value == input.value) return
    };
    var ret="";
    input.value,ret = input.value.charAt(0).toUpperCase() + input.value.slice(1).toLowerCase()
    unique_concepts.push(ret)
    if (input.value.length > 10) input.value = input.value.slice(0,10) + "..."
    option.value = ret
    option.text = input.value
    input.value = ""
    dropdown.appendChild(option)
  });

  dropdown.addEventListener("click",(event)=>{
    event.preventDefault()
    const input = document.getElementById("conceptInput")
    const result = dropdown.value
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
  //console.log(concept)
  if (concept != "void") tooltip_e.textContent=concept; 
  row_e.appendChild(image_e);
  row_e.appendChild(tooltip_e);
  e.appendChild(row_e)
}

function createbuttons(text1,text2,text3,text4){
  const div = document.createElement("div")
  div.classList.add("container","overflow-auto","border" ,"border-2","rounded-3","p-1","m-1","bg-light","bg-gradient","d-flex", "justify-content-center")
  div.id  = "button_div.."
  let button = document.createElement("button")
  button.type="button"
  button.classList.add("btn","btn-secondary","btn-sm","me-1")
  button.textContent=text1
  div.appendChild(button)
  //parent.appendChild(div)
  button.addEventListener("click",(event)=>{
    event.preventDefault()
    build_image_containers()
    });
  // //update dataset buttom
  firebase_save(div);
  firebase_save_as(div);
  
  // button = document.createElement("button")
  // button.type="button"
  // button.id="myInput"
  // button.classList.add("btn","btn-secondary","btn-sm","me-1")
  // button.textContent=text2
  // div.appendChild(button)
  // button.addEventListener("click",(event)=>{
  //   event.preventDefault()
  //   var authData = auth.currentUser;
  //   const db = getDatabase();
  //   console.log("authData: ",authData.uid)
  //   if (authData) { 
  //     update_training_set(authData.uid,"-NeS3F4ipXpjEBnuEAqa",getBirds())
  //     //click on button to update database Organise images and load new unlabelled images.

  //   }else{console.log("Not logged in")}
  // });  
  //save as new dataset buttom
  
  // button = document.createElement("button")
  // button.type="button"
  // button.classList.add("btn","btn-secondary","btn-sm","me-1")
  // button.textContent=text3
  // div.appendChild(button)
  // button.addEventListener("click",(event)=>{
  //   event.preventDefault()
  //   var authData = auth.currentUser;
  //   const db = getDatabase();
  //   console.log(authData.uid)
  //   if (authData) { 
  //     save_new_training_set_to_databasebase(authData.uid,getBirds())
  //   }else{console.log("Not logged in")}
  // });  
  //download json   
  button = document.createElement("button")
  button.type="button"
  button.classList.add("btn","btn-secondary","btn-sm","me-1")
  button.textContent=text4
  div.appendChild(button)
      button.addEventListener("click",(event)=>{
        event.preventDefault()
        downloadJson(getBirds());
      });
  document.getElementById("image_data").appendChild(div);
  //parent.appendChild(div)      
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

function firebase_save(parent){
  fetch('./resources/modal_save.html')
  .then(response => response.text())
  .then(html => {
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = html;
    parent.appendChild(modalContainer);
    var myModal = document.getElementById('myModal_save')
    var myInput = document.getElementById('myInput_save')
    myModal.addEventListener('shown.bs.modal', function () {
        myInput.focus()
    });
    myInput.innerHTML = "Save";
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

    document.getElementById("saveChanges_save").addEventListener("click", (event) => {
      event.preventDefault()
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
         update_training_set(authData.uid, getMetadata().training_set_ref, getBirds())
      }
      console.log("metadata: ", getMetadata())
      //cast div to modal to bootstrap modal
      // var myModal = document.getElementById('exampleModal')
      // const bootstrapModal = new bootstrap.Modal(myModal);
      // bootstrapModal.hide();
      //from stackoverflow
    });
  });
}

function firebase_save_as(parent) {
  fetch('./resources/modal_save_as.html')
    .then(response => response.text())
    .then(html => {
      const modalContainer = document.createElement('div');
      modalContainer.innerHTML = html;
      parent.appendChild(modalContainer);
      var myModal = document.getElementById('myModal_saveAs')
      var myInput = document.getElementById('myInput_saveAs')
      myModal.addEventListener('shown.bs.modal', function () {
        myInput.focus()
      });
      myInput.innerHTML = "Save as";
      //document.getElementById("saveChanges").innerHTML = "Save as new dataset on server";
      const modalSubtitle = document.getElementById("modalSubtitle_saveAs");
      modalSubtitle.innerHTML = "Version: " + getMetadata().version;
      const title = document.getElementById("modalTitle_saveAs");
      title.innerHTML = getMetadata().title;
      title.setAttribute("contenteditable", true); // make h5 editable
      title.addEventListener("click", function () {
        title.setAttribute("contenteditable", true);
        //title.focus();
      });
      title.addEventListener("blur", function () {
        title.setAttribute("contenteditable", false);
      });
      const description = document.getElementById("modalInput_saveAs")
      description.innerHTML = getMetadata().description;
      description.setAttribute("contenteditable", true); // make h5 editable
      description.addEventListener("click", function () {
        description.setAttribute("contenteditable", true);
        //title.focus();
      });
      description.addEventListener("blur", function () {
        description.setAttribute("contenteditable", false);
      });

      document.getElementById("saveChanges_saveAs").addEventListener("click", (event) => {
        event.preventDefault()
        const title = document.getElementById("modalTitle_saveAs").innerHTML;
        const description = document.getElementById("modalInput_saveAs").innerHTML;
        console.log("In SAVE AS")
        console.log(document.getElementById("modalInput_saveAs").innerHTML);
        console.log(document.getElementById("modalTitle_saveAs").innerHTML);

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
            //get_training_sets_metadata(userID);
            //read_training_data(authData.uid, key);
          }
        console.log("metadata: ", getMetadata())
      });
    });
}
export function loggedIn(user){
  
  if(user){
    //get_training_sets_metadata(user.uid)
    console.log("Logged in (onAuthStateChanged)",user.displayName);
    populate_json()
    listeners()
    collapsable();
  }else{
    console.log("Not logged in (onAuthStateChanged)");
  }
}

//set it up
function setup() {
    console.log(location.host);
}
setup();

/*Old things mosty on using csv instead of json*/
//const csvFilePath = './ottenbyresized/birds.csv'

//let csvFile = null; //Here convert this to JSON
  // birds_subset.forEach((bird)=>{
  //   row=Math.trunc((i/12));
  //   if (row>lastRow){
  //     rowElement = createRowInGrid(element);
  //     element.appendChild(rowElement);
  //     lastRow=row;
  //   }
  //   column=i%12
  //   createImageItem(rowElement,bird.path);
  //   i++;
  // });      

// async function populate_container_old(e) {
//   let row,lastRow=-1,column,i=0;
//   let rowElement;
//   fetch(csvFilePath)
//     .then(response => response.text())
//     .then(data => {
//       let lines = data.split('\n');
//       csvFile = lines;
//       lines.shift(); 
//       lines = lines.sort(() => Math.random() - Math.random()).slice(0, 144);
//       for (const line of lines) {
//         row=Math.trunc((i/12));
//         if (row>lastRow){
//           rowElement = createRowInGrid(e);
//           e.appendChild(rowElement);
//           lastRow=row;
//         }
//         column=i%12
//         const columns = line.split(',');
//         if (columns.length > 0) {
//           const firstColumn = columns[0];
//           createImageItem(rowElement,firstColumn);
//         }
//         i++;
//       }
//     })
//     .catch(error => {
//       console.error('Error fetching CSV file:', error);
//     });
// }
//function create_reload_button(parent,text1){
  //     const div = document.createElement("div")
  //     //div.classList.add("d-grid","gap-2")
  //     div.id  = "button_div.."
  //     let button = document.createElement("button")
  //     button.type="button"
  //     button.classList.add("btn","btn-secondary","btn-sm")
  //     button.textContent=text1
  //     div.appendChild(button)
  //     parent.appendChild(div)
  //     button.addEventListener("click",(event)=>{
  //       event.preventDefault()
  //       build_image_containers()
  
  //       });
  //     //update dataset buttom
  //     button = document.createElement("button")
  //     button.type="button"
  //     button.classList.add("btn","btn-secondary","btn-sm")
  //     button.textContent=text1
  //     div.appendChild(button)
  //     button.addEventListener("click",(event)=>{
  //       event.preventDefault()
  //       var authData = auth.currentUser;
  //       const db = getDatabase();
  //       console.log("authData: ",authData.uid)
  //       if (authData) { 
  //         update_training_set(authData.uid,"-NeS3F4ipXpjEBnuEAqa",birds)
  //         //click on button to update database Organise images and load new unlabelled images.
  
  //       }else{console.log("Not logged in")}
  //     });  
  //     //save as new dataset buttom
  //     button = document.createElement("button")
  //     button.type="button"
  //     button.classList.add("btn","btn-secondary","btn-sm")
  //     button.textContent=text2
  //     div.appendChild(button)
  //     button.addEventListener("click",(event)=>{
  //       event.preventDefault()
  //       var authData = auth.currentUser;
  //       const db = getDatabase();
  //       console.log(authData.uid)
  //       if (authData) { 
  //         save_new_training_set_to_databasebase(authData.uid,birds)
  //       }else{console.log("Not logged in")}
  //     });  
  //     //download json   
  //     button = document.createElement("button")
  //     button.type="button"
  //     button.classList.add("btn","btn-secondary","btn-sm")
  //     button.textContent=text3
  //     div.appendChild(button)
  //         button.addEventListener("click",(event)=>{
  //           event.preventDefault()
  //           downloadJson(birds);
  //         });
  //     parent.appendChild(div)      
  // }
  
  // function create_save_to_database_Button(parent,text1,text2,text3){
  //     //Create a container for the buttons
  //     const div = document.createElement("div")
  //     //div.classList.add("d-grid","gap-2")
  //     div.id  = "button_div_2"
  //     //update dataset buttom
  //     let button = document.createElement("button")
  //     button.type="button"
  //     button.classList.add("btn","btn-secondary","btn-sm")
  //     button.textContent=text1
  //     div.appendChild(button)
  //     button.addEventListener("click",(event)=>{
  //       event.preventDefault()
  //       var authData = auth.currentUser;
  //       const db = getDatabase();
  //       console.log("authData: ",authData.uid)
  //       if (authData) { 
  //         update_training_set(authData.uid,"-NeS3F4ipXpjEBnuEAqa",birds)
  //         //click on button to update database Organise images and load new unlabelled images.
  
  //       }else{console.log("Not logged in")}
  //     });  
  //   //save as new dataset buttom
  //   button = document.createElement("button")
  //   button.type="button"
  //   button.classList.add("btn","btn-secondary","btn-sm")
  //   button.textContent=text2
  //   div.appendChild(button)
  //   button.addEventListener("click",(event)=>{
  //     event.preventDefault()
  //     var authData = auth.currentUser;
  //     const db = getDatabase();
  //     console.log(authData.uid)
  //     if (authData) { 
  //       save_new_training_set_to_databasebase(authData.uid,birds)
  //     }else{console.log("Not logged in")}
  //   });  
  //   //download json   
  //   button = document.createElement("button")
  //   button.type="button"
  //   button.classList.add("btn","btn-secondary","btn-sm")
  //   button.textContent=text3
  //   div.appendChild(button)
  //       button.addEventListener("click",(event)=>{
  //         event.preventDefault()
  //         downloadJson(birds);
  //       });
  //   parent.appendChild(div)      
  // }