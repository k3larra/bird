#!/bin/bash
# Install the node server for connecting to bird firebase and flask server as a service that starts on boot.
cd /home/lars_rauer/bird/systemd
sudo systemctl daemon-reload
sudo systemctl enable autostart_on_startup.service
#sudo systemctl start myscript.service # Start the service directely
#sudo systemctl status myscript.service # Check the status of the service