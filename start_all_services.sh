#!/bin/bash
#get the latest version of the code
cd /home/lars_rauer/bird
git checkout -- start_all_services.sh
git update-index --assume-unchanged start_all_services.sh
git pull origin main 
# Start the Flask server
/home/lars_rauer/bird/flask/birdweb/start_flask.sh
# Start node server for connecting to bird firebase and flask server
/home/lars_rauer/bird/node/start_connect_firebase_to_flask.sh
# Start the web server
/home/lars_rauer/bird/start_webserver.sh
