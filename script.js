import {database} from "./firebase-module.js";
// Using a popup.


function setup() {
    //console.log(database);
    //console.log(app);
    const main = document.querySelector("main");
    const mainheader = document.createElement("h1");
    main.appendChild(mainheader);
    console.log(location.host);
}
setup();