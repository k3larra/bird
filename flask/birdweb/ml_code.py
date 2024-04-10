import os
import gc
import json
import platform
import uuid
import numpy as np
import sys
import torch
import torch.nn as nn
import torch.optim as optim
from pathlib import Path
import torch.nn.functional as F
from torch.utils.data import DataLoader
from torch.utils.data import Dataset
from torchvision.io import read_image
from torchvision.io import ImageReadMode
from torch.optim import lr_scheduler
#from torchvision.models import efficientnet_v2_s, EfficientNet_V2_S_Weights, resnet50, ResNet50_Weights
from torchvision.models import efficientnet_v2_s, EfficientNet_V2_S_Weights
from torchvision.models import inception_v3, Inception_V3_Weights
from torchvision.models import resnet50, ResNet50_Weights
from torchvision.models import resnet18, ResNet18_Weights
from torchvision.models import resnet152, ResNet152_Weights
from torchvision.models import convnext_tiny,ConvNeXt_Tiny_Weights
#from birdnest import get_logger
import firebase_admin
from firebase_admin import db
#print("torch.__version__",torch.__version__)
#print("torchvision.__version__",torchvision.__version__)
device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
print("device",device)
#get_logger().info("device is:",device) Gets circular import error....

# print("sys.path",sys.path)
#if torch.cuda.is_available():
#    get_logger().info("torch.cuda.is_available()",torch.cuda.is_available())
#    get_logger().info("torch.version.cuda",torch.version.cuda)
#else:
#    get_logger().info("torch.cuda.is_available()",torch.cuda.is_available())
#    get_logger().info("torch.version.cuda","None")
#get_logger().info("torch.__version__",torch.__version__)
#get_logger().info("python3 --version",sys.version)
#annotation_json_file = './json_file.json'
#image_path_resized = '../ottenbyresized'
#save_path='./'
#batch_size = 32
#num_epochs=2

class CustomImageDataset(Dataset):
    def __init__(self, json_file, image_path, transform=None, target_transform=None):
        self.img_labels = json_file
        if platform.system() == 'Windows':
            for index in range(len(self.img_labels)):
                self.img_labels[index]['image_location'] = Path(self.img_labels[index]['image_location'])
        elif platform.system() == 'Linux':
            for index in range(len(self.img_labels)):
                self.img_labels[index]['image_location'] = self.img_labels[index]['image_location'].replace("\\", "/")
        self.catagories = np.unique([item['concept'] for item in self.img_labels]).tolist()
        self.image_path = image_path
        self.transform = transform
        self.target_transform = target_transform

    def __len__(self):
        return len(self.img_labels)

    def __getitem__(self, idx):
        img_path = os.path.join(self.image_path, self.img_labels[idx]['image_location'])
        image = read_image(img_path, ImageReadMode.UNCHANGED)
        image = image.float()
        image /= 255.
        label = self.img_labels[idx]['concept'] 
        label = torch.tensor(self.catagories.index(label))
        if self.transform:
            image = self.transform(image)
        if self.target_transform:
            label = self.target_transform(label)
        return image, label
    
def getResNet18_model(num_classes):
    weights = ResNet18_Weights.DEFAULT
    model_transforms = weights.transforms(antialias=True)
    model = resnet18(weights=weights)
    model._name="ResNet18"
    model.fc =nn.Linear(model.fc.in_features, num_classes)
    model.eval()
    return model, model_transforms

def getResNet50_model(num_classes):
    weights = ResNet50_Weights.DEFAULT
    model_transforms = weights.transforms(antialias=True)
    model = resnet50(weights=weights)
    model._name="ResNet50"
    model.fc =nn.Linear(model.fc.in_features, num_classes)
    model.eval()
    return model, model_transforms

def getResNet152_model(num_classes):
    weights = ResNet152_Weights.DEFAULT
    model_transforms = weights.transforms(antialias=True)
    model = resnet152(weights=weights)
    model._name="ResNet152"
    model.fc =nn.Linear(model.fc.in_features, num_classes)
    model.eval()
    return model, model_transforms

def getEfficientNet_V2_S_model(num_classes):
    weights = EfficientNet_V2_S_Weights.DEFAULT
    model_transforms = weights.transforms(antialias=True)
    #model_transforms = weights.transforms()
    model = efficientnet_v2_s(weights=weights)
    model._name="EfficientNet_V2_S"
    #model.fc = nn.Linear(model._fc.in_features, num_classes)
    #model.classifier = nn.Linear(model.classifier.in_features, num_classes)
    model.classifier[1] = nn.Linear(1280, num_classes)
    model.eval()
    return model, model_transforms

