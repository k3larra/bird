#!/bin/bash
# Start the web server on port 80 use authbind to allow non-root user to use port 80
cd /home/lars_rauer/bird
authbind node server.js > node_server.log 2>&1
