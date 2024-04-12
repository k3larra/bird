#!/bin/bash
cd /home/lars_rauer/bird
git checkout -- start.sh
git update-index --assume-unchanged start.sh
git pull origin main 
cd /home/lars_rauer/bird/flask/birdweb/
source .venv/bin/activate
# Start the Flask server
export FLASK_APP=birdnest
export FLASK_ENV=development
flask run > flask.log 2>&1 &
#Start node server fir connecting to bird firebase and flask server
cd /home/lars_rauer/bird/node
node nodebird.js > node_firebase.log 2>&1 &
cd /home/lars_rauer/bird
# Start the web server
authbind node server.js > node_server.log 2>&1 &
# to run this file:
#chmod +x start.sh
#./start.sh
