// Nexus Health AI Platform - High Fidelity Multi-Role Architecture
// Consolidated logic with Role-Based Access Control (RBAC) and Biometric Simulation

// --- API CONFIG ---
const API_BASE_URL = window.location.origin + '/api';
let AUTH_TOKEN = null;
let CURRENT_USER_DATA = null;

// --- MOCK FALLBACKS (For UI components not yet in DB) ---
const PATIENT_DATA = {
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

let activePatient = null;
let PATIENTS_LIST = [];

// --- THEME LOGIC ---
function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('nexus-theme', theme);
    const icon = theme === 'dark' ? '☀️' : '🌙';
    document.querySelectorAll('#theme-toggle-btn, #global-theme-btn').forEach(btn => {
        if (btn) btn.textContent = icon;
    });
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    applyTheme(current === 'dark' ? 'light' : 'dark');
}

// Apply saved theme on load
applyTheme(localStorage.getItem('nexus-theme') || 'light');

document.getElementById('theme-toggle-btn')?.addEventListener('click', toggleTheme);
document.getElementById('global-theme-btn')?.addEventListener('click', toggleTheme);

// --- MOBILE SIDEBAR LOGIC ---
const sidebar = document.querySelector('.sidebar');
const sidebarToggle = document.getElementById('sidebar-toggle');
const sidebarOverlay = document.getElementById('sidebar-overlay');

function toggleSidebar() {
    sidebar?.classList.toggle('active');
    sidebarOverlay?.classList.toggle('active');
}

sidebarToggle?.addEventListener('click', toggleSidebar);
sidebarOverlay?.addEventListener('click', toggleSidebar);

// Close sidebar when clicking a link on mobile
document.querySelectorAll('.nav-links li').forEach(link => {
    link.addEventListener('click', () => {
        if (window.innerWidth <= 900) {
            sidebar?.classList.remove('active');
            sidebarOverlay?.classList.remove('active');
        }
    });
});

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
    if (role === 'admin') {
        document.getElementById('admin-login-form').classList.remove('hidden');
    } else {
        document.getElementById('patient-login-form').classList.remove('hidden');
    }
}

async function submitAdminLogin() {
    await performLogin('admin-login-userid', 'admin-login-password', 'admin');
}

async function submitPatientLogin() {
    await performLogin('patient-login-userid', 'patient-login-password', 'patient');
}

async function performLogin(userField, passField, expectedRole) {
    const userId = document.getElementById(userField).value;
    const pass = document.getElementById(passField).value;
    
    try {
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: userId, password: pass })
        });
        
        if (!response.ok) {
            throw new Error('Invalid credentials');
        }
        
        const data = await response.json();
        AUTH_TOKEN = data.token;
        CURRENT_USER_DATA = data.user;
        
        if (CURRENT_USER_DATA.role !== expectedRole) {
            throw new Error('Please use the correct portal for your account type.');
        }
        
        if (CURRENT_USER_DATA.role === 'admin') {
            showBiometricScan(() => finalizeLogin(CURRENT_USER_DATA));
        } else {
            finalizeLogin(CURRENT_USER_DATA);
        }
    } catch (err) {
        alert(err.message);
    }
}

function backToRoles() {
    selectedLoginRole = null;
    document.getElementById('login-options').classList.remove('hidden');
    document.getElementById('admin-login-form').classList.add('hidden');
    document.getElementById('patient-login-form').classList.add('hidden');
}

