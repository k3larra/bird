import os
import sys
import datetime
from flask import Flask
from flask import request
import json
import shutil
app = Flask(__name__)
#firebase
import firebase_admin
from firebase_admin import credentials, db

# Initialize the Firebase Admin SDK
cred = credentials.Certificate('../../secrets/bird-ad15f-firebase-adminsdk-hzlhg-4ccf1a7271.json')
firebase_admin.initialize_app(cred, {
    'databaseURL': 'https://bird-ad15f-default-rtdb.europe-west1.firebasedatabase.app'
})


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
    print(data["training_set_ref"])
    print(data["images"][10])
    print(data["uid"])
    print(data["ml_model"])
    print(data["training_set_ref"])
    #Start the training of a Resnet50 model
    

    ref = db.reference('/').child(data["uid"]).child("metadata").child(data["training_set_ref"]).update({
        'ml_train': False,
        'ml_train_ongoing': True,
        'ml_train_status': "running",
        'ml_training_started_timestamp':{".sv": "timestamp"}
    }) 
    return json.dumps({"status":"running" })

#app.run()