// Nexus Medical Portal - Unified Healthcare Operating System
// Core Application Logic

let API_BASE_URL = window.location.origin + '/api';
if (window.location.port === '5500') {
    API_BASE_URL = 'http://127.0.0.1:5002/api';
}
let AUTH_TOKEN = localStorage.getItem('nexus_token');
let CURRENT_USER = JSON.parse(localStorage.getItem('nexus_user'));
let html5QrCode = null;

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    if (AUTH_TOKEN && CURRENT_USER) {
        showApp();
    } else {
        showLandingPage();
    }
    
    setupEventListeners();
});

function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-item[data-view]').forEach(item => {
        item.addEventListener('click', () => {
            const view = item.getAttribute('data-view');
            switchView(view);
        });
    });

    // Login
    document.getElementById('submit-login')?.addEventListener('click', handleLogin);
    
    // Logout
    document.getElementById('logout-btn')?.addEventListener('click', handleLogout);

    // Search
    document.getElementById('global-search')?.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') handleGlobalSearch(e.target.value);
    });
}

// --- VIEW MANAGEMENT ---
function switchView(view, data = null) {
    const container = document.getElementById('view-container');
    container.innerHTML = '<div class="animate-fade-in" style="padding:40px; text-align:center; opacity:0.5;">Loading...</div>';
    
    // Update Sidebar Active State
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-view') === view) item.classList.add('active');
    });

    switch(view) {
        case 'dashboard':
            renderMainDashboard(container);
            break;
        case 'patients':
            renderPatientDirectory(container);
            break;
        case 'patient-detail':
            renderPatientMedicalDashboard(container, data);
            break;
        case 'emergency':
            renderEmergencyMode(container);
            break;
        case 'upload':
            renderUploadCenter(container);
            break;
        default:
            renderMainDashboard(container);
    }
}

// --- AUTH & LOGIN ---
function showLandingPage() {
    document.getElementById('login-screen').classList.remove('hidden');
    document.getElementById('app').classList.add('hidden');
}

function showLoginForm(role) {
    document.getElementById('login-options').classList.add('hidden');
    document.getElementById('login-form-container').classList.remove('hidden');
    document.getElementById('login-form-title').textContent = role === 'admin' ? 'Clinician Access' : 'Patient Access';
}

function hideLoginForm() {
    document.getElementById('login-options').classList.remove('hidden');
    document.getElementById('login-form-container').classList.add('hidden');
}

async function handleLogin() {
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    try {
        const res = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        if (!res.ok) throw new Error('Invalid credentials');

        const data = await res.json();
        AUTH_TOKEN = data.token;
        CURRENT_USER = data.user;
        
        localStorage.setItem('nexus_token', AUTH_TOKEN);
        localStorage.setItem('nexus_user', JSON.stringify(CURRENT_USER));
        
        showApp();
    } catch (err) {
        showToast(err.message, 'danger');
    }
}

function handleLogout() {
    AUTH_TOKEN = null;
    CURRENT_USER = null;
    localStorage.removeItem('nexus_token');
    localStorage.removeItem('nexus_user');
    location.reload();
}

function showApp() {
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('app').classList.remove('hidden');
    
    document.getElementById('user-name').textContent = CURRENT_USER.name;
    document.getElementById('user-role').textContent = CURRENT_USER.role === 'admin' ? 'Medical Director' : 'Verified Patient';
    document.getElementById('user-avatar').textContent = CURRENT_USER.name.charAt(0);
    
    // RBAC
    const isPatient = CURRENT_USER.role === 'patient';
    document.querySelectorAll('.clinician-only').forEach(el => {
        if (isPatient) el.classList.add('hidden');
        else el.classList.remove('hidden');
    });
    document.querySelectorAll('.patient-only').forEach(el => {
        if (isPatient) el.classList.remove('hidden');
        else el.classList.add('hidden');
    });

    if (isPatient) {
        openPatientDetail(CURRENT_USER.patient_id);
    } else {
        switchView('dashboard');
    }
}

// --- QR SCANNER ---
function startQRScanner() {
    document.getElementById('qr-scanner-overlay').classList.remove('hidden');
    html5QrCode = new Html5Qrcode("qr-reader");
    html5QrCode.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        onScanSuccess
    ).catch(err => {
        showToast("Camera access denied", "danger");
        stopQRScanner();
    });
}

