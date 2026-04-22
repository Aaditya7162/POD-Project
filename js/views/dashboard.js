export function initDashboard(container) {
    container.innerHTML = `
        <div class="dashboard-grid">
            <div class="main-column">
                <!-- Patient Summary Card -->
                <div class="card patient-hero">
                    <div style="display: flex; gap: 24px; align-items: flex-start;">
                        <div class="patient-avatar-large">JW</div>
                        <div style="flex-grow: 1;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                                <h1 style="font-size: 1.75rem; font-weight: 700;">James Wilson</h1>
                                <span class="badge badge-success">Active Record</span>
                            </div>
                            <p style="color: var(--text-muted); margin-bottom: 16px;">
                                DOB: Oct 12, 1955 (68 yrs) &bull; MRN: #482-991-002 &bull; Blood: O+
                            </p>
                            <div class="stats-row" style="display: flex; gap: 32px;">
                                <div>
                                    <label style="font-size: 0.75rem; color: var(--text-muted); display: block;">Height</label>
                                    <span style="font-weight: 600;">178 cm</span>
                                </div>
                                <div>
                                    <label style="font-size: 0.75rem; color: var(--text-muted); display: block;">Weight</label>
                                    <span style="font-weight: 600;">84 kg</span>
                                </div>
                                <div>
                                    <label style="font-size: 0.75rem; color: var(--text-muted); display: block;">BMI</label>
                                    <span style="font-weight: 600;">26.5 (Overweight)</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Unified Conditions & Meds -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
                    <div class="card">
                        <h3 style="margin-bottom: 16px; display: flex; align-items: center; gap: 8px;">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>
                            Active Conditions
                        </h3>
                        <ul class="tag-list" style="list-style: none;">
                            <li class="tag">Type 2 Diabetes (E11.9)</li>
                            <li class="tag">Hypertension (I10)</li>
                            <li class="tag">Hyperlipidemia (E78.5)</li>
                        </ul>
                    </div>
                    <div class="card">
                        <h3 style="margin-bottom: 16px; display: flex; align-items: center; gap: 8px;">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="7" cy="7" r="5"></circle><circle cx="17" cy="17" r="5"></circle><path d="M12 17h.01"></path><path d="M12 7h.01"></path><path d="M2 12h20"></path></svg>
                            Current Medications
                        </h3>
                        <div class="medication-item">
                            <span style="font-weight: 600;">Metformin</span>
                            <span style="font-size: 0.8rem; color: var(--text-muted);">500mg BID</span>
                        </div>
                        <div class="medication-item">
                            <span style="font-weight: 600;">Lisinopril</span>
                            <span style="font-size: 0.8rem; color: var(--text-muted);">10mg QD</span>
                        </div>
                    </div>
                </div>

                <!-- Recent Health Activity -->
                <div class="card">
                    <div class="section-header">
                        <h3>Recent Activity</h3>
                        <div style="display: flex; gap: 12px;">
                            <button id="order-lab-btn" class="btn-primary" style="background: #f1f5f9; color: var(--primary);">+ Order Lab Test</button>
                            <button class="btn-text">View All</button>
                        </div>
                    </div>
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Type</th>
                                <th>Provider</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Apr 18, 2026</td>
                                <td>Lab Results (HbA1c)</td>
                                <td>Quest Diagnostics</td>
                                <td><span class="status-pill status-success">Released</span></td>
                            </tr>
                            <tr>
                                <td>Apr 10, 2026</td>
                                <td>Cardiology Consult</td>
                                <td>St. Jude Clinic</td>
                                <td><span class="status-pill status-neutral">Completed</span></td>
                            </tr>
                            <tr>
                                <td>Mar 24, 2026</td>
                                <td>Prescription Refill</td>
                                <td>CVS Health</td>
                                <td><span class="status-pill status-neutral">Processed</span></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="side-column">
                <!-- Data Aggregation Sources -->
                <div class="card">
                    <h3 style="margin-bottom: 16px; font-size: 1rem;">Aggregated Sources</h3>
                    <div class="source-item">
                        <div class="source-icon epic">E</div>
                        <div>
                            <div style="font-weight: 600; font-size: 0.9rem;">Cleveland Clinic</div>
                            <div style="font-size: 0.75rem; color: var(--text-muted);">Last sync: 2h ago</div>
                        </div>
                        <div class="sync-status"></div>
                    </div>
                    <div class="source-item">
                        <div class="source-icon apple">A</div>
                        <div>
                            <div style="font-weight: 600; font-size: 0.9rem;">Apple Health</div>
                            <div style="font-size: 0.75rem; color: var(--text-muted);">Last sync: 15m ago</div>
                        </div>
                        <div class="sync-status"></div>
                    </div>
                    <div class="source-item">
                        <div class="source-icon kaiser">K</div>
                        <div>
                            <div style="font-weight: 600; font-size: 0.9rem;">Kaiser Permanente</div>
                            <div style="font-size: 0.75rem; color: var(--text-muted);">Last sync: Apr 20</div>
                        </div>
                        <div class="sync-status"></div>
                    </div>
                </div>

                <!-- AI Insight Card -->
                <div class="card ai-card">
                    <div class="ai-badge">AI INSIGHT</div>
                    <p style="font-size: 0.9rem; line-height: 1.5; margin-bottom: 12px;">
                        HbA1c levels show a upward trend (7.2% up from 6.8% in Jan). Consider nutritional consult.
                    </p>
                    <button class="btn-outline-white">Schedule Follow-up</button>
                </div>
            </div>
        </div>
    `;

    // Add styles for this view if not in main.css
    renderDashboardStyles();
    attachDashboardEvents();
}

