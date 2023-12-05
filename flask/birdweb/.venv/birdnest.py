from flask import Flask
from flask import request
from threading import Thread
import json
import os
app = Flask(__name__)
##

#firebase
import firebase_admin
from firebase_admin import credentials, db
from ml_code import train_and_save, getResNet50_model,getEfficientNet_V2_S_model,get_existing_trained_model

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
def json_endpoint():
    metaData = request.get_json()
    num_epochs = int(metaData["ml_epochs"])
    #annotation_json_file = metaData
    image_path_resized = '../../ottenbyresized'
    save_path = "../../models"
    print(metaData["training_set_ref"])
    print(metaData["uid"])
    print(metaData["ml_model"])
    epoch_str=str(1)+"/"+str(num_epochs)
    metadataRef = db.reference('/').child(metaData["uid"]).child("metadata").child(metaData["training_set_ref"])
    metadataRef.update({
        'ml_epoch': epoch_str,
        'ml_train': False,
        'ml_train_ongoing': True,
        'ml_train_status': "running",
        'ml_training_started_timestamp': {".sv": "timestamp"}
    }) 
    trainingDataRef = db.reference('/').child(metaData["uid"]).child("trainingsets").child(metaData["training_set_ref"])
    # Get the training data from firebase
    training_data = trainingDataRef.get()
    print(metaData["training_set_ref"])
    print(training_data["images"][10])
    dataset = [x for x in training_data["images"] if x['concept'] != 'void']
    print(len(dataset))

    # Start the training of a Resnet50 model asynchronously
    if "ml_retrain_existing_model" in metaData and metaData["ml_retrain_existing_model"]:
        retrain = True
    else:
        retrain = False
        # Delete old models since we restart the training
        if "ml_model_filename" in metaData and metaData["ml_model_filename"]:
            for filename in os.listdir(save_path):
                if filename.startswith(metaData["ml_model_filename"]):
                    os.remove(os.path.join(save_path, filename))
    if "ml_model_filename" in metaData and metaData["ml_model_filename"] and retrain:
        # Load the saved model
        model, model_tranforms = get_existing_trained_model(save_path,metaData["ml_model_filename"])
        print("Loading old")
    else:
        if metaData["ml_model"] == "ResNet50":
            model,model_tranforms = getResNet50_model()
            print("Loading ResNet50")
        elif metaData["ml_model"] == "EfficientNet_V2_S":
            model, model_tranforms = getEfficientNet_V2_S_model()
            print("Loading EfficientNet_V2_S")
        else:
            model = None

    if model:
        thread = Thread(target=train_and_save, args=(model, model_tranforms, metaData, training_data, image_path_resized, save_path, 32, num_epochs))
        thread.start()
    #result=train_and_save(*getResNet50_model(),  annotation_json_file, image_path_resized, save_path)
    # Start the training of a Resnet50 model asynchronously
    #loop = asyncio.get_event_loop()
    #result = await loop.run_in_executor(None, train_and_save_async, *getResNet50_model(),  annotation_json_file, image_path_resized, save_path)
    #print(result)
    #write Hello to a testfile in save_path directory
    with open(save_path+"testfile.txt", "w") as f:
        f.write("Hello")
    return json.dumps({"status":"running" })

@app.route('/delete_model', methods=['POST'])
def delete_model():
    metaData = request.get_json()
    save_path = "../../models"
    if "ml_model_filename" in metaData and metaData["ml_model_filename"]:
        for filename in os.listdir(save_path):
            if filename.startswith(metaData["ml_model_filename"]):
                os.remove(os.path.join(save_path, filename))
    return json.dumps({"status":"deleted" })







#app.run()