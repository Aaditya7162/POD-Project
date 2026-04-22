// Nexus Health AI Platform - High Fidelity Multi-Role Architecture
// Consolidated logic with Role-Based Access Control (RBAC) and Biometric Simulation

// --- DATASET: INDIAN CONTEXT ---
const PATIENT_DATA = {
    name: "Arjun Sharma",
    age: 45,
    gender: "Male",
    dob: "Mar 12, 1979",
    abhaId: "#91-2204-1102-4421",
    bloodGroup: "B+",
    height: "175 cm",
    weight: "78 kg",
    bmi: "25.5 (Healthy)",
    city: "Mumbai, MH",
    conditions: [
        { code: "E11.9", name: "Type 2 Diabetes (Glycemic Control)" },
        { code: "I10", name: "Essential Hypertension" },
        { code: "E78.5", name: "Hyperlipidemia" }
    ],
    medications: [
        { brand: "Glycomet GP 1/500", generic: "Metformin + Glimepiride", dosage: "OD (After Breakfast)" },
        { brand: "Telma 40", generic: "Telmisartan", dosage: "OD (Morning)" },
        { brand: "Lipicure 10", generic: "Atorvastatin", dosage: "HS (Bedtime)" }
    ],
    providers: [
        { name: "Apollo Hospitals", location: "Hyderabad", type: "Partner", color: "apollo" },
        { name: "Max Healthcare", location: "Mumbai", type: "Partner", color: "max" },
        { name: "AIIMS", location: "New Delhi", type: "Verified", color: "aiims" }
    ],
    auditLogs: [
        { timestamp: "2026-04-21 22:15:02", clinician: "Dr. Sarah Mitchell", facility: "Max Healthcare", action: "Chart Review", hash: "0x7a2...4f1" },
        { timestamp: "2026-04-21 14:30:11", clinician: "Dr. Rajesh Gupta", facility: "AIIMS New Delhi", action: "Lab Order: HbA1c", hash: "0xf12...8e2" }
    ]
};

// --- STATE ---
let currentUserRole = null;
let selectedLoginRole = null;
let liveVitals = { hr: 75, bp: "128/84", spo2: 98 };

let activePatient = null; // Track current patient for simulation

const PATIENTS_LIST = [
    { 
        id: 1, name: "Arjun Sharma", age: 45, abha: "91-2204-1102-4421", status: "Active", height: "175 cm", weight: "78 kg", avatar: "AS",
        healthScore: 82, vitals: { hr: 74, bp: "128/84", spo2: 98 },
        conditions: ["Type 2 Diabetes", "Essential Hypertension"],
        vitalsHistory: [
            { hr: 72, date: "Apr 20" }, { hr: 75, date: "Apr 19" }, { hr: 71, date: "Apr 18" }
        ],
        recentActivity: [
            { date: "Apr 20, 2026", type: "Lipid Profile", facility: "Max Labs", status: "Normal" },
            { date: "Apr 12, 2026", type: "Cardiac Consult", facility: "Apollo", status: "Follow-up" }
        ]
    },
    { 
        id: 2, name: "Priya Singh", age: 32, abha: "91-3305-2213-5532", status: "Active", height: "162 cm", weight: "55 kg", avatar: "PS",
        healthScore: 91, vitals: { hr: 68, bp: "112/76", spo2: 99 },
        conditions: ["PCOS (Managed)"],
        recentActivity: [
            { date: "Apr 18, 2026", type: "Fasting Glucose", facility: "Healthians", status: "Normal" }
        ]
    },
    { 
        id: 3, name: "Rahul Verma", age: 58, abha: "91-4406-3324-6643", status: "Stable", height: "170 cm", weight: "82 kg", avatar: "RV",
        healthScore: 65, vitals: { hr: 82, bp: "145/92", spo2: 96 },
        conditions: ["Hyperlipidemia", "Chronic Back Pain"],
        recentActivity: [
            { date: "Apr 15, 2026", type: "Physiotherapy", facility: "AIIMS", status: "Ongoing" }
        ]
    },
    { 
        id: 4, name: "Ananya Iyer", age: 24, abha: "91-5507-4435-7754", status: "Critical", height: "158 cm", weight: "49 kg", avatar: "AI",
        healthScore: 34, vitals: { hr: 118, bp: "92/58", spo2: 91 },
        conditions: ["Septic Shock", "Multi-organ Dysfunction"],
        recentActivity: [
            { date: "Apr 22, 2026", type: "ICU Admission", facility: "Fortis", status: "CRITICAL" },
            { date: "Apr 22, 2026", type: "Ventilator Setup", facility: "Fortis", status: "Manual" }
        ]
    },
    { 
        id: 5, name: "Vikram Malhotra", age: 50, abha: "91-6608-5546-8865", status: "Stable", height: "182 cm", weight: "88 kg", avatar: "VM",
        healthScore: 72, vitals: { hr: 76, bp: "135/88", spo2: 97 },
        conditions: ["Obesity Class I", "Smoker"],
        recentActivity: [
            { date: "Apr 10, 2026", type: "Nicotine Patch Script", facility: "Local Clinic", status: "Issued" }
        ]
    }
];