function attachDashboardEvents() {
    const orderBtn = document.getElementById('order-lab-btn');
    
    orderBtn.addEventListener('click', () => {
        showDuplicateAlert('HbA1c');
    });

    const medications = document.querySelectorAll('.medication-item');
    medications.forEach(med => {
        med.addEventListener('mouseenter', () => {
            if (med.textContent.includes('Metformin')) {
                showDrugAlert('Metformin', 'Patient has history of chronic kidney disease (hypothetical). Risk of lactic acidosis.');
            }
        });
    });
}

function showDuplicateAlert(testName) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal" style="border-top: 8px solid var(--warning);">
            <div style="display: flex; gap: 16px; margin-bottom: 20px;">
                <div style="background: #fffbeb; color: #b45309; padding: 12px; border-radius: 50%;">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                </div>
                <div>
                    <h2 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 4px;">Potential Duplicate Test Detected</h2>
                    <p style="color: var(--text-muted); font-size: 0.9rem;">An HbA1c test was performed 3 days ago at Quest Diagnostics.</p>
                </div>
            </div>
            
            <div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="font-size: 0.8rem; font-weight: 600;">Previous Result:</span>
                    <span style="font-size: 0.8rem; color: var(--danger); font-weight: 700;">7.2% (High)</span>
                </div>
                <div style="font-size: 0.75rem; color: var(--text-muted);">Released: Apr 18, 2026 &bull; Verified by Dr. Miller</div>
            </div>

            <div style="display: flex; justify-content: flex-end; gap: 12px;">
                <button class="btn-cancel" style="padding: 10px; border: none; background: transparent; cursor: pointer; font-weight: 600;">View Previous Result</button>
                <div style="display: flex; gap: 8px;">
                    <button class="btn-cancel-action" style="padding: 10px 20px; border: 1px solid var(--border); border-radius: 8px; background: white; cursor: pointer; font-weight: 600;">Cancel Order</button>
                    <button class="btn-primary" id="proceed-anyway" style="background: var(--warning); color: #000;">Proceed Anyway</button>
                </div>
            </div>
            <div style="margin-top: 16px; font-size: 0.7rem; color: var(--text-muted); text-align: center;">
                Estimated cost savings if avoided: <strong>$84.50</strong>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    modal.querySelector('.btn-cancel-action').addEventListener('click', () => modal.remove());
    modal.querySelector('#proceed-anyway').addEventListener('click', () => {
        modal.remove();
        alert('Order placed. Rationale logged: "Frequent monitoring required due to titration".');
    });
}

