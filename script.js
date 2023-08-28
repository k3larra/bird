// Import Bootstrap JavaScript
// import 'bootstrap';
import 'lodash';

document.addEventListener('DOMContentLoaded', function() {
    // Initialize Bootstrap components here
    // For example, if you're using modals:
    var myModal = new bootstrap.Modal(document.getElementById('modal'));
  });

function setup() {
    const main = document.querySelector("main");
    const mainheader = document.createElement("h1");
    mainheader.textContent = "API Lab X.X";
    main.appendChild(mainheader);
    console.log(location.host);
}
setup();