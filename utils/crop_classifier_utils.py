"""
AquaGuard - Crop Classifier Inference Utility
Loads the trained MobileNetV2 model once (lazy-loaded, cached), and maps
the raw dataset class name (e.g. "tomato") to AquaGuard's known crop
categories (used for the Kc / crop-coefficient lookup).
"""

import tensorflow as tf
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input
from PIL import Image
import numpy as np
import json
import os

MODEL_PATH = os.path.join(os.path.dirname(__file__), '..', 'ml', 'crop_classifier.keras')
LABELS_PATH = os.path.join(os.path.dirname(__file__), '..', 'ml', 'crop_labels.json')

_model = None
_labels = None

# Dataset ke raw class names ko humari app ki known categories mein map karte hain
# (jo CROP_COEFFICIENTS mein hain). Jo match na ho, 'Other' fallback hoga.
CROP_NAME_MAPPING = {
    'wheat': 'Wheat',
    'rice': 'Rice',
    'cotton': 'Cotton',
    'sugarcane': 'Sugarcane',
    'maize': 'Maize',
    'corn': 'Maize',
    'tomato': 'Vegetables',
    'cucumber': 'Vegetables',
    'chilli': 'Vegetables',
    'gram': 'Vegetables',
    'soyabean': 'Vegetables',
}


def _load_model_and_labels():
    global _model, _labels
    if _model is None:
        if not os.path.exists(MODEL_PATH):
            raise FileNotFoundError(
                f"Crop classifier model not found at {MODEL_PATH}. "
                "Run train_crop_classifier.py first."
            )
        _model = tf.keras.models.load_model(MODEL_PATH)
        with open(LABELS_PATH, 'r') as f:
            _labels = json.load(f)
    return _model, _labels


def identify_crop_from_image(image_path):
    """
    Image path leta hai, predicted crop name aur confidence return karta hai.
    Raw dataset label ko humari app ki known category mein map karta hai.

    Returns:
        {
            'detected_crop_raw': str,     # e.g. "tomato"
            'mapped_crop_type': str,      # e.g. "Vegetables"
            'confidence': float,          # 0-100
        }
    """
    model, labels = _load_model_and_labels()

    img = Image.open(image_path).convert('RGB').resize((160, 160))
    img_array = np.array(img)
    img_array = preprocess_input(img_array)
    img_array = np.expand_dims(img_array, axis=0)

    predictions = model.predict(img_array, verbose=0)[0]
    predicted_index = int(np.argmax(predictions))
    confidence = float(predictions[predicted_index])

    raw_label = labels[str(predicted_index)]  # jaise "tomato", "wheat"
    mapped_crop = CROP_NAME_MAPPING.get(raw_label.lower(), 'Other')

    return {
        'detected_crop_raw': raw_label,
        'mapped_crop_type': mapped_crop,
        'confidence': round(confidence * 100, 1),
    }