// --- LOGIN LOGIC ---
const loginScreen = document.getElementById('login-screen');
const appContainer = document.getElementById('app');
const loginTiles = {
    admin: document.getElementById('login-admin'),
    patient: document.getElementById('login-patient')
};

function handleLogin(role) {
    selectedLoginRole = role;
    document.getElementById('login-options').classList.add('hidden');
    document.getElementById('login-form').classList.remove('hidden');
    
    const idInput = document.getElementById('login-userid');
    if (role === 'admin') {
        idInput.placeholder = 'e.g. dr.gupta@nexus.ai';
    } else {
        idInput.placeholder = 'e.g. arjun.sharma@abha.in';
    }
}

function submitLogin() {
    const userId = document.getElementById('login-userid').value;
    const pass = document.getElementById('login-password').value;
    
    // In a real app, we would validate credentials here
    if (selectedLoginRole === 'admin') {
        showBiometricScan(() => finalizeLogin('admin'));
    } else {
        finalizeLogin('patient');
    }
}

function backToRoles() {
    selectedLoginRole = null;
    document.getElementById('login-options').classList.remove('hidden');
    document.getElementById('login-form').classList.add('hidden');
}

function finalizeLogin(role) {
    currentUserRole = role;
    document.body.className = `role-${role}`;
    loginScreen.classList.add('hidden');
    appContainer.classList.remove('hidden');
    
    // Update Header based on Persona
    const nameEl = document.getElementById('user-name');
    const avatarEl = document.getElementById('user-avatar');
    const roleEl = document.getElementById('user-role');
    
    if (role === 'admin') {
        nameEl.textContent = 'Dr. Rajesh Gupta';
        avatarEl.textContent = 'RG';
        roleEl.textContent = 'Chief Medical Officer';
        document.getElementById('patient-nav-label').textContent = 'Patient Directory';
        switchView('patients');
    } else {
        nameEl.textContent = 'Arjun Sharma';
        avatarEl.textContent = 'AS';
        roleEl.textContent = 'Patient (Verified)';
        document.getElementById('patient-nav-label').textContent = 'My Health Portal';
        switchView('patient-app');
    }
}

function showBiometricScan(onSuccess) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal" style="width: 400px; padding: 40px; text-align: center;">
            <div class="bio-icon" style="font-size: 4rem; margin-bottom: 24px; animation: pulse 1s infinite alternate;">👆</div>
            <h3 style="margin-bottom: 12px;">Admin Identity Verification</h3>
            <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 32px;">Please place your finger on the sensor or use FaceID to unlock the clinical node.</p>
            <div id="scan-progress" style="height: 4px; background: #f1f5f9; border-radius: 2px; overflow: hidden;">
                <div style="width: 0%; height: 100%; background: var(--primary); transition: width 0.8s ease-in-out;"></div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    setTimeout(() => {
        modal.querySelector('#scan-progress div').style.width = '100%';
        setTimeout(() => {
            modal.remove();
            onSuccess();
        }, 1000);
    }, 500);
}