async function onScanSuccess(decodedText) {
    stopQRScanner();
    showToast("Nexus Card Verified: " + decodedText);
    
    try {
        const res = await fetch(`${API_BASE_URL}/patients/scan`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${AUTH_TOKEN}`
            },
            body: JSON.stringify({ identifier: decodedText })
        });
        
        if (res.ok) {
            const patient = await res.json();
            switchView('patient-detail', patient);
        }
    } catch (err) {
        showToast("Patient not found", "danger");
    }
}

function stopQRScanner() {
    if (html5QrCode) {
        html5QrCode.stop().then(() => {
            document.getElementById('qr-scanner-overlay').classList.add('hidden');
        });
    } else {
        document.getElementById('qr-scanner-overlay').classList.add('hidden');
    }
}

// --- VIEWS: MAIN DASHBOARD ---
async function renderMainDashboard(container) {
    container.innerHTML = `
        <div class="animate-fade-in">
            <h1 style="margin-bottom:32px;">Clinical Overview</h1>
            <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:24px; margin-bottom:32px;">
                <div class="widget" style="border-top:4px solid var(--primary);">
                    <div class="widget-title">Active Patients <span>👥</span></div>
                    <div style="font-size:2rem; font-weight:800;">24</div>
                    <div style="font-size:0.8rem; color:var(--success);">↑ 4 since last shift</div>
                </div>
                <div class="widget" style="border-top:4px solid var(--danger);">
                    <div class="widget-title">Critical Alerts <span>⚠️</span></div>
                    <div style="font-size:2rem; font-weight:800; color:var(--danger);">03</div>
                    <div style="font-size:0.8rem; color:var(--text-muted);">Requires immediate review</div>
                </div>
                <div class="widget" style="border-top:4px solid var(--success);">
                    <div class="widget-title">Reports Verified <span>✅</span></div>
                    <div style="font-size:2rem; font-weight:800;">128</div>
                    <div style="font-size:0.8rem; color:var(--text-muted);">98% AI accuracy</div>
                </div>
            </div>

            <div style="display:grid; grid-template-columns: 2fr 1.2fr; gap:32px;">
                <div class="widget">
                    <div class="widget-title">Recent Patients</div>
                    <div id="recent-patients-list" class="flex-column" style="gap:12px;">
                        Loading...
                    </div>
                </div>
                <div class="widget">
                    <div class="widget-title">Upcoming Reviews</div>
                    <div class="flex-column" style="gap:16px;">
                        <div style="display:flex; align-items:center; gap:12px; padding:12px; background:var(--bg-main); border-radius:12px;">
                            <div class="logo-circle" style="width:32px; height:32px; font-size:0.8rem;">AS</div>
                            <div>
                                <div style="font-weight:700; font-size:0.85rem;">Arjun Sharma</div>
                                <div style="font-size:0.75rem; color:var(--text-muted);">HbA1c Follow-up</div>
                            </div>
                            <div style="margin-left:auto; font-size:0.75rem; font-weight:700;">10:30 AM</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Fetch and render recent patients
    try {
        const res = await fetch(`${API_BASE_URL}/patients`, {
            headers: { 'Authorization': `Bearer ${AUTH_TOKEN}` }
        });
        const patients = await res.json();
        const list = document.getElementById('recent-patients-list');
        list.innerHTML = patients.slice(0, 5).map(p => `
            <div onclick="openPatientDetail(${p.id})" style="display:flex; align-items:center; gap:16px; padding:16px; border:1px solid var(--border); border-radius:16px; cursor:pointer;" class="nav-item">
                <div class="logo-circle" style="background:var(--primary-light); color:var(--primary); font-weight:bold;">${p.avatar}</div>
                <div style="flex-grow:1;">
                    <div style="font-weight:700;">${p.name}</div>
                    <div style="font-size:0.8rem; color:var(--text-muted);">ABHA: ${p.abha}</div>
                </div>
                <div class="badge badge-${p.status.toLowerCase()}">${p.status}</div>
                <div style="font-weight:700; color:var(--primary);">H: ${p.healthScore}</div>
            </div>
        `).join('');
    } catch (err) {
        list.innerHTML = 'Error loading patients';
    }
}

async function openPatientDetail(id) {
    try {
        const res = await fetch(`${API_BASE_URL}/patients/${id}`, {
            headers: { 'Authorization': `Bearer ${AUTH_TOKEN}` }
        });
        const patient = await res.json();
        switchView('patient-detail', patient);
    } catch (err) {
        showToast("Error loading patient detail", "danger");
    }
}

async function renderPatientDirectory(container) {
    container.innerHTML = `
        <div class="animate-fade-in">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px;">
                <h1 style="margin:0;">Patient Directory</h1>
                <button class="btn-primary" onclick="showAddPatientModal()">+ Add New Patient</button>
            </div>
            <div id="patient-grid" class="patient-grid">Loading...</div>
        </div>
    `;
    
    try {
        const res = await fetch(`${API_BASE_URL}/patients`, {
            headers: { 'Authorization': `Bearer ${AUTH_TOKEN}` }
        });
        const patients = await res.json();
        
        const grid = document.getElementById('patient-grid');
        grid.innerHTML = patients.map(p => `
            <div class="widget" style="cursor:pointer;" onclick="openPatientDetail(${p.id})">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:16px;">
                    <div class="logo-circle" style="background:var(--primary-light); color:var(--primary); font-weight:bold; font-size:1.2rem;">${p.avatar}</div>
                    <span class="badge badge-${p.status.toLowerCase()}">${p.status}</span>
                </div>
                <h3 style="margin-bottom:4px;">${p.name}</h3>
                <div style="font-size:0.8rem; color:var(--text-muted); margin-bottom:12px;">ID: ${p.abha} • ${p.age} Yrs</div>
                <div style="display:flex; justify-content:space-between; font-size:0.85rem; border-top:1px solid var(--border); padding-top:12px;">
                    <span>Health Score</span>
                    <span style="font-weight:bold; color:var(--primary);">${p.healthScore}/100</span>
                </div>
            </div>
        `).join('');
    } catch (err) {
        document.getElementById('patient-grid').innerHTML = 'Failed to load patients.';
    }
}

async function renderEmergencyMode(container) {
    container.innerHTML = `
        <div class="animate-fade-in emergency-dashboard">
            <h1 style="color:var(--danger); margin-bottom:12px; display:flex; align-items:center; gap:12px;">
                ⚠️ EMERGENCY PROTOCOL ACTIVE
            </h1>
            <p style="margin-bottom:32px; font-weight:600;">Displaying only Critical and High-Risk Patients requiring immediate attention.</p>
            <div id="emergency-grid" class="patient-grid">Loading...</div>
        </div>
    `;

    try {
        const res = await fetch(`${API_BASE_URL}/patients`, {
            headers: { 'Authorization': `Bearer ${AUTH_TOKEN}` }
        });
        const patients = await res.json();
        const criticalPatients = patients.filter(p => p.status === 'Critical');
        
        const grid = document.getElementById('emergency-grid');
        if (criticalPatients.length === 0) {
            grid.innerHTML = '<div style="grid-column: span 3; padding: 24px; background: white; border-radius: 12px; font-weight: bold; color: var(--success);">✅ No active critical patients at this time.</div>';
            return;
        }

        grid.innerHTML = criticalPatients.map(p => `
            <div class="widget" style="border:2px solid var(--danger); background:white; cursor:pointer;" onclick="openPatientDetail(${p.id})">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:16px;">
                    <div class="logo-circle" style="background:var(--danger); color:white; font-weight:bold; font-size:1.2rem;">${p.avatar}</div>
                    <span class="badge badge-critical">CRITICAL</span>
                </div>
                <h3 style="margin-bottom:4px;">${p.name}</h3>
                <div style="font-size:0.8rem; color:var(--text-muted); margin-bottom:12px;">${p.age} Yrs • ${p.gender}</div>
                <div style="background:rgba(239, 68, 68, 0.1); padding:8px; border-radius:8px; font-size:0.8rem; font-weight:bold; color:var(--danger);">
                    Immediate Review Required
                </div>
            </div>
        `).join('');
    } catch (err) {
        document.getElementById('emergency-grid').innerHTML = 'Failed to load emergency data.';
    }
}

async function renderUploadCenter(container) {
    container.innerHTML = `
        <div class="animate-fade-in upload-center-container">
            <h1 style="margin-bottom:24px;">Global Upload Center</h1>
            <div class="widget">
                <div class="form-group" style="margin-bottom:24px;">
                    <label style="display:block; font-size:0.8rem; font-weight:600; margin-bottom:4px;">Select Patient</label>
                    <select id="global-upload-patient" class="search-input" style="width:100%; padding-left:16px;">
                        <option value="">Loading patients...</option>
                    </select>
                </div>
                <div style="display:flex; justify-content:space-between; gap:24px;">
                    <button class="btn-primary" style="flex-grow:1;" onclick="triggerGlobalUpload()">Select & Continue</button>
                </div>
            </div>
        </div>
    `;

    try {
        let endpoint = `${API_BASE_URL}/patients`;
        if (CURRENT_USER.role === 'patient') {
            const res = await fetch(`${API_BASE_URL}/patients/${CURRENT_USER.patient_id}`, { headers: { 'Authorization': `Bearer ${AUTH_TOKEN}` }});
            const p = await res.json();
            const select = document.getElementById('global-upload-patient');
            select.innerHTML = `<option value="${p.id}">${p.name} (ABHA: ${p.abha})</option>`;
            select.disabled = true;
            return;
        }

        const res = await fetch(endpoint, {
            headers: { 'Authorization': `Bearer ${AUTH_TOKEN}` }
        });
        const patients = await res.json();
        
        const select = document.getElementById('global-upload-patient');
        select.innerHTML = '<option value="">-- Choose Patient --</option>' + patients.map(p => `
            <option value="${p.id}">${p.name} (ABHA: ${p.abha})</option>
        `).join('');
    } catch (err) {
        console.error(err);
    }
}

function triggerGlobalUpload() {
    const pId = document.getElementById('global-upload-patient').value;
    if (!pId) return showToast("Please select a patient first", "danger");
    showUploadModal(pId);
}

// --- VIEWS: PATIENT MEDICAL DASHBOARD (THE HEART) ---
function renderPatientMedicalDashboard(container, patient) {
    initAIChat(patient.id, patient.name);

    if (patient.status === 'Critical' || patient.allergies.includes('Penicillin')) {
        document.getElementById('critical-alert-banner').classList.remove('hidden');
    } else {
        document.getElementById('critical-alert-banner').classList.add('hidden');
    }

    window.currentPatientActivities = patient.recentActivity;

    container.innerHTML = `
        <div class="patient-dashboard animate-fade-in">
            <div class="summary-card">
                <div class="patient-avatar-large">${patient.avatar}</div>
                <div class="patient-info">
                    <div class="patient-header">
                        <div>
                            <div style="display:flex; align-items:center; gap:12px; margin-bottom:4px;">
                                <h1 style="font-size:2.25rem; font-weight:800; margin:0;">${patient.name}</h1>
                                <button onclick="showIdCardModal(${patient.id}, '${patient.abha}', '${patient.name}')" style="background:var(--primary-light); color:var(--primary); border:none; padding:4px 12px; border-radius:12px; font-weight:bold; cursor:pointer; font-size:0.8rem;">🪪 ID Card</button>
                                ${CURRENT_USER.role === 'admin' ? `<button onclick='showEditPatientModal(${JSON.stringify(patient).replace(/'/g, "\\'")})' style="background:var(--bg-main); color:var(--secondary); border:1px solid var(--border); padding:4px 12px; border-radius:12px; font-weight:bold; cursor:pointer; font-size:0.8rem;">✎ Edit Profile</button>` : ''}
                            </div>
                            <div style="display:flex; gap:12px; color:var(--text-muted); font-size:0.9rem;">
                                <span>${patient.age} Yrs</span> • <span>${patient.gender}</span> • <span>ABHA: ${patient.abha}</span>
                            </div>
                        </div>
                        <div class="badge-group">
                            <span class="badge badge-${patient.status.toLowerCase()}">${patient.status}</span>
                            <span class="badge" style="background:var(--primary-light); color:var(--primary); font-weight:800;">Health Score: ${patient.healthScore}</span>
                        </div>
                    </div>
                    <div class="info-grid">
                        <div class="info-item"><label>Blood Group</label><span>${patient.bloodGroup}</span></div>
                        <div class="info-item"><label>Last Visit</label><span>${patient.lastVisit}</span></div>
                        <div class="info-item"><label>Height/Weight</label><span>${patient.height} / ${patient.weight}</span></div>
                        <div class="info-item"><label>Conditions</label><span style="font-size:0.8rem;">${patient.conditions.join(', ')}</span></div>
                    </div>
                </div>
            </div>

            <div class="timeline-column">
                <h2 style="margin-bottom:24px; display:flex; align-items:center; gap:12px;">
                    Medical Timeline
                    <span style="font-size:0.8rem; font-weight:400; padding:4px 12px; background:var(--bg-card); border:1px solid var(--border); border-radius:20px;">${patient.recentActivity.length} Events</span>
                </h2>
                <div class="timeline">
                    ${patient.recentActivity.map((act, i) => `
                        <div class="timeline-item ${i === 0 ? 'active' : ''}">
                            <div class="timeline-icon">${getActivityIcon(act.type)}</div>
                            <div class="timeline-card" onclick="previewReport('${act.id}', '${act.type}')">
                                <div class="timeline-header">
                                    <div class="timeline-meta">${act.date} • ${act.time}</div>
                                    <div style="display:flex; gap:8px; align-items:center;">
                                        <div class="badge" style="font-size:0.65rem; background:var(--bg-main); border:1px solid var(--border);">${act.facility}</div>
                                        ${CURRENT_USER.role === 'admin' ? `<button onclick="event.stopPropagation(); deleteActivity(${act.id}, ${patient.id})" style="background:none; border:none; color:var(--danger); cursor:pointer; font-size:1rem;" title="Delete Activity">🗑️</button>` : ''}
                                    </div>
                                </div>
                                <div class="timeline-title">${act.type}</div>
                                <div style="font-size:0.85rem; color:var(--text-muted); margin-bottom:8px;">${act.notes || 'No additional notes provided.'}</div>
                                <div style="display:flex; align-items:center; gap:8px; font-size:0.75rem; font-weight:600;">
                                    <span style="color:var(--primary);">👨‍⚕️ ${act.physician}</span>
                                    ${act.critical ? '<span style="color:var(--danger);">⚠️ Critical Finding</span>' : ''}
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <div class="side-column">
                ${CURRENT_USER.role !== 'patient' ? `
                <div class="widget" style="background:var(--primary); color:white; border:none; box-shadow:var(--shadow-lg);">
                    <div class="widget-title" style="color:white;">Quick Actions</div>
                    <div style="display:grid; gap:12px;">
                        <button class="btn-primary" style="background:rgba(255,255,255,0.2); width:100%; text-align:left;" onclick="showUploadModal(${patient.id})">📤 Upload Lab Report</button>
                        <button class="btn-primary" style="background:rgba(255,255,255,0.2); width:100%; text-align:left;" onclick="showReviewModal(${patient.id})">📝 Add Doctor Review</button>
                    </div>
                </div>
                ` : ''}

                <div class="widget">
                    <div class="widget-title">Clinical Alerts</div>
                    <div style="display:flex; flex-direction:column; gap:12px;">
                        ${patient.allergies !== 'None' ? `
                            <div style="padding:12px; background:rgba(239, 68, 68, 0.1); border-left:4px solid var(--danger); border-radius:8px;">
                                <div style="font-size:0.7rem; font-weight:700; color:var(--danger); text-transform:uppercase;">Severe Allergy</div>
                                <div style="font-weight:600; font-size:0.9rem;">${patient.allergies}</div>
                            </div>
                        ` : '<div style="color:var(--text-muted); font-size:0.85rem;">No active clinical alerts.</div>'}
                    </div>
                </div>

                <div class="widget">
                    <div class="widget-title">Emergency Contact</div>
                    <div style="display:flex; align-items:center; gap:12px;">
                        <div class="logo-circle" style="width:40px; height:40px; background:var(--primary-light); color:var(--primary);">📞</div>
                        <div>
                            <div style="font-weight:700; font-size:0.85rem;">${patient.emergencyContact.split(' - ')[0]}</div>
                            <div style="font-size:0.75rem; color:var(--text-muted);">${patient.emergencyContact ? patient.emergencyContact.split(' - ')[1] : ''}</div>
                        </div>
                    </div>
                </div>

                <div class="widget">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                        <div class="widget-title" style="margin:0;">Insurance & Bank Details</div>
                        <button onclick='showBankDetailsModal(${JSON.stringify(patient).replace(/'/g, "\\'")})' style="background:none; border:none; color:var(--primary); cursor:pointer; font-size:0.8rem; font-weight:bold;">✎ Edit</button>
                    </div>
                    <div style="display:flex; flex-direction:column; gap:8px; font-size:0.85rem;">
                        <div style="display:flex; justify-content:space-between;">
                            <span style="color:var(--text-muted);">Provider</span>
                            <span style="font-weight:600;">${patient.insuranceProvider || 'Not Set'}</span>
                        </div>
                        <div style="display:flex; justify-content:space-between;">
                            <span style="color:var(--text-muted);">Policy No.</span>
                            <span style="font-weight:600;">${patient.insurancePolicyNumber || 'Not Set'}</span>
                        </div>
                        <div style="display:flex; justify-content:space-between; border-top:1px solid var(--border); padding-top:8px; margin-top:4px;">
                            <span style="color:var(--text-muted);">Bank A/C</span>
                            <span style="font-weight:600;">${patient.bankAccountNumber || 'Not Set'}</span>
                        </div>
                        <div style="display:flex; justify-content:space-between;">
                            <span style="color:var(--text-muted);">IFSC</span>
                            <span style="font-weight:600;">${patient.ifscCode || 'Not Set'}</span>
                        </div>
                    </div>
                </div>
                ${CURRENT_USER.role === 'admin' ? `
                <div class="widget" style="margin-top:24px; border:1px solid var(--danger); background:rgba(239, 68, 68, 0.05);">
                    <button class="btn-primary" style="background:var(--danger); width:100%;" onclick="deletePatientRecord(${patient.id}, '${patient.name}')">🗑️ Delete Patient Record</button>
                </div>
                ` : ''}
            </div>
        </div>
    `;
}

function getActivityIcon(type) {
    switch(type) {
        case 'Doctor Review': return '📝';
        case 'Lab Report': return '🧪';
        case 'Prescription': return '💊';
        case 'Test History': return '📂';
        default: return '📍';
    }
}

// --- MODALS: UPLOAD & REVIEW ---
function showUploadModal(patientId) {
    const modal = document.createElement('div');
    modal.className = 'qr-scanner-overlay animate-fade-in';
    modal.innerHTML = `
        <div class="widget glass" style="width:500px; padding:32px;">
            <h2 style="margin-bottom:24px;">Upload Lab Report</h2>
            <div style="display:flex; flex-direction:column; gap:16px;">
                <div class="form-group">
                    <label style="display:block; font-size:0.8rem; font-weight:600; margin-bottom:4px;">Report Type</label>
                    <select id="upload-type" class="search-input" style="padding-left:16px; width:100%;">
                        <option>Blood Work</option>
                        <option>Imaging (X-Ray/MRI)</option>
                        <option>ECG/Cardiology</option>
                        <option>Urinalysis</option>
                    </select>
                </div>
                <div class="form-group">
                    <label style="display:block; font-size:0.8rem; font-weight:600; margin-bottom:4px;">Notes</label>
                    <textarea id="upload-notes" class="search-input" style="padding-left:16px; width:100%; height:100px; padding-top:12px;" placeholder="Add brief finding notes..."></textarea>
                </div>
                <div style="display:flex; align-items:center; gap:12px;">
                    <input type="checkbox" id="upload-critical">
                    <label for="upload-critical" style="font-weight:600; color:var(--danger);">Mark as Critical Finding</label>
                </div>
                <div style="border:2px dashed var(--border); padding:40px; text-align:center; border-radius:16px; cursor:pointer;" onclick="document.getElementById('report-file-input').click()">
                    <div style="font-size:2rem; margin-bottom:8px;">📄</div>
                    <div id="upload-file-label" style="font-weight:600;">Drag & Drop or Click to Upload</div>
                    <div style="font-size:0.75rem; color:var(--text-muted);">PDF or JPG (Max 10MB)</div>
                </div>
                <input type="file" id="report-file-input" accept="image/*,application/pdf" style="display:none;" onchange="handleFileSelect(event)">
                <div id="upload-progress" class="hidden" style="height:4px; background:var(--border); border-radius:2px; overflow:hidden;">
                    <div style="width:0%; height:100%; background:var(--primary); transition:width 0.3s;"></div>
                </div>
                <div style="display:flex; gap:12px; margin-top:12px;">
                    <button class="btn-primary" style="flex-grow:1;" id="confirm-upload">Start Upload</button>
                    <button onclick="this.closest('.qr-scanner-overlay').remove()" style="background:none; border:none; color:var(--text-muted); cursor:pointer;">Cancel</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    modal.querySelector('#confirm-upload').addEventListener('click', async () => {
        const notes = document.getElementById('upload-notes').value;
        const critical = document.getElementById('upload-critical').checked;
        const type = document.getElementById('upload-type').value;
        
        const progressBar = document.getElementById('upload-progress');
        progressBar.classList.remove('hidden');
        
        // Simulate progress
        for(let i=0; i<=100; i+=20) {
            progressBar.querySelector('div').style.width = i + '%';
            await new Promise(r => setTimeout(r, 200));
        }

        try {
            const res = await fetch(`${API_BASE_URL}/patients/${patientId}/upload`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${AUTH_TOKEN}`
                },
                body: JSON.stringify({ notes, critical, type, reportData: window.currentUploadData || '' })
            });
            window.currentUploadData = null;
            if (res.ok) {
                showToast("Report uploaded successfully!");
                modal.remove();
                openPatientDetail(patientId);
            }
        } catch (err) {
            showToast("Upload failed", "danger");
        }
    });
}

