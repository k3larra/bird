import os
import json
import platform
import uuid
import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
from pathlib import Path
from torch.utils.data import DataLoader
from torch.utils.data import Dataset
from torchvision.io import read_image
from torchvision.io import ImageReadMode
from torch.optim import lr_scheduler
from torchvision.models import efficientnet_v2_s, EfficientNet_V2_S_Weights, resnet50, ResNet50_Weights

device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
import firebase_admin
from firebase_admin import credentials, db
#annotation_json_file = './json_file.json'
#image_path_resized = '../ottenbyresized'
#save_path='./'
#batch_size = 32
#num_epochs=2

class CustomImageDataset(Dataset):
    def __init__(self, json_file, image_path, transform=None, target_transform=None):
        self.img_labels = json_file
        #with open(json_file,encoding='utf-8') as f:
        #    data = json.load(f)
        #    self.img_labels = data['images']
        if platform.system() == 'Windows':
            for index in range(len(self.img_labels)):
                self.img_labels[index]['image_location'] = Path(self.img_labels[index]['image_location'])
        elif platform.system() == 'Linux':
            for index in range(len(self.img_labels)):
                #self.img_labels[index]['image_location'] = self.img_labels[index]['image_location'].replace("\\", "/")
                self.img_labels[index]['image_location'] = self.img_labels[index]['image_location'].replace("\\", "/")
        #for index in range(len(self.img_labels)):          #For windows
        #   self.img_labels[index]['image_location'] = Path(self.img_labels[index]['image_location'])  # Replace backslashes with forward slashes
        #for index in range(len(self.img_labels)):          #For linux
        #    self.img_labels[index]['image_location'] = self.img_labels[index]['image_location'].replace("\\", "/")  # Replace backslashes with forward slashes
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

def getResNet50_model(num_classes):
    weights = ResNet50_Weights.DEFAULT
    model_transforms = weights.transforms(antialias=True)
    model = resnet50(weights=weights)
    model._name="ResNet50"
    model.fc =nn.Linear(model.fc.in_features, num_classes)
    model.eval()
    return model, model_transforms

def getEfficientNet_V2_S_model(num_classes):
    weights = EfficientNet_V2_S_Weights.DEFAULT
    model_transforms = weights.transforms(antialias=True)
    model = efficientnet_v2_s(weights=weights)
    model._name="EfficientNet_V2_S"
    model._fc = nn.Linear(model._fc.in_features, num_classes)
    model.eval()
    return model, model_transforms


def get_existing_trained_model(save_path, ml_filename,num_classes):  
    # Loads the model at annotation_json_file["ml_model_filename"] and returns it
    model = torch.load(os.path.join(save_path, ml_filename))
    if "ResNet50" in ml_filename:
        weights = ResNet50_Weights.DEFAULT #to get the transforms
        model.fc =nn.Linear(model.fc.in_features, num_classes)
    elif "EfficientNet_V2_S" in ml_filename:
        weights = EfficientNet_V2_S_Weights.DEFAULT #to get the transforms
        model._fc = nn.Linear(model._fc.in_features, num_classes)
    model_transforms = weights.transforms()
    model.eval()
    return model, model_transforms

def train_model(model, criterion, optimizer, training_loader):
    model.train()  
    for inputs, labels in training_loader:
        inputs = inputs.to(device)
        labels = labels.to(device)
        outputs = model(inputs)
        loss = criterion(outputs, labels)
        optimizer.zero_grad()
        loss.backward()
        optimizer.step()

def increment_counter(transaction, ref):
    current_value = transaction.get(ref)
    if current_value is None:
        new_value = 1
    else:
        new_value = current_value + 1
    transaction.put(ref, new_value)
    return new_value

def predict_image(model, model_transforms, image_path_resized, image_name,idx_to_label):
    #model = torch.load(os.path.join(save_path, annotation_json_file["ml_model_filename"]))
    print("in predict_image")
    model.eval()
    imagePath = os.path.join(image_path_resized, image_name)
    if platform.system() == 'Linux':
        imagePath = imagePath.replace("\\", "/")
    image = read_image(imagePath, ImageReadMode.UNCHANGED)
    image = image.float()
    image /= 255.
    image = model_transforms(image)
    image = image.unsqueeze(0)
    image = image.to(device)
    output = model(image)
    _, predicted = torch.max(output.data, 1)
    print("predicted: "+str(idx_to_label[predicted]))
    return idx_to_label[predicted]

def train_and_save(model,model_transforms,annotation_json_file, training_data, image_path_resized,save_path,batch_size=32,num_epochs=5):
    dataset = training_data["images"]
    print(len(dataset))
    dataset = [x for x in dataset if x['concept'] != 'void']
    print(len(dataset))
    if platform.system() == 'Windows':
        print("Windows")
    if platform.system() == 'Linux':
        print("Linux")
    #print(dataset)
    print(annotation_json_file['concept'])
    bird_dataset = CustomImageDataset(dataset, image_path_resized, transform=model_transforms, target_transform=None)
    training_loader = DataLoader(bird_dataset, batch_size=batch_size, shuffle=True)  #32,64
    model = model.to(device)
    criterion = nn.CrossEntropyLoss()
    optimizer_ft = optim.SGD(model.parameters(), lr=0.001, momentum=0.9)
    scheduler = lr_scheduler.StepLR(optimizer_ft, step_size=7, gamma=0.1)
    ref = db.reference('/').child(annotation_json_file["uid"]).child("metadata").child(annotation_json_file["training_set_ref"])
    for epoch in range(num_epochs):
        train_model(model, criterion, optimizer_ft,training_loader)
        scheduler.step()
        epoch_str=str(epoch+1)+"/"+str(num_epochs)
        ref.update({
            'ml_epoch': epoch_str,
            'ml_train_status': "running",
            })
    model_file_name = str(uuid.uuid4())+model._name+'.pth'
    #delete old models in the folder annotation_json_file["ml_model_filename"]
    if "ml_model_filename" in annotation_json_file and annotation_json_file["ml_model_filename"]:
        for filename in os.listdir(save_path):
            if filename.startswith(annotation_json_file["ml_model_filename"]):
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