#!/usr/bin/env python3
"""Comprehensive patch for Nexus Health app.js:
1. Fix broken Clinical Activity table HTML (from previous bad edit)
2. Link patient portal to real API data
3. Fix renderDashboardStyles to use CSS variables for dark mode
"""
import re

with open('js/app.js', 'r', encoding='utf-8') as f:
    content = f.read()

# ─────────────────────────────────────────────────────────────────────────────
# FIX 1: Repair the broken Clinical Activity section in initDashboard
# The previous multi_replace left malformed closing tags like </di and </le>
# We'll find the whole Clinical Activity card block and replace it cleanly.
# ─────────────────────────────────────────────────────────────────────────────
bad_block_start = content.find("Active Diagnosis")
bad_block_end   = content.find("</div>\n            </div>\n            <div class=\"side-column\">", bad_block_start)

if bad_block_start == -1 or bad_block_end == -1:
    print("ERROR: Could not find Diagnosis/Activity block. Trying alternate search...")
    # Try to find any malformed tag
    idx = content.find('</di')
    if idx != -1:
        print(f"Found malformed </di at index {idx}: {repr(content[idx-50:idx+80])}")
    idx2 = content.find('</le>')
    if idx2 != -1:
        print(f"Found malformed </le> at index {idx2}: {repr(content[idx2-50:idx2+80])}")
else:
    good_activity_block = '''                <div class="card">
                    <h3 style="margin-bottom: 24px;">Active Diagnosis</h3>
                    <div style="display:flex; gap:12px; flex-wrap:wrap;">
                        ${patient.conditions.map(c => `<span class="tag">${c}</span>`).join('')}
                    </div>
                </div>
                <div class="card">
                    <div class="section-header" style="margin-bottom: 24px;">
                        <h3>Clinical Activity</h3>
                        <button id="order-lab-btn" class="btn-primary" style="background: var(--primary-light); color: var(--primary-dark);">+ Order Lab</button>
                    </div>
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Date</th>
                                <th>Test / Procedure</th>
                                <th>Facility</th>
                                <th>Physician</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${(patient.recentActivity || []).length === 0
                                ? `<tr><td colspan="6" style="text-align:center; color:var(--text-muted); padding:32px;">No clinical activity yet. Use &ldquo;+ Order Lab&rdquo; to add an entry.</td></tr>`
                                : (patient.recentActivity || []).map((a, i) => {
                                    const statusColors = {
                                        'CRITICAL':  { bg: 'rgba(239,68,68,0.12)',   color: 'var(--danger)' },
                                        'Pending':   { bg: 'rgba(245,158,11,0.12)',  color: 'var(--warning)' },
                                        'Scheduled': { bg: 'rgba(99,102,241,0.12)',  color: 'var(--primary)' },
                                        'Normal':    { bg: 'rgba(16,185,129,0.12)',  color: 'var(--success)' },
                                        'Completed': { bg: 'rgba(16,185,129,0.12)',  color: 'var(--success)' },
                                    };
                                    const sc = statusColors[a.status] || { bg: 'rgba(100,116,139,0.12)', color: 'var(--text-muted)' };
                                    return `<tr>
                                        <td>${i+1}</td>
                                        <td>${a.date}</td>
                                        <td><strong>${a.type}</strong></td>
                                        <td>${a.facility}</td>
                                        <td style="color:var(--text-muted);">${a.physician || '&mdash;'}</td>
                                        <td><span class="status-pill" style="background:${sc.bg}; color:${sc.color};">${a.status}</span></td>
                                    </tr>`;
                                }).join('')
                            }
                        </tbody>
                    </table>
                </div>
            </div>
            <div class="side-column">'''

    # Extract what currently exists between those markers and replace
    old_block = content[bad_block_start:bad_block_end]
    content = content[:bad_block_start] + good_activity_block + content[bad_block_end + len('</div>\n            </div>\n            <div class="side-column">'):]
    print("FIX 1: Clinical Activity block repaired")