function showReviewModal(patientId) {
    const modal = document.createElement('div');
    modal.className = 'qr-scanner-overlay animate-fade-in';
    modal.innerHTML = `
        <div class="widget glass" style="width:500px; padding:32px;">
            <h2 style="margin-bottom:24px;">Add Doctor Review</h2>
            <div style="display:flex; flex-direction:column; gap:16px;">
                <div class="form-group">
                    <label style="display:block; font-size:0.8rem; font-weight:600; margin-bottom:4px;">Diagnosis/Condition</label>
                    <input type="text" id="review-condition" class="search-input" style="padding-left:16px; width:100%;" placeholder="e.g. Hypertension Controlled">
                </div>
                <div class="form-group">
                    <label style="display:block; font-size:0.8rem; font-weight:600; margin-bottom:4px;">Clinical Review Notes</label>
                    <textarea id="review-notes" class="search-input" style="padding-left:16px; width:100%; height:150px; padding-top:12px;" placeholder="Detailed diagnosis and follow-up notes..."></textarea>
                </div>
                <div style="display:flex; gap:12px; margin-top:12px;">
                    <button class="btn-primary" style="flex-grow:1;" id="confirm-review">Save Medical Review</button>
                    <button onclick="this.closest('.qr-scanner-overlay').remove()" style="background:none; border:none; color:var(--text-muted); cursor:pointer;">Cancel</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    modal.querySelector('#confirm-review').addEventListener('click', async () => {
        const notes = document.getElementById('review-notes').value;
        const condition = document.getElementById('review-condition').value;

        try {
            const res = await fetch(`${API_BASE_URL}/patients/${patientId}/review`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${AUTH_TOKEN}`
                },
                body: JSON.stringify({ notes, condition })
            });
            if (res.ok) {
                showToast("Medical review saved!");
                modal.remove();
                openPatientDetail(patientId);
            }
        } catch (err) {
            showToast("Failed to save review", "danger");
        }
    });
}

