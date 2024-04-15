#!/bin/bash
# Start the node server for connecting to bird firebase and flask server on port 3000.
# This server reads from firebase and instructs FLask, this since Flask cannot listen for changes on firebase.
cd /home/lars_rauer/bird/node
node nodebird.js > node_firebase.log 2>&1