import requests
import os
from math import radians, sin, cos, sqrt, atan2

OPENWEATHER_API_KEY = os.getenv('OPENWEATHER_API_KEY')

# Hamare 8 known districts ke approximate center coordinates
# DISTRICT_COORDINATES = {
#     'Khairpur': (27.5295, 68.7621),
#     'Sukkur': (27.7052, 68.8574),
#     'Multan': (30.1575, 71.5249),
#     'Bahawalpur': (29.3956, 71.6722),
#     'Mardan': (34.1986, 72.0404),
#     'Charsadda': (34.1453, 71.7414),
#     'DI Khan': (31.8314, 70.9017),
#     'Swat': (35.2227, 72.4258),
# }

DISTRICT_COORDINATES = {
    'Khairpur': (27.5295, 68.7621),
    'Sukkur': (27.7052, 68.8574),
    'Multan': (30.1575, 71.5249),
    'Bahawalpur': (29.3956, 71.6722),
    'Mardan': (34.1986, 72.0404),
    'Charsadda': (34.1453, 71.7414),
    'DI Khan': (31.8314, 70.9017),
    'Swat': (35.2227, 72.4258),
    'Lahore': (31.5497, 74.3436),
    'Faisalabad': (31.4180, 73.0791),
    'Gujranwala': (32.1877, 74.1945),
    'Sialkot': (32.4945, 74.5229),
    'Sahiwal': (30.6682, 73.1114),
    'Rawalpindi': (33.5651, 73.0169),
    'Islamabad': (33.6844, 73.0479),
    'Peshawar': (34.0151, 71.5249),
    'Quetta': (30.1798, 66.9750),
    'Karachi': (24.8607, 67.0011),
    'Hyderabad': (25.3960, 68.3578),
    'Larkana': (27.5590, 68.2123),
}

def haversine_distance(lat1, lon1, lat2, lon2):
    """Do coordinates ke beech ka distance (km) nikalta hai"""
    R = 6371  # Earth's radius in km
    dlat = radians(lat2 - lat1)
    dlon = radians(lon2 - lon1)
    a = sin(dlat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2) ** 2
    c = 2 * atan2(sqrt(a), sqrt(1 - a))
    return R * c


def find_nearest_district(latitude, longitude):
    """User ke GPS coordinates se sabse qareeb wala known district dhoondta hai"""
    nearest_district = None
    min_distance = float('inf')

    for district, (d_lat, d_lon) in DISTRICT_COORDINATES.items():
        distance = haversine_distance(latitude, longitude, d_lat, d_lon)
        if distance < min_distance:
            min_distance = distance
            nearest_district = district

    return nearest_district, round(min_distance, 1)


def get_weather_data(latitude, longitude):
    """OpenWeatherMap se current weather aur rainfall data leta hai"""
    if not OPENWEATHER_API_KEY:
        raise ValueError("Weather API key not configured.")

    url = "https://api.openweathermap.org/data/2.5/weather"
    params = {
        'lat': latitude,
        'lon': longitude,
        'appid': OPENWEATHER_API_KEY,
        'units': 'metric',
    }

    response = requests.get(url, params=params, timeout=10)

    if response.status_code != 200:
        raise ConnectionError(f"Weather API request failed: {response.status_code}")

    data = response.json()

    # Rainfall (agar available na ho, 0 treat karte hain)
    rainfall_mm = data.get('rain', {}).get('1h', 0) * 24  # 1-hour ko rough daily estimate mein convert

    humidity = data.get('main', {}).get('humidity', 50)  # moisture proxy ke tor par

    return {
        'rainfall_mm': round(rainfall_mm, 1),
        'humidity': humidity,
        'temperature': data.get('main', {}).get('temp'),
        'weather_description': data.get('weather', [{}])[0].get('description', ''),
    }