// --- UTILITIES ---
function showToast(msg, type = 'success') {
    const toast = document.createElement('div');
    toast.style.cssText = `
        padding: 16px 24px;
        background: ${type === 'success' ? 'var(--success)' : 'var(--danger)'};
        color: white;
        border-radius: 12px;
        font-weight: 600;
        box-shadow: var(--shadow-lg);
        animation: fadeIn 0.3s ease;
    `;
    toast.textContent = msg;
    document.getElementById('toast-container').appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    document.getElementById('theme-icon').textContent = next === 'dark' ? '☀️' : '🌙';
}

function previewReport(id, type) {
    if (type !== 'Lab Report') return;
    
    const act = window.currentPatientActivities ? window.currentPatientActivities.find(a => String(a.id) === String(id)) : null;

    const modal = document.createElement('div');
    modal.className = 'qr-scanner-overlay animate-fade-in';
    
    let contentHtml = '';
    if (act && act.reportData && act.reportData.startsWith('data:image')) {
        contentHtml = `<img src="${act.reportData}" style="max-width:100%; object-fit:contain;">`;
    } else if (act && act.reportData && act.reportData.startsWith('data:application/pdf')) {
        contentHtml = `<iframe src="${act.reportData}" style="width:100%; height:100%; border:none;"></iframe>`;
    } else {
        contentHtml = `
            <div style="width:800px; background:white; padding:60px; box-shadow:var(--shadow-lg); border-radius:4px; font-family:serif;">
                <div style="display:flex; justify-content:space-between; border-bottom:2px solid #000; padding-bottom:20px; margin-bottom:40px;">
                    <div>
                        <h2 style="margin:0;">NEXUS DIAGNOSTICS</h2>
                        <p style="margin:4px 0;">Quality & Precision in Healthcare</p>
                    </div>
                    <div style="text-align:right;">
                        <p style="margin:0;">Report ID: #LAB-${id || '12004'}</p>
                        <p style="margin:0;">Date: ${act ? act.date : '24 Oct 2026'}</p>
                    </div>
                </div>
                
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:40px; margin-bottom:40px; font-size:0.9rem;">
                    <div><strong>Patient:</strong> Arjun Sharma (45M)</div>
                    <div><strong>Reference By:</strong> Dr. Rajesh Gupta</div>
                </div>

                <table style="width:100%; border-collapse:collapse; margin-bottom:40px;">
                    <thead>
                        <tr style="border-bottom:1px solid #ddd; text-align:left;">
                            <th style="padding:12px 0;">TEST NAME</th>
                            <th>RESULT</th>
                            <th>UNIT</th>
                            <th>NORMAL RANGE</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr style="border-bottom:1px solid #eee;">
                            <td style="padding:16px 0;">HbA1c (Glycosylated Hemoglobin)</td>
                            <td style="font-weight:bold; color:var(--danger);">7.2</td>
                            <td>%</td>
                            <td>4.0 - 5.6</td>
                        </tr>
                        <tr style="border-bottom:1px solid #eee;">
                            <td style="padding:16px 0;">Fasting Blood Sugar</td>
                            <td style="font-weight:bold; color:var(--danger);">142</td>
                            <td>mg/dL</td>
                            <td>70 - 99</td>
                        </tr>
                        <tr>
                            <td style="padding:16px 0;">Total Cholesterol</td>
                            <td style="font-weight:bold;">185</td>
                            <td>mg/dL</td>
                            <td>< 200</td>
                        </tr>
                    </tbody>
                </table>
            </div>`;
    }

    modal.innerHTML = `
        <div class="widget glass" style="width:80%; height:90%; display:flex; flex-direction:column; padding:0; overflow:hidden;">
            <div style="padding:16px 24px; border-bottom:1px solid var(--border); display:flex; justify-content:space-between; align-items:center; background:var(--bg-card);">
                <h3 style="margin:0;">Lab Report Preview</h3>
                <button onclick="this.closest('.qr-scanner-overlay').remove()" class="btn-primary" style="padding:8px 16px;">Close Preview</button>
            </div>
            <div style="flex-grow:1; background:#f1f5f9; padding:40px; overflow-y:auto; display:flex; justify-content:center;">
                ${contentHtml}
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}


function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    document.getElementById('upload-file-label').textContent = file.name;
    
    const reader = new FileReader();
    reader.onload = (e) => {
        window.currentUploadData = e.target.result;
    };
    reader.readAsDataURL(file);
}

// --- GLOBAL SEARCH ---
async function handleGlobalSearch(query) {
    const resultsContainer = document.getElementById('search-results');
    if (!query || query.length < 2) {
        resultsContainer.classList.add('hidden');
        return;
    }

    try {
        const res = await fetch(`${API_BASE_URL}/patients`, {
            headers: { 'Authorization': `Bearer ${AUTH_TOKEN}` }
        });
        const patients = await res.json();
        
        const lowerQ = query.toLowerCase();
        const matches = patients.filter(p => p.name.toLowerCase().includes(lowerQ) || p.abha.toLowerCase().includes(lowerQ));
        
        if (matches.length > 0) {
            resultsContainer.innerHTML = matches.map(p => `
                <div class="search-result-item" onclick="openPatientDetail(${p.id}); document.getElementById('global-search').value=''; document.getElementById('search-results').classList.add('hidden');">
                    <div class="logo-circle" style="width:32px; height:32px; font-size:0.8rem; background:var(--primary-light); color:var(--primary);">${p.avatar}</div>
                    <div>
                        <div style="font-weight:700; font-size:0.9rem;">${p.name}</div>
                        <div style="font-size:0.75rem; color:var(--text-muted);">ABHA: ${p.abha} • ${p.status}</div>
                    </div>
                </div>
            `).join('');
            resultsContainer.classList.remove('hidden');
        } else {
            resultsContainer.innerHTML = '<div style="padding:16px; color:var(--text-muted); text-align:center;">No patients found.</div>';
            resultsContainer.classList.remove('hidden');
        }
    } catch (err) {
        console.error("Search failed");
    }
}

document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-container')) {
        const sr = document.getElementById('search-results');
        if(sr) sr.classList.add('hidden');
    }
});

// --- AI CHAT SYSTEM ---
let currentChatPatientId = null;

function toggleAIChat() {
    const widget = document.getElementById('ai-chat-widget');
    widget.classList.toggle('hidden');
}

function initAIChat(patientId, patientName) {
    currentChatPatientId = patientId;
    const btn = document.getElementById('ai-chat-toggle-btn');
    if(btn) btn.classList.remove('hidden');
    
    const body = document.getElementById('ai-chat-body');
    body.innerHTML = `<div class="ai-message">Hello. I am Nexus AI. I have scanned the clinical node for ${patientName}. Ask me for a clinical analysis or treatment recommendations.</div>`;
}

async function sendAIMessage() {
    const input = document.getElementById('ai-chat-input');
    const text = input.value.trim();
    if (!text || !currentChatPatientId) return;

    input.value = '';
    const body = document.getElementById('ai-chat-body');
    
    body.innerHTML += `<div class="user-message">${text}</div>`;
    body.scrollTop = body.scrollHeight;

    const loadingId = 'loading-' + Date.now();
    body.innerHTML += `<div id="${loadingId}" class="ai-message" style="opacity:0.7;">Scanning clinical parameters...</div>`;
    body.scrollTop = body.scrollHeight;

    try {
        const res = await fetch(`${API_BASE_URL}/chat`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${AUTH_TOKEN}`
            },
            body: JSON.stringify({ patient_id: currentChatPatientId, message: text })
        });
        
        const data = await res.json();
        document.getElementById(loadingId).remove();
        
        // Parse markdown-ish AI response
        let formattedReply = data.reply;
        formattedReply = formattedReply.replace(/^### (.*$)/gim, '<h4 style="margin: 8px 0 4px 0;">$1</h4>');
        formattedReply = formattedReply.replace(/^## (.*$)/gim, '<h3 style="margin: 12px 0 6px 0;">$1</h3>');
        formattedReply = formattedReply.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        formattedReply = formattedReply.replace(/\n/g, '<br>');
        
        body.innerHTML += `<div class="ai-message">${formattedReply}</div>`;
        body.scrollTop = body.scrollHeight;

    } catch (err) {
        document.getElementById(loadingId).remove();
        body.innerHTML += `<div class="ai-message" style="color:var(--danger);">Error: Could not connect to AI Engine.</div>`;
        showToast("AI Error", "danger");
    }
}

