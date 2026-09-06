from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from utils.weather_utils import find_nearest_district, get_weather_data
from utils.crop_classifier_utils import identify_crop_from_image
from werkzeug.utils import secure_filename
import joblib
import pandas as pd
import os

irrigation_bp = Blueprint('irrigation', __name__, url_prefix='/api/irrigation')

MODEL_PATH = os.path.join(os.path.dirname(__file__), '..', 'ml', 'irrigation_model.pkl')
MAPPING_PATH = os.path.join(os.path.dirname(__file__), '..', 'ml', 'canal_access_map.pkl')

model = joblib.load(MODEL_PATH)
CANAL_ACCESS_MAP = joblib.load(MAPPING_PATH)

VALID_DISTRICTS = list(CANAL_ACCESS_MAP.keys())
VALID_SOIL_TYPES = ['Peaty', 'Clay', 'Sandy', 'Loamy', 'Silty']

# FAO-56 based standard crop coefficients. Yeh ML model ka hissa nahi hai —
# yeh ek fixed agronomic lookup hai jo model ke output par apply hoti hai.
CROP_COEFFICIENTS = {
    'Wheat': 1.15,
    'Rice': 1.20,
    'Cotton': 1.10,
    'Sugarcane': 1.25,
    'Maize': 1.15,
    'Vegetables': 0.90,
}
DEFAULT_KC = 1.00  # 'Other' ya unknown crop ke liye fallback
VALID_CROP_TYPES = list(CROP_COEFFICIENTS.keys()) + ['Other']

# Har irrigation-need decision isi per-acre threshold (Liters) par based hai.
# NOTE: yeh hamesha per-acre, post-Kc "adjusted_depth" ke against check hota
# hai — total_liters_required (jo area se multiply hota hai) ke against NAHI,
# warna "658L total, No Water Needed" jaisa confusing result aata hai.
WATER_NEED_THRESHOLD_PER_ACRE = 300

UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), '..', 'uploads', 'crops')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# District ke default soil parameters (dataset ke averages se liye gaye)
DISTRICT_SOIL_DEFAULTS = {
    'Khairpur': {'soil_type': 'Peaty', 'soil_ph': 7.2},
    'Sukkur': {'soil_type': 'Clay', 'soil_ph': 7.0},
    'Multan': {'soil_type': 'Loamy', 'soil_ph': 6.8},
    'Bahawalpur': {'soil_type': 'Sandy', 'soil_ph': 7.4},
    'Mardan': {'soil_type': 'Clay', 'soil_ph': 6.5},
    'Charsadda': {'soil_type': 'Silty', 'soil_ph': 6.9},
    'DI Khan': {'soil_type': 'Sandy', 'soil_ph': 7.6},
    'Swat': {'soil_type': 'Loamy', 'soil_ph': 6.4},
    'Lahore': {'soil_type': 'Loamy', 'soil_ph': 7.0},
    'Faisalabad': {'soil_type': 'Clay', 'soil_ph': 7.3},
    'Gujranwala': {'soil_type': 'Loamy', 'soil_ph': 7.1},
    'Sialkot': {'soil_type': 'Loamy', 'soil_ph': 6.9},
    'Sahiwal': {'soil_type': 'Sandy', 'soil_ph': 7.4},
    'Rawalpindi': {'soil_type': 'Loamy', 'soil_ph': 6.6},
    'Islamabad': {'soil_type': 'Loamy', 'soil_ph': 6.5},
    'Peshawar': {'soil_type': 'Silty', 'soil_ph': 7.0},
    'Quetta': {'soil_type': 'Sandy', 'soil_ph': 7.8},
    'Karachi': {'soil_type': 'Sandy', 'soil_ph': 7.9},
    'Hyderabad': {'soil_type': 'Clay', 'soil_ph': 7.5},
    'Larkana': {'soil_type': 'Peaty', 'soil_ph': 7.3},
}


def get_crop_coefficient(crop_type: str) -> float:
    """Case-insensitive Kc lookup — 'cotton', 'Cotton', 'COTTON' sab match karenge."""
    if not crop_type:
        return DEFAULT_KC
    normalized = crop_type.strip().title()  # 'cotton' -> 'Cotton'
    return CROP_COEFFICIENTS.get(normalized, DEFAULT_KC)


def normalize_crop_type(crop_type: str) -> str:
    """Free-text crop input ko humari known category ki tarah normalize karta hai
    agar match ho jaye, warna jaisa likha tha waisa hi wapas karta hai (display ke liye)."""
    if not crop_type:
        return 'Other'
    normalized = crop_type.strip().title()
    return normalized if normalized in CROP_COEFFICIENTS else crop_type.strip()


