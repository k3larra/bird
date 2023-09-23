import {getDatabase, ref, set, child, push, update,user,auth,onValue} from "./firebase-module.js";
//const db = database;

// function writeUserData(userId, name) {
//     const db = getDatabase();
//     set(ref(db,'users/' + userId),{
//     username: name
//   });
// }

// writeUserData("42", "larsfan")

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

// function writeNewPost(uid, username, picture, title, body) {
//   // A post entry.
//   var postData = {
//     author: username,
//     uid: uid,
//     body: body,
//     title: title,
//     starCount: 0,
//     authorPic: picture
//   };

//   // Get a key for a new Post.
//   var newPostKey = ref().child('posts').push().key;

//   // Write the new post's data simultaneously in the posts list and the user's post list.
//   var updates = {};
//   updates['/posts/' + newPostKey] = postData;
//   updates['/user-posts/' + uid + '/' + newPostKey] = postData;

//   return ref().update(updates);
// }



//writeNewPost("32", "lars", "picture32", "PhD", "MyBody")
//save_to_firebase("uid",{ "name": "John", "age": 30, "city": "New York" })

///////////////////////////////////////////////////////////
const jsonFilePath = './ottenbyresized/birds.json'
const imageFolder = 'ottenbyresized/'
const unique_concepts = [] 

let birds = null;

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
  // }).then(data => {
  //     birds = data;
  //     build_image_containers();
  // })
  // .catch(error => {console.error("Fetch problem:", error);});
  // build_image_containers();
  read_training_data("vKFIvuQHJbMDmdaACZZMyRJXyMs1","-NeS3F4ipXpjEBnuEAqa");
}

function build_image_containers(){
  //Delete all children of main and their listners
  const image_data_article = document.getElementById("image_data");
  while (image_data_article.firstChild) {
    image_data_article.lastChild.removeEventListener("click", function(){});
    image_data_article.removeChild(image_data_article.lastChild);
  } 
  //find all unique concepts in birds
  for (const [key, value] of Object.entries(birds.images)) {
    if (value.concept == "void") continue;
    if (unique_concepts.indexOf(value.concept) === -1) unique_concepts.push(value.concept);
  }
  const dropdown = document.getElementById("inputGroupSelect03")
  console.log("drop",dropdown)
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
  populate_void_container(birds,imageContainer)
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
  //imageContainer = createContainer("Buttons","Buttoncontainer");
  
  //create_save_to_database_Button(imageContainer,"Organise & reload.","Save","Save as...","Download")
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
  //create_reload_button(element,"Organise & reload.")
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
    //createImageItem(rowElement,item["image_location"],item["concept"],34);
    createImageItem(rowElement,birds.images[item]["image_location"],birds.images[item]["concept"],item);
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
  //update dataset buttom
  button = document.createElement("button")
  button.type="button"
  button.classList.add("btn","btn-secondary","btn-sm","me-1")
  button.textContent=text2
  div.appendChild(button)
  button.addEventListener("click",(event)=>{
    event.preventDefault()
    var authData = auth.currentUser;
    const db = getDatabase();
    console.log("authData: ",authData.uid)
    if (authData) { 
      update_training_set(authData.uid,"-NeS3F4ipXpjEBnuEAqa",birds)
      //click on button to update database Organise images and load new unlabelled images.

    }else{console.log("Not logged in")}
  });  
  //save as new dataset buttom
  button = document.createElement("button")
  button.type="button"
  button.classList.add("btn","btn-secondary","btn-sm","me-1")
  button.textContent=text3
  div.appendChild(button)
  button.addEventListener("click",(event)=>{
    event.preventDefault()
    var authData = auth.currentUser;
    const db = getDatabase();
    console.log(authData.uid)
    if (authData) { 
      save_new_training_set_to_databasebase(authData.uid,birds)
    }else{console.log("Not logged in")}
  });  
  //download json   
  button = document.createElement("button")
  button.type="button"
  button.classList.add("btn","btn-secondary","btn-sm")
  button.textContent=text4
  div.appendChild(button)
      button.addEventListener("click",(event)=>{
        event.preventDefault()
        downloadJson(birds);
      });
  document.getElementById("image_data").appendChild(div);
  //parent.appendChild(div)      
}

// 

/*Misc*/
function save_new_training_set_to_databasebase(userID,jsonfile) {
  const db = getDatabase();
    const key = push(child(ref(db), userID+"/trainingsets"),jsonfile).key;
    if (key) { 
      console.log('Data has been successfully saved and key is: ', key);
      build_image_containers();
    } else {   
      console.log('Something went wrong saving the data to the database.');
    }
}

function update_training_set(userID,training_set_ref,jsonfile) {
  const db = getDatabase();
    update(child(ref(db), userID+"/trainingsets/"+training_set_ref),jsonfile).then(() => {
      console.log('Data has been successfully updated in the database');
      build_image_containers()
    })
    .catch((error) => {
      console.error('Error updating data:', error);
    });
}

function read_training_data(userID,training_set_ref) {
  const db = getDatabase();
  const starCountRef = ref(db, userID+"/trainingsets/"+training_set_ref);
  onValue(starCountRef, (snapshot) => {
    const data = snapshot.val();
    birds=data;
    build_image_containers();
  }, {
    onlyOnce: true
  });
}
function changeConcept(index,concept){
  if (concept == "") concept = "void";  
  birds.images[index].concept = concept;
}
function findImageIndexWithConcept(concept){
  //Find all rows with concept in column 1 in birds and return them
  let image_indexes_for_concept = []
  for (const [key, value] of Object.entries(birds.images)) {
    if (value.concept == concept){
      image_indexes_for_concept.push(key)
    }
  }
  return image_indexes_for_concept
}
function downloadJson(birds){
  //var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(birds));
  var dataStr = JSON.stringify(birds);
  const blob = new Blob([dataStr], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = "try.json";
  a.click();
  URL.revokeObjectURL(url);
}

//create a function that collects a list of trainingset from firebase
function get_training_sets(userID){
  const db = getDatabase();
  const starCountRef = ref(db, userID+"/trainingsets/");
  onValue(starCountRef, (snapshot) => {
    snapshot.forEach((doc) => {
      const description = doc.data().description;
      console.log("description: ",description);
    });
    //const data = snapshot.val();
    //console.log(data);
    //birds=data;
    //build_image_containers();
  }, {
    onlyOnce: true
  });
} 

//Make text with id="text_1" collapsable
function collapsable(){
  const header_1 = document.getElementById("header_1");
  const content = header_1.nextElementSibling;
  header_1.addEventListener('click', function () {
    if (content.style.display === 'none' || content.style.display === '') {
      content.style.display = 'block';
      header_1.innerHTML = "Select and label training data";
    } else {
      content.style.display = 'none';
      header_1.innerHTML = "Select and label training data...";
    }
  });
}


export function loggedIn(user){
  console.log("Logged in (onAuthStateChanged)",user.displayName);
  populate_json()
  listeners()
  collapsable();
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