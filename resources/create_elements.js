import { clear_and_populate_pred_container, findImageIndexWithConcept, changeConcept, changePredConcept, build_image_containers, getMetadata } from "../script.js";

export function createDropdownMenu(predicted_concept_container_value) {
  const div = document.createElement("div");
  div.classList.add("btn-group", "ms-3", "mb-1", "mt-1");
  const button = document.createElement("button");
  button.classList.add("btn", "btn-outline-secondary", "lh_btn-sm", "dropdown-toggle");
  button.setAttribute("type", "button");
  button.setAttribute("data-bs-toggle", "dropdown");
  button.setAttribute("aria-expanded", "false");
  button.textContent = "Class probability above:";
  //var dropdown = new bootstrap.Dropdown(button);
  div.appendChild(button);
  const ul = document.createElement("ul");
  ul.setAttribute('data-concept-value', predicted_concept_container_value)
  ul.classList.add("dropdown-menu", "pt-1", "pb-1", "on_top");
  const x = 100 / getMetadata().concept.length;
  const step = (100 - x) / 10;
  //const probabilities = Array.from({length: 10}, (_, i) => x + i * step).map(String);
  const probabilities = Array.from({ length: 10 }, (_, i) => Math.round(x + i * step))
  //const probabilities = ["0","25","50","60","70", "80", "90"];
  probabilities.forEach((probability) => {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.classList.add("dropdown-item", "lh_btn-sm");
    a.textContent = probability + '%';
    a.setAttribute('data-probability', probability)
    a.addEventListener("click", (event) => {
      event.preventDefault();
      //remove images with lower probability than selected
      const concept_pred = event.target.parentElement.parentElement.getAttribute('data-concept-value');
      const pred_probability_limit = event.target.getAttribute('data-probability');
      const selected_images = findImageIndexWithConcept("concept_pred", concept_pred, pred_probability_limit);
      const predImagesDiv = event.target.parentElement.parentElement.parentElement.parentElement.parentElement;
      clear_and_populate_pred_container(selected_images, concept_pred, predImagesDiv);
      const dropdown = new bootstrap.Dropdown(event.target.closest('div').firstChild);
      dropdown.toggle(); // Close the dropdown
    });
    li.appendChild(a);
    ul.appendChild(li);
  });
  div.appendChild(ul);
  /*  new bootstrap.Tooltip(button, {
     customClass: '_lh_tooltip_standard',
     html: true,
     title: "By selecting a class probability all images predicted with a lower probability will be hidden."
       + "</br><b> Note: </b> Class probability is not the same as probability of correct classification." +
       "Class probability is a probability that always adds up to one between the classes. Therefor, for two classes pure chance is 50% and with four classes pure chance is 25%.",
     placement: 'top'
   }); */
  return div;
}

export function createDropdownMenuSelectingProbBelow(predicted_concept_container_value) {
  const div = document.createElement("div");
  div.classList.add("btn-group", "ms-3", "mb-1", "mt-1");
  const button = document.createElement("button");
  button.classList.add("btn", "btn-outline-secondary", "lh_btn-sm", "dropdown-toggle");
  button.setAttribute("type", "button");
  button.setAttribute("data-bs-toggle", "dropdown");
  button.setAttribute("aria-expanded", "false");
  button.textContent = "Class probability below:";
  //var dropdown = new bootstrap.Dropdown(button);
  div.appendChild(button);
  const ul = document.createElement("ul");
  ul.setAttribute('data-concept-value', predicted_concept_container_value)
  ul.classList.add("dropdown-menu", "pt-1", "pb-1", "on_top");
  const x = 100 / getMetadata().concept.length;
  const step = (100 - x) / 10;
  //const probabilities = Array.from({ length: 10 }, (_, i) => Math.round(x + i * step));
  const probabilities = Array.from({ length: 10 }, (_, i) => Math.round(x + i * step))
  //const probabilities = ["0","25","50","60","70", "80", "90"];
  probabilities.forEach((probability) => {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.classList.add("dropdown-item", "lh_btn-sm");
    a.textContent = probability + '%';
    a.setAttribute('data-probability', probability)
    a.addEventListener("click", (event) => {
      event.preventDefault();
      //remove images with lower probability than selected
      const concept_pred = event.target.parentElement.parentElement.getAttribute('data-concept-value');
      const pred_probability_limit = event.target.getAttribute('data-probability');
      const selected_images = findImageIndexWithConcept("concept_pred", concept_pred, pred_probability_limit,false);
      const predImagesDiv = event.target.parentElement.parentElement.parentElement.parentElement.parentElement;
      clear_and_populate_pred_container(selected_images, concept_pred, predImagesDiv);
      const dropdown = new bootstrap.Dropdown(event.target.closest('div').firstChild);
      dropdown.toggle(); // Close the dropdown
    });
    li.appendChild(a);
    ul.appendChild(li);
  });
  div.appendChild(ul);
  /*  new bootstrap.Tooltip(button, {
     customClass: '_lh_tooltip_standard',
     html: true,
     title: "By selecting a class probability all images predicted with a lower probability will be hidden."
       + "</br><b> Note: </b> Class probability is not the same as probability of correct classification." +
       "Class probability is a probability that always adds up to one between the classes. Therefor, for two classes pure chance is 50% and with four classes pure chance is 25%.",
     placement: 'top'
   }); */
  return div;
}

export function createAddImagesToTrainingdataButton(text, mouseOverText, buttonDiv) {
  const button = document.createElement("button");
  button.type = "button";
  button.classList.add("btn", "btn-outline-secondary", "lh_btn-sm", "me-1", "ms-3");
  button.textContent = text;
  button.addEventListener("click", (event) => {
    event.preventDefault();
    console.log("In createAddImagesToTrainingdataButton listener");
    const predImagesDiv = event.target.parentElement.parentElement;
    //find all img elements in predImagesDiv
    const selected_images = [];
    const images = predImagesDiv.querySelectorAll("img");
    images.forEach((image) => {
      const index = image.getAttribute("data-image-index");
      const concept = image.nextSibling.textContent;
      if (concept !== "") {
        changeConcept(index, concept)
        changePredConcept(index, "void");
      }
    });
    build_image_containers();
    const button = document.getElementById("myInput_save");
    button.classList.remove('btn-outline-dark');
    button.classList.add('btn-success');
    button.textContent = "Save updated dataset to server"
    console.log("WHAT");
    //console.log("selected_images", selected_images);
  });
  buttonDiv.appendChild(button);
  /* new bootstrap.Tooltip(button, {
    customClass: '_lh_tooltip_standard',
    html: true,
    title: mouseOverText,
    placement: 'top'
  }); */
}

export function clearPredictedImages(buttonDiv) {
  const button = document.createElement("button");
  button.type = "button";
  button.classList.add("btn", "btn-outline-secondary", "lh_btn-sm", "me-1", "ms-3");
  button.textContent = "Clear predicted images";
  button.addEventListener("click", (event) => {
    event.preventDefault();
    const predImagesDiv = event.target.parentElement.parentElement;
    const images = predImagesDiv.querySelectorAll("img");
    images.forEach((image) => {
      const index = image.getAttribute("data-image-index");
      const concept = image.nextSibling.textContent;
      changePredConcept(index, "void");
    });
    while (predImagesDiv.firstChild) {
      predImagesDiv.removeChild(predImagesDiv.firstChild);
    }
  });
  buttonDiv.appendChild(button);
}