@irrigation_bp.route('/predict', methods=['POST'])
@jwt_required()
def predict_irrigation():
    data = request.get_json()

    district = data.get('district')
    soil_type = data.get('soil_type')
    soil_ph = data.get('soil_ph')
    moisture = data.get('moisture')
    rainfall = data.get('rainfall')
    crop_type = data.get('crop_type', 'Other')
    area_acres = data.get('area_acres', 1.0)

    if not all([district, soil_type, soil_ph is not None, moisture is not None, rainfall is not None]):
        return jsonify({'error': 'All fields (district, soil_type, soil_ph, moisture, rainfall) are required.'}), 400

    if district not in VALID_DISTRICTS:
        return jsonify({'error': f'District must be one of: {", ".join(VALID_DISTRICTS)}'}), 400

    if soil_type not in VALID_SOIL_TYPES:
        return jsonify({'error': f'Soil type must be one of: {", ".join(VALID_SOIL_TYPES)}'}), 400

    if crop_type not in VALID_CROP_TYPES:
        return jsonify({'error': f'Crop type must be one of: {", ".join(VALID_CROP_TYPES)}'}), 400

    try:
        area_acres = float(area_acres)
        if area_acres <= 0:
            return jsonify({'error': 'area_acres must be a positive number.'}), 400
    except (TypeError, ValueError):
        return jsonify({'error': 'area_acres must be a valid number.'}), 400

    canal_access = CANAL_ACCESS_MAP.get(district, 'No')

    try:
        input_df = pd.DataFrame([{
            'District': district,
            'Soil_Type': soil_type,
            'Canal_Access': canal_access,
            'Soil_pH': float(soil_ph),
            'Moisture_%': float(moisture),
            'Rainfall_mm': float(rainfall),
        }])

        prediction = model.predict(input_df)[0]

        if canal_access == 'No':
            prediction = prediction * 1.1
            water_source_note = (
                "This area has limited canal irrigation access and relies mainly on groundwater. "
                "Plan irrigation carefully to avoid over-extraction of groundwater."
            )
        else:
            water_source_note = (
                "This area has access to canal irrigation. Water availability is generally more reliable here."
            )

        base_liters = float(prediction)

        kc_factor = get_crop_coefficient(crop_type)
        liters_per_acre = base_liters * kc_factor          # post-Kc, per-acre
        total_liters_required = liters_per_acre * area_acres

        # FIX: needs_water ab post-Kc per-acre value ke against check hota hai,
        # taake displayed total number aur badge hamesha consistent rahein.
        needs_water = liters_per_acre > WATER_NEED_THRESHOLD_PER_ACRE

        return jsonify({
            'recommended_irrigation_liters': round(base_liters, 1),
            'needs_water': bool(needs_water),
            'district': district,
            'soil_type': soil_type,
            'canal_access': canal_access,
            'water_source_note': water_source_note,
            'crop_type': crop_type,
            'area_acres': area_acres,
            'kc_factor': kc_factor,
            'liters_per_acre': round(liters_per_acre, 1),
            'total_liters_required': round(total_liters_required),
        }), 200

    except Exception as e:
        return jsonify({'error': f'Prediction failed: {str(e)}'}), 500


@irrigation_bp.route('/districts', methods=['GET'])
def get_districts():
    return jsonify({
        'districts': VALID_DISTRICTS,
        'soil_types': VALID_SOIL_TYPES,
        'crop_types': VALID_CROP_TYPES,
    }), 200


