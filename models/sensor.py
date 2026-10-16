from models.user import db
from datetime import datetime


class SensorReading(db.Model):
    __tablename__ = 'sensor_readings'

    id = db.Column(db.Integer, primary_key=True)
    temperature = db.Column(db.Float, nullable=False)      # Celsius
    soil_moisture = db.Column(db.Float, nullable=False)    # percentage 0-100
    humidity = db.Column(db.Float, nullable=False)         # percentage 0-100
    water_level = db.Column(db.Float, nullable=False)      # percentage 0-100
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'temperature': self.temperature,
            'soil_moisture': self.soil_moisture,
            'humidity': self.humidity,
            'water_level': self.water_level,
            'timestamp': self.timestamp.isoformat(),
        }
