#!/bin/bash
# Kill the Flask server
pkill -f "flask run"
echo "Flask server stopped"
# Kill the Node.js processes
pkill -f "node nodebird.js"
echo "Firebase node server stopped"
pkill -f "node server.js"
echo "Webserver stopped"