document.getElementById('logout-btn')?.addEventListener('click', () => {
    currentUserRole = null;
    document.body.className = '';
    loginScreen.classList.remove('hidden');
    appContainer.classList.add('hidden');
});

loginTiles.admin?.addEventListener('click', () => handleLogin('admin'));
loginTiles.patient?.addEventListener('click', () => handleLogin('patient'));
document.getElementById('submit-login')?.addEventListener('click', submitLogin);
document.getElementById('back-to-roles')?.addEventListener('click', backToRoles);

// --- VIEW: DASHBOARD (ADMIN ONLY) ---
function initDashboard(container, patient = PATIENTS_LIST[0]) {
    activePatient = patient;
    const isCritical = patient.status === 'Critical';
    const scoreColor = patient.healthScore > 80 ? 'var(--success)' : (patient.healthScore > 50 ? 'var(--warning)' : 'var(--danger)');
    
    container.innerHTML = `
        <div class="dashboard-grid ${isCritical ? 'critical-mode' : ''}" style="display: grid; grid-template-columns: 1fr 380px; gap: 32px;">
            <div class="main-column">
                <div class="card patient-hero ${isCritical ? 'critical-glow' : 'glow'}" style="border-left: 8px solid ${isCritical ? 'var(--danger)' : 'var(--primary)'};">
                    <div style="display: flex; gap: 32px; align-items: start;">
                        <div class="patient-avatar-large" style="background: linear-gradient(135deg, ${isCritical ? 'var(--danger)' : 'var(--primary)'} 0%, ${isCritical ? '#991b1b' : 'var(--primary-dark)'} 100%); width: 100px; height: 100px; border-radius: 24px; font-size: 2.5rem; display: flex; align-items: center; justify-content: center; color: white; font-weight: 700;">${patient.avatar}</div>
                        <div style="flex-grow: 1;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                                <h1 style="font-size: 2rem; font-weight: 700;">${patient.name}</h1>
                                <span class="badge ${isCritical ? 'badge-danger pulse' : 'badge-success'}">${isCritical ? '● CRITICAL ADMISSION' : '● VERIFIED ABHA'}</span>
                            </div>
                            <div class="stats-row" style="display: flex; gap: 48px;">
                                <div><label class="stat-label">Height</label><span class="stat-val">${patient.height}</span></div>
                                <div><label class="stat-label">Weight</label><span class="stat-val">${patient.weight}</span></div>
                                <div id="health-score-btn" style="cursor: pointer;"><label class="stat-label">Health Score ⓘ</label><span class="stat-val" style="color: ${scoreColor};">${patient.healthScore}/100</span></div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="card" style="display: flex; justify-content: space-around; padding: 24px;">
                    <div class="vital-stat ${patient.vitals.hr > 100 ? 'vital-alert' : ''}"><div>❤️ <span style="font-size: 0.75rem; font-weight: 700;">HEART RATE</span></div><div style="font-size: 1.75rem; font-weight: 800;"><span id="live-hr">${patient.vitals.hr}</span> <small>BPM</small></div></div>
                    <div class="vital-stat ${patient.vitals.bp.split('/')[0] > 140 || patient.vitals.bp.split('/')[0] < 100 ? 'vital-alert' : ''}"><div>🩺 <span style="font-size: 0.75rem; font-weight: 700;">BP</span></div><div style="font-size: 1.75rem; font-weight: 800;">${patient.vitals.bp}</div></div>
                    <div class="vital-stat ${patient.vitals.spo2 < 95 ? 'vital-alert' : ''}"><div>💧 <span style="font-size: 0.75rem; font-weight: 700;">SPO2</span></div><div style="font-size: 1.75rem; font-weight: 800;">${patient.vitals.spo2}%</div></div>
                </div>
                <div class="card">
                    <h3 style="margin-bottom: 24px;">Active Diagnosis</h3>
                    <div style="display:flex; gap:12px; flex-wrap:wrap;">
                        ${patient.conditions.map(c => `<span class="tag">${c}</span>`).join('')}
                    </div>
                </div>
                <div class="card">
                    <div class="section-header" style="margin-bottom: 24px;"><h3>Clinical Activity</h3><button id="order-lab-btn" class="btn-primary" style="background: var(--primary-light); color: var(--primary-dark);">+ Order Lab</button></div>
                    <table class="data-table">
                        <thead><tr><th>S.No</th><th>Date</th><th>Type</th><th>Facility</th><th>Status</th></tr></thead>
                        <tbody>
                            ${(patient.recentActivity || []).map((a, i) => `
                                <tr><td>${i+1}</td><td>${a.date}</td><td>${a.type}</td><td>${a.facility}</td><td><span class="status-pill" style="background:${a.status === 'CRITICAL' ? '#fef2f2' : (a.status === 'Normal' ? '#ecfdf5' : '#f1f5f9')}; color:${a.status === 'CRITICAL' ? '#ef4444' : (a.status === 'Normal' ? '#10b981' : '#64748b')};">${a.status}</span></td></tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
            <div class="side-column">
                <div class="card">
                    <h3 style="margin-bottom: 20px;">Providers</h3>
                    ${PATIENT_DATA.providers.map(p => `<div class="source-item"><div class="source-icon ${p.color}">${p.name[0]}</div><div style="margin-left:12px; font-weight:700; font-size:0.85rem;">${p.name}</div><div class="sync-status"></div></div>`).join('')}
                </div>
                <div class="card ai-card" style="background: linear-gradient(135deg, ${isCritical ? '#991b1b' : '#1e293b'} 0%, ${isCritical ? '#450a0a' : '#334155'} 100%); color: white;">
                    <div class="ai-badge">${isCritical ? 'CRITICAL ALERT' : 'AI INSIGHT'}</div>
                    <p style="font-size: 0.9rem; line-height: 1.6;">${isCritical ? 'Uncontrolled vitals detected. Suggesting immediate intervention team alert and lactate level check.' : 'Inter-facility data indicates steady recovery. Suggesting follow-up in 2 weeks.'}</p>
                </div>
            </div>
        </div>
    `;
    renderDashboardStyles();
    attachDashboardEvents();
}

function attachDashboardEvents() {
    document.getElementById('order-lab-btn')?.addEventListener('click', () => showDuplicateAlert('HbA1c Screener'));
    document.getElementById('health-score-btn')?.addEventListener('click', showHealthScoreBreakdown);
}

function showHealthScoreBreakdown() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal" style="width: 500px; padding: 40px;">
            <h2 style="margin-bottom: 24px;">Health Score Breakdown</h2>
            <div style="display: grid; gap: 20px;">
                <div style="display:flex; justify-content:space-between;"><span>Cardio Health</span><strong>85</strong></div>
                <div style="display:flex; justify-content:space-between;"><span>Glycemic Control</span><strong>72</strong></div>
            </div>
            <button class="btn-primary" style="width: 100%; margin-top: 32px;" onclick="this.closest('.modal-overlay').remove()">Close</button>
        </div>
    `;
    document.body.appendChild(modal);
}

