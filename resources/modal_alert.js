/*Useage:
alert("Add some concepts in the concept list using the concept button. Then label the images by clicking on them."); 
const bodytext = "Add some concepts in the concept list using the concept button. Then label the images by clicking on them.";
showAlert(bodytext);
showPrompt('Enter your name', 'Please enter your name:', function(input) {
    console.log('User entered: ' + input);
});
showConfirm('Confirm action', 'Are you sure you want to do this?', function() {
    console.log('User confirmed action');
});*/

export function loadModalAlert() {
  fetch('./resources/modal_alert.html')
    .then(response => response.text())
    .then(html => {
      document.querySelector('#modalcontainer').innerHTML = html;
    })
    .catch(error => {
      console.warn('Something went wrong.', error);
    });
}



export function showAlert(title, message) {
  const modalTitle = document.getElementById('alertModalLabel');
  modalTitle.textContent = title;
  const modalBody = document.getElementById('alertModalBody');
  modalBody.textContent = message;
  var myModal = new bootstrap.Modal(document.getElementById('alertModal'), {});
  myModal.show();
}


export function showConfirm(title, message, onConfirm) {
  const modalTitle = document.getElementById('confirmModalLabel');
  modalTitle.textContent = title;
  const modalBody = document.getElementById('confirmModalBody');
  modalBody.textContent = message;

  // Get the confirm button and attach the onConfirm function as a click event handler
  const confirmButton = document.getElementById('confirmButton');
  confirmButton.onclick = onConfirm;

  var myModal = new bootstrap.Modal(document.getElementById('confirmModal'), {});
  myModal.show();
}

export function showPrompt(title, message, onConfirm) {
  const modalTitle = document.getElementById('promptModalLabel');
  modalTitle.textContent = title;
  const modalBody = document.getElementById('promptModalBody');
  modalBody.textContent = message;

  // Get the confirm button and attach the onConfirm function as a click event handler
  const confirmButton = document.getElementById('promptConfirmButton');
  confirmButton.onclick = function () {
    // Get the user's input
    const userInput = document.getElementById('promptInput').value;

    // Call the onConfirm function with the user's input
    onConfirm(userInput);
  };

  var myModal = new bootstrap.Modal(document.getElementById('promptModal'), {});
  myModal.show();

}

