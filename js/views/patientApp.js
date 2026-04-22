export function initPatientApp(container) {
    container.innerHTML = `
        <div class="view-header" style="margin-bottom: 32px;">
            <h1 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 8px;">Patient Control Center</h1>
            <p style="color: var(--text-muted);">Empowering patients with granular control over their health data and interoperability.</p>
        </div>

        <div class="mobile-simulation" style="display: flex; justify-content: center;">
            <div class="phone-frame">
                <div class="phone-screen">
                    <div class="phone-header">
                        <div class="flex-row">
                            <span style="font-weight: 800;">Nexus Control</span>
                            <div class="phone-avatar">JW</div>
                        </div>
                    </div>

                    <div class="phone-body">
                        <section>
                            <h4 class="phone-section-title">Data Permissions</h4>
                            <div class="permission-item">
                                <div>
                                    <div style="font-weight: 600; font-size: 0.9rem;">Cleveland Clinic</div>
                                    <div style="font-size: 0.75rem; color: var(--text-muted);">All records &bull; EHR-Access</div>
                                </div>
                                <label class="switch">
                                    <input type="checkbox" checked>
                                    <span class="slider round"></span>
                                </label>
                            </div>
                            <div class="permission-item">
                                <div>
                                    <div style="font-weight: 600; font-size: 0.9rem;">St. Jude Clinic</div>
                                    <div style="font-size: 0.75rem; color: var(--text-muted);">Clinical notes & Labs</div>
                                </div>
                                <label class="switch">
                                    <input type="checkbox" checked>
                                    <span class="slider round"></span>
                                </label>
                            </div>
                            <div class="permission-item">
                                <div>
                                    <div style="font-weight: 600; font-size: 0.9rem;">MyFitnessPal</div>
                                    <div style="font-size: 0.75rem; color: var(--text-muted);">Step count & calories</div>
                                </div>
                                <label class="switch">
                                    <input type="checkbox">
                                    <span class="slider round"></span>
                                </label>
                            </div>
                        </section>

                        <section style="margin-top: 24px;">
                            <h4 class="phone-section-title">Safety & Emergency</h4>
                            <div class="permission-item emergency-pref">
                                <div>
                                    <div style="font-weight: 600; font-size: 0.9rem;">Pre-authorize Emergency Access</div>
                                    <div style="font-size: 0.75rem; color: #475569;">Allow "Break-the-Glass" protocols</div>
                                </div>
                                <label class="switch">
                                    <input type="checkbox" checked>
                                    <span class="slider round"></span>
                                </label>
                            </div>
                        </section>

                        <section style="margin-top: 24px;">
                            <h4 class="phone-section-title">Recent Access Log</h4>
                            <div class="access-log">
                                <div class="log-entry">
                                    <div class="log-dot"></div>
                                    <div>
                                        <div style="font-weight: 600; font-size: 0.8rem;">Dr. Sarah Mitchell</div>
                                        <div style="font-size: 0.7rem; color: var(--text-muted);">Accessed Lab Results &bull; 10m ago</div>
                                    </div>
                                </div>
                                <div class="log-entry">
                                    <div class="log-dot"></div>
                                    <div>
                                        <div style="font-weight: 600; font-size: 0.8rem;">Quest Diagnostics</div>
                                        <div style="font-size: 0.7rem; color: var(--text-muted);">Uploaded Lipid Panel &bull; 2h ago</div>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    `;

    renderPatientAppStyles();
}

function renderPatientAppStyles() {
    if (document.getElementById('patient-app-styles')) return;
    const styleSheet = document.createElement('style');
    styleSheet.id = 'patient-app-styles';
    styleSheet.textContent = `
        .phone-frame {
            width: 320px;
            height: 640px;
            background: #111;
            border-radius: 40px;
            padding: 12px;
            box-shadow: 0 40px 100px -20px rgba(0,0,0,0.5);
            border: 4px solid #333;
        }
        .phone-screen {
            width: 100%;
            height: 100%;
            background: #fff;
            border-radius: 30px;
            overflow: hidden;
            display: flex;
            flex-direction: column;
        }
        .phone-header {
            padding: 24px 20px 12px;
            background: #fff;
        }
        .flex-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .phone-avatar {
            width: 32px;
            height: 32px;
            background: var(--primary);
            color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.75rem;
            font-weight: 700;
        }
        .phone-body {
            flex-grow: 1;
            padding: 20px;
            overflow-y: auto;
        }
        .phone-section-title {
            font-size: 0.65rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: var(--text-muted);
            margin-bottom: 12px;
        }
        .permission-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px;
            background: #f8fafc;
            border-radius: 12px;
            margin-bottom: 8px;
        }
        .emergency-pref {
            background: #fff1f2;
            border: 1px solid #fecdd3;
        }
        .access-log {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }
        .log-entry {
            display: flex;
            gap: 12px;
            align-items: flex-start;
        }
        .log-dot {
            width: 6px;
            height: 6px;
            background: var(--primary);
            border-radius: 50%;
            margin-top: 6px;
        }
        
        /* Switch Switch */
        .switch {
          position: relative;
          display: inline-block;
          width: 36px;
          height: 20px;
        }
        .switch input { opacity: 0; width: 0; height: 0; }
        .slider {
          position: absolute;
          cursor: pointer;
          top: 0; left: 0; right: 0; bottom: 0;
          background-color: #cbd5e1;
          transition: .4s;
        }
        .slider:before {
          position: absolute;
          content: "";
          height: 14px; width: 14px;
          left: 3px; bottom: 3px;
          background-color: white;
          transition: .4s;
        }
        input:checked + .slider { background-color: var(--primary); }
        input:checked + .slider:before { transform: translateX(16px); }
        .slider.round { border-radius: 20px; }
        .slider.round:before { border-radius: 50%; }
    `;
    document.head.appendChild(styleSheet);
}
