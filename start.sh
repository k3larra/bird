#!/bin/bash
# Navigate to your project directory
cd ~/ottenby/bird/flask/birdweb/
# Activate the virtual environment
source .venv/bin/activate
# Set the FLASK_APP environment variable
export FLASK_APP=birdnest
# Optionally, enable debug mode
export FLASK_ENV=development
# Start the Flask server
flask run --debugger &
#flask run --debugger > flask.log 2>&1 &
#Start node server
cd ~/ottenby/bird/node/
#node nodebird.js > node.log 2>&1 &
node nodebird.js &
## Sar
