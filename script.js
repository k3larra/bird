import { app, database } from "./firebase-module.js";

function setup() {
    //console.log(database);
    //console.log(app);
    const main = document.querySelector("main");
    const mainheader = document.createElement("h1");
    mainheader.textContent = "API Lab X.X";
    main.appendChild(mainheader);
    console.log(location.host);
}
setup();