from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from models import db, User, Patient, Vital, Condition, ClinicalActivity
from werkzeug.security import check_password_hash
import jwt
import datetime
from datetime import timezone
import os
from functools import wraps

app = Flask(__name__, static_folder='.')
CORS(app)

# Configuration
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = 'nexus_health_super_secret_key_2026'

db.init_app(app)

# Authentication Decorator
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if len(auth_header.split(" ")) > 1:
                token = auth_header.split(" ")[1]
        
        if not token:
            return jsonify({'message': 'Token is missing!'}), 401

        try:
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
            current_user = User.query.filter_by(id=data['user_id']).first()
        except Exception as e:
            return jsonify({'message': 'Token is invalid!', 'error': str(e)}), 401

        return f(current_user, *args, **kwargs)
    return decorated


# --- ROUTES FOR STATIC FILES ---
@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/styles/<path:path>')
def send_styles(path):
    return send_from_directory('styles', path)

@app.route('/js/<path:path>')
def send_js(path):
    return send_from_directory('js', path)


# --- API ROUTES ---

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data or not data.get('username') or not data.get('password'):
        return jsonify({'message': 'Could not verify', 'WWW-Authenticate': 'Basic realm="Login required!"'}), 401

    user = User.query.filter_by(username=data.get('username')).first()

    if not user:
        return jsonify({'message': 'User not found'}), 401

    if check_password_hash(user.password_hash, data.get('password')):
        token = jwt.encode({
            'user_id': user.id,
            'role': user.role,
            'exp': datetime.datetime.now(timezone.utc) + datetime.timedelta(hours=24)
        }, app.config['SECRET_KEY'], algorithm="HS256")

        return jsonify({
            'token': token,
            'user': {
                'id': user.id,
                'name': user.name,
                'role': user.role,
                'patient_id': user.patient_id
            }
        })

    return jsonify({'message': 'Invalid password'}), 401


@app.route('/api/patients', methods=['GET'])
@token_required
def get_patients(current_user):
    if current_user.role != 'admin':
        return jsonify({'message': 'Unauthorized'}), 403
    
    patients = Patient.query.all()
    return jsonify([patient.to_dict() for patient in patients])


@app.route('/api/patients', methods=['POST'])
@token_required
def add_patient(current_user):
    if current_user.role != 'admin':
        return jsonify({'message': 'Unauthorized'}), 403

    data = request.get_json()
    new_patient = Patient(
        name=data.get('name', 'Unknown Patient'),
        age=int(data.get('age', 0)),
        abha=data.get('abha', '00-0000-0000-0000'),
        status=data.get('status', 'Active'),
        height=data.get('height', '170 cm'),
        weight=data.get('weight', '70 kg'),
        health_score=80 if data.get('status') != 'Critical' else 35
    )
    db.session.add(new_patient)
    db.session.commit()
    
    # Add initial vital
    try:
        hr_val = int(data.get('hr', 75))
    except (ValueError, TypeError):
        hr_val = 75
        
    try:
        spo2_val = int(data.get('spo2', 98))
    except (ValueError, TypeError):
        spo2_val = 98

    initial_vital = Vital(
        patient_id=new_patient.id, 
        hr=hr_val, 
        bp=data.get('bp', "120/80"), 
        spo2=spo2_val
    )
    db.session.add(initial_vital)
    db.session.commit()

    return jsonify(new_patient.to_dict()), 201


@app.route('/api/patients/<int:id>', methods=['DELETE'])
@token_required
def delete_patient(current_user, id):
    if current_user.role != 'admin':
        return jsonify({'message': 'Unauthorized'}), 403

    patient = Patient.query.get_or_404(id)
    db.session.delete(patient)
    db.session.commit()

    return jsonify({'message': 'Patient deleted'})


@app.route('/api/patients/<int:id>', methods=['GET'])
@token_required
def get_patient(current_user, id):
    if current_user.role != 'admin' and current_user.patient_id != id:
        return jsonify({'message': 'Unauthorized'}), 403

    patient = Patient.query.get_or_404(id)
    return jsonify(patient.to_dict())

@app.route('/api/patients/<int:id>/vitals', methods=['POST'])
@token_required
def add_vital(current_user, id):
    if current_user.role != 'admin':
        return jsonify({'message': 'Unauthorized'}), 403
        
    patient = Patient.query.get_or_404(id)
    data = request.get_json()
    try:
        hr_val = int(data.get('hr', 75))
    except (ValueError, TypeError):
        hr_val = 75
        
    try:
        spo2_val = int(data.get('spo2', 98))
    except (ValueError, TypeError):
        spo2_val = 98

    new_vital = Vital(
        patient_id=patient.id,
        hr=hr_val,
        bp=data.get('bp', '120/80'),
        spo2=spo2_val
    )
    db.session.add(new_vital)
    
    # Simple logic to update health status based on vitals
    if new_vital.hr > 100 or new_vital.spo2 < 95:
        patient.status = 'Critical'
        patient.health_score = max(0, patient.health_score - 10)
    
    db.session.commit()
    return jsonify({'message': 'Vital added successfully', 'patient': patient.to_dict()}), 201

if __name__ == '__main__':
    app.run(debug=True, port=5001)
