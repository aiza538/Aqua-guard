from flask import Blueprint, request, jsonify
from models.user import db
from models.irrigation import IrrigationConfig, IrrigationLog
from models.sensor import SensorReading

irrigation_bp = Blueprint('irrigation', __name__, url_prefix='/api/irrigation')


def get_or_create_config():
    config = IrrigationConfig.query.first()
    if not config:
        config = IrrigationConfig()
        db.session.add(config)
        db.session.commit()
    return config


@irrigation_bp.route('/config', methods=['GET'])
def get_config():
    return jsonify(get_or_create_config().to_dict())


@irrigation_bp.route('/config', methods=['PUT'])
def update_config():
    config = get_or_create_config()
    data = request.get_json()

    if 'auto_mode' in data:
        config.auto_mode = data['auto_mode']
    if 'moisture_threshold_low' in data:
        config.moisture_threshold_low = float(data['moisture_threshold_low'])
    if 'moisture_threshold_high' in data:
        config.moisture_threshold_high = float(data['moisture_threshold_high'])

    db.session.commit()
    return jsonify(config.to_dict())


@irrigation_bp.route('/pump', methods=['POST'])
def toggle_pump():
    """Manual pump override — app sends { pump_on: true/false }."""
    config = get_or_create_config()
    data = request.get_json()
    pump_on = data.get('pump_on', not config.pump_on)
    config.pump_on = pump_on

    latest = SensorReading.query.order_by(SensorReading.timestamp.desc()).first()
    moisture = latest.soil_moisture if latest else None

    db.session.add(IrrigationLog(
        action='pump_on' if pump_on else 'pump_off',
        trigger='manual',
        soil_moisture_at_time=moisture,
    ))
    db.session.commit()

    return jsonify({'pump_on': config.pump_on, 'action': 'pump_on' if pump_on else 'pump_off'})


@irrigation_bp.route('/status', methods=['GET'])
def get_status():
    """Full irrigation status — config + latest sensor + recent logs."""
    config = get_or_create_config()
    latest = SensorReading.query.order_by(SensorReading.timestamp.desc()).first()
    logs = IrrigationLog.query.order_by(IrrigationLog.timestamp.desc()).limit(10).all()

    return jsonify({
        'config': config.to_dict(),
        'latest_sensor': latest.to_dict() if latest else None,
        'recent_logs': [l.to_dict() for l in logs],
    })
