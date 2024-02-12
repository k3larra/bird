#!/bin/bash
# Kill the Flask server
pkill -f "flask run --debugger"

# Kill the Node.js processes
pkill -f "node nodebird.js"
pkill -f "authbind node server.js"

# to run this file:
#chmod +x stop.sh
#./stop.sh