def getInception_V3_model(num_classes):
    weights = Inception_V3_Weights.DEFAULT
    model_transforms = weights.transforms(antialias=True)
    model = inception_v3(weights=weights)
    model._name="Inception_V3"
    model.fc = nn.Linear(model.fc.in_features, num_classes)
    model.aux_logits=False
    #model.classifier = nn.Linear(model.classifier.in_features, num_classes)
    model.eval()
    return model, model_transforms

def getConvnext_tiny_model(num_classes):
# from torchvision.models import convnext_tiny,ConvNeXt_Tiny_Weights
    weights = ConvNeXt_Tiny_Weights.DEFAULT
    model = convnext_tiny(weights=weights)
    model_transforms = weights.transforms(antialias=True)
    model._name = "ConvNeXt_Tiny"
    #model._fc = nn.Linear(model.fc.in_features, num_classes)
    model.classifier[2] = nn.Linear(768, num_classes)
    model.eval()
    return model, model_transforms

def get_existing_trained_model(save_path, ml_filename,num_classes):  
    # Loads the model at annotation_json_file["ml_model_filename"] and returns it
    model = torch.load(os.path.join(save_path, ml_filename),map_location=torch.device('cpu'))
    if "ResNet18" in ml_filename:
        weights = ResNet18_Weights.DEFAULT #to get the transforms
    elif "ResNet50" in ml_filename:
        weights = ResNet50_Weights.DEFAULT #to get the transforms
    elif "ResNet152" in ml_filename:
        weights = ResNet152_Weights.DEFAULT #to get the transforms
    elif "EfficientNet_V2_S" in ml_filename:
        weights = EfficientNet_V2_S_Weights.DEFAULT #to get the transforms
    elif "Inception_V3" in ml_filename:
        weights = Inception_V3_Weights.DEFAULT #to get the transforms
    elif "ConvNeXt_Tiny" in ml_filename:
        weights = ConvNeXt_Tiny_Weights.DEFAULT #to get the transforms
    model_transforms = weights.transforms(antialias=True)
    #model.eval()
    return model, model_transforms

def train_model(model, criterion, optimizer, training_loader):
    model.train()  
    for inputs, labels in training_loader:
        inputs = inputs.to(device) # Error here first in Thread -2
        labels = labels.to(device)
        outputs = model(inputs)
        loss = criterion(outputs, labels)
        optimizer.zero_grad()
        loss.backward()    # Error here thenin Thread -4
        optimizer.step()
        # Delete tensors
        del inputs, labels, outputs, loss
        # Run the garbage collector
        gc.collect()

def increment_counter(transaction, ref):
    current_value = transaction.get(ref)
    if current_value is None:
        new_value = 1
    else:
        new_value = current_value + 1
    transaction.put(ref, new_value)
    return new_value

def predict_image(model, model_transforms, image_path_resized, image_name, labels):
    model.eval()
    #print(labels) 
    #labels = labels[-1:] + labels[:-1] last to first
    #THis is the ugliest hack ever, I do not know why the predictions comes out one step wrong so index 0 is really the last label and the first is the second.
    ##labels = labels[1:] + labels[:1] #first to last 
    #print(labels)
    model = model.to(device) #-This could be done once
    model = model.to('cpu')
    imagePath = os.path.join(image_path_resized, image_name)
    if platform.system() == 'Linux':
        imagePath = imagePath.replace("\\", "/")
    image = read_image(imagePath, ImageReadMode.UNCHANGED)
    image = image.float()
    image /= 255.
    image = model_transforms(image)
    image = image.unsqueeze(0)
    # image = image.to(device) already on cpu
    output = model(image)
    output_prob = F.softmax(output, dim=1)
    class_prob, predicted = torch.max(output_prob.data, 1)
    class_prob = int(class_prob.item()*100)
    print("labels",labels)
    print("predictedRaw: "+str(predicted.item())+ " ("+str(class_prob)+"%)" )
    print("predicted: "+str(labels[predicted.item()])+ " ("+str(class_prob)+"%)" )
    #labels = labels[-1:] + labels[:-1]
    #print("predictedAfter: "+str(labels[predicted.item()])+ " ("+str(class_prob)+"%)" )
    return labels[predicted.item()], class_prob

