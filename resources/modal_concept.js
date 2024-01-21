import { handleButtonClicks, getMetadata, getBirds, clear_concept, build_image_containers } from "../script.js";

export function edit_concepts() {
  const buttonDiv = document.getElementById("button_div");
  const button = document.createElement("button");
  button.type = "button";
  button.id = "myInput_concept";
  button.className = "btn btn-outline-secondary btn-sm me-1";
  button.setAttribute("data-bs-toggle", "modal");
  button.setAttribute("data-bs-target", "#myModal_concept");
  button.textContent = "Edit concepts";
  buttonDiv.appendChild(button);
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
      var mytitle = document.getElementById('modalInputTitle_concept');
      mytitle.innerHTML =  "View, Add, edit or delete concepts";
      var modalInputBody_concept = document.getElementById('modalInputBody_concept');
      modalInputBody_concept.innerHTML = " Click on the kebab icon to edit or delete a concept and click on the save button to save changes."+
      "</br> The \"Save\" button saves all changes and rebuilds the page, changes are not saved to the server."+
      "</br> To revert the changes made locally, use the \"Reload\" button on the main page."+
      "</br> The \"Save changes to server\" button on the main page overwrites the server version with all local changes.";
      var myInput = document.getElementById('myInput_concept');
      myInput.innerHTML = "Edit concepts";
      document.getElementById("addConcept").addEventListener("click", (event) => {
        event.preventDefault();
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
      });
      //clean up concept list
      const conceptList = document.getElementById("concept_list");
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
          event.preventDefault();
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
                const newConcept = input.value.charAt(0).toUpperCase() + input.value.slice(1).toLowerCase();
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
              event.preventDefault();
              console.log("In delete");
              const deleteButton = event.target;
              const input = deleteButton.parentElement.parentElement.previousSibling;
              const result = input.value;
              console.log("result", result);
              clear_concept(input.value);
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
          event.preventDefault();
          if (event.target.tagName === 'LI') {
            event.target.classList.add('list-group-item-secondary');
          }
        });
        //remove hover effect on li when hovering over
        conceptList.addEventListener("mouseout", (event) => {
          event.preventDefault();
          if (event.target.tagName === 'LI') {
            event.target.classList.remove('list-group-item-secondary');
          }
        });
      } catch (error) {
        console.log("No concepts found in metadata");
      }
      document.getElementById("saveChanges_concept").addEventListener("click", (event) => {
        event.preventDefault();
        console.log("In saveChanges_concept");
        console.log("getMetadata().concept", getMetadata().concept);
        //repace all concept for images that are not in the metadata concept list with "void"
        getBirds().images.forEach((item) => {
          if (!getMetadata().concept.includes(item.concept)) {
            item.concept = "void";
            if (item.concept_pred != null) {
              item.concept_pred = "void";
            }
          }
        });
        //rebuild image containers
        build_image_containers();
      });
    });
}

export function createRowInConceptList(newConcept) {
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