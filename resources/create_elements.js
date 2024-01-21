export function createAddImagesToTrainingdataButton(text, mouseOverText, buttonDiv) {
  const button = document.createElement("button");
  button.type = "button";
  button.classList.add("btn", "btn-outline-secondary", "lh_btn-sm", "me-1", "ms-3");
  button.textContent = text;
  button.addEventListener("click", (event) => {
    event.preventDefault();
    console.log("In createAddImagesToTrainingdataButton listener");
  });
  buttonDiv.appendChild(button);
  new bootstrap.Tooltip(button, {
    customClass: '_lh_tooltip_standard',
    html: true,
    title: mouseOverText,
    placement: 'top'
  });
}

export function createDropdownMenu() {
  const div = document.createElement("div");
  div.classList.add("btn-group", "ms-3", "mb-1", "mt-1");
  const button = document.createElement("button");
  button.classList.add("btn", "btn-outline-secondary", "lh_btn-sm", "dropdown-toggle");
  button.setAttribute("type", "button");
  button.setAttribute("data-bs-toggle", "dropdown");
  button.setAttribute("aria-expanded", "false");
  button.textContent = "Class probability above:";
  div.appendChild(button);
  const ul = document.createElement("ul");
  ul.classList.add("dropdown-menu", "pt-1", "pb-1");
  const probabilities = ["60%", "70%", "80%", "90%"];
  probabilities.forEach((probability) => {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.classList.add("dropdown-item", "lh_btn-sm");
    a.textContent = probability;
    a.addEventListener("click", (event) => {
      event.preventDefault();
      const selectedProbability = event.target.textContent;
      console.log("Selected probability:", selectedProbability);
      // Perform any desired action based on the selected probability
    });
    li.appendChild(a);
    ul.appendChild(li);
  });
  div.appendChild(ul);
  new bootstrap.Tooltip(button, {
    customClass: '_lh_tooltip_standard',
    html: true,
    title: "By selecting a class probability all images predicted with a lower probability will be hidden."
      + "</br><b> Note: </b> Class probability is not the same as probability of correct classification." +
      "Class probability is a probability that always adds up to one between the classes. Therefor, for two classes pure chance is 50% and with four classes pure chance is 25%.",
    placement: 'top'
  });
  return div;
}

