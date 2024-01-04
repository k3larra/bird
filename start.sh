#!/bin/bash
cd ~/ottenby/bird/flask/birdweb/
source .venv/bin/activate
export FLASK_APP=birdnest
# Optionally, enable debug mode
export FLASK_ENV=development
# Start the Flask server
#flask run --debugger &
flask run --debugger > flask.log 2>&1 &
#Start node server fir connecting to bird firebase and flask
cd ~/ottenby/bird/node/
node nodebird.js > node_firebase_flask.log 2>&1 &
#node nodebird.js &
## cd
cd ~/ottenby/
# Start the bird server
node server.js > node_server.log 2>&1 &
# to run this file:
chmod +x start.sh
#./start.sh
