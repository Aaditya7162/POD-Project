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
# Support Vercel Postgres or other remote databases
database_url = os.environ.get('DATABASE_URL')
if database_url:
    if database_url.startswith("postgres://"):
        database_url = database_url.replace("postgres://", "postgresql://", 1)
else:
    # If on Vercel and no remote DB, use /tmp for SQLite (writable but non-persistent)
    if os.environ.get('VERCEL'):
        database_url = 'sqlite:////tmp/database.db'
    else:
        database_url = 'sqlite:///database.db'

app.config['SQLALCHEMY_DATABASE_URI'] = database_url
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'nexus_health_super_secret_key_2026')

db.init_app(app)

# Create tables and seed if empty (Useful for initial deployment)
with app.app_context():
    db.create_all()
    # Check if we need to seed
    if not User.query.filter_by(username='dr.gupta@nexus.ai').first():
        try:
            # We import here to avoid circular dependencies if any
            from init_db import init_db
            print("Seeding database...")
            init_db()
        except Exception as e:
            print(f"Seeding skipped or failed: {e}")

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

import google.generativeai as genai

# Configure Gemini AI
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY')
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel('gemini-1.5-flash')
else:
    model = None

@app.route('/api/chat', methods=['POST'])
@token_required
def chat_analysis(current_user):
    data = request.get_json()
    patient_id = data.get('patient_id')
    message = data.get('message', '')
    
    if not patient_id:
        return jsonify({'message': 'Patient ID is required'}), 400
        
    patient = Patient.query.get_or_404(patient_id)
    vitals_list = Vital.query.filter_by(patient_id=patient.id).order_by(Vital.timestamp.desc()).limit(5).all()
    latest_vital = vitals_list[0] if vitals_list else None
    
    # Context for AI
    context = {
        'name': patient.name,
        'age': patient.age,
        'status': patient.status,
        'health_score': patient.health_score,
        'conditions': [c.name for c in patient.conditions],
        'vitals': [{'hr': v.hr, 'bp': v.bp, 'spo2': v.spo2, 'time': v.timestamp.strftime('%H:%M')} for v in vitals_list],
        'activities': [a.to_dict() for a in patient.activities[:5]]
    }

    if model:
        try:
            prompt = f"""
            You are Nexus AI, an advanced clinical decision support system. 
            You are analyzing the patient: {context['name']} (Age: {context['age']}).
            
            Current Clinical State:
            - Status: {context['status']}
            - Health Score: {context['health_score']}/100
            - Conditions: {', '.join(context['conditions'])}
            - Latest Vitals: {context['vitals'][0] if context['vitals'] else 'N/A'}
            - Recent Activity: {len(context['activities'])} entries
            
            User Query: "{message}"
            
            Instructions:
            1. Provide a professional, clinical analysis based ONLY on the data provided.
            2. If vitals are abnormal (e.g. HR > 100, SpO2 < 95), highlight them immediately.
            3. Be concise and use medical terminology where appropriate.
            4. If the query is "analyze" or "summary", provide a structured deep-scan of their current risk profile.
            5. Always maintain a clinical and objective tone.
            """
            
            response = model.generate_content(prompt)
            reply = response.text
        except Exception as e:
            reply = f"AI Engine Error: {str(e)}. Falling back to local analysis..."
            model_fallback = True
    else:
        model_fallback = True

    if not model or 'model_fallback' in locals():
        # Enhanced simulated clinical logic for high-fidelity reasoning
        m = message.lower()
        
        # 1. Summary / Analysis
        if any(x in m for x in ["analyze", "status", "summary", "scan"]):
            reply = f"### Clinical Analysis for {patient.name}\n"
            reply += f"**Current Status:** {patient.status} (Health Score: {patient.health_score}/100)\n\n"
            
            if latest_vital:
                reply += "#### Vital Signs Scan:\n"
                reply += f"• **Heart Rate:** {latest_vital.hr} BPM "
                reply += "(NORMAL)" if latest_vital.hr <= 100 else "(ABNORMAL - Tachycardia)"
                reply += f"\n• **Blood Pressure:** {latest_vital.bp} "
                reply += f"\n• **Oxygen (SpO2):** {latest_vital.spo2}% "
                reply += "(NORMAL)" if latest_vital.spo2 >= 95 else "(CRITICAL - Hypoxia)"
                reply += "\n\n"

            if patient.conditions:
                reply += "#### Diagnosis Overview:\n"
                for c in patient.conditions:
                    reply += f"• {c.name}\n"
                reply += "\n"

            reply += "#### AI Risk Assessment:\n"
            if patient.status == 'Critical':
                reply += "⚠️ **High Risk Profile:** Multiple vital alerts detected. Suggest immediate clinical review and potential escalation of care."
            elif patient.health_score < 70:
                reply += "🟡 **Moderate Risk:** Patient is stable but requires active monitoring of condition trends."
            else:
                reply += "✅ **Low Risk:** Clinical data suggests steady state. Maintain current management plan."

        # 2. Recommendations
        elif any(x in m for x in ["recommend", "plan", "advice", "what to do"]):
            reply = f"### Clinical Recommendations for {patient.name}\n"
            
            if "diabetes" in str(context['conditions']).lower():
                reply += "• **Endocrine:** Request daily fasting glucose logs and check latest HbA1c results.\n"
            
            if latest_vital and latest_vital.hr > 100:
                reply += "• **Cardiac:** Perform ECG to rule out arrhythmia due to sustained tachycardia.\n"
            
            if patient.status == 'Critical':
                reply += "• **Stat Action:** Notify primary consultant and prepare for potential ICU transfer if SpO2 drops below 92%.\n"
                reply += "• **Diagnostics:** Order comprehensive metabolic panel (CMP) and ABG immediately.\n"
            else:
                reply += "• **Routine:** Schedule follow-up in 10-14 days.\n"
                reply += "• **Wellness:** Review medication compliance and physical activity logs.\n"
            
            reply += "\n*Note: This is an automated clinical scan based on dashboard parameters.*"
        
        else:
            reply = "I am the Nexus AI Assistant. I have scanned this patient's clinical node. You can ask me for a **'clinical analysis'** or a **'treatment recommendation'** based on their current vitals and history."

    return jsonify({
        'reply': reply,
        'timestamp': datetime.datetime.now(timezone.utc).strftime('%H:%M')
    })

if __name__ == '__main__':
    app.run(debug=True, port=5001)
