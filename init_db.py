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

        patients_data = [
            {
                "name": "Arjun Sharma", "age": 45, "gender": "Male", "blood_group": "A+", 
                "abha": "91-2204-1102-4421", "status": "Stable", "height": "175 cm", "weight": "78 kg", 
                "health_score": 82, "allergies": "Penicillin, Sulfa", "emergency_contact": "Anita Sharma (Wife) - +91 98765 43210",
                "insurance_provider": "HDFC Ergo", "insurance_policy_number": "POL-12345678", "bank_account_number": "XXXX-XXXX-1234", "ifsc_code": "HDFC0001234",
                "last_visit": datetime.datetime.now(timezone.utc) - datetime.timedelta(days=12)
            },
            {
                "name": "Priya Singh", "age": 32, "gender": "Female", "blood_group": "O+", 
                "abha": "91-3305-2213-5532", "status": "Active", "height": "162 cm", "weight": "55 kg", 
                "health_score": 91, "allergies": "None", "emergency_contact": "Vikram Singh (Brother) - +91 98765 12345",
                "insurance_provider": "Star Health", "insurance_policy_number": "SH-98765432", "bank_account_number": "XXXX-XXXX-5678", "ifsc_code": "SBIN0005678",
                "last_visit": datetime.datetime.now(timezone.utc) - datetime.timedelta(days=5)
            },
            {
                "name": "Rahul Verma", "age": 58, "gender": "Male", "blood_group": "B-", 
                "abha": "91-4406-3324-6643", "status": "Observation", "height": "170 cm", "weight": "82 kg", 
                "health_score": 65, "allergies": "Latex, Dust", "emergency_contact": "Sunil Verma (Son) - +91 98765 55667",
                "insurance_provider": "ICICI Lombard", "insurance_policy_number": "IL-55554444", "bank_account_number": "XXXX-XXXX-9012", "ifsc_code": "ICIC0009012",
                "last_visit": datetime.datetime.now(timezone.utc) - datetime.timedelta(days=2)
            },
            {
                "name": "Ananya Iyer", "age": 24, "gender": "Female", "blood_group": "AB+", 
                "abha": "91-5507-4435-7754", "status": "Critical", "height": "158 cm", "weight": "49 kg", 
                "health_score": 34, "allergies": "Peanuts, Shellfish", "emergency_contact": "Lakshmi Iyer (Mother) - +91 98765 88990",
                "insurance_provider": "Max Bupa", "insurance_policy_number": "MB-11223344", "bank_account_number": "XXXX-XXXX-3456", "ifsc_code": "UTIB0003456",
                "last_visit": datetime.datetime.now(timezone.utc) - datetime.timedelta(hours=6)
            }
        ]
        
        patients = []
        for p_data in patients_data:
            p = Patient(**p_data)
            db.session.add(p)
            patients.append(p)
        
        db.session.commit()

        # 3. Create User accounts
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

        # 4. Add Vitals
        for p in patients:
            if p.status == "Critical":
                v = Vital(patient_id=p.id, hr=115, bp="90/60", spo2=92)
            elif p.status == "Observation":
                v = Vital(patient_id=p.id, hr=88, bp="145/95", spo2=96)
            else:
                v = Vital(patient_id=p.id, hr=72, bp="120/80", spo2=98)
            db.session.add(v)

        # 5. Add Conditions
        conditions_pool = {
            "Arjun Sharma": ["Type 2 Diabetes", "Hyperlipidemia"],
            "Priya Singh": ["Mild Asthma"],
            "Rahul Verma": ["Hypertension", "Early Stage COPD"],
            "Ananya Iyer": ["Septic Shock", "Severe Anemia"]
        }
        
        for p in patients:
            for c_name in conditions_pool.get(p.name, ["Healthy"]):
                db.session.add(Condition(patient_id=p.id, name=c_name))

        # 6. Add Detailed Clinical Activities for Timeline
        facilities = ["Apollo Jubilee Hills", "Max Labs", "Fortis", "AIIMS New Delhi", "Nexus Diagnostics"]
        physicians = ["Dr. Rajesh Gupta", "Dr. Sarah Mitchell", "Dr. Amit Shah", "Dr. Priya Das"]

        for p in patients:
            # Add a recent Doctor Review
            db.session.add(ClinicalActivity(
                patient_id=p.id,
                type="Doctor Review",
                facility=random.choice(facilities),
                physician=random.choice(physicians),
                status="Completed",
                notes=f"Patient {p.name} presented for routine follow-up. Vital signs are within expected ranges for condition profile. Adjusted dosage of primary medication.",
                date=p.last_visit
            ))

            # Add a Lab Report
            dummy_svg = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4MDAiIGhlaWdodD0iNjAwIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZWVlIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjI0IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjMzMzIj5EdW1teSBMYWIgUmVwb3J0IENvbnRlbnQ8L3RleHQ+PC9zdmc+"
            db.session.add(ClinicalActivity(
                patient_id=p.id,
                type="Lab Report",
                facility="Nexus Diagnostics",
                physician="Dr. Vikram Seth",
                status="Verified",
                notes="Comprehensive metabolic panel completed. All parameters within normal variance except slightly elevated serum glucose.",
                critical_finding=(p.status == "Critical"),
                date=p.last_visit - datetime.timedelta(days=2),
                report_data=dummy_svg
            ))

            # Add a Prescription
            db.session.add(ClinicalActivity(
                patient_id=p.id,
                type="Prescription",
                facility=random.choice(facilities),
                physician=random.choice(physicians),
                status="Active",
                notes="Metformin 500mg BID, Lisinopril 10mg QD. Continue current lifestyle modifications.",
                date=p.last_visit - datetime.timedelta(days=5)
            ))

            # Add an old condition/test history
            db.session.add(ClinicalActivity(
                patient_id=p.id,
                type="Test History",
                facility="AIIMS New Delhi",
                physician="Dr. S. K. Nair",
                status="Historical",
                notes="Initial diagnostic screening performed. Patient profile established for long-term monitoring.",
                date=p.last_visit - datetime.timedelta(days=45)
            ))

        db.session.commit()
        print(f"Database seeding completed successfully with {len(patients)} high-fidelity patient profiles.")

if __name__ == '__main__':
    init_db()
