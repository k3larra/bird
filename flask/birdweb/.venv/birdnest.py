from flask import Flask
from flask import request
import json
app = Flask(__name__)
##

#firebase
import firebase_admin
from firebase_admin import credentials, db
from ml_code import train_and_save, getResNet50_model
import asyncio

# Initialize the Firebase Admin SDK
cred = credentials.Certificate('../../secrets/bird-ad15f-firebase-adminsdk-hzlhg-4ccf1a7271.json')
firebase_admin.initialize_app(cred, {
    'databaseURL': 'https://bird-ad15f-default-rtdb.europe-west1.firebasedatabase.app'
})


@app.route("/")
def hello_world():
    print("Hello World")
    return "<p>Hello, World!</p>"

@app.route('/retrain', methods=['GET'])
def retrain():
    userId = request.args.get('userId')
    print(userId)
    return json.dumps({"functioning":0 })

@app.route('/json_endpoint', methods=['POST'])

async def train_and_save_async(*args):
    return train_and_save(*args)

async def json_endpoint():
    data = request.get_json()
    num_epochs = 1
    annotation_json_file = data["images"]
    image_path_resized = '../ottenbyresized'
    save_path = "../models"

    print(data["training_set_ref"])
    print(data["images"][10])
    print(data["uid"])
    print(data["ml_model"])
    print(data["training_set_ref"])
    ref = db.reference('/').child(data["uid"]).child("metadata").child(data["training_set_ref"]).update({
        'ml_train': False,
        'ml_train_ongoing': True,
        'ml_train_status': "running",
        'ml_training_started_timestamp': {".sv": "timestamp"}
    }) 

    # Start the training of a Resnet50 model asynchronously
    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(None, train_and_save_async, *getResNet50_model(), num_epochs, annotation_json_file, image_path_resized, save_path)
    print(result)

    return json.dumps({"status":"running" })

#app.run()