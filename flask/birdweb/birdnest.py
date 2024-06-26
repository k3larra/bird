from flask import Flask
from flask import request
from threading import Thread
import json
import os
import random
import queue
import threading
import logging
import firebase_admin
from firebase_admin import credentials, db
from ml_code import predict_image,predict_images,train_and_save, get_existing_trained_model
from ml_code import getInception_V3_model, getResNet18_model, getResNet50_model,getResNet152_model,getEfficientNet_V2_S_model,getInception_V3_model,getConvnext_tiny_model
import random

app = Flask(__name__)
#if not app.debug:
app.logger.setLevel(logging.INFO)
file_handler = logging.FileHandler('flask.log')
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
file_handler.setFormatter(formatter)
app.logger.addHandler(file_handler)
def get_logger():
    return app.logger
##
app.logger.info("_____________birdnest started New session_______ddd_____________")
model_queue = queue.Queue()
pred_queue = queue.Queue()
# Initialize the Firebase Admin SDK
cred = credentials.Certificate('../../secrets/bird-ad15f-firebase-adminsdk-hzlhg-4ccf1a7271.json')
firebase_admin.initialize_app(cred, {
    'databaseURL': 'https://bird-ad15f-default-rtdb.europe-west1.firebasedatabase.app'
})

@app.route('/train_model', methods=['POST'])
def json_endpoint():
    app.logger.info("in json_endpoint/train")
    #print("in json_endpoint/train")
    metaData = request.get_json()
    metaData=metaData["metadata"]
    projID = request.get_json()
    projID=projID["projectID"]
    num_epochs = int(metaData["ml_epochs"])
    nbr_concept = len(metaData["concept"])
    #annotation_json_file = metaData
    #image_path_resized = '../../ottenbyresized'
    image_path_resized = '../../images/ottenby/training'
    save_path = "../../models"
    if not os.path.exists(save_path):
        os.makedirs(save_path)
    #print(metaData["training_set_ref"])
    app.logger.info(metaData["training_set_ref"])
    #print(metaData["uid"])
    app.logger.info(metaData["uid"])
    #print(metaData["ml_model"])
    app.logger.info(metaData["ml_model"])
    epoch_str=str(1)+"/"+str(num_epochs)
    #metadataRef = db.reference('/').child(metaData["uid"]).child("metadata").child(metaData["training_set_ref"])
    metadataRef = db.reference('/projects/').child(projID).child("metadata").child(metaData["training_set_ref"])
    metadataRef.update({
        'ml_epoch': epoch_str,
        'ml_train': False,
        'ml_train_ongoing': True,
        'ml_train_status': "running",
        'ml_training_started_timestamp': {".sv": "timestamp"}
    }) 
    trainingDataRef = db.reference('/projects/').child(projID).child("trainingsets").child(metaData["training_set_ref"])
    # Get the training data from firebase
    training_data = trainingDataRef.get()
    #dataset = [x for x in training_data["images"] if x['concept'] != 'void']
    #print(len(dataset))
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
        model, model_tranforms = get_existing_trained_model(save_path,metaData["ml_model_filename"],nbr_concept)
        app.logger.info("Loading old")
    else:
        if metaData["ml_model"] == "ResNet18":
            model,model_tranforms = getResNet18_model(nbr_concept)
            app.logger.info("Loading ResNet18")
        elif metaData["ml_model"] == "ResNet50":
            model,model_tranforms = getResNet50_model(nbr_concept)
            app.logger.info("Loading ResNet50")
        elif metaData["ml_model"] == "ResNet152":
            model,model_tranforms = getResNet152_model(nbr_concept)
            app.logger.info("Loading ResNet152")
        elif metaData["ml_model"] == "EfficientNet_V2_S":
            model, model_tranforms = getEfficientNet_V2_S_model(nbr_concept)
            app.logger.info("Loading EfficientNet_V2_S")
        elif metaData["ml_model"] == "Inception_V3":
            model, model_tranforms = getInception_V3_model(nbr_concept)
            app.logger.info("Loading Inception_V3")
        elif metaData["ml_model"] == "ConvNeXt_Tiny":
            model, model_tranforms = getConvnext_tiny_model(nbr_concept)
            app.logger.info("Loading ConvNeXt_Tiny")
        else:
            model = None
            app.logger.info("No model loaded")

    if model:
        ## here we need a que instead since a GPU is not Threadsafe.
        #I cannot log like this in logger!!!
        #app.logger.info('Queue length before:', model_queue.qsize())
        #db.reference('/projects/').update({'queue_length': model_queue.qsize()})
        model_queue.put((model, model_tranforms, metaData, projID, training_data, image_path_resized, save_path, 32, num_epochs))

        #thread = Thread(target=train_and_save, args=(model, model_tranforms, metaData, projID, training_data, image_path_resized, save_path, 32, num_epochs))
        #thread.start()
    return json.dumps({"status":"running" })



