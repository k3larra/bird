#!/bin/bash
echo "nvidia-smi (12.0): $(nvidia-smi)"
echo "CUDA version (11.8): $(nvcc --version)"
echo "python version (3.10.13): $(python --version)"
echo "pip version (23.3.2): $(pip --version)"
pip show torch #(Should be version 2.0.0+cu118)
echo "Node version (20.9.0): $(node --version)"
sudo apt-get update
git clone https://github.com/k3larra/bird.git
cd bird/flask/birdweb
pip install Flask firebase-admin
cd ~
cd bird
npm install
sudo apt-get install authbind
sudo touch /etc/authbind/byport/80
sudo chown lars_rauer /etc/authbind/byport/80
sudo chmod 755 /etc/authbind/byport/80
npm install express-session
cd node 
npm install
cd ..
mkdir secrets
##Add firebase secrets here