from datetime import datetime
from flask import Blueprint, request, jsonify
from models.user import db
from models.sensor import SensorReading
from models.irrigation import IrrigationConfig, IrrigationLog

sensor_bp = Blueprint('sensor', __name__, url_prefix='/api/sensors')


@sensor_bp.route('/data', methods=['POST'])
def receive_sensor_data():
    """ESP32 sends sensor readings here every few seconds."""
    data = request.get_json()

    reading = SensorReading(
        temperature=data['temperature'],
        soil_moisture=data['soil_moisture'],
        humidity=data['humidity'],
        water_level=data['water_level'],
    )
    db.session.add(reading)
    db.session.commit()

    # Get or create irrigation config
    config = IrrigationConfig.query.first()
    if not config:
        config = IrrigationConfig()
        db.session.add(config)
        db.session.commit()

    # Auto irrigation decision logic
    pump_command = None
    if config.auto_mode:
        moisture = reading.soil_moisture
        tank = reading.water_level

        # Moisture too low and tank has water → start pump
        if moisture < config.moisture_threshold_low and not config.pump_on and tank > 10:
            config.pump_on = True
            pump_command = 'pump_on'
            db.session.add(IrrigationLog(action='pump_on', trigger='auto', soil_moisture_at_time=moisture))

        # Moisture high enough → stop pump
        elif moisture >= config.moisture_threshold_high and config.pump_on:
            config.pump_on = False
            pump_command = 'pump_off'
            db.session.add(IrrigationLog(action='pump_off', trigger='auto', soil_moisture_at_time=moisture))

        # Tank empty → safety stop
        elif tank <= 10 and config.pump_on:
            config.pump_on = False
            pump_command = 'pump_off'
            db.session.add(IrrigationLog(action='pump_off', trigger='auto', soil_moisture_at_time=moisture))

        db.session.commit()

    return jsonify({
        'status': 'ok',
        'pump_command': pump_command,
        'pump_on': config.pump_on,
        'reading': reading.to_dict(),
    }), 201


@sensor_bp.route('/latest', methods=['GET'])
def get_latest_reading():
    """Returns the most recent sensor snapshot for the app dashboard."""
    reading = SensorReading.query.order_by(SensorReading.timestamp.desc()).first()
    if not reading:
        return jsonify({
            'temperature': 0,
            'soil_moisture': 0,
            'humidity': 0,
            'water_level': 0,
            'timestamp': None,
            'connected': False,
            'last_seen_seconds': None,
        })

    diff = (datetime.utcnow() - reading.timestamp).total_seconds()
    is_connected = diff <= 12  # Connected if data arrived in the last 12 seconds
    data = reading.to_dict()
    data['connected'] = is_connected
    data['last_seen_seconds'] = max(0, int(diff))
    return jsonify(data)


@sensor_bp.route('/history', methods=['GET'])
def get_sensor_history():
    """Returns last 50 readings for trend charts."""
    readings = SensorReading.query.order_by(SensorReading.timestamp.desc()).limit(50).all()
    return jsonify([r.to_dict() for r in readings])
