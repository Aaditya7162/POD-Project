from flask_sqlalchemy import SQLAlchemy
import datetime
from datetime import timezone

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    role = db.Column(db.String(20), nullable=False) # 'admin' or 'patient'
    name = db.Column(db.String(80), nullable=False)
    # If patient, optionally link to a patient record
    patient_id = db.Column(db.Integer, db.ForeignKey('patients.id'), nullable=True)

class Patient(db.Model):
    __tablename__ = 'patients'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    age = db.Column(db.Integer, nullable=False)
    gender = db.Column(db.String(20))
    blood_group = db.Column(db.String(10))
    abha = db.Column(db.String(50), nullable=False)
    status = db.Column(db.String(20), default='Active') # Active, Stable, Critical
    height = db.Column(db.String(20))
    weight = db.Column(db.String(20))
    health_score = db.Column(db.Integer, default=80)
    allergies = db.Column(db.Text)
    emergency_contact = db.Column(db.String(100))
    last_visit = db.Column(db.DateTime)
    
    # Relationships
    vitals = db.relationship('Vital', backref='patient', lazy=True, cascade="all, delete-orphan")
    conditions = db.relationship('Condition', backref='patient', lazy=True, cascade="all, delete-orphan")
    activities = db.relationship('ClinicalActivity', backref='patient', lazy=True, cascade="all, delete-orphan")

    def to_dict(self):
        # latest vital
        latest_vital = None
        if self.vitals:
            latest_vital = sorted(self.vitals, key=lambda x: x.timestamp, reverse=True)[0]

        return {
            'id': self.id,
            'name': self.name,
            'age': self.age,
            'gender': self.gender,
            'bloodGroup': self.blood_group,
            'abha': self.abha,
            'status': self.status,
            'height': self.height,
            'weight': self.weight,
            'avatar': ''.join([n[0] for n in self.name.split() if n]),
            'healthScore': self.health_score,
            'allergies': self.allergies,
            'emergencyContact': self.emergency_contact,
            'lastVisit': self.last_visit.strftime('%b %d, %Y') if self.last_visit else 'N/A',
            'vitals': {
                'hr': latest_vital.hr if latest_vital else 75,
                'bp': latest_vital.bp if latest_vital else '120/80',
                'spo2': latest_vital.spo2 if latest_vital else 98,
            },
            'conditions': [c.name for c in self.conditions],
            'recentActivity': [a.to_dict() for a in sorted(self.activities, key=lambda x: x.date, reverse=True)]
        }

class Vital(db.Model):
    __tablename__ = 'vitals'
    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey('patients.id'), nullable=False)
    hr = db.Column(db.Integer)
    bp = db.Column(db.String(20))
    spo2 = db.Column(db.Integer)
    timestamp = db.Column(db.DateTime, default=lambda: datetime.datetime.now(timezone.utc))

class Condition(db.Model):
    __tablename__ = 'conditions'
    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey('patients.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)

class ClinicalActivity(db.Model):
    __tablename__ = 'clinical_activities'
    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey('patients.id'), nullable=False)
    date = db.Column(db.DateTime, default=lambda: datetime.datetime.now(timezone.utc))
    type = db.Column(db.String(100)) # Doctor Review, Lab Report, Prescription, etc.
    facility = db.Column(db.String(100))
    physician = db.Column(db.String(100))
    status = db.Column(db.String(50))
    notes = db.Column(db.Text)
    critical_finding = db.Column(db.Boolean, default=False)
    report_data = db.Column(db.Text) # Base64 or JSON string for preview

    def to_dict(self):
        return {
            'id': self.id,
            'date': self.date.strftime('%b %d, %Y'),
            'time': self.date.strftime('%I:%M %p'),
            'type': self.type,
            'facility': self.facility,
            'physician': self.physician,
            'status': self.status,
            'notes': self.notes,
            'critical': self.critical_finding,
            'reportData': self.report_data
        }