function showDrugAlert(name, message) {
    if (document.getElementById('drug-toast')) return;
    const toast = document.createElement('div');
    toast.id = 'drug-toast';
    toast.className = 'toast-drug-alert view-animate';
    toast.innerHTML = `
        <div style="display: flex; gap: 12px; align-items: flex-start;">
            <div class="alert-icon">!</div>
            <div>
                <div style="font-weight: 700; font-size: 0.9rem;">Clinical Guardrail: ${name}</div>
                <div style="font-size: 0.8rem; opacity: 0.9;">${message}</div>
            </div>
        </div>
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 5000);
}

function renderDashboardStyles() {
    if (document.getElementById('dashboard-styles')) return;
    const styleSheet = document.createElement('style');
    styleSheet.id = 'dashboard-styles';
    styleSheet.textContent = `
        .patient-hero {
            border-left: 6px solid var(--primary);
        }
        .patient-avatar-large {
            width: 80px;
            height: 80px;
            background: var(--primary);
            color: white;
            border-radius: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 2rem;
            font-weight: 700;
        }
        .badge {
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.75rem;
            font-weight: 600;
        }
        .badge-success { background: #d1fae5; color: #065f46; }
        .tag {
            background: #f1f5f9;
            padding: 6px 12px;
            border-radius: 6px;
            margin-bottom: 8px;
            font-size: 0.85rem;
            border-left: 3px solid var(--primary);
        }
        .medication-item {
            padding: 10px 0;
            border-bottom: 1px solid var(--border);
            display: flex;
            flex-direction: column;
        }
        .medication-item:last-child { border-bottom: none; }
        .btn-text {
            background: none;
            border: none;
            color: var(--primary);
            font-weight: 600;
            cursor: pointer;
            font-size: 0.85rem;
        }
        .data-table {
            width: 100%;
            border-collapse: collapse;
        }
        .data-table th {
            text-align: left;
            padding: 12px 0;
            color: var(--text-muted);
            font-size: 0.8rem;
            text-transform: uppercase;
            border-bottom: 1px solid var(--border);
        }
        .data-table td {
            padding: 16px 0;
            border-bottom: 1px solid #f8fafc;
            font-size: 0.9rem;
        }
        .status-pill {
            padding: 4px 10px;
            border-radius: 12px;
            font-size: 0.7rem;
            font-weight: 700;
        }
        .status-success { background: #ecfdf5; color: #10b981; }
        .status-neutral { background: #f1f5f9; color: #64748b; }
        
        .source-item {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 16px;
        }
        .source-icon {
            width: 32px;
            height: 32px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: 800;
            font-size: 0.75rem;
        }
        .source-icon.epic { background: #ea3323; }
        .source-icon.apple { background: #000; }
        .source-icon.kaiser { background: #006fb1; }
        .sync-status {
            width: 8px;
            height: 8px;
            background: var(--success);
            border-radius: 50%;
            margin-left: auto;
        }
        .ai-card {
            background: linear-gradient(135deg, #0066ff 0%, #0044aa 100%);
            color: white;
            border: none;
        }
        .ai-badge {
            background: rgba(255, 255, 255, 0.2);
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 0.65rem;
            font-weight: 800;
            margin-bottom: 12px;
            display: inline-block;
        }
        .btn-outline-white {
            background: transparent;
            border: 1px solid white;
            color: white;
            padding: 8px 16px;
            border-radius: 8px;
            font-size: 0.8rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
        }
        .btn-outline-white:hover {
            background: white;
            color: var(--primary);
        }
        .toast-drug-alert {
            position: fixed;
            bottom: 32px;
            right: 32px;
            background: #1e293b;
            color: white;
            padding: 20px;
            border-radius: 12px;
            width: 380px;
            box-shadow: 0 20px 25px -5px rgba(0,0,0,0.2);
            border-left: 5px solid var(--danger);
            z-index: 1000;
        }
        .alert-icon {
            width: 24px;
            height: 24px;
            background: var(--danger);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 900;
            font-size: 0.75rem;
        }
    `;
    document.head.appendChild(styleSheet);
}
