#!/bin/bash
#get the latest version of the code
cd /home/lars_rauer/bird
git checkout -- git_pull.sh
git update-index --assume-unchanged git_pull.sh
git pull origin main 