function showDuplicateAlert(testName) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal" style="border-top: 10px solid var(--warning); width: 550px; padding: 40px;">
            <h2 style="color:var(--warning);">Redundant Order Detection</h2>
            <p style="margin: 20px 0;">Duplicate HbA1c detected from Apollo Jubilee Hills (12 days ago).</p>
            <div style="display: flex; justify-content: flex-end; gap: 16px;">
                <button onclick="this.closest('.modal-overlay').remove()">Cancel</button>
                <button class="btn-primary" style="background:var(--warning); color:#000;" onclick="this.closest('.modal-overlay').remove()">Proceed Anyway</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

// --- VIEW: STANDARDIZER ---
function initStandardizer(container) {
    container.innerHTML = `<div class="card" style="padding:100px; text-align:center;"><h2>AI Standardizer Portal</h2><p style="color:var(--text-muted);">Drop files to convert to FHIR</p></div>`;
}

// --- VIEW: TIMELINE ---
function initTimeline(container) {
    container.innerHTML = `
        <div class="card" style="padding: 40px;">
            <h2 style="margin-bottom:32px;">Transparency & History</h2>
            <div class="timeline" style="margin-bottom:48px;">
                <div class="timeline-item"><h4>Max Labs</h4><p>Lipid Profile processed via UHI.</p></div>
                <div class="timeline-item emergency"><h4>AIIMS Trauma</h4><p>Emergency chart access node activated.</p></div>
            </div>
            <h3>🛡️ Audit Ledger</h3>
            <div style="display:grid; gap:12px; margin-top:20px;">
                ${PATIENT_DATA.auditLogs.map(log => `<div style="padding:16px; background:#f8fafc; border-radius:12px; display:flex; justify-content:space-between; font-size:0.8rem; border:1px solid var(--border);"><div><strong>${log.clinician}</strong> &bull; ${log.action}</div><div style="font-family:monospace;">${log.hash}</div></div>`).join('')}
            </div>
        </div>
    `;
    renderTimelineStyles();
}