function showAddPatientModal() {
    const modal = document.createElement('div');
    modal.className = 'qr-scanner-overlay animate-fade-in';
    modal.innerHTML = `
        <div class="widget glass" style="width:500px; padding:32px; max-height:90vh; overflow-y:auto;">
            <h2 style="margin-bottom:24px;">Add New Patient</h2>
            <div style="display:flex; flex-direction:column; gap:16px;">
                <div class="form-group">
                    <label style="display:block; font-size:0.8rem; font-weight:600; margin-bottom:4px;">Full Name *</label>
                    <input type="text" id="add-name" class="search-input" style="padding-left:16px; width:100%;" required>
                </div>
                <div style="display:flex; gap:16px;">
                    <div class="form-group" style="flex:1;">
                        <label style="display:block; font-size:0.8rem; font-weight:600; margin-bottom:4px;">Age *</label>
                        <input type="number" id="add-age" class="search-input" style="padding-left:16px; width:100%;" required>
                    </div>
                    <div class="form-group" style="flex:1;">
                        <label style="display:block; font-size:0.8rem; font-weight:600; margin-bottom:4px;">Gender *</label>
                        <select id="add-gender" class="search-input" style="padding-left:16px; width:100%;" required>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                </div>
                <div style="display:flex; gap:16px;">
                    <div class="form-group" style="flex:1;">
                        <label style="display:block; font-size:0.8rem; font-weight:600; margin-bottom:4px;">Blood Group *</label>
                        <input type="text" id="add-blood" class="search-input" style="padding-left:16px; width:100%;" placeholder="e.g. O+">
                    </div>
                    <div class="form-group" style="flex:1;">
                        <label style="display:block; font-size:0.8rem; font-weight:600; margin-bottom:4px;">ABHA ID *</label>
                        <input type="text" id="add-abha" class="search-input" style="padding-left:16px; width:100%;" placeholder="91-0000-0000-0000">
                    </div>
                </div>
                <div class="form-group">
                    <label style="display:block; font-size:0.8rem; font-weight:600; margin-bottom:4px;">Allergies</label>
                    <input type="text" id="add-allergies" class="search-input" style="padding-left:16px; width:100%;" placeholder="None">
                </div>
                <div style="display:flex; gap:12px; margin-top:12px;">
                    <button class="btn-primary" style="flex-grow:1;" id="confirm-add-patient">Add Patient</button>
                    <button onclick="this.closest('.qr-scanner-overlay').remove()" style="background:none; border:none; color:var(--text-muted); cursor:pointer;">Cancel</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    modal.querySelector('#confirm-add-patient').addEventListener('click', async () => {
        const name = document.getElementById('add-name').value;
        const age = document.getElementById('add-age').value;
        const gender = document.getElementById('add-gender').value;
        const bloodGroup = document.getElementById('add-blood').value;
        const abha = document.getElementById('add-abha').value;
        const allergies = document.getElementById('add-allergies').value || 'None';

        if (!name || !age || !gender || !bloodGroup || !abha) {
            return showToast("Please fill all required fields", "danger");
        }

        try {
            const res = await fetch(`${API_BASE_URL}/patients`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${AUTH_TOKEN}`
                },
                body: JSON.stringify({ name, age, gender, bloodGroup, abha, allergies, status: 'Active' })
            });
            if (res.ok) {
                showToast("Patient added successfully!");
                modal.remove();
                switchView('patients');
            } else {
                showToast("Error adding patient", "danger");
            }
        } catch (err) {
            showToast("Network Error", "danger");
        }
    });
}

