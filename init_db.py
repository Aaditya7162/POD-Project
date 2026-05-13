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
            {"name": "Vikram Malhotra", "age": 50, "abha": "91-6608-5546-8865", "status": "Stable", "height": "182 cm", "weight": "88 kg", "health_score": 72},
            {"name": "Siddharth Rao", "age": 39, "abha": "91-7709-6657-9976", "status": "Active", "height": "178 cm", "weight": "74 kg", "health_score": 88},
            {"name": "Meera Kulkarni", "age": 62, "abha": "91-8810-7768-0087", "status": "Stable", "height": "155 cm", "weight": "68 kg", "health_score": 59},
            {"name": "Karan Johar", "age": 41, "abha": "91-9911-8879-1198", "status": "Active", "height": "172 cm", "weight": "80 kg", "health_score": 85},
            {"name": "Sneha Reddy", "age": 29, "abha": "91-1012-9980-2209", "status": "Active", "height": "165 cm", "weight": "52 kg", "health_score": 94},
            {"name": "Aditya Chopra", "age": 55, "abha": "91-2123-0091-3310", "status": "Critical", "height": "168 cm", "weight": "85 kg", "health_score": 28},
            {"name": "Ishita Bhalla", "age": 34, "abha": "91-3234-1102-4421", "status": "Stable", "height": "160 cm", "weight": "58 kg", "health_score": 76},
            {"name": "Rohan Mehra", "age": 47, "abha": "91-4345-2213-5532", "status": "Active", "height": "180 cm", "weight": "76 kg", "health_score": 81},
            {"name": "Zoya Akhtar", "age": 31, "abha": "91-5456-3324-6643", "status": "Active", "height": "163 cm", "weight": "54 kg", "health_score": 92},
            {"name": "Kabir Khan", "age": 43, "abha": "91-6567-4435-7754", "status": "Stable", "height": "174 cm", "weight": "72 kg", "health_score": 68},
            {"name": "Diya Mirza", "age": 38, "abha": "91-7678-5546-8865", "status": "Active", "height": "167 cm", "weight": "59 kg", "health_score": 87},
            {"name": "Varun Dhawan", "age": 27, "abha": "91-8789-6657-9976", "status": "Active", "height": "176 cm", "weight": "70 kg", "health_score": 95},
            {"name": "Alia Bhatt", "age": 30, "abha": "91-9890-7768-0087", "status": "Stable", "height": "158 cm", "weight": "50 kg", "health_score": 79},
            {"name": "Ranbir Kapoor", "age": 42, "abha": "91-0901-8879-1198", "status": "Active", "height": "182 cm", "weight": "82 kg", "health_score": 84},
            {"name": "Deepika Padukone", "age": 37, "abha": "91-1012-9980-2209", "status": "Active", "height": "173 cm", "weight": "60 kg", "health_score": 90},
            {"name": "Ranveer Singh", "age": 39, "abha": "91-2123-0091-3310", "status": "Critical", "height": "178 cm", "weight": "75 kg", "health_score": 31},
            {"name": "Katrina Kaif", "age": 40, "abha": "91-3234-1102-4421", "status": "Active", "height": "174 cm", "weight": "58 kg", "health_score": 88},
            {"name": "Vicky Kaushal", "age": 35, "abha": "91-4345-2213-5532", "status": "Active", "height": "183 cm", "weight": "78 kg", "health_score": 86},
            {"name": "Sara Ali Khan", "age": 28, "abha": "91-5456-3324-6643", "status": "Active", "height": "162 cm", "weight": "51 kg", "health_score": 93},
            {"name": "Kartik Aaryan", "age": 33, "abha": "91-6567-4435-7754", "status": "Stable", "height": "175 cm", "weight": "73 kg", "health_score": 74},
            {"name": "Janhvi Kapoor", "age": 26, "abha": "91-7678-5546-8865", "status": "Active", "height": "160 cm", "weight": "50 kg", "health_score": 96}
        ]
        
        patients = []
        for p_data in patients_data:
            p = Patient(**p_data)
            db.session.add(p)
            patients.append(p)
        
        db.session.commit() # Commit to get patient IDs

        # 3. Create User accounts for ALL patients
        for p in patients:
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
            elif p.status == "Stable":
                v = Vital(patient_id=p.id, hr=85 + random.randint(0, 10), bp="135/90", spo2=95 + random.randint(0, 2))
            else:
                v = Vital(patient_id=p.id, hr=70 + random.randint(0, 10), bp="120/80", spo2=97 + random.randint(0, 2))
            db.session.add(v)

        # 5. Add Conditions
        conditions_pool = ["Type 2 Diabetes", "Essential Hypertension", "PCOS", "Hyperlipidemia", "Septic Shock", "Post-OP Recovery", "Asthma", "Anemia", "Vitamin D Deficiency", "Migraine"]
        
        for p in patients:
            num_conditions = random.randint(1, 3) if p.status != "Active" else 1
            selected_conditions = random.sample(conditions_pool, num_conditions)
            for c_name in selected_conditions:
                db.session.add(Condition(patient_id=p.id, name=c_name))

        # 6. Add 5 Activities for EACH patient
        facilities = ["Apollo Jubilee Hills", "Max Labs", "Fortis", "AIIMS New Delhi", "Nexus Diagnostics", "Metropolis", "Lal Path Labs"]
        test_types = ["HbA1c Screener", "Lipid Profile", "Complete Blood Count", "Thyroid Panel", "Metabolic Panel", "ECG", "Chest X-Ray", "Liver Function Test"]
        statuses = ["Normal", "Review Required", "Pending", "Normal", "Normal"]
        physicians = ["Dr. Rajesh Gupta", "Dr. Sarah Mitchell", "Dr. Amit Shah", "Dr. Priya Das", "Dr. Vikram Seth"]
        
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
                        date=datetime.datetime.now(timezone.utc) - datetime.timedelta(days=random.randint(1, 60))
                    )
                )

        db.session.commit()
        print(f"Database seeding completed successfully with {len(patients)} patients.")

if __name__ == '__main__':
    init_db()
