#!/bin/bash
cd /home/lars_rauer/bird/flask/birdweb/
source .venv/bin/activate
export FLASK_APP=birdnest
export FLASK_ENV=development
flask run > flask.log 2>&1