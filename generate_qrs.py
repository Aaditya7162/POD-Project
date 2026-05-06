import os
import urllib.request
import ssl
from app import app
from models import db, Patient

# Bypass SSL verification for macOS
ssl._create_default_https_context = ssl._create_unverified_context

os.makedirs('qr_codes', exist_ok=True)

with app.app_context():
    patients = Patient.query.all()
    for p in patients:
        url = f"https://api.qrserver.com/v1/create-qr-code/?size=300x300&data={p.id}"
        filename = f"qr_codes/{p.name.replace(' ', '_')}_QR.png"
        urllib.request.urlretrieve(url, filename)
        print(f"Generated QR for {p.name} -> {filename}")

print("All QR codes generated successfully!")
