import { _login } from "../firebase-module.js";
export function modal_login() {
    fetch('./resources/modal_login_email.html')
      .then(response => response.text())
      .then(html => {
        const myModal_login_email = document.getElementById("nav-bar");
        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = html;
        myModal_login_email.appendChild(modalContainer);
        document.getElementById("saveChanges_login_email").addEventListener("click", login_email);
      });
  }

function login_email(e) {
    var email = document.getElementById("login_email").value;
    var password = document.getElementById("login_password").value;
    var data = {
        "email": email,
        "password": password
    };
    console.log(data);
    _login(e,email,password);
}