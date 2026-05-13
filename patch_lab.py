import re

with open('js/app.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Find and replace the showOrderLabModal function
old_func_pattern = r'function showOrderLabModal\(\) \{.*?\n\}'
new_func = r'''function showOrderLabModal() {
    const today = new Date().toISOString().split('T')[0];
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal" style="width:560px; padding:40px; border-top:6px solid var(--primary);">
            <div style="display:flex; align-items:center; gap:14px; margin-bottom:28px;">
                <div style="width:44px;height:44px;border-radius:12px;background:var(--primary-light);display:flex;align-items:center;justify-content:center;font-size:1.4rem;">&#x1F9EA;</div>
                <div>
                    <h2 style="font-family:'Outfit'; margin:0; font-size:1.3rem; color:var(--text-main);">Order Lab Test</h2>
                    <p style="color:var(--text-muted); font-size:0.8rem; margin:0;">Patient: <strong>${activePatient?.name || 'N/A'}</strong></p>
                </div>
            </div>
            <div style="display:grid; gap:16px;">
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
                    <div class="form-group" style="margin:0;">
                        <label>Test Type *</label>
                        <select id="new-lab-type" style="width:100%;padding:12px;border-radius:12px;border:1px solid var(--border);background:var(--input-bg);color:var(--text-main);font-family:inherit;font-size:0.9rem;">
                            <option value="">-- Select Test --</option>
                            <option value="HbA1c Screener">HbA1c Screener</option>
                            <option value="Lipid Profile">Lipid Profile</option>
                            <option value="Complete Blood Count">Complete Blood Count</option>
                            <option value="Liver Function Test">Liver Function Test</option>
                            <option value="Kidney Function Test">Kidney Function Test</option>
                            <option value="Thyroid Panel">Thyroid Panel</option>
                            <option value="Urine Analysis">Urine Analysis</option>
                            <option value="Blood Glucose">Blood Glucose</option>
                            <option value="Chest X-Ray">Chest X-Ray</option>
                            <option value="ECG">ECG</option>
                            <option value="MRI Brain">MRI Brain</option>
                            <option value="Ultrasound Abdomen">Ultrasound Abdomen</option>
                        </select>
                    </div>
                    <div class="form-group" style="margin:0;">
                        <label>Priority</label>
                        <select id="new-lab-priority" style="width:100%;padding:12px;border-radius:12px;border:1px solid var(--border);background:var(--input-bg);color:var(--text-main);font-family:inherit;font-size:0.9rem;">
                            <option value="Routine">Routine</option>
                            <option value="Urgent">Urgent</option>
                            <option value="STAT">STAT (Emergency)</option>
                        </select>
                    </div>
                </div>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
                    <div class="form-group" style="margin:0;">
                        <label>Ordering Facility</label>
                        <select id="new-lab-facility" style="width:100%;padding:12px;border-radius:12px;border:1px solid var(--border);background:var(--input-bg);color:var(--text-main);font-family:inherit;font-size:0.9rem;">
                            <option value="Apollo Hospitals">Apollo Hospitals</option>
                            <option value="Max Healthcare">Max Healthcare</option>
                            <option value="AIIMS New Delhi">AIIMS New Delhi</option>
                            <option value="Nexus Diagnostics">Nexus Diagnostics</option>
                        </select>
                    </div>
                    <div class="form-group" style="margin:0;">
                        <label>Scheduled Date</label>
                        <input type="date" id="new-lab-date" value="${today}" style="padding:12px;border-radius:12px;border:1px solid var(--border);background:var(--input-bg);color:var(--text-main);font-family:inherit;font-size:0.9rem;width:100%;">
                    </div>
                </div>
                <div class="form-group" style="margin:0;">
                    <label>Ordering Physician</label>
                    <input type="text" id="new-lab-physician" placeholder="e.g. Dr. Rajesh Gupta" style="padding:12px;border-radius:12px;border:1px solid var(--border);background:var(--input-bg);color:var(--text-main);font-family:inherit;font-size:0.9rem;width:100%;">
                </div>
                <div class="form-group" style="margin:0;">
                    <label>Clinical Notes / Indication</label>
                    <textarea id="new-lab-notes" placeholder="e.g. Patient reports fatigue, elevated glucose..." rows="3" style="width:100%;padding:12px;border-radius:12px;border:1px solid var(--border);background:var(--input-bg);color:var(--text-main);font-family:inherit;font-size:0.9rem;resize:vertical;"></textarea>
                </div>
            </div>
            <div id="lab-error-msg" style="display:none;margin-top:12px;padding:10px 14px;border-radius:10px;font-size:0.85rem;"></div>
            <div style="display:flex; justify-content:flex-end; gap:12px; margin-top:24px; border-top:1px solid var(--border); padding-top:20px;">
                <button class="btn-text" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
                <button class="btn-primary" id="confirm-lab-btn">&#x1F9EA; Place Order</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    modal.querySelector('#confirm-lab-btn').addEventListener('click', () => {
        const testType = document.getElementById('new-lab-type').value;
        const priority = document.getElementById('new-lab-priority').value;
        const facility = document.getElementById('new-lab-facility').value;
        const date = document.getElementById('new-lab-date').value;
        const physician = document.getElementById('new-lab-physician').value.trim();
        const notes = document.getElementById('new-lab-notes').value.trim();
        const errorEl = document.getElementById('lab-error-msg');

        if (!testType) {
            errorEl.textContent = 'Please select a test type before placing the order.';
            errorEl.style.display = 'block';
            errorEl.style.background = 'rgba(239,68,68,0.1)';
            errorEl.style.border = '1px solid rgba(239,68,68,0.3)';
            errorEl.style.color = 'var(--danger)';
            return;
        }

        const existingTypes = (activePatient.recentActivity || []).map(a => a.type);
        if (existingTypes.includes(testType)) {
            errorEl.innerHTML = `&#x26A0; <strong>${testType}</strong> already in recent activity. <a href="#" id="proceed-lab-link" style="color:var(--warning);text-decoration:underline;cursor:pointer;">Proceed anyway?</a>`;
            errorEl.style.display = 'block';
            errorEl.style.background = 'rgba(245,158,11,0.1)';
            errorEl.style.border = '1px solid rgba(245,158,11,0.3)';
            errorEl.style.color = 'var(--warning)';
            document.getElementById('proceed-lab-link').addEventListener('click', (e) => {
                e.preventDefault();
                placeLabOrder(modal, testType, priority, facility, date, physician, notes);
            });
            return;
        }
        placeLabOrder(modal, testType, priority, facility, date, physician, notes);
    });
}

function placeLabOrder(modal, testType, priority, facility, date, physician, notes) {
    const statusMap = { 'STAT': 'CRITICAL', 'Urgent': 'Pending', 'Routine': 'Scheduled' };
    const newEntry = {
        date: date,
        type: testType,
        facility: facility,
        status: statusMap[priority] || 'Scheduled',
        physician: physician || 'Dr. (System)',
        notes: notes || ''
    };
    if (!activePatient.recentActivity) activePatient.recentActivity = [];
    activePatient.recentActivity.unshift(newEntry);
    modal.remove();
    showToast('Lab ordered: ' + testType + ' at ' + facility);
    switchView('dashboard', activePatient);
}'''

# Use a simple start-marker based replacement
start_marker = 'function showOrderLabModal() {'
end_marker = '\n}\n\n// --- VIEW: STANDARDIZER ---'

start_idx = content.find(start_marker)
end_idx = content.find(end_marker, start_idx)

if start_idx == -1 or end_idx == -1:
    print(f"ERROR: markers not found. start={start_idx}, end={end_idx}")
    # Print context around where it should be
    idx = content.find('showOrderLabModal')
    print(f"Found 'showOrderLabModal' at index {idx}")
    print(repr(content[idx:idx+200]))
else:
    new_content = content[:start_idx] + new_func + '\n\n// --- VIEW: STANDARDIZER ---' + content[end_idx + len(end_marker):]
    with open('js/app.js', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("SUCCESS: showOrderLabModal replaced")
    print(f"New file size: {len(new_content)} chars")
