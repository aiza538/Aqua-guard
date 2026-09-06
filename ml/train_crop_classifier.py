"""
AquaGuard - Crop Identification Model Training
Transfer Learning approach using MobileNetV2 (lightweight, deployment-friendly)

Run this AFTER downloading and extracting the Kaggle dataset into:
backend/ml/crop_images/<crop_name>/*.jpg
"""

import tensorflow as tf
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D, Dropout
from tensorflow.keras.models import Model
from tensorflow.keras.preprocessing.image import ImageDataGenerator
import os
import json

DATA_DIR = os.path.join(os.path.dirname(__file__), 'crop_images')
IMG_SIZE = (160, 160)
BATCH_SIZE = 16
EPOCHS = 10

if not os.path.isdir(DATA_DIR):
    raise FileNotFoundError(
        f"'{DATA_DIR}' not found. Download the Kaggle dataset and extract it here first."
    )

# 1. Data augmentation + loading
datagen = ImageDataGenerator(
    preprocessing_function=preprocess_input,
    validation_split=0.2,
    rotation_range=20,
    horizontal_flip=True,
    zoom_range=0.15,
)

train_gen = datagen.flow_from_directory(
    DATA_DIR,
    target_size=IMG_SIZE,
    batch_size=BATCH_SIZE,
    class_mode='categorical',
    subset='training',
)

val_gen = datagen.flow_from_directory(
    DATA_DIR,
    target_size=IMG_SIZE,
    batch_size=BATCH_SIZE,
    class_mode='categorical',
    subset='validation',
)

num_classes = len(train_gen.class_indices)
print(f"Found {num_classes} crop classes:", list(train_gen.class_indices.keys()))

# 2. Transfer learning: MobileNetV2 base (pre-trained on ImageNet), freeze it
base_model = MobileNetV2(input_shape=(*IMG_SIZE, 3), include_top=False, weights='imagenet')
base_model.trainable = False

x = base_model.output
x = GlobalAveragePooling2D()(x)
x = Dropout(0.3)(x)
x = Dense(128, activation='relu')(x)
output = Dense(num_classes, activation='softmax')(x)

model = Model(inputs=base_model.input, outputs=output)
model.compile(optimizer='adam', loss='categorical_crossentropy', metrics=['accuracy'])

# 3. Train (sirf naya top layer seekhta hai, base frozen hai — is liye fast hai)
history = model.fit(train_gen, validation_data=val_gen, epochs=EPOCHS)

# 4. Evaluate
val_loss, val_acc = model.evaluate(val_gen)
print(f"\nValidation Accuracy: {val_acc:.3f}")

# 5. Save model + class labels mapping
MODEL_PATH = os.path.join(os.path.dirname(__file__), 'crop_classifier.keras')
model.save(MODEL_PATH)

class_indices = train_gen.class_indices
labels_map = {v: k for k, v in class_indices.items()}  # index -> crop name
LABELS_PATH = os.path.join(os.path.dirname(__file__), 'crop_labels.json')
with open(LABELS_PATH, 'w') as f:
    json.dump(labels_map, f)

print(f"Model saved to: {MODEL_PATH}")
print(f"Labels saved to: {LABELS_PATH}")
