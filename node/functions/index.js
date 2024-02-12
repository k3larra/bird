/**
 * Import function triggers from their respective submodules:
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const {onRequest} = require("firebase-functions/v2/https");
//const logger = require("firebase-functions/logger");
const admin = require('firebase-admin');
//admin.initializeApp();
const functions = require('firebase-functions');
exports.myFunction = functions.region('europe-west1')
    .database.ref('/projects/{projectID}/metadata/{metadataID}')  
    .onWrite((snapshot, context) => {
        console.log("trigged");
        const projectID = context.params.projectID;
        const metadataID = context.params.metadataID;
        console.log("Got request from project: ", projectID, "with data: ", metadataID );
        const data = snapshot.after.val();
        const response = {
            "childnode": {
                "projectID": projectID,
                "metadata": data
            }
        };
        const responseRef = admin.database().ref('/projects/clientrequest');
        return responseRef.set(response);
    });