function renderTimelineStyles() {
    if (document.getElementById('timeline-styles')) return;
    const s = document.createElement('style');
    s.id = 'timeline-styles';
    s.textContent = `.timeline { position: relative; padding-left: 32px; border-left: 2px solid var(--border); } .timeline-item { margin-bottom: 32px; position: relative; } .timeline-item::after { content: ''; position: absolute; left: -39px; top: 0; width: 12px; height: 12px; background: #fff; border: 3px solid var(--primary); border-radius: 50%; } .timeline-item.emergency::after { border-color: var(--danger); background: var(--danger); }`;
    document.head.appendChild(s);
}

// --- VIEW: PRIOR AUTH ---
function initPriorAuth(container) {
    container.innerHTML = `<div class="card" style="padding:100px; text-align:center;"><h2>Prior Authorization Control</h2><p>HDFC ERGO / Star Health Integrated</p></div>`;
}

// --- VIEW: PATIENT LIST (ADMIN ONLY) ---
function initPatientList(container) {
    container.innerHTML = `
        <div class="card" style="padding: 40px;">
            <div class="section-header" style="margin-bottom: 32px;">
                <h2 style="font-family: 'Outfit';">Central Patient Directory</h2>
                <div style="display:flex; gap:12px;">
                    <button class="btn-primary" style="background: var(--primary-light); color: var(--primary-dark);">Download CSV</button>
                    <button class="btn-primary" onclick="showAddPatientModal()">+ Add Patient</button>
                </div>
            </div>
            <table class="data-table">
                <thead>
                    <tr>
                        <th style="width: 80px;">S.No</th>
                        <th>Name</th>
                        <th>Age</th>
                        <th>ABHA ID</th>
                        <th>Vitals</th>
                        <th>Status</th>
                        <th style="text-align: right;">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${PATIENTS_LIST.map((p, i) => `
                        <tr>
                            <td>${i + 1}</td>
                            <td><div style="display:flex; align-items:center; gap:10px;"><div class="avatar" style="width:32px; height:32px; font-size:0.75rem;">${p.name.split(' ').map(n=>n[0]).join('')}</div><strong>${p.name}</strong></div></td>
                            <td>${p.age}</td>
                            <td style="font-family:monospace; color:var(--text-muted);">${p.abha}</td>
                            <td><span style="color:var(--success);">Normal</span></td>
                            <td><span class="status-pill" style="background: ${p.status === 'Critical' ? '#fef2f2' : '#f0f9ff'}; color: ${p.status === 'Critical' ? '#ef4444' : '#0ea5e9'};">${p.status}</span></td>
                            <td style="text-align: right;">
                                <button class="btn-text" onclick="switchView('dashboard', PATIENTS_LIST[${i}])">View</button>
                                <button class="btn-text" style="color: var(--danger); margin-left: 8px;" onclick="deletePatient(${i})">Remove</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function showAddPatientModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal" style="width: 500px; padding: 40px; border-top: 10px solid var(--primary);">
            <h2 style="margin-bottom: 24px; font-family: 'Outfit';">Add New Patient</h2>
            <div style="display: grid; gap: 16px;">
                <div class="form-group">
                    <label>Full Name</label>
                    <input type="text" id="new-patient-name" placeholder="e.g. Arjun Sharma">
                </div>
                <div class="form-group">
                    <label>Age</label>
                    <input type="number" id="new-patient-age" placeholder="45">
                </div>
                <div class="form-group">
                    <label>ABHA ID (91-XXXX-XXXX-XXXX)</label>
                    <input type="text" id="new-patient-abha" placeholder="91-0000-0000-0000">
                </div>
                <div class="form-group">
                    <label>Status</label>
                    <select id="new-patient-status" style="width:100%; padding:12px; border-radius:12px; border:1px solid var(--border); background: #f8fafc; font-family: inherit;">
                        <option value="Active">Active</option>
                        <option value="Stable">Stable</option>
                        <option value="Critical">Critical</option>
                    </select>
                </div>
            </div>
            <div style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 32px;">
                <button class="btn-text" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
                <button class="btn-primary" id="save-patient-btn">Add to Directory</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    modal.querySelector('#save-patient-btn').addEventListener('click', () => {
        const name = document.getElementById('new-patient-name').value;
        const age = document.getElementById('new-patient-age').value;
        const abha = document.getElementById('new-patient-abha').value;
        const status = document.getElementById('new-patient-status').value;
        
        if (!name || !age || !abha) return alert('Please fill all fields');
        
        saveNewPatient({ name, age, abha, status });
        modal.remove();
    });
}

