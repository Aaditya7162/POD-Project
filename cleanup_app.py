#!/usr/bin/env python3
import re

with open('js/app.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the duplicated Diagnosis header and malformed tag
content = content.replace('<h3 style="margin-bottom: 24px;">                <div class="card">', '<div class="card">')

# Fix hardcoded backgrounds in initDashboard
content = content.replace('background: #f8fafc; border: 1px solid var(--border);', 'background: var(--permission-bg); border: 1px solid var(--border);')
content = content.replace('background: #f0fdf4; border: 1px solid #dcfce7;', 'background: rgba(16, 185, 129, 0.1); border: 1px solid var(--success);')
content = content.replace('color: #15803d;', 'color: var(--success);')

# Fix Provider Consents in initPatientApp (which failed before)
old_consent = 'background: #fff; border: 1px solid var(--border); border-radius: 12px; margin-bottom: 8px;'
new_consent = 'background: var(--bg-card-solid); border: 1px solid var(--border); border-radius: 12px; margin-bottom: 8px;'
content = content.replace(old_consent, new_consent)

# Fix OTP inputs to be more concise and use variables
otp_input = '<input type="text" maxlength="1" style="text-align: center; font-weight: 700; background: var(--input-bg); color: var(--text-main); border: 1px solid var(--border); border-radius: 8px; width: 40px; height: 50px;">'
content = content.replace('<input type="text" maxlength="1" style="text-align: center; font-weight: 700;">', otp_input)

# Fix QR code generator in attachPatientAppEvents to use variables for colors if possible, 
# although QRCode.js uses strings. We can use the current theme to decide.
# But for now, just making sure the container itself is handled.
content = content.replace('background: white;', 'background: var(--bg-card-solid);')

with open('js/app.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Cleanup patch applied.")