function showIdCardModal(patientId, abha, patientName) {
    const modal = document.createElement('div');
    modal.className = 'qr-scanner-overlay animate-fade-in';
    modal.innerHTML = `
        <div class="widget glass" style="width:480px; padding:32px; text-align:center;">
            <h2 style="margin-bottom:24px; color:var(--text-main);">Patient ID Card</h2>
            
            <div class="nexus-id-card">
                <div class="id-card-header">
                    <div class="id-card-logo">
                        <div class="logo-circle" style="width:24px; height:24px; font-size:0.7rem;">N</div>
                        NEXUS HEALTH
                    </div>
                    <div class="id-card-chip"></div>
                </div>
                
                <div class="id-card-body">
                    <div class="id-card-info">
                        <div class="id-card-name">${patientName}</div>
                        <div style="display:flex; gap:16px; margin-bottom:12px;">
                            <div>
                                <div class="id-card-label">ABHA ID</div>
                                <div class="id-card-value">${abha}</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="id-card-qr-container">
                        <div id="id-qrcode"></div>
                    </div>
                </div>
            </div>

            <button onclick="this.closest('.qr-scanner-overlay').remove()" class="btn-primary" style="width:100%; margin-top:24px;">Close ID Card</button>
        </div>
    `;
    document.body.appendChild(modal);

    new QRCode(document.getElementById("id-qrcode"), {
        text: abha,
        width: 80,
        height: 80,
        colorDark : "#000000",
        colorLight : "#ffffff",
        correctLevel : QRCode.CorrectLevel.H
    });
}