function finalizeLogin(user) {
    currentUserRole = user.role;
    document.body.className = `role-${user.role}`;
    loginScreen.classList.add('hidden');
    appContainer.classList.remove('hidden');
    
    // Update Header based on Persona
    const nameEl = document.getElementById('user-name');
    const avatarEl = document.getElementById('user-avatar');
    const roleEl = document.getElementById('user-role');
    
    if (user.role === 'admin') {
        nameEl.textContent = user.name;
        avatarEl.textContent = user.name.split(' ').map(n=>n[0]).join('');
        roleEl.textContent = 'Chief Medical Officer';
        document.getElementById('patient-nav-label').textContent = 'Patient Directory';
        switchView('patients');
    } else {
        nameEl.textContent = user.name;
        avatarEl.textContent = user.name.split(' ').map(n=>n[0]).join('');
        roleEl.textContent = 'Patient (Verified)';
        document.getElementById('patient-nav-label').textContent = 'My Health Portal';
        switchView('patient-app', { id: user.patient_id });
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
document.getElementById('submit-admin-login')?.addEventListener('click', submitAdminLogin);
document.getElementById('submit-patient-login')?.addEventListener('click', submitPatientLogin);
document.querySelectorAll('.back-to-roles').forEach(btn => btn.addEventListener('click', backToRoles));

// --- VIEW: DASHBOARD (ADMIN ONLY) ---
async function initDashboard(container, data = null) {
    container.innerHTML = `<div style="padding: 40px;">Loading dashboard...</div>`;
    try {
        let patient = data;
        if (data && data.id) {
            const response = await fetch(`${API_BASE_URL}/patients/${data.id}`, {
                headers: { 'Authorization': `Bearer ${AUTH_TOKEN}` }
            });
            if (!response.ok) throw new Error('Failed to fetch patient data');
            patient = await response.json();
        } else if (!data && PATIENTS_LIST.length > 0) {
            patient = PATIENTS_LIST[0];
        }
        
        if (!patient) throw new Error('No patient data available');
        
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
                <div class="card" style="display: flex; flex-direction: column; padding: 24px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                        <h3 style="margin: 0;">Current Vitals</h3>
                        <button id="add-vitals-btn" class="btn-primary" style="padding: 6px 12px; font-size: 0.8rem; background: var(--primary-light); color: var(--primary-dark);">+ Update</button>
                    </div>
                    <div style="display: flex; justify-content: space-around;">
                        <div class="vital-stat ${patient.vitals.hr > 100 ? 'vital-alert' : ''}"><div>❤️ <span style="font-size: 0.75rem; font-weight: 700;">HEART RATE</span></div><div style="font-size: 1.75rem; font-weight: 800;"><span id="live-hr">${patient.vitals.hr}</span> <small>BPM</small></div></div>
                        <div class="vital-stat ${patient.vitals.bp.split('/')[0] > 140 || patient.vitals.bp.split('/')[0] < 100 ? 'vital-alert' : ''}"><div>🩺 <span style="font-size: 0.75rem; font-weight: 700;">BP</span></div><div style="font-size: 1.75rem; font-weight: 800;">${patient.vitals.bp}</div></div>
                        <div class="vital-stat ${patient.vitals.spo2 < 95 ? 'vital-alert' : ''}"><div>💧 <span style="font-size: 0.75rem; font-weight: 700;">SPO2</span></div><div style="font-size: 1.75rem; font-weight: 800;">${patient.vitals.spo2}%</div></div>
                    </div>
                </div>
                <div class="card">
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
            <div class="side-column">
                <div class="card">
                    <h3 style="margin-bottom: 20px;">Providers</h3>
                    ${PATIENT_DATA.providers.map(p => `<div class="source-item"><div class="source-icon ${p.color}">${p.name[0]}</div><div style="margin-left:12px; font-weight:700; font-size:0.85rem;">${p.name}</div><div class="sync-status"></div></div>`).join('')}
                </div>

                ${patient.linkedDocuments ? `
                <div class="card">
                    <h3 style="margin-bottom: 20px;">DigiLocker Records</h3>
                    ${patient.linkedDocuments.map(doc => `
                        <div class="doc-item" style="display: flex; align-items: center; gap: 12px; padding: 12px; background: var(--permission-bg); border: 1px solid var(--border); border-radius: 12px; margin-bottom: 8px;">
                            <div style="font-size: 1.2rem;">📄</div>
                            <div style="flex-grow: 1;">
                                <div style="font-weight: 700; font-size: 0.8rem;">${doc.name}</div>
                                <div style="font-size: 0.7rem; color: var(--text-muted);">${doc.type} &bull; ${doc.date}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
                ` : ''}

                ${patient.bankAccounts ? `
                <div class="card">
                    <h3 style="margin-bottom: 20px;">Financial Profile</h3>
                    ${patient.bankAccounts.map(acc => `
                        <div class="bank-item" style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: rgba(16, 185, 129, 0.1); border: 1px solid var(--success); border-radius: 12px; margin-bottom: 8px;">
                            <div>
                                <div style="font-weight: 700; font-size: 0.8rem;">${acc.bank} (****${acc.last4})</div>
                                <div style="font-size: 0.7rem; color: var(--success);">Healthcare Spend: <strong>${acc.healthcareSpend}</strong></div>
                            </div>
                            <div style="font-size: 1.2rem;">💳</div>
                        </div>
                    `).join('')}
                </div>
                ` : ''}

                <div class="card ai-card" style="background: linear-gradient(135deg, ${isCritical ? '#991b1b' : '#1e293b'} 0%, ${isCritical ? '#450a0a' : '#334155'} 100%); color: white;">
                    <div class="ai-badge">${isCritical ? 'CRITICAL ALERT' : 'AI INSIGHT'}</div>
                    <p style="font-size: 0.9rem; line-height: 1.6;">${isCritical ? 'Uncontrolled vitals detected. Suggesting immediate intervention team alert and lactate level check.' : 'Inter-facility data indicates steady recovery. Suggesting follow-up in 2 weeks.'}</p>
                </div>
            </div>
        </div>
    `;
    renderDashboardStyles();
    attachDashboardEvents();
    
    } catch (err) {
        container.innerHTML = `<div style="color: red; padding: 40px;">Error loading dashboard: ${err.message}</div>`;
    }
}

function attachDashboardEvents() {
    document.getElementById('order-lab-btn')?.addEventListener('click', () => showOrderLabModal());
    document.getElementById('health-score-btn')?.addEventListener('click', showHealthScoreBreakdown);
    document.getElementById('add-vitals-btn')?.addEventListener('click', showAddVitalsModal);
}

function showAddVitalsModal() {
    if (!activePatient) return;
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal" style="width: 400px; padding: 40px;">
            <h2 style="margin-bottom: 24px;">Update Vitals</h2>
            <div style="display: grid; gap: 16px;">
                <div class="form-group"><label>Heart Rate (BPM)</label><input type="number" id="vital-hr" placeholder="75" value="${activePatient.vitals.hr}"></div>
                <div class="form-group"><label>Blood Pressure</label><input type="text" id="vital-bp" placeholder="120/80" value="${activePatient.vitals.bp}"></div>
                <div class="form-group"><label>SpO2 (%)</label><input type="number" id="vital-spo2" placeholder="98" value="${activePatient.vitals.spo2}"></div>
            </div>
            <div style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 32px;">
                <button class="btn-text" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
                <button class="btn-primary" id="save-vitals-btn">Save Vitals</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    modal.querySelector('#save-vitals-btn').addEventListener('click', async () => {
        const hr = document.getElementById('vital-hr').value;
        const bp = document.getElementById('vital-bp').value;
        const spo2 = document.getElementById('vital-spo2').value;
        
        try {
            const response = await fetch(`${API_BASE_URL}/patients/${activePatient.id}/vitals`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${AUTH_TOKEN}`
                },
                body: JSON.stringify({ hr, bp, spo2 })
            });
            if (!response.ok) throw new Error('Failed to update vitals');
            modal.remove();
            switchView('dashboard', activePatient); // reload dashboard
        } catch(err) {
            alert(err.message);
        }
    });
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

function showOrderLabModal() {
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
}

// --- VIEW: STANDARDIZER ---
// --- VIEW: STANDARDIZER (DATA CENTER) ---
function initStandardizer(container) {
    container.innerHTML = `
        <div class="view-animate">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:32px;">
                <div>
                    <h1 style="margin:0;">AI Data Standardizer</h1>
                    <p style="color:var(--text-muted); margin:4px 0 0 0;">Convert legacy clinical data to FHIR R4 standard</p>
                </div>
                <div style="display:flex; gap:12px;">
                    <div class="tag" style="background:var(--success); color:#fff; border:none;">● Engine Online</div>
                    <div class="tag">Mapping: ICD-10-CM</div>
                </div>
            </div>

            <div class="card" style="padding:60px; border: 2px dashed var(--border); background:var(--glass); text-align:center; margin-bottom:32px;">
                <div style="font-size:3rem; margin-bottom:20px;">📂</div>
                <h3 style="margin-bottom:12px;">Drag & Drop Clinical Records</h3>
                <p style="color:var(--text-muted); margin-bottom:24px;">Upload PDF, HL7, or DICOM files to begin automated FHIR transformation</p>
                <button class="btn-primary" onclick="simulateFileUpload()">Browse Files</button>
                <div id="upload-progress-container" style="display:none; width:400px; margin:32px auto 0 auto;">
                    <div style="display:flex; justify-content:space-between; font-size:0.8rem; margin-bottom:8px;">
                        <span id="upload-status-text">Parsing HL7 Segment...</span>
                        <span id="upload-percent">45%</span>
                    </div>
                    <div style="height:8px; background:var(--border); border-radius:4px; overflow:hidden;">
                        <div id="upload-bar" style="width:45%; height:100%; background:var(--primary); transition:width 0.3s ease;"></div>
                    </div>
                </div>
            </div>

            <div class="card">
                <h3 style="margin-bottom:24px;">Recent Transformations</h3>
                <table class="data-table">
                    <thead>
                        <tr><th>ID</th><th>Source File</th><th>Format</th><th>Entities Identified</th><th>Status</th></tr>
                    </thead>
                    <tbody>
                        <tr><td>#8821</td><td>discharge_summary_v2.pdf</td><td><span class="tag">PDF</span></td><td>12 ICD, 4 LOINC</td><td><span class="status-pill" style="background:rgba(16,185,129,0.1); color:var(--success);">Standardized</span></td></tr>
                        <tr><td>#8819</td><td>lab_results_apollo.hl7</td><td><span class="tag">HL7</span></td><td>18 LOINC</td><td><span class="status-pill" style="background:rgba(16,185,129,0.1); color:var(--success);">Standardized</span></td></tr>
                        <tr><td>#8815</td><td>ct_scan_brain.dcm</td><td><span class="tag">DICOM</span></td><td>Imaging Metadata</td><td><span class="status-pill" style="background:rgba(245,158,11,0.1); color:var(--warning);">Mapping Check</span></td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function simulateFileUpload() {
    const container = document.getElementById('upload-progress-container');
    const bar = document.getElementById('upload-bar');
    const percentText = document.getElementById('upload-percent');
    const statusText = document.getElementById('upload-status-text');
    
    container.style.display = 'block';
    let p = 0;
    const statuses = ["Reading file...", "Identifying entities...", "Mapping to FHIR R4...", "Signing hash...", "Success!"];
    
    const interval = setInterval(() => {
        p += 5;
        if (p > 100) {
            clearInterval(interval);
            showToast("Record Standardized Successfully!");
            setTimeout(() => container.style.display = 'none', 1000);
            return;
        }
        bar.style.width = p + '%';
        percentText.textContent = p + '%';
        statusText.textContent = statuses[Math.floor((p/101)*statuses.length)];
    }, 100);
}

// --- VIEW: TIMELINE ---
// --- VIEW: TIMELINE (TRANSPARENCY & HISTORY) ---
function initTimeline(container) {
    container.innerHTML = `
        <div class="view-animate">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:32px;">
                <div>
                    <h1 style="margin:0;">Audit & Transparency</h1>
                    <p style="color:var(--text-muted); margin:4px 0 0 0;">Immutable ledger of all clinical data interactions</p>
                </div>
                <button class="btn-primary" style="background:var(--primary-light); color:var(--primary-dark);">Download Full Audit Trail</button>
            </div>

            <div style="display:grid; grid-template-columns: 1.5fr 1fr; gap:32px; align-items:start;">
                <div class="card">
                    <h3 style="margin-bottom:28px;">Recent Access Events</h3>
                    <div class="timeline-v2">
                        <div class="timeline-v2-item verified">
                            <div class="t-icon">✅</div>
                            <div class="t-content">
                                <h4>Data Sync Complete</h4>
                                <p>Successfully synced 4 immunization records from DigiLocker (MoHFW).</p>
                                <span class="t-time">Today, 11:45 AM</span>
                            </div>
                        </div>
                        <div class="timeline-v2-item alert">
                            <div class="t-icon">🚨</div>
                            <div class="t-content">
                                <h4>Break the Glass Activated</h4>
                                <p><strong>Dr. Sarah Mitchell</strong> accessed records at AIIMS Trauma Center. Emergency override confirmed.</p>
                                <span class="t-time">Yesterday, 10:30 PM</span>
                            </div>
                        </div>
                        <div class="timeline-v2-item access">
                            <div class="t-icon">🔍</div>
                            <div class="t-content">
                                <h4>Routine Chart Review</h4>
                                <p><strong>Dr. Rajesh Gupta</strong> accessed the Diabetes Management dashboard at Apollo Hospital.</p>
                                <span class="t-time">Oct 24, 2:15 PM</span>
                            </div>
                        </div>
                        <div class="timeline-v2-item consent">
                            <div class="t-icon">📝</div>
                            <div class="t-content">
                                <h4>Consent Granted</h4>
                                <p>Patient authorized Max Healthcare to access historical imaging records for 30 days.</p>
                                <span class="t-time">Oct 23, 9:00 AM</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="card">
                    <h3 style="margin-bottom:20px;">🛡️ Blockchain Ledger</h3>
                    <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:24px;">All events are cryptographically hashed and verified on the Nexus Private Ledger.</p>
                    <div style="display:grid; gap:12px;">
                        ${PATIENT_DATA.auditLogs.map(log => `
                            <div style="padding:14px; background:var(--permission-bg); border-radius:12px; border:1px solid var(--border);">
                                <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
                                    <span style="font-weight:700; font-size:0.8rem;">${log.clinician}</span>
                                    <span style="color:var(--primary); font-family:monospace; font-size:0.7rem;">#${Math.random().toString(16).substr(2, 6)}</span>
                                </div>
                                <div style="font-size:0.75rem; color:var(--text-muted); margin-bottom:10px;">${log.action} &bull; ${log.facility}</div>
                                <div style="font-family:monospace; font-size:0.65rem; color:var(--text-muted); background:var(--input-bg); padding:6px; border-radius:6px; word-break:break-all;">HASH: ${log.hash}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        </div>
    `;
    renderTimelineStyles();
}

function renderTimelineStyles() {
    if (document.getElementById('timeline-styles')) return;
    const s = document.createElement('style');
    s.id = 'timeline-styles';
    s.textContent = `
        .timeline-v2 { position: relative; padding-left: 20px; }
        .timeline-v2::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 2px; background: var(--border); }
        .timeline-v2-item { position: relative; padding-bottom: 32px; padding-left: 24px; }
        .timeline-v2-item::after { content: ''; position: absolute; left: -24px; top: 0; width: 10px; height: 100%; background: transparent; }
        .t-icon { position: absolute; left: -32px; top: 0; width: 24px; height: 24px; background: var(--bg-card-solid); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; border: 2px solid var(--border); z-index: 2; }
        .timeline-v2-item.verified .t-icon { border-color: var(--success); }
        .timeline-v2-item.alert .t-icon { border-color: var(--danger); background: rgba(239,68,68,0.1); }
        .timeline-v2-item h4 { margin: 0 0 4px 0; font-size: 1rem; }
        .timeline-v2-item p { margin: 0; font-size: 0.85rem; color: var(--text-muted); line-height: 1.5; }
        .t-time { display: block; margin-top: 8px; font-size: 0.75rem; font-weight: 700; color: var(--primary); text-transform: uppercase; }
    `;
    document.head.appendChild(s);
}

// --- VIEW: PRIOR AUTH ---
// --- VIEW: PRIOR AUTH (INSURANCE GATEWAY) ---
function initPriorAuth(container) {
    container.innerHTML = `
        <div class="view-animate">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:32px;">
                <div>
                    <h1 style="margin:0;">Prior Authorization</h1>
                    <p style="color:var(--text-muted); margin:4px 0 0 0;">Unified gateway for Indian insurance adjudication</p>
                </div>
                <button class="btn-primary" onclick="showToast('Insurance Portal Synced!')">+ New Request</button>
            </div>

            <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:24px; margin-bottom:32px;">
                <div class="card" style="padding:24px; text-align:center;">
                    <div style="font-size:0.75rem; color:var(--text-muted); font-weight:700; text-transform:uppercase; margin-bottom:8px;">Avg. Approval Time</div>
                    <div style="font-size:1.8rem; font-weight:800; color:var(--success);">14.2 Min</div>
                    <div style="font-size:0.7rem; color:var(--success); margin-top:4px;">⬇ 12% from last month</div>
                </div>
                <div class="card" style="padding:24px; text-align:center;">
                    <div style="font-size:0.75rem; color:var(--text-muted); font-weight:700; text-transform:uppercase; margin-bottom:8px;">Auto-Approved (AI)</div>
                    <div style="font-size:1.8rem; font-weight:800; color:var(--primary);">88.4%</div>
                    <div style="font-size:0.7rem; color:var(--text-muted); margin-top:4px;">Across all partner insurers</div>
                </div>
                <div class="card" style="padding:24px; text-align:center;">
                    <div style="font-size:0.75rem; color:var(--text-muted); font-weight:700; text-transform:uppercase; margin-bottom:8px;">Pending Review</div>
                    <div style="font-size:1.8rem; font-weight:800; color:var(--warning);">12 Cases</div>
                    <div style="font-size:0.7rem; color:var(--danger); margin-top:4px;">3 STAT cases requires action</div>
                </div>
            </div>

            <div class="card">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px;">
                    <h3>Active Authorization Requests</h3>
                    <div style="display:flex; gap:8px;">
                        <input type="text" placeholder="Search requests..." style="padding:8px 12px; border-radius:8px; border:1px solid var(--border); background:var(--input-bg); color:var(--text-main); font-size:0.8rem;">
                    </div>
                </div>
                <table class="data-table">
                    <thead>
                        <tr><th>Req ID</th><th>Patient</th><th>Procedure</th><th>Insurer</th><th>AI Check</th><th>Status</th></tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>#PA-992</td>
                            <td>Arjun Sharma</td>
                            <td>MRI Brain (Contrast)</td>
                            <td>HDFC ERGO</td>
                            <td><span style="color:var(--success);">✅ Verified</span></td>
                            <td><span class="status-pill" style="background:rgba(16,185,129,0.1); color:var(--success);">Approved</span></td>
                        </tr>
                        <tr>
                            <td>#PA-985</td>
                            <td>Priya Patel</td>
                            <td>Knee Replacement</td>
                            <td>Star Health</td>
                            <td><span style="color:var(--warning);">⌛ Manual Review</span></td>
                            <td><span class="status-pill" style="background:rgba(245,158,11,0.1); color:var(--warning);">Pending</span></td>
                        </tr>
                        <tr>
                            <td>#PA-981</td>
                            <td>Rahul Verma</td>
                            <td>Cardiac Stenting</td>
                            <td>ICICI Lombard</td>
                            <td><span style="color:var(--success);">✅ Verified</span></td>
                            <td><span class="status-pill" style="background:rgba(16,185,129,0.1); color:var(--success);">Approved</span></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

// --- VIEW: PATIENT LIST (ADMIN ONLY) ---
async function initPatientList(container) {
    container.innerHTML = `<div style="padding: 40px;">Loading patients...</div>`;
    try {
        const response = await fetch(`${API_BASE_URL}/patients`, {
            headers: { 'Authorization': `Bearer ${AUTH_TOKEN}` }
        });
        if (!response.ok) throw new Error('Failed to fetch patients');
        PATIENTS_LIST = await response.json();
        
        container.innerHTML = `
            <div class="card" style="padding: 40px;">
                <div class="section-header" style="margin-bottom: 32px;">
                    <h2 style="font-family: 'Outfit';">Central Patient Directory</h2>
                    <div style="display:flex; gap:12px;">
                        <button class="btn-primary" style="background: #000; color: #fff;" onclick="initCardScanner()">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 8px; vertical-align: middle;"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
                            Scan Patient Card
                        </button>
                        <button class="btn-primary" style="background: var(--primary-light); color: var(--primary-dark);" onclick="downloadPatientCSV()">Download CSV</button>
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
                                <td><div style="display:flex; align-items:center; gap:16px;"><div class="avatar" style="width:40px; height:40px; font-size:0.9rem; font-weight:700;">${p.avatar}</div><strong>${p.name}</strong></div></td>
                                <td>${p.age}</td>
                                <td style="font-family:monospace; color:var(--text-muted); letter-spacing:0.5px;">${p.abha}</td>
                                <td><span style="color:var(--success); font-weight:600;">Normal</span></td>
                                <td><span class="status-pill" style="padding: 6px 12px; font-weight: 600; border-radius: 20px; background: ${p.status === 'Critical' ? '#fef2f2' : '#f0f9ff'}; color: ${p.status === 'Critical' ? '#ef4444' : '#0ea5e9'};">${p.status}</span></td>
                                <td style="text-align: right; white-space: nowrap;">
                                    <button class="btn-primary" style="padding: 8px 16px; font-size: 0.8rem; background: #f1f5f9; color: var(--text); margin-right: 8px;" onclick="showPatientQRModal(${p.id}, '${p.name}')">QR</button>
                                    <button class="btn-primary" style="padding: 8px 16px; font-size: 0.8rem; background: var(--primary-light); color: var(--primary-dark); margin-right: 8px;" onclick="switchView('dashboard', PATIENTS_LIST[${i}])">View</button>
                                    <button class="btn-primary" style="padding: 8px 16px; font-size: 0.8rem; background: #fef2f2; color: var(--danger);" onclick="deletePatient(${p.id})">Remove</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    } catch (err) {
        container.innerHTML = `<div style="color: red; padding: 40px;">Error loading patients: ${err.message}</div>`;
    }
}

function downloadPatientCSV() {
    if (!PATIENTS_LIST || PATIENTS_LIST.length === 0) return alert('No data to download.');
    
    const headers = ['S.No', 'Name', 'Age', 'ABHA ID', 'Status', 'Heart Rate', 'Blood Pressure', 'SpO2', 'Health Score'];
    const rows = [headers.join(',')];
    
    PATIENTS_LIST.forEach((p, index) => {
        const row = [
            index + 1,
            `"${p.name}"`,
            p.age,
            `"${p.abha}"`,
            p.status,
            p.vitals?.hr || 'N/A',
            `"${p.vitals?.bp || 'N/A'}"`,
            p.vitals?.spo2 || 'N/A',
            p.healthScore
        ];
        rows.push(row.join(','));
    });
    
    const csvString = rows.join('\r\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'nexus_patient_directory.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function showPatientQRModal(id, name) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal" style="width: 400px; padding: 40px; text-align: center;">
            <h2 style="margin-bottom: 8px; font-family: 'Outfit';">${name}</h2>
            <p style="color: var(--text-muted); margin-bottom: 24px;">Scan to open patient dashboard</p>
            <div id="qr-code-container" style="display: flex; justify-content: center; align-items: center; margin: 0 auto 32px auto; padding: 16px; background: var(--bg-card-solid); border-radius: 16px; border: 1px solid var(--border); width: 180px; height: 180px;"></div>
            <button class="btn-primary" style="width: 100%;" onclick="this.closest('.modal-overlay').remove()">Close</button>
        </div>
    `;
    document.body.appendChild(modal);
    
    // Generate QR Code properly centered
    setTimeout(() => {
        new QRCode(document.getElementById("qr-code-container"), {
            text: id.toString(),
            width: 148,
            height: 148,
            colorDark : "#000000",
            colorLight : "#ffffff",
            correctLevel : QRCode.CorrectLevel.H
        });
    }, 0);
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
                <div class="form-group" style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-top: 8px;">
                    <div><label>HR (BPM)</label><input type="number" id="new-patient-hr" placeholder="75"></div>
                    <div><label>BP (mmHg)</label><input type="text" id="new-patient-bp" placeholder="120/80"></div>
                    <div><label>SpO2 (%)</label><input type="number" id="new-patient-spo2" placeholder="98"></div>
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
        const hr = document.getElementById('new-patient-hr').value || 75;
        const bp = document.getElementById('new-patient-bp').value || '120/80';
        const spo2 = document.getElementById('new-patient-spo2').value || 98;
        
        if (!name || !age || !abha) return alert('Please fill all required fields');
        
        saveNewPatient({ name, age, abha, status, hr, bp, spo2 });
        modal.remove();
    });
}

async function saveNewPatient(data) {
    try {
        const response = await fetch(`${API_BASE_URL}/patients`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${AUTH_TOKEN}`
            },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('Failed to save patient');
        switchView('patients');
    } catch (err) {
        alert(err.message);
    }
}

async function deletePatient(id) {
    if (confirm(`Are you sure you want to remove this patient?`)) {
        try {
            const response = await fetch(`${API_BASE_URL}/patients/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${AUTH_TOKEN}` }
            });
            if (!response.ok) throw new Error('Failed to delete patient');
            switchView('patients');
        } catch (err) {
            alert(err.message);
        }
    }
}

function initCardScanner() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal" style="width: 500px; padding: 0; overflow: hidden; background: #000; border: 1px solid #333;">
            <div class="scanner-header" style="padding: 20px; background: #111; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #333;">
                <span style="color: white; font-weight: 700;">Nexus Universal Scanner</span>
                <button class="btn-text" style="color: #94a3b8;" id="close-scanner">✕</button>
            </div>
            <div class="scanner-viewport" style="height: 400px; position: relative; display: flex; align-items: center; justify-content: center; background: #000;">
                <div id="reader" style="width: 100%; height: 100%;"></div>
                <p style="position: absolute; bottom: 10px; color: #fff; font-size: 0.9rem; font-weight: 500; z-index: 10; background: rgba(0,0,0,0.5); padding: 4px 12px; border-radius: 12px;">Align Patient QR Code within frame</p>
            </div>
            <div class="scanner-footer" style="padding: 30px; background: #111; text-align: center;">
                <div class="scanner-status" id="scanner-status" style="color: var(--primary); font-weight: 700; font-family: monospace;">[ CAMERA INITIALIZING... ]</div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    const html5QrcodeScanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: {width: 250, height: 250} }, false);
    
    document.getElementById('close-scanner').addEventListener('click', () => {
        html5QrcodeScanner.clear().catch(error => console.error("Failed to clear scanner", error));
        modal.remove();
    });

    html5QrcodeScanner.render(async (decodedText, decodedResult) => {
        html5QrcodeScanner.clear();
        document.getElementById('scanner-status').textContent = '[ DECRYPTING PATIENT ID... ]';
        document.getElementById('scanner-status').style.color = 'var(--success)';
        
        try {
            const response = await fetch(`${API_BASE_URL}/patients/${decodedText}`, {
                headers: { 'Authorization': `Bearer ${AUTH_TOKEN}` }
            });
            if (!response.ok) throw new Error('Patient not found');
            const patient = await response.json();
            modal.remove();
            showToast(`${patient.name} identified successfully!`);
            switchView('dashboard', patient);
        } catch (err) {
            document.getElementById('scanner-status').textContent = '[ INVALID QR CODE ]';
            document.getElementById('scanner-status').style.color = 'var(--danger)';
            setTimeout(() => { modal.remove(); alert("QR Code scanned, but patient could not be verified in the DB."); }, 2000);
        }
    }, (error) => {});
}

// --- VIEW: PATIENT APP ---
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
    if (!patient) patient = PATIENTS_LIST[0]; // fallback for admin preview
    container.innerHTML = `
        <div class="patient-app-grid" style="display: grid; grid-template-columns: 1fr 400px; gap: 40px; align-items: start;">
            <div class="main-controls">
                <div class="card" style="background: var(--bg-card);">
                    <h2 style="margin-bottom: 24px;">Data Governance</h2>
                    <p style="color: var(--text-muted); margin-bottom: 32px;">Manage who can access your healthcare records and link external providers.</p>
                    
                    <div class="governance-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                        <div class="link-card ${patient.linkedDocuments ? 'linked' : ''}" id="link-digilocker">
                            <div style="font-size: 2rem; margin-bottom: 12px;">🇮🇳</div>
                            <h4>DigiLocker</h4>
                            <p>${patient.linkedDocuments ? patient.linkedDocuments.length + ' Documents Linked' : 'Connect for Insurance & Certs'}</p>
                            <button class="btn-text" style="margin-top: 12px; font-weight: 700;">${patient.linkedDocuments ? 'Manage' : 'Connect Now'}</button>
                        </div>
                        <div class="link-card ${patient.bankAccounts ? 'linked' : ''}" id="link-bank">
                            <div style="font-size: 2rem; margin-bottom: 12px;">🏦</div>
                            <h4>Bank Accounts</h4>
                            <p>${patient.bankAccounts ? patient.bankAccounts.length + ' Accounts Connected' : 'Connect for Financial History'}</p>
                            <button class="btn-text" style="margin-top: 12px; font-weight: 700;">${patient.bankAccounts ? 'Manage' : 'Connect Now'}</button>
                        </div>
                    </div>

                    <div style="margin-top: 40px;">
                        <h4 style="margin-bottom: 16px;">Active Provider Consents</h4>
                        ${PATIENT_DATA.providers.map(p => `
                            <div style="display: flex; justify-content: space-between; align-items: center; padding: 16px; background: var(--bg-card-solid); border: 1px solid var(--border); border-radius: 12px; margin-bottom: 8px;">
                                <div style="display: flex; align-items: center; gap: 12px;">
                                    <div class="source-icon ${p.color}" style="width: 32px; height: 32px; font-size: 0.7rem;">${p.name[0]}</div>
                                    <div>
                                        <div style="font-weight: 600; font-size: 0.9rem;">${p.name}</div>
                                        <div style="font-size: 0.7rem; color: var(--text-muted);">Last sync: 2h ago</div>
                                    </div>
                                </div>
                                <label class="switch-ui"><input type="checkbox" checked><span></span></label>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>

            <div class="card health-card-display" style="padding: 0; background: none; border: none; box-shadow: none;">
                <h3 style="margin-bottom: 20px; text-align: center;">My Digital Health Card</h3>
                <div class="nexus-card">
                    <div class="card-top">
                        <div class="card-logo">
                            <div class="logo-icon" style="width: 30px; height: 30px;"></div>
                            <span>Nexus Health</span>
                        </div>
                        <div class="card-chip"></div>
                    </div>
                    <div class="card-middle">
                        <div class="patient-info">
                            <div class="name">${patient.name}</div>
                            <div class="abha">${patient.abha}</div>
                        </div>
                        <div class="qr-code" style="display: flex; justify-content: center; align-items: center; background: var(--bg-card-solid);">
                            <div id="patient-app-qr-container"></div>
                        </div>
                    </div>
                    <div class="card-bottom">
                        <div class="valid">BLOOD GROUP: ${patient.bloodGroup || 'B+'}</div>
                        <div class="issuer">ISSUED BY MoHFW INDIA</div>
                    </div>
                </div>
                <p style="text-align: center; color: var(--text-muted); font-size: 0.8rem; margin-top: 20px;">Show this card at any Nexus-enabled hospital for instant record sharing.</p>
            </div>
        </div>
    `;
    attachPatientAppEvents(patient);
}

function attachPatientAppEvents(patient) {
    document.getElementById('link-digilocker')?.addEventListener('click', () => simulateDigiLockerLinking());
    document.getElementById('link-bank')?.addEventListener('click', () => simulateBankLinking());
    
    // Generate QR Code
    setTimeout(() => {
        new QRCode(document.getElementById("patient-app-qr-container"), {
            text: patient.id.toString(),
            width: 52,
            height: 52,
            colorDark : "#000000",
            colorLight : "#ffffff",
            correctLevel : QRCode.CorrectLevel.H
        });
    }, 0);
}

function simulateDigiLockerLinking() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal" style="width: 450px; padding: 40px;">
            <div style="text-align: center; margin-bottom: 32px;">
                <div style="font-size: 3rem; margin-bottom: 16px;">🇮🇳</div>
                <h2>Connect DigiLocker</h2>
                <p style="color: var(--text-muted);">Fetching your verified government documents via ABHA</p>
            </div>
            <div class="form-group">
                <label>Aadhaar Number / ABHA ID</label>
                <input type="text" value="91-2204-1102-4421" disabled style="background: var(--tag-bg); color: var(--text-muted); border: 1px solid var(--border);">
            </div>
            <div class="form-group">
                <label>Enter OTP sent to +91 ******4210</label>
                <div style="display: flex; gap: 12px;">
                    <input type="text" maxlength="1" style="text-align: center; font-weight: 700; background: var(--input-bg); color: var(--text-main); border: 1px solid var(--border); border-radius: 8px; width: 40px; height: 50px;">
                    <input type="text" maxlength="1" style="text-align: center; font-weight: 700; background: var(--input-bg); color: var(--text-main); border: 1px solid var(--border); border-radius: 8px; width: 40px; height: 50px;">
                    <input type="text" maxlength="1" style="text-align: center; font-weight: 700; background: var(--input-bg); color: var(--text-main); border: 1px solid var(--border); border-radius: 8px; width: 40px; height: 50px;">
                    <input type="text" maxlength="1" style="text-align: center; font-weight: 700; background: var(--input-bg); color: var(--text-main); border: 1px solid var(--border); border-radius: 8px; width: 40px; height: 50px;">
                    <input type="text" maxlength="1" style="text-align: center; font-weight: 700; background: var(--input-bg); color: var(--text-main); border: 1px solid var(--border); border-radius: 8px; width: 40px; height: 50px;">
                    <input type="text" maxlength="1" style="text-align: center; font-weight: 700; background: var(--input-bg); color: var(--text-main); border: 1px solid var(--border); border-radius: 8px; width: 40px; height: 50px;">
                </div>
            </div>
            <button class="btn-primary" style="width: 100%; margin-top: 24px;" id="verify-dl-btn">Verify & Link</button>
            <button class="btn-text" style="width: 100%; margin-top: 12px;" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
        </div>
    `;
    document.body.appendChild(modal);
    modal.querySelector('#verify-dl-btn').addEventListener('click', () => {
        modal.querySelector('#verify-dl-btn').textContent = 'Fetching Documents...';
        setTimeout(() => {
            modal.remove();
            showToast('DigiLocker documents linked successfully!');
            switchView('patient-app');
        }, 1500);
    });
}

function simulateBankLinking() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal" style="width: 500px; padding: 40px;">
            <div style="text-align: center; margin-bottom: 32px;">
                <div style="font-size: 3rem; margin-bottom: 16px;">🏦</div>
                <h2>Link Bank Account</h2>
                <p style="color: var(--text-muted);">Select your bank and enter account details</p>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 24px;" id="bank-tiles">
                <div class="bank-tile" data-bank="HDFC BANK">HDFC BANK</div>
                <div class="bank-tile" data-bank="ICICI BANK">ICICI BANK</div>
                <div class="bank-tile" data-bank="SBI">SBI</div>
                <div class="bank-tile" data-bank="AXIS BANK">AXIS BANK</div>
            </div>

            <div id="bank-details-area" style="display: grid; gap: 16px; margin-bottom: 24px;">
                <div class="form-group">
                    <label>Account Holder Name</label>
                    <input type="text" id="acc-name" placeholder="As per bank records">
                </div>
                <div style="display: grid; grid-template-columns: 1.5fr 1fr; gap: 12px;">
                    <div class="form-group">
                        <label>Account Number</label>
                        <input type="text" id="acc-num" placeholder="XXXX XXXX XXXX">
                    </div>
                    <div class="form-group">
                        <label>IFSC Code</label>
                        <input type="text" id="acc-ifsc" placeholder="HDFC0001234">
                    </div>
                </div>
            </div>

            <p style="font-size: 0.75rem; color: var(--text-muted); line-height: 1.4; margin-bottom: 24px;">By clicking authorize, you agree to share your transaction history related to health services with Nexus Health for unified billing insights.</p>
            
            <button class="btn-primary" style="width: 100%;" id="confirm-bank-btn">Authorize via Secure Link</button>
            <button class="btn-text" style="width: 100%; margin-top: 12px;" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
        </div>
    `;
    document.body.appendChild(modal);

    let selectedBank = null;
    const tiles = modal.querySelectorAll('.bank-tile');
    tiles.forEach(tile => {
        tile.addEventListener('click', () => {
            tiles.forEach(t => {
                t.style.borderColor = 'var(--border)';
                t.style.background = 'none';
                t.style.color = 'var(--text-main)';
            });
            tile.style.borderColor = 'var(--primary)';
            tile.style.background = 'var(--primary-light)';
            tile.style.color = 'var(--primary-dark)';
            selectedBank = tile.dataset.bank;
        });
    });

    modal.querySelector('#confirm-bank-btn').addEventListener('click', () => {
        const name = modal.querySelector('#acc-name').value;
        const num = modal.querySelector('#acc-num').value;
        const ifsc = modal.querySelector('#acc-ifsc').value;

        if (!selectedBank) return alert('Please select a bank first');
        if (!name || !num || !ifsc) return alert('Please fill in all account details');

        const btn = modal.querySelector('#confirm-bank-btn');
        btn.textContent = 'Verifying with ' + selectedBank + '...';
        btn.disabled = true;

        setTimeout(() => {
            btn.textContent = 'Linking Account...';
            setTimeout(() => {
                modal.remove();
                showToast('Bank account linked successfully!');
                switchView('patient-app');
            }, 1500);
        }, 1500);
    });
}

function showToast(msg) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 100);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
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
        .data-table { width: 100%; border-collapse: separate; border-spacing: 0 8px; margin-top: 16px; }
        .data-table th { text-align: left; padding: 12px 24px; color: var(--text-muted); font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid var(--border); }
        .data-table td { padding: 16px 24px; background: var(--table-row-bg); color: var(--text-main); font-size: 0.95rem; border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); vertical-align: middle; }
        .data-table td:first-child { border-left: 1px solid var(--border); border-top-left-radius: 12px; border-bottom-left-radius: 12px; }
        .data-table td:last-child { border-right: 1px solid var(--border); border-top-right-radius: 12px; border-bottom-right-radius: 12px; }
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

// --- AI CHATBOT LOGIC ---
const aiChatToggle = document.getElementById('ai-chat-toggle');
const aiChatWindow = document.getElementById('ai-chat-window');
const aiChatClose = document.getElementById('ai-chat-close');
const aiChatInput = document.getElementById('ai-chat-input');
const aiChatSend = document.getElementById('ai-chat-send');
const aiChatMessages = document.getElementById('ai-chat-messages');

function toggleAiChat() {
    aiChatWindow.classList.toggle('hidden');
    if (!aiChatWindow.classList.contains('hidden')) {
        aiChatInput.focus();
    }
}

async function sendAiMessage() {
    const text = aiChatInput.value.trim();
    if (!text) return;

    // Add user message to UI
    addChatMessage(text, 'user');
    aiChatInput.value = '';

    // Show typing indicator
    const typingId = 'typing-' + Date.now();
    const typingDiv = document.createElement('div');
    typingDiv.id = typingId;
    typingDiv.className = 'message ai typing-indicator';
    typingDiv.textContent = 'Nexus AI is analyzing data...';
    aiChatMessages.appendChild(typingDiv);
    aiChatMessages.scrollTop = aiChatMessages.scrollHeight;

    try {
        const response = await fetch(`${API_BASE_URL}/chat`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${AUTH_TOKEN}`
            },
            body: JSON.stringify({ 
                message: text,
                patient_id: activePatient ? activePatient.id : null 
            })
        });

        const data = await response.json();
        document.getElementById(typingId).remove();
        
        if (response.ok) {
            addChatMessage(data.reply, 'ai');
        } else {
            addChatMessage('Error: ' + data.message, 'ai');
        }
    } catch (err) {
        document.getElementById(typingId).remove();
        addChatMessage('System error: Could not reach the AI clinical node.', 'ai');
    }
}

function addChatMessage(text, sender) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${sender}`;
    msgDiv.innerHTML = text.replace(/\n/g, '<br>');
    aiChatMessages.appendChild(msgDiv);
    aiChatMessages.scrollTop = aiChatMessages.scrollHeight;
}

aiChatToggle?.addEventListener('click', toggleAiChat);
aiChatClose?.addEventListener('click', toggleAiChat);
aiChatSend?.addEventListener('click', sendAiMessage);
aiChatInput?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendAiMessage();
});

// Update visibility of chat widget based on login status
function updateChatVisibility() {
    const chatWidget = document.getElementById('ai-chat-widget');
    if (currentUserRole && activePatient) {
        chatWidget?.classList.remove('hidden');
    } else {
        chatWidget?.classList.add('hidden');
    }
}

// Hook into switchView to update chat visibility
const originalSwitchView = window.switchView;
window.switchView = function(view, data) {
    if (originalSwitchView) originalSwitchView(view, data);
    updateChatVisibility();
};