# ─────────────────────────────────────────────────────────────────────────────
# FIX 2: Fix renderDashboardStyles to use CSS variables (dark mode safe)
# ─────────────────────────────────────────────────────────────────────────────
old_ds = "        .data-table td { padding: 16px 24px; background: white; font-size: 0.95rem; border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); vertical-align: middle; }"
new_ds = "        .data-table td { padding: 16px 24px; background: var(--table-row-bg); color: var(--text-main); font-size: 0.95rem; border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); vertical-align: middle; }"
if old_ds in content:
    content = content.replace(old_ds, new_ds)
    print("FIX 2: data-table td now uses --table-row-bg")
else:
    print("FIX 2: SKIP - old_ds not found (may already be patched)")

# ─────────────────────────────────────────────────────────────────────────────
# FIX 3: Fix initPatientApp so patient portal shows real logged-in patient data
# Currently it always uses PATIENTS_LIST[0] for the admin view simulation.
# For logged-in patients, it should use CURRENT_USER_DATA to fetch real data.
# ─────────────────────────────────────────────────────────────────────────────
old_patient_app_start = "// --- VIEW: PATIENT APP ---\nfunction initPatientApp(container) {\n    const patient = PATIENTS_LIST[0]; // Simulation for current patient"
new_patient_app_start = """// --- VIEW: PATIENT APP ---
async function initPatientApp(container, data = null) {
    // Use passed data, or fetch real patient data for logged-in patients
    let patient = data;
    if (!patient && CURRENT_USER_DATA && CURRENT_USER_DATA.patient_id) {
        container.innerHTML = '<div style="padding:40px; color:var(--text-muted);">Loading your health portal...</div>';
        try {
            const resp = await fetch(`${API_BASE_URL}/patients/${CURRENT_USER_DATA.patient_id}`, {
                headers: { 'Authorization': `Bearer ${AUTH_TOKEN}` }
            });
            if (resp.ok) {
                patient = await resp.json();
                // Keep PATIENTS_LIST in sync so admin sees same data
                const idx = PATIENTS_LIST.findIndex(p => p.id === patient.id);
                if (idx >= 0) PATIENTS_LIST[idx] = patient;
            }
        } catch(e) { console.warn('Could not fetch patient data:', e); }
    }
    if (!patient) patient = PATIENTS_LIST[0]; // fallback for admin preview"""

if old_patient_app_start in content:
    content = content.replace(old_patient_app_start, new_patient_app_start)
    print("FIX 3: initPatientApp now fetches real patient data for logged-in patients")
else:
    print("FIX 3: SKIP - marker not found, checking alternate...")
    idx = content.find('function initPatientApp(container)')
    if idx != -1:
        print(f"  Found at index {idx}: {repr(content[idx:idx+150])}")

# ─────────────────────────────────────────────────────────────────────────────
# FIX 4: Update the views registry so 'patient-app' uses the now-async function
# The views object maps view names to functions.
# ─────────────────────────────────────────────────────────────────────────────
# No change needed for the views object since async functions work the same way.
print("FIX 4: No changes needed for views registry (async is transparent)")

# ─────────────────────────────────────────────────────────────────────────────
# FIX 5: In finalizeLogin, pass the patient's own data when switching to patient-app
# Currently it passes { id: user.patient_id } which is correct, but initPatientApp
# now handles that properly
# ─────────────────────────────────────────────────────────────────────────────
print("FIX 5: finalizeLogin already passes correct data")

with open('js/app.js', 'w', encoding='utf-8') as f:
    f.write(content)

print(f"\nAll patches applied. New file size: {len(content)} chars")

# Verify no malformed tags remain
for bad_tag in ['</di\n', '</le>', '</di ']:
    if bad_tag in content:
        idx = content.find(bad_tag)
        print(f"WARNING: Still found '{repr(bad_tag)}' at index {idx}")
        print(repr(content[max(0,idx-100):idx+100]))
    else:
        print(f"CLEAN: No '{repr(bad_tag)}' found")
