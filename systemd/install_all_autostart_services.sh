#!/bin/bash
# Install the node server for connecting to bird firebase and flask server as a service that starts on boot.
cd /etc/systemd/system/
# Install git pull as a service
sudo cp /home/lars_rauer/bird/systemd/git_pull.service .
# Install the flask server as a service
sudo cp /home/lars_rauer/bird/systemd/start_flask.service .
# Install the firebase to flask server as a service
sudo cp /home/lars_rauer/bird/systemd/start_firebase_to_flask.service .
# Install the web server as a service 
sudo cp /home/lars_rauer/bird/systemd/start_web_server.service .
# Install the autostart on startup service
sudo systemctl daemon-reload
sudo systemctl enable autostart_on_startup.service
#sudo systemctl start autostart_on_startup.service # Start the service directely
#sudo systemctl status autostart_on_startup.service # Check the status of the service