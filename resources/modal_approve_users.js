export function approve_users() {
    fetch('./resources/modal_approve_users.html')
      .then(response => response.text())
      .then(html => {
        const myModal_approve_users = document.getElementById("nav-bar");
        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = html;
        myModal_approve_users.appendChild(modalContainer);
        //document.getElementById("refresh_predicting_modal").addEventListener("click", refreshContent);
        //document.getElementById("saveChanges_predict").removeEventListener("click", handlePredictModelButton);
        //document.getElementById("saveChanges_predict").addEventListener("click", handlePredictModelButton);
      });
      
    //document.getElementById("image_data").appendChild(button);
  }