def train_a_model(callback):
    while True:
         model, model_tranforms, metaData, projID, training_data, image_path_resized, save_path, batch_size, num_epochs = model_queue.get()
         app.logger.info('Loaded new model to train')
         #print('Loaded new model to train')
         train_and_save(model, model_tranforms, metaData, projID, training_data, image_path_resized, save_path, batch_size, num_epochs)
         callback("Done")
         model_queue.task_done()

def model_trained_callback(data):
    # This function will be called when a model has been trained
    app.logger.info(f'Queue length training: {model_queue.qsize()}')
    app.logger.info(f'Model trained: {data}')
    #print('Queue length training:', model_queue.qsize())
    #print('Model trained', data)

t = threading.Thread(target=train_a_model, args=(model_trained_callback,))
t.start()

@app.route('/delete_model', methods=['POST'])
def delete_model():
    print("in delete_model")
    metaData = request.get_json()
    metaData=metaData["metadata"]
    projID = request.get_json()
    projID=projID["projectID"]
    save_path = "../../models"
    if not os.path.exists(save_path):
        os.makedirs(save_path)
    if "ml_model_filename" in metaData and metaData["ml_model_filename"]:
        for filename in os.listdir(save_path):
            if filename.startswith(metaData["ml_model_filename"]):
                os.remove(os.path.join(save_path, filename))
    return json.dumps({"status":"deleted" })



def predictor():
    while True:
        task = pred_queue.get()
        if task is None:
            #print('Task is None')
            app.logger.info('Task is None')
            break
        # Unpack the task
        metaData, save_path, image_path_resized, trainingDataRef, metadataRef = task
        metadataRef.update({
            'ml_predict_started_timestamp': {".sv": "timestamp"},
        })   
        training_data = trainingDataRef.get()
        ml_pred_concept_key = metaData["ml_pred_concept"] + "_pred"
        ml_pred_concept_probability = metaData["ml_pred_concept"] + "_pred_probability"
        ml_predict_erase = metaData["ml_predict_erase"]
        ml_predict_nbr = metaData["ml_predict_nbr"]
        if ml_predict_erase:
            nbrVoid = 0
            for image in training_data["images"]:
                if ml_pred_concept_key in image:
                    image[ml_pred_concept_key] = "void"
                    nbrVoid += 1
            trainingDataRef.set(training_data)
        indexes = [index for index, image in enumerate(training_data["images"]) if image["concept"] == "void" and (ml_pred_concept_key not in image or image[ml_pred_concept_key] == "void")]
        random_indexes = random.sample(indexes, min(int(ml_predict_nbr), len(indexes)))
        random_images = [training_data["images"][index] for index in random_indexes]
        # Load the model
        #print('Ready to LOAD model: '+ metaData["ml_model_filename"]+'  '+str(len(metaData["concept"]))+' concepts ');
        app.logger.info('Ready to LOAD model: '+ str(metaData["ml_model_filename"])+'  '+str(len(metaData["concept"]))+' concepts ');
        #print(metaData["concept"])
        app.logger.info("Concept: "+str(metaData["concept"]))
        model, model_transforms = get_existing_trained_model(save_path, metaData["ml_model_filename"],len(metaData["concept"]))
        # print("Loading saved model: "+ metaData["ml_model_filename"])
        model = model.to('cpu')  # Ensure the model is on the CPU
        # Run the prediction
        image_names = [training_data["images"][index]["image_location"] for index in random_indexes]
        predictions, class_probs = predict_images(model, model_transforms, image_path_resized, image_names, metaData["concept"])
        #print('predictions:',predictions,'class_probs:',class_probs)    
        for i in range(len(random_images)):
            trainingDataRef.child("images").child(str(random_indexes[i])).update({ml_pred_concept_key: predictions[i], ml_pred_concept_probability: class_probs[i]})
        metadataRef.update({
            'ml_predict_finished_timestamp': {".sv": "timestamp"},
            "ml_predict": False
        })
        #print('Queue length predict DONE:', pred_queue.qsize())
        app.logger.info('Queue length predict DONE:' + str(pred_queue.qsize()))
        #print('Predicted:',len(random_images))
        app.logger.info(f"Predicted: {len(random_images)}")
        pred_queue.task_done()

