from app import app
from models import db, User, Patient, Vital, Condition, ClinicalActivity
from werkzeug.security import generate_password_hash
import datetime

def init_db():
    with app.app_context():
        db.drop_all()
        db.create_all()

        print("Seeding database...")

        # 1. Create Admin
        admin = User(username='dr.gupta@nexus.ai', password_hash=generate_password_hash('password'), role='admin', name='Dr. Rajesh Gupta')
        db.session.add(admin)

        # 2. Create Patients
        p1 = Patient(name="Arjun Sharma", age=45, abha="91-2204-1102-4421", status="Active", height="175 cm", weight="78 kg", health_score=82)
        p2 = Patient(name="Priya Singh", age=32, abha="91-3305-2213-5532", status="Active", height="162 cm", weight="55 kg", health_score=91)
        p3 = Patient(name="Rahul Verma", age=58, abha="91-4406-3324-6643", status="Stable", height="170 cm", weight="82 kg", health_score=65)
        p4 = Patient(name="Ananya Iyer", age=24, abha="91-5507-4435-7754", status="Critical", height="158 cm", weight="49 kg", health_score=34)
        p5 = Patient(name="Vikram Malhotra", age=50, abha="91-6608-5546-8865", status="Stable", height="182 cm", weight="88 kg", health_score=72)
        
        db.session.add_all([p1, p2, p3, p4, p5])
        db.session.commit()

        # 3. Create Patient Users
        patient_user = User(username='arjun.sharma@abha.in', password_hash=generate_password_hash('password'), role='patient', name='Arjun Sharma', patient_id=p1.id)
        db.session.add(patient_user)
        db.session.commit()

        # 4. Add Vitals
        v1 = Vital(patient_id=p1.id, hr=75, bp="128/84", spo2=98)
        v2 = Vital(patient_id=p2.id, hr=68, bp="112/76", spo2=99)
        v3 = Vital(patient_id=p3.id, hr=82, bp="145/92", spo2=96)
        v4 = Vital(patient_id=p4.id, hr=118, bp="92/58", spo2=91)
        v5 = Vital(patient_id=p5.id, hr=76, bp="135/88", spo2=97)

        db.session.add_all([v1, v2, v3, v4, v5])

        # 5. Add Conditions
        c1 = Condition(patient_id=p1.id, name="Type 2 Diabetes")
        c2 = Condition(patient_id=p1.id, name="Essential Hypertension")
        c3 = Condition(patient_id=p2.id, name="PCOS (Managed)")
        c4 = Condition(patient_id=p4.id, name="Septic Shock")

        db.session.add_all([c1, c2, c3, c4])

        # 6. Add 5 Activities for EACH patient
        activities = []
        import random
        facilities = ["Apollo Jubilee Hills", "Max Labs", "Fortis", "AIIMS New Delhi", "Nexus Diagnostics"]
        test_types = ["HbA1c Screener", "Lipid Profile", "Complete Blood Count", "Thyroid Panel", "Metabolic Panel", "ECG", "Chest X-Ray"]
        statuses = ["Normal", "Review Required", "Pending", "Normal", "Normal"]
        
        for p in [p1, p2, p3, p4, p5]:
            for i in range(5):
                activities.append(
                    ClinicalActivity(
                        patient_id=p.id, 
                        type=random.choice(test_types), 
                        facility=random.choice(facilities), 
                        status=random.choice(statuses) if p.status != "Critical" else random.choice(["CRITICAL", "Review Required"]), 
                        date=datetime.datetime.utcnow() - datetime.timedelta(days=random.randint(1, 30))
                    )
                )

        db.session.add_all(activities)
        db.session.commit()
        print("Database seeding completed.")

if __name__ == '__main__':
    init_db()