function saveNewPatient(data) {
    const newId = PATIENTS_LIST.length + 1;
    const newPatient = {
        id: newId,
        name: data.name,
        age: parseInt(data.age),
        abha: data.abha,
        status: data.status,
        height: "170 cm",
        weight: "70 kg",
        avatar: data.name.split(' ').map(n => n[0]).join(''),
        healthScore: data.status === 'Critical' ? 35 : 82,
        vitals: { hr: 75, bp: "120/80", spo2: 98 },
        conditions: ["New Admission"],
        recentActivity: [{ date: new Date().toLocaleDateString(), type: "Admission", facility: "Nexus Home", status: data.status === 'Critical' ? 'CRITICAL' : 'Normal' }]
    };
    PATIENTS_LIST.push(newPatient);
    switchView('patients');
}

function deletePatient(index) {
    if (confirm(`Are you sure you want to remove ${PATIENTS_LIST[index].name} from the records?`)) {
        PATIENTS_LIST.splice(index, 1);
        switchView('patients');
    }
}

// --- VIEW: PATIENT APP ---
function initPatientApp(container) {
    container.innerHTML = `
        <div style="display:flex; justify-content:center; align-items:center;">
            <div style="width:320px; height:640px; border:10px solid #1e293b; border-radius:40px; background:#fff; padding:24px; box-shadow: var(--shadow-lg);">
                <h3 style="color:var(--primary); font-weight:900;">ABHA CONNECT</h3>
                <div style="margin-top:40px;">
                    <p style="font-size:0.8rem; font-weight:700; color:var(--text-muted);">ACTIVE CONSENTS</p>
                    <div style="display:flex; justify-content:space-between; margin:16px 0;"><span>Apollo Hospitals</span><input type="checkbox" checked></div>
                    <div style="display:flex; justify-content:space-between; margin:16px 0;"><span>Max Healthcare</span><input type="checkbox" checked></div>
                </div>
                <div style="background:var(--primary-light); padding:20px; border-radius:12px; margin-top:200px; font-size:0.8rem; color:var(--primary-dark);">
                    Saved <strong>₹14,250</strong> this quarter via interoperability.
                </div>
            </div>
        </div>
    `;
}