@irrigation_bp.route('/predict-auto', methods=['POST'])
@jwt_required()
def predict_irrigation_auto():
    try:
        latitude = request.form.get('latitude', type=float)
        longitude = request.form.get('longitude', type=float)
        crop_name = request.form.get('crop_name', '').strip()
        area_acres = request.form.get('area_acres', type=float)
        image_file = request.files.get('image')

        if latitude is None or longitude is None:
            return jsonify({'error': 'GPS coordinates are required.'}), 400

        if area_acres is None:
            return jsonify({'error': 'Field area is required.'}), 400

        try:
            area_acres = float(area_acres)
            if area_acres <= 0:
                return jsonify({'error': 'area_acres must be a positive number.'}), 400
        except (TypeError, ValueError):
            return jsonify({'error': 'area_acres must be a valid number.'}), 400

        detected_crop_info = None
        image_path = None

        if image_file:
            filename = secure_filename(f"crop_{latitude}_{longitude}.jpg")
            image_path = os.path.join(UPLOAD_FOLDER, filename)
            image_file.save(image_path)

            # Photo se crop identify karne ki koshish karte hain.
            # Agar classifier fail ho jaye (corrupt image, model load issue, etc.),
            # hum silently manually diye gaye crop_name par fallback karte hain —
            # user ko is se koi crash/error nahi dikhna chahiye.
            try:
                detected_crop_info = identify_crop_from_image(image_path)
                crop_name = detected_crop_info['mapped_crop_type']
            except Exception as classify_err:
                print(f"Crop classification failed, falling back to manual input: {classify_err}")

        # Photo detect na ho paye AUR user ne khud bhi crop name na diya ho, tabhi error
        if not crop_name:
            return jsonify({
                'error': 'Crop name is required (either type it or upload a clear crop photo).'
            }), 400

        # Step 1: Nearest district dhoondein
        nearest_district, distance_km = find_nearest_district(latitude, longitude)

        if distance_km > 150:
            return jsonify({
                'error': (
                    f'Sorry, your location is {distance_km}km away from our nearest supported region. '
                    f'This feature currently supports: {", ".join(VALID_DISTRICTS)}.'
                )
            }), 400

        # Step 2: Weather data lein
        try:
            weather = get_weather_data(latitude, longitude)
        except (ValueError, ConnectionError) as e:
            return jsonify({'error': f'Could not fetch weather data: {str(e)}'}), 503

        # Step 3: District ke soil defaults lein
        soil_defaults = DISTRICT_SOIL_DEFAULTS.get(nearest_district, {'soil_type': 'Loamy', 'soil_ph': 7.0})
        canal_access = CANAL_ACCESS_MAP.get(nearest_district, 'No')

        # Step 4: Existing trained model ko call karein
        input_df = pd.DataFrame([{
            'District': nearest_district,
            'Soil_Type': soil_defaults['soil_type'],
            'Canal_Access': canal_access,
            'Soil_pH': soil_defaults['soil_ph'],
            'Moisture_%': weather['humidity'],
            'Rainfall_mm': weather['rainfall_mm'],
        }])

        prediction = model.predict(input_df)[0]

        if canal_access == 'No':
            prediction = prediction * 1.1
            water_source_note = (
                "This area has limited canal irrigation access and relies mainly on groundwater."
            )
        else:
            water_source_note = "This area has access to canal irrigation."

        base_liters = float(prediction)

        # FIX: pehle Kc factor apply hi nahi ho raha tha yahan — ab /predict
        # endpoint jaisa hi consistent tareeqa: crop_name se Kc nikaal kar
        # per-acre aur total dono usi se calculate karte hain.
        display_crop_name = normalize_crop_type(crop_name)
        kc_factor = get_crop_coefficient(crop_name)
        liters_per_acre = base_liters * kc_factor
        total_liters_required = round(liters_per_acre * area_acres, 1)

        # FIX: needs_water ab total ki jagah per-acre (post-Kc) value ke
        # against check hota hai — display ke sath consistent rahega.
        needs_water = liters_per_acre > WATER_NEED_THRESHOLD_PER_ACRE

        response_data = {
            'detected_district': nearest_district,
            'distance_from_reference_km': distance_km,
            'crop_name': display_crop_name,
            'area_acres': area_acres,
            'rainfall_mm': weather['rainfall_mm'],
            'humidity': weather['humidity'],
            'temperature': weather['temperature'],
            'weather_description': weather['weather_description'],
            'soil_type_estimated': soil_defaults['soil_type'],
            'soil_ph_estimated': soil_defaults['soil_ph'],
            'canal_access': canal_access,
            'water_source_note': water_source_note,
            'kc_factor': kc_factor,
            'liters_per_acre': round(liters_per_acre, 1),
            'total_liters_required': total_liters_required,
            'needs_water': bool(needs_water),
        }

        # Agar photo se crop detect hua tha, wo info bhi frontend ko bhejte hain
        # taake user dekh sake AI ne kya pehchana aur kitne confidence ke sath
        if detected_crop_info:
            response_data['crop_detected_from_photo'] = True
            response_data['detection_confidence'] = detected_crop_info['confidence']
            response_data['raw_detected_label'] = detected_crop_info['detected_crop_raw']

        return jsonify(response_data), 200

    except Exception as e:
        return jsonify({'error': f'Auto-prediction failed: {str(e)}'}), 500
