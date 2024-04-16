#!/bin/bash
# Start all installed services and chek that they are working
# First run install_all_autostart_services.sh to install the services
# Then run this script to start the services
# Then check the status of the services with systemctl status <service_name>
# Start the git pull service
sudo systemctl start git_pull.service
# Check the status of the git pull service
sudo systemctl status git_pull.service
# Start the flask server service
sudo systemctl start start_flask.service
# Check the status of the flask server service
sudo systemctl status start_flask.service
# Start the firebase to flask server service
sudo systemctl start start_firebase_to_flask.service
# Check the status of the firebase to flask server service
sudo systemctl status start_firebase_to_flask.service
# Start the web server service
sudo systemctl start start_web_server.service
# Check the status of the web server service
sudo systemctl status start_web_server.service
echo "All services started and checked"