# Start the worker threadd
predictor_thread = Thread(target=predictor)
predictor_thread.start()

@app.route('/predict', methods=['POST'])
def predict():
    # ... (same as before until after the model is loaded)
    
    metaData = request.get_json()
    metaData=metaData["metadata"]
    projID = request.get_json()
    projID=projID["projectID"]
    save_path = "../../models"
    if not os.path.exists(save_path):
        os.makedirs(save_path)
    #image_path_resized = '../../ottenbyresized'
    image_path_resized = '../../images/ottenby/training'
    app.logger.info("in predict: "+projID)
    # check if trained model exists
    metadataRef = db.reference('/projects/').child(projID).child("metadata").child(metaData["training_set_ref"])
    trainingDataRef = db.reference('/projects/').child(projID).child("trainingsets").child(metaData["training_set_ref"])
    if "ml_model_filename" in metaData and metaData["ml_model_filename"]:
        # Put the task on the queue
        task = (metaData, save_path, image_path_resized, trainingDataRef, metadataRef)
        pred_queue.put(task)
        #print('Queue length predict:', pred_queue.qsize())
        app.logger.info('Queue length predict:'+ str(pred_queue.qsize()))
    else:
        metadataRef.update({
            'ml_predict_started_timestamp': {".sv": "timestamp"},
            "ml_predict": False
        })
    return json.dumps({"status": "queued"})

#This is to try and test if this predict more correct or if I am mad.
""" @app.route('/predictXXX', methods=['POST'])
def predictXXX():
    print("in predict")
    metaData = request.get_json()
    metaData=metaData["metadata"]
    projID = request.get_json()
    projID=projID["projectID"]
    save_path = "../../models"
    image_path_resized = '../../ottenbyresized'
    # check if trained model exists
    metadataRef = db.reference('/projects/').child(projID).child("metadata").child(metaData["training_set_ref"])
    if "ml_model_filename" in metaData and metaData["ml_model_filename"]:
        metadataRef.update({
            'ml_predict_started_timestamp': {".sv": "timestamp"},
        })
        trainingDataRef = db.reference('/projects/').child(projID).child("trainingsets").child(metaData["training_set_ref"])
        # Get the training data from Firebase
        training_data = trainingDataRef.get()
        ml_pred_concept_key = metaData["ml_pred_concept"] + "_pred"
        ml_pred_concept_probability = metaData["ml_pred_concept"] + "_pred_probability"
        #print("ml_pred_concept: "+ml_pred_concept_key)
        ml_predict_erase = metaData["ml_predict_erase"]
        #print("ml_predict_erase: "+str(ml_predict_erase))
        ml_predict_nbr = metaData["ml_predict_nbr"]
        #print("ml_predict_nbr: ",str(ml_predict_nbr))
        if ml_predict_erase:
            nbrVoid = 0
            for image in training_data["images"]:
                if ml_pred_concept_key in image:
                    image[ml_pred_concept_key] = "void"
                    nbrVoid += 1
            trainingDataRef.set(training_data)
            #print("nbrVoid: ",nbrVoid)
        # Load the saved model
        model, model_transforms = get_existing_trained_model(save_path, metaData["ml_model_filename"],len(metaData["concept"]))
        print("Loading saved model: "+ metaData["ml_model_filename"])
      
        # New Approach
        # Get ml_predict_nbr of indexes from training_data["images"] that are not classified as void (image["concept"] != "void") and image[ml_pred_concept_key] not exists or (image[ml_pred_concept_key] == "void").
        indexes = [index for index, image in enumerate(training_data["images"]) if image["concept"] == "void" and (ml_pred_concept_key not in image or image[ml_pred_concept_key] == "void")]
        random_indexes = random.sample(indexes, min(int(ml_predict_nbr), len(indexes)))
        #random_indexes = [1335, 4221, 4260, 1729, 2693, 4230, 6047, 4289, 4694, 5142, 1061, 932]
        #print(training_data["images"][1335])
        #print(training_data["images"][4221])
        random_images = [training_data["images"][index] for index in random_indexes]
        random_images_length = len(random_images)
        #print("random_images_length: ",random_images_length)
        #print("random_indexes:" + str(random_indexes))
        #print("random_images:" + str(random_images))
        #print("Example:" + str(random_images[1]))
        #Loop over random_indexes and predict the image and update the concept_predict in training_data["images"] with the prediction
        for index in random_indexes:
            image = training_data["images"][index]
            print(metaData["concept"])
            prediction,class_prob = predict_image(model, model_transforms, image_path_resized, image["image_location"], metaData["concept"])
            #print( "index:" + str(index)+" predicted: "+prediction+ " ("+str(class_prob)+"%)" +" path:" + image["image_location"])
            training_data["images"][index][ml_pred_concept_key] = prediction
            trainingDataRef.child("images").child(str(index)).update({ml_pred_concept_key: prediction, ml_pred_concept_probability: class_prob})
        #trainingDataRef.set(training_data)
        
        #for random_image in random_images:
        #    if ml_pred_concept_key not in random_image:
        #        random_image[ml_pred_concept_key] = 'void'
        #    prediction = predict_image(model, model_transforms, image_path_resized, random_image["image_location"], metaData["concept"])
        #    # Update concept_predict in Firebase
        #    for index, image in enumerate(training_data["images"]):
                # Use the index here
                
        #        if image["image_location"] == random_image["image_location"]:
        #            print("Index:", index)
        #            print(image)
        #            trainingDataRef.child("images").child(str(index)).update({ml_pred_concept_key: prediction})
        #            print("image[ml_pred_concept_key]: ",image[ml_pred_concept_key])
        #            break
            
        metadataRef.update({
            'ml_predict_finished_timestamp': {".sv": "timestamp"},
            "ml_predict": False
        })
    else:
        metadataRef.update({
            'ml_predict_started_timestamp': {".sv": "timestamp"},
            "ml_predict": False
        })
    return json.dumps({"status": "predicted"}) """

