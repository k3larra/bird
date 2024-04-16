#!/bin/bash
# Unistall all services installed in install_all_autostart_services.sh.
# First stop and disable all services
sudo systemctl stop autostart_gitupdate.service
sudo systemctl disable autostart_gitupdate.service
sudo rm /etc/systemd/system/autostart_gitupdate.service
sudo systemctl stop autostart_flask.service
sudo systemctl disable autostart_flask.service
sudo rm /etc/systemd/system/autostart_flask.service
sudo systemctl stop autostart_firebase_flask.service
sudo systemctl disable autostart_firebase_flask.service
sudo rm /etc/systemd/system/autostart_firebase_flask.service
sudo systemctl stop autostart_webserver.service
sudo systemctl disable autostart_webserver.service
sudo rm /etc/systemd/system/autostart_webserver.service
sudo systemctl daemon-reload
sudo systemctl reset-failed
echo "All services uninstalled"