"""
Crop Coefficient (Kc) lookup utility.
Based on FAO-56 standard crop coefficients for common Pakistani crops.
This is NOT part of the ML model — it's a fixed agronomic reference table.
"""

CROP_COEFFICIENTS = {
    "Wheat": 1.15,
    "Rice": 1.20,
    "Cotton": 1.10,
    "Sugarcane": 1.25,
    "Maize": 1.15,
    "Vegetables": 0.90,
}

DEFAULT_KC = 1.00  # fallback for "Other" or unrecognized crop
MM_TO_LITERS_PER_ACRE = 4046.86  # 1mm depth over 1 acre = 4046.86 liters


def get_crop_coefficient(crop_type: str) -> float:
    """Return Kc factor for a given crop_type, defaulting to 1.00 if unknown."""
    return CROP_COEFFICIENTS.get(crop_type, DEFAULT_KC)


def calculate_total_water(base_water_mm: float, crop_type: str, area_acres: float) -> dict:
    """
    Applies crop coefficient and area scaling to the ML model's base output.

    Args:
        base_water_mm: raw prediction from the trained ML model (depth in mm)
        crop_type: selected crop (e.g. 'Wheat', 'Rice', ...)
        area_acres: land area in acres

    Returns:
        dict with total_liters_required, liters_per_acre, kc_factor, adjusted_depth_mm
    """
    kc_factor = get_crop_coefficient(crop_type)
    adjusted_depth_mm = base_water_mm * kc_factor
    liters_per_acre = adjusted_depth_mm * MM_TO_LITERS_PER_ACRE
    total_liters = liters_per_acre * area_acres

    return {
        "total_liters_required": round(total_liters),
        "liters_per_acre": round(liters_per_acre, 2),
        "kc_factor": kc_factor,
        "adjusted_depth_mm": round(adjusted_depth_mm, 2),
    }