""" @app.route('/predict_old', methods=['POST'])
def predict_old():
    print("in predict")
    metaData = request.get_json()
    metaData=metaData["metadata"]
    projID = request.get_json()
    projID=projID["projectID"]
    save_path = "../../models"
    image_path_resized = '../../ottenbyresized'
    # check if trained model exists
    metadataRef = db.reference('/projects/').child(projID).child("metadata").child(metaData["training_set_ref"])
    if "ml_model_filename" in metaData and metaData["ml_model_filename"]:
        metadataRef.update({
            'ml_predict_started_timestamp': {".sv": "timestamp"},
        })
        trainingDataRef = db.reference('/projects/').child(projID).child("trainingsets").child(metaData["training_set_ref"])
        training_data = trainingDataRef.get()
        ml_pred_concept_key = metaData["ml_pred_concept"] + "_pred"
        ml_pred_concept_probability = metaData["ml_pred_concept"] + "_pred_probability"
        ml_predict_erase = metaData["ml_predict_erase"]
        ml_predict_nbr = metaData["ml_predict_nbr"]
        if ml_predict_erase:
            nbrVoid = 0
            for image in training_data["images"]:
                if ml_pred_concept_key in image:
                    image[ml_pred_concept_key] = "void"
                    nbrVoid += 1
            trainingDataRef.set(training_data)
        model, model_transforms = get_existing_trained_model(save_path, metaData["ml_model_filename"],len(metaData["concept"]))
        print("Loading saved model: "+ metaData["ml_model_filename"])
        indexes = [index for index, image in enumerate(training_data["images"]) if image["concept"] == "void" and (ml_pred_concept_key not in image or image[ml_pred_concept_key] == "void")]
        random_indexes = random.sample(indexes, min(int(ml_predict_nbr), len(indexes)))
        random_images = [training_data["images"][index] for index in random_indexes]
        #Some type of batch predict?
        model = model.to('cpu')  # Ensure the model is on the CPU
        image_names = [training_data["images"][index]["image_location"] for index in random_indexes]
        predictions, class_probs = predict_images(model, model_transforms, image_path_resized, image_names, metaData["concept"])    
        for i in range(len(random_images)):
            #random_images[i][ml_pred_concept_key] = predictions[i]
            trainingDataRef.child("images").child(str(random_indexes[i])).update({ml_pred_concept_key: predictions[i], ml_pred_concept_probability: class_probs[i]})
        metadataRef.update({
            'ml_predict_finished_timestamp': {".sv": "timestamp"},
            "ml_predict": False
        })
    else:
        metadataRef.update({
            'ml_predict_started_timestamp': {".sv": "timestamp"},
            "ml_predict": False
        })
    return json.dumps({"status": "predicted"}) """