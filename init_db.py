from app import app
from models import db, User, Patient, Vital, Condition, ClinicalActivity
from werkzeug.security import generate_password_hash
import datetime
from datetime import timezone
import random

def init_db():
    with app.app_context():
        print("Dropping and recreating database...")
        db.drop_all()
        db.create_all()

        print("Seeding database...")

        # 1. Create Admin
        admin = User(
            username='dr.gupta@nexus.ai', 
            password_hash=generate_password_hash('password'), 
            role='admin', 
            name='Dr. Rajesh Gupta'
        )
        db.session.add(admin)

        # 2. Create Patients
        patients_data = [
            {"name": "Arjun Sharma", "age": 45, "abha": "91-2204-1102-4421", "status": "Active", "height": "175 cm", "weight": "78 kg", "health_score": 82},
            {"name": "Priya Singh", "age": 32, "abha": "91-3305-2213-5532", "status": "Active", "height": "162 cm", "weight": "55 kg", "health_score": 91},
            {"name": "Rahul Verma", "age": 58, "abha": "91-4406-3324-6643", "status": "Stable", "height": "170 cm", "weight": "82 kg", "health_score": 65},
            {"name": "Ananya Iyer", "age": 24, "abha": "91-5507-4435-7754", "status": "Critical", "height": "158 cm", "weight": "49 kg", "health_score": 34},
            {"name": "Vikram Malhotra", "age": 50, "abha": "91-6608-5546-8865", "status": "Stable", "height": "182 cm", "weight": "88 kg", "health_score": 72}
        ]
        
        patients = []
        for p_data in patients_data:
            p = Patient(**p_data)
            db.session.add(p)
            patients.append(p)
        
        db.session.commit() # Commit to get patient IDs

        # 3. Create User accounts for ALL patients
        for p in patients:
            # Create a username based on name (e.g., arjun.sharma@abha.in)
            username = f"{p.name.lower().replace(' ', '.')}@abha.in"
            user = User(
                username=username, 
                password_hash=generate_password_hash('password'), 
                role='patient', 
                name=p.name, 
                patient_id=p.id
            )
            db.session.add(user)
        
        db.session.commit()

        # 4. Add Vitals for all
        for p in patients:
            if p.status == "Critical":
                v = Vital(patient_id=p.id, hr=112 + random.randint(0, 10), bp="92/58", spo2=91 + random.randint(0, 2))
            else:
                v = Vital(patient_id=p.id, hr=70 + random.randint(0, 10), bp="120/80", spo2=97 + random.randint(0, 2))
            db.session.add(v)

        # 5. Add Conditions
        conditions_map = {
            "Arjun Sharma": ["Type 2 Diabetes", "Essential Hypertension"],
            "Priya Singh": ["PCOS (Managed)"],
            "Rahul Verma": ["Hyperlipidemia"],
            "Ananya Iyer": ["Septic Shock", "Acute Respiratory Distress"],
            "Vikram Malhotra": ["Post-OP Recovery"]
        }
        
        for p in patients:
            for c_name in conditions_map.get(p.name, ["General Checkup"]):
                db.session.add(Condition(patient_id=p.id, name=c_name))

        # 6. Add 5 Activities for EACH patient
        facilities = ["Apollo Jubilee Hills", "Max Labs", "Fortis", "AIIMS New Delhi", "Nexus Diagnostics"]
        test_types = ["HbA1c Screener", "Lipid Profile", "Complete Blood Count", "Thyroid Panel", "Metabolic Panel", "ECG", "Chest X-Ray"]
        statuses = ["Normal", "Review Required", "Pending", "Normal", "Normal"]
        physicians = ["Dr. Rajesh Gupta", "Dr. Sarah Mitchell", "Dr. Amit Shah", "Dr. Priya Das"]
        
        for p in patients:
            for i in range(5):
                activity_status = random.choice(statuses)
                if p.status == "Critical":
                    activity_status = random.choice(["CRITICAL", "Review Required"])
                
                db.session.add(
                    ClinicalActivity(
                        patient_id=p.id, 
                        type=random.choice(test_types), 
                        facility=random.choice(facilities), 
                        physician=random.choice(physicians),
                        status=activity_status, 
                        date=datetime.datetime.now(timezone.utc) - datetime.timedelta(days=random.randint(1, 30))
                    )
                )

        db.session.commit()
        print("Database seeding completed successfully.")

if __name__ == '__main__':
    init_db()
