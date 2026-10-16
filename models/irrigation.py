from models.user import db
from datetime import datetime


class IrrigationConfig(db.Model):
    __tablename__ = 'irrigation_config'

    id = db.Column(db.Integer, primary_key=True)
    auto_mode = db.Column(db.Boolean, default=True)
    pump_on = db.Column(db.Boolean, default=False)
    moisture_threshold_low = db.Column(db.Float, default=30.0)   # below this -> start watering
    moisture_threshold_high = db.Column(db.Float, default=60.0)  # above this -> stop watering
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'auto_mode': self.auto_mode,
            'pump_on': self.pump_on,
            'moisture_threshold_low': self.moisture_threshold_low,
            'moisture_threshold_high': self.moisture_threshold_high,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }


class IrrigationLog(db.Model):
    __tablename__ = 'irrigation_logs'

    id = db.Column(db.Integer, primary_key=True)
    action = db.Column(db.String(20), nullable=False)      # 'pump_on' or 'pump_off'
    trigger = db.Column(db.String(20), nullable=False)     # 'auto' or 'manual'
    soil_moisture_at_time = db.Column(db.Float)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'action': self.action,
            'trigger': self.trigger,
            'soil_moisture_at_time': self.soil_moisture_at_time,
            'timestamp': self.timestamp.isoformat(),
        }
