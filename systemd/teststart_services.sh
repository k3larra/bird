#!/bin/bash
# Start all installed services and chek that they are working
# First run install_all_autostart_services.sh to install the services
# Then run this script to start the services
# Then check the status of the services with systemctl status <service_name>
# Start the git pull service
### Seems to not work only gets the first service but not the other
### But the instlled services are working and starting.....
##I leave this for now since this is more of a check....
sudo systemctl start autostart_gitupdate.service
# Check the status of the git pull service
sudo systemctl status autostart_gitupdate.service
# Start the flask server service
sudo systemctl start autostart_flask.service
# Check the status of the flask server service
sudo systemctl status autostart_flask.service
# Start the firebase to flask server service
sudo systemctl start autostart_firebase_flask.service
# Check the status of the firebase to flask server service
sudo systemctl status autostart_firebase_flask.service
# Start the web server service
sudo systemctl start autostart_webserver.service
# Check the status of the web server service
sudo systemctl status autostart_webserver.service
echo "All services started and checked"