function showBankDetailsModal(patient) {
    const modal = document.createElement('div');
    modal.className = 'qr-scanner-overlay animate-fade-in';
    modal.innerHTML = `
        <div class="widget glass" style="width:500px; padding:32px;" id="bank-details-form-view">
            <h2 style="margin-bottom:24px;">Update Emergency Insurance & Bank Details</h2>
            <div style="display:flex; flex-direction:column; gap:16px;">
                <div class="form-group">
                    <label style="display:block; font-size:0.8rem; font-weight:600; margin-bottom:4px;">Insurance Provider</label>
                    <input type="text" id="edit-insurance-provider" class="search-input" style="padding-left:16px; width:100%;" value="${patient.insuranceProvider || ''}" placeholder="e.g. HDFC Ergo">
                </div>
                <div class="form-group">
                    <label style="display:block; font-size:0.8rem; font-weight:600; margin-bottom:4px;">Policy Number</label>
                    <input type="text" id="edit-insurance-policy" class="search-input" style="padding-left:16px; width:100%;" value="${patient.insurancePolicyNumber || ''}" placeholder="e.g. POL-123456">
                </div>
                <div class="form-group">
                    <label style="display:block; font-size:0.8rem; font-weight:600; margin-bottom:4px;">Bank Account Number</label>
                    <input type="text" id="edit-bank-account" class="search-input" style="padding-left:16px; width:100%;" value="${patient.bankAccountNumber || ''}" placeholder="e.g. XXXX-XXXX-1234">
                </div>
                <div class="form-group">
                    <label style="display:block; font-size:0.8rem; font-weight:600; margin-bottom:4px;">IFSC Code</label>
                    <input type="text" id="edit-ifsc" class="search-input" style="padding-left:16px; width:100%;" value="${patient.ifscCode || ''}" placeholder="e.g. HDFC0001234">
                </div>
                <div style="display:flex; gap:12px; margin-top:12px;">
                    <button class="btn-primary" style="flex-grow:1;" id="initiate-save-bank-details">Save Details</button>
                    <button onclick="this.closest('.qr-scanner-overlay').remove()" style="background:none; border:none; color:var(--text-muted); cursor:pointer;">Cancel</button>
                </div>
            </div>
        </div>

        <div class="widget glass hidden" style="width:400px; padding:32px; text-align:center;" id="bank-details-otp-view">
            <h2 style="margin-bottom:16px;">Security Verification</h2>
            <p style="color:var(--text-muted); font-size:0.9rem; margin-bottom:24px;">To update sensitive financial data, please enter the 4-digit authorization PIN.</p>
            <p style="color:var(--text-muted); font-size:0.75rem; margin-bottom:16px;">(Hint: For this prototype, use PIN <strong>1234</strong>)</p>
            
            <div class="otp-container">
                <input type="text" maxlength="1" class="otp-input" id="otp-1" onkeyup="if(this.value.length) document.getElementById('otp-2').focus()">
                <input type="text" maxlength="1" class="otp-input" id="otp-2" onkeyup="if(this.value.length) document.getElementById('otp-3').focus()">
                <input type="text" maxlength="1" class="otp-input" id="otp-3" onkeyup="if(this.value.length) document.getElementById('otp-4').focus()">
                <input type="text" maxlength="1" class="otp-input" id="otp-4" onkeyup="if(this.value.length) document.getElementById('verify-otp-btn').click()">
            </div>

            <div style="display:flex; gap:12px; margin-top:24px;">
                <button class="btn-primary" style="flex-grow:1;" id="verify-otp-btn">Verify & Save</button>
                <button onclick="document.getElementById('bank-details-otp-view').classList.add('hidden'); document.getElementById('bank-details-form-view').classList.remove('hidden');" style="background:none; border:none; color:var(--text-muted); cursor:pointer;">Back</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    modal.querySelector('#initiate-save-bank-details').addEventListener('click', () => {
        document.getElementById('bank-details-form-view').classList.add('hidden');
        document.getElementById('bank-details-otp-view').classList.remove('hidden');
        document.getElementById('otp-1').focus();
    });

    modal.querySelector('#verify-otp-btn').addEventListener('click', async () => {
        const pin = document.getElementById('otp-1').value + document.getElementById('otp-2').value + document.getElementById('otp-3').value + document.getElementById('otp-4').value;
        
        if (pin !== '1234') {
            return showToast("Invalid Authorization PIN", "danger");
        }

        const insuranceProvider = document.getElementById('edit-insurance-provider').value;
        const insurancePolicyNumber = document.getElementById('edit-insurance-policy').value;
        const bankAccountNumber = document.getElementById('edit-bank-account').value;
        const ifscCode = document.getElementById('edit-ifsc').value;

        try {
            const res = await fetch(`${API_BASE_URL}/patients/${patient.id}`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${AUTH_TOKEN}`
                },
                body: JSON.stringify({ insuranceProvider, insurancePolicyNumber, bankAccountNumber, ifscCode })
            });
            if (res.ok) {
                showToast("Bank details updated securely!");
                modal.remove();
                openPatientDetail(patient.id);
            } else {
                showToast("Error updating details", "danger");
            }
        } catch (err) {
            showToast("Network Error", "danger");
        }
    });
}

