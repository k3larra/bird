import os
import sys
import datetime
from flask import Flask
from flask import request
import json
import shutil
app = Flask(__name__)

@app.route("/")
def hello_world():
    print("Hejlo World")
    return "<p>Hello, World!</p>"

@app.route('/retrain', methods=['GET'])
def retrain():
    userId = request.args.get('userId')
    print(userId)
    return json.dumps({"functioning":0 })

@app.route('/json_endpoint', methods=['POST'])
def json_endpoint():
    data = request.get_json()
    print(data.title)
    return json.dumps({"functioning":0 })

#app.run()