def predict_images(model, model_transforms, image_path_resized, image_names, labels, batch_size=100):
    model.eval()
    predictions = []
    class_probs = []
     #THis is the ugliest hack ever, I do not know why the predictions comes out one step wrong so index 0 is really the last label and the first is the second.
    #labels = labels[1:] + labels[:1] #first to last 
    for i in range(0, len(image_names), batch_size):
        batch_image_names = image_names[i:i+batch_size]
        images = []
        for image_name in batch_image_names:
            imagePath = os.path.join(image_path_resized, image_name)
            if platform.system() == 'Linux':
                imagePath = imagePath.replace("\\", "/")
            image = read_image(imagePath, ImageReadMode.UNCHANGED)
            image = image.float()
            image /= 255.
            image = model_transforms(image)
            images.append(image)
        images = torch.stack(images)  # Create a batch of images
        output = model(images)
        output_prob = F.softmax(output, dim=1)
        batch_class_probs, batch_predictions = torch.max(output_prob.data, 1)
        batch_class_probs = [int(prob.item()*100) for prob in batch_class_probs]
        predictions.extend([labels[pred] for pred in batch_predictions])
        class_probs.extend(batch_class_probs)
        del images, output
        gc.collect()
    return predictions, class_probs

def train_and_save(model,model_transforms,metadata, projID, training_data, image_path_resized,save_path,batch_size=32,num_epochs=5):
    dataset = training_data["images"]
    concepts = metadata['concept']
    ref = db.reference('/projects').child(projID).child("metadata").child(metadata["training_set_ref"])
    for concept in concepts:
        if not any(d['concept'] == concept for d in dataset):
            print("No images for concept",concept)
            ref.update({
                'ml_model_filename': "",
                'ml_train_status': 'There are no images for concept '+concept,
                'ml_train_ongoing': False,
                'ml_training_finished_timestamp': {".sv": "timestamp"},
                "ml_train":False,
                "ml_train_finished":True
            }) 
            return
    print("total number images",len(dataset))
    #app.logger.info("total number images")
    dataset = [x for x in dataset if x['concept'] != 'void']
    print(concepts)
    # Create a dictionary that maps concept names to indices
    concept_to_index = {name: index for index, name in enumerate(concepts)}
    # Replace the concept names in the dataset with their corresponding indices
    for item in dataset:
        if item['concept'] in concept_to_index:
            item['concept'] = concept_to_index[item['concept']]
    print("number images in training dataset",len(dataset))
    #for i in range(105):
    #    print(dataset[i])
    #Here check that there are images for all concepts in metadata['concept']
    if platform.system() == 'Windows':
        print("Windows")
    if platform.system() == 'Linux':
        print("Linux")
 
    if torch.cuda.is_available():
        print('CUDA is available.')
    else:
        print('CUDA is not available.')
    model = model.to(device)
    bird_dataset = CustomImageDataset(dataset, image_path_resized, transform=model_transforms, target_transform=None)
    print(f"Total samples in the dataset: {len(bird_dataset)}")
    # Print the first few samples in the dataset
    """ for i in range(min(20, len(bird_dataset))):
        sample, label = bird_dataset[i]
        print(f"Sample #{i}:")
        print(f"Label: {label}") """
        #print(f"Sample data: {sample}")
    training_loader = DataLoader(bird_dataset, batch_size=batch_size, shuffle=True)  #32,64
    #device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    criterion = nn.CrossEntropyLoss()
    optimizer_ft = optim.SGD(model.parameters(), lr=0.001, momentum=0.9)
    scheduler = lr_scheduler.StepLR(optimizer_ft, step_size=7, gamma=0.1)
    ref = db.reference('/projects').child(projID).child("metadata").child(metadata["training_set_ref"])
    for epoch in range(num_epochs):
        loss=train_model(model, criterion, optimizer_ft,training_loader)
        del loss  # Delete the loss tensor
        gc.collect()  # Run the garbage collector
        scheduler.step()
        epoch_str=str(epoch+1)+"/"+str(num_epochs)
        ref.update({
            'ml_epoch': epoch_str,
            'ml_train_status': "running",
            })
    model_file_name = str(uuid.uuid4())+model._name+'.pth'
    #delete old models in the folder annotation_json_file["ml_model_filename"]
    if "ml_model_filename" in metadata and metadata["ml_model_filename"]:
        for filename in os.listdir(save_path):
            if filename.startswith(metadata["ml_model_filename"]):
                os.remove(os.path.join(save_path, filename))
    torch.save(model, os.path.join(save_path,model_file_name))
    ref.update({
        'ml_model_filename': model_file_name,
        'ml_train_status': 'trained',
        'ml_train_ongoing': False,
        'ml_training_finished_timestamp': {".sv": "timestamp"},
        "ml_train":False,
        "ml_train_finished":True
    }) 
    print('Finished Training')
    #return model_file_name

#print(train_and_save(*getResNet50_model(),annotation_json_file, image_path_resized,num_epochs=1))