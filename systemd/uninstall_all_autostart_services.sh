#!/bin/bash
# Unistall all services installed in install_all_autostart_services.sh.
# First stop and disable all services
sudo systemctl stop git_pull.service
sudo systemctl disable git_pull.service
sudo rm /etc/systemd/system/git_pull.service
sudo systemctl stop start_flask.service
sudo systemctl disable start_flask.service
sudo rm /etc/systemd/system/start_flask.service
sudo systemctl stop start_firebase_to_flask.service
sudo systemctl disable start_firebase_to_flask.service
sudo rm /etc/systemd/system/start_firebase_to_flask.service
sudo systemctl stop start_web_server.service
sudo systemctl disable start_web_server.service
sudo rm /etc/systemd/system/start_web_server.service
sudo systemctl daemon-reload
sudo systemctl reset-failed
echo "All services uninstalled"