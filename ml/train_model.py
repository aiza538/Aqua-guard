"""
AquaGuard - Smart Irrigation Prediction Model Training
Developer 3 (AI Integration)

Dataset: Smart_Irrigation_Soil_Health_Pakistan.csv (agronomy-formula recalculated target,
         now covering 20 districts across Pakistan)
Target: Recommended_Irrigation_Liters (regression)
"""

import pandas as pd
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.metrics import mean_absolute_error, r2_score
import joblib
import os

# 1. Load dataset
DATA_PATH = os.path.join(os.path.dirname(__file__), '..', 'data', 'Smart_Irrigation_Soil_Health_Pakistan.csv')
df = pd.read_csv(DATA_PATH)

# 2. Real Pakistan irrigation infrastructure mapping (20 districts)
# Based on Indus Basin Irrigation System coverage (Punjab/Sindh plains + canal-fed
# KP districts have reliable canal access; hilly/arid/urban-groundwater districts don't)
CANAL_ACCESS_MAP = {
    'Khairpur': 'Yes', 'Sukkur': 'Yes', 'Multan': 'Yes', 'Bahawalpur': 'Yes',
    'Mardan': 'Yes', 'Charsadda': 'Yes', 'DI Khan': 'No', 'Swat': 'No',
    'Lahore': 'Yes', 'Faisalabad': 'Yes', 'Gujranwala': 'Yes', 'Sialkot': 'Yes',
    'Sahiwal': 'Yes', 'Rawalpindi': 'No', 'Islamabad': 'No', 'Peshawar': 'Yes',
    'Quetta': 'No', 'Karachi': 'No', 'Hyderabad': 'Yes', 'Larkana': 'Yes',
}

# Dataset already has Canal_Access column, but we re-derive it from the map
# to guarantee consistency between training data and the Flask backend's mapping.
df['Canal_Access'] = df['District'].map(CANAL_ACCESS_MAP)

print("Dataset loaded:", df.shape)
print("\nDistricts x Canal Access:")
print(df[['District', 'Canal_Access']].drop_duplicates().sort_values('District').to_string(index=False))

missing = df['Canal_Access'].isnull().sum()
if missing:
    print(f"\n⚠️ WARNING: {missing} rows have a District not present in CANAL_ACCESS_MAP!")

# 3. Features and target
FEATURES = ['District', 'Soil_Type', 'Canal_Access', 'Soil_pH', 'Moisture_%', 'Rainfall_mm']
TARGET = 'Recommended_Irrigation_Liters'

X = df[FEATURES]
y = df[TARGET]

# 4. Train/test split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# 5. Preprocessing pipeline
categorical_features = ['District', 'Soil_Type', 'Canal_Access']

preprocessor = ColumnTransformer(
    transformers=[('cat', OneHotEncoder(handle_unknown='ignore'), categorical_features)],
    remainder='passthrough'
)

model = Pipeline(steps=[
    ('preprocessor', preprocessor),
    ('regressor', RandomForestRegressor(n_estimators=200, max_depth=10, random_state=42))
])

# 6. Train
model.fit(X_train, y_train)

# 7. Evaluate
y_pred = model.predict(X_test)
mae = mean_absolute_error(y_test, y_pred)
r2 = r2_score(y_test, y_pred)

cv_scores = cross_val_score(model, X, y, cv=5, scoring='r2')

print(f"\n--- Evaluation ---")
print(f"Test set size: {len(X_test)} rows")
print(f"MAE: {mae:.2f} Liters")
print(f"R2 Score (test): {r2:.3f}")
print(f"5-Fold CV R2: {cv_scores.mean():.3f} ± {cv_scores.std():.3f}")

# 8. Save model + the canal access mapping (Flask ko bhi chahiye hoga)
MODEL_PATH = os.path.join(os.path.dirname(__file__), 'irrigation_model.pkl')
joblib.dump(model, MODEL_PATH)

MAPPING_PATH = os.path.join(os.path.dirname(__file__), 'canal_access_map.pkl')
joblib.dump(CANAL_ACCESS_MAP, MAPPING_PATH)

print(f"\nModel saved to: {MODEL_PATH}")
print(f"Canal access mapping saved to: {MAPPING_PATH}")