async function deletePatientRecord(patientId, patientName) {
    if (confirm(`⚠️ WARNING: Are you sure you want to permanently delete the medical record for ${patientName}? This action cannot be undone.`)) {
        try {
            const res = await fetch(`${API_BASE_URL}/patients/${patientId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${AUTH_TOKEN}`
                }
            });
            
            if (res.ok) {
                showToast("Patient record successfully deleted", "success");
                switchView('patients');
            } else {
                showToast("Unauthorized or Error deleting patient", "danger");
            }
        } catch (err) {
            showToast("Network Error", "danger");
        }
    }
}

function showEditPatientModal(patient) {
    const modal = document.createElement('div');
    modal.className = 'qr-scanner-overlay animate-fade-in';
    modal.innerHTML = `
        <div class="widget glass" style="width:600px; padding:32px; max-height:90vh; overflow-y:auto;">
            <h2 style="margin-bottom:24px;">Edit Patient Profile</h2>
            <div style="display:flex; flex-direction:column; gap:16px;">
                <div class="form-group">
                    <label style="display:block; font-size:0.8rem; font-weight:600; margin-bottom:4px;">Full Name</label>
                    <input type="text" id="edit-name" class="search-input" style="padding-left:16px; width:100%;" value="${patient.name}">
                </div>
                <div style="display:flex; gap:16px;">
                    <div class="form-group" style="flex:1;">
                        <label style="display:block; font-size:0.8rem; font-weight:600; margin-bottom:4px;">Age</label>
                        <input type="number" id="edit-age" class="search-input" style="padding-left:16px; width:100%;" value="${patient.age}">
                    </div>
                    <div class="form-group" style="flex:1;">
                        <label style="display:block; font-size:0.8rem; font-weight:600; margin-bottom:4px;">Gender</label>
                        <select id="edit-gender" class="search-input" style="padding-left:16px; width:100%;">
                            <option value="Male" ${patient.gender === 'Male' ? 'selected' : ''}>Male</option>
                            <option value="Female" ${patient.gender === 'Female' ? 'selected' : ''}>Female</option>
                            <option value="Other" ${patient.gender === 'Other' ? 'selected' : ''}>Other</option>
                        </select>
                    </div>
                </div>
                <div style="display:flex; gap:16px;">
                    <div class="form-group" style="flex:1;">
                        <label style="display:block; font-size:0.8rem; font-weight:600; margin-bottom:4px;">Blood Group</label>
                        <input type="text" id="edit-blood" class="search-input" style="padding-left:16px; width:100%;" value="${patient.bloodGroup}">
                    </div>
                    <div class="form-group" style="flex:1;">
                        <label style="display:block; font-size:0.8rem; font-weight:600; margin-bottom:4px;">Height</label>
                        <input type="text" id="edit-height" class="search-input" style="padding-left:16px; width:100%;" value="${patient.height}">
                    </div>
                    <div class="form-group" style="flex:1;">
                        <label style="display:block; font-size:0.8rem; font-weight:600; margin-bottom:4px;">Weight</label>
                        <input type="text" id="edit-weight" class="search-input" style="padding-left:16px; width:100%;" value="${patient.weight}">
                    </div>
                </div>
                <div class="form-group">
                    <label style="display:block; font-size:0.8rem; font-weight:600; margin-bottom:4px;">Allergies</label>
                    <input type="text" id="edit-allergies" class="search-input" style="padding-left:16px; width:100%;" value="${patient.allergies}">
                </div>
                <div style="display:flex; gap:12px; margin-top:12px;">
                    <button class="btn-primary" style="flex-grow:1;" id="save-patient-details">Save Changes</button>
                    <button onclick="this.closest('.qr-scanner-overlay').remove()" style="background:none; border:none; color:var(--text-muted); cursor:pointer;">Cancel</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    modal.querySelector('#save-patient-details').addEventListener('click', async () => {
        const payload = {
            name: document.getElementById('edit-name').value,
            age: document.getElementById('edit-age').value,
            gender: document.getElementById('edit-gender').value,
            bloodGroup: document.getElementById('edit-blood').value,
            height: document.getElementById('edit-height').value,
            weight: document.getElementById('edit-weight').value,
            allergies: document.getElementById('edit-allergies').value
        };

        try {
            const res = await fetch(`${API_BASE_URL}/patients/${patient.id}`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${AUTH_TOKEN}`
                },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                showToast("Patient profile updated successfully!");
                modal.remove();
                openPatientDetail(patient.id);
            } else {
                showToast("Error updating patient profile", "danger");
            }
        } catch (err) {
            showToast("Network Error", "danger");
        }
    });
}

async function deleteActivity(activityId, patientId) {
    if (confirm("Are you sure you want to permanently delete this clinical activity?")) {
        try {
            const res = await fetch(`${API_BASE_URL}/activities/${activityId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${AUTH_TOKEN}`
                }
            });
            
            if (res.ok) {
                showToast("Activity deleted successfully", "success");
                openPatientDetail(patientId);
            } else {
                showToast("Error deleting activity", "danger");
            }
        } catch (err) {
            showToast("Network Error", "danger");
        }
    }
}