// --- CORE CONTROLLER ---
const viewContainer = document.getElementById('view-container');
const navLinks = document.querySelectorAll('.nav-links li');
const breakGlassBtn = document.getElementById('break-glass-btn');

const views = {
    dashboard: initDashboard,
    timeline: initTimeline,
    standardizer: initStandardizer,
    auth: initPriorAuth,
    patients: initPatientList,
    'patient-app': initPatientApp
};

function switchView(viewName, data = null) {
    navLinks.forEach(link => link.classList.toggle('active', link.dataset.view === viewName));
    viewContainer.innerHTML = '';
    viewContainer.classList.remove('view-animate');
    void viewContainer.offsetWidth;
    viewContainer.classList.add('view-animate');
    if (views[viewName]) views[viewName](viewContainer, data);
}

navLinks.forEach(link => link.addEventListener('click', () => switchView(link.dataset.view)));

breakGlassBtn?.addEventListener('click', () => {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal" style="width: 450px; padding: 40px; border-top: 10px solid var(--danger);">
            <h2 style="color: var(--danger);">🚨 Authorize Emergency Access</h2>
            <textarea id="eb-reason" style="width:100%; height:100px; padding:12px; margin:20px 0; border:1px solid var(--border); border-radius:12px;" placeholder="Reason..."></textarea>
            <div style="display:flex; justify-content:flex-end; gap:12px;">
                <button onclick="this.closest('.modal-overlay').remove()">Cancel</button>
                <button id="auth-eb" class="btn-primary" style="background:var(--danger);">Authorize Access</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    modal.querySelector('#auth-eb').addEventListener('click', () => {
        if (!document.getElementById('eb-reason').value) return;
        modal.remove();
        document.body.style.boxShadow = 'inset 0 0 180px rgba(239, 68, 68, 0.4)';
    });
});

function renderDashboardStyles() {
    if (document.getElementById('dashboard-styles')) return;
    const s = document.createElement('style');
    s.id = 'dashboard-styles';
    s.textContent = `
        .stat-label { font-size: 0.75rem; color: var(--text-muted); display: block; text-transform: uppercase; font-weight: 700; margin-bottom: 4px; }
        .stat-val { font-weight: 700; font-size: 1.1rem; }
        .data-table { width: 100%; border-collapse: collapse; }
        .data-table th { text-align: left; padding: 16px; color: var(--text-muted); font-size: 0.8rem; border-bottom: 1px solid var(--border); }
        .data-table td { padding: 16px; border-bottom: 1px solid #f8fafc; font-size: 0.95rem; }
        .source-item { display:flex; align-items:center; padding:12px; background:rgba(255,255,255,0.5); border-radius:12px; margin-bottom:12px; border:1px solid var(--border); }
        .source-icon { background: var(--primary); color: white; width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 0.75rem; }
        .sync-status { width: 8px; height: 8px; background: #10b981; border-radius: 50%; margin-left: auto; }
        .ai-badge { background: var(--primary); padding: 4px 12px; border-radius: 8px; font-size: 0.7rem; font-weight: 800; margin-bottom: 20px; display: inline-block; }
    `;
    document.head.appendChild(s);
}

// FAB Message
const fab = document.createElement('div');
fab.innerHTML = `<div style="position:fixed; bottom:32px; left:32px; width:60px; height:60px; background:var(--primary); border-radius:50%; display:flex; align-items:center; justify-content:center; color:white; font-size:1.5rem; cursor:pointer; box-shadow:var(--shadow-lg); z-index:2000;" onclick="alert('Clinician Messaging Node Online')">💬</div>`;
document.body.appendChild(fab);
