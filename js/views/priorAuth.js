export function initPriorAuth(container) {
    container.innerHTML = `
        <div class="view-header" style="margin-bottom: 32px;">
            <h1 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 8px;">Automated Prior Authorization</h1>
            <p style="color: var(--text-muted);">Real-time justification and submission portal for clinical procedures.</p>
        </div>

        <div class="auth-grid" style="display: grid; grid-template-columns: 2fr 1fr; gap: 24px;">
            <div class="card">
                <div class="section-header">
                    <h3>New Authorization Request</h3>
                    <span class="badge" style="background: #fdf2f8; color: #9d174d;">AUTO-FILL ACTIVE</span>
                </div>
                
                <form class="auth-form" id="auth-form">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px;">
                        <div class="form-group">
                            <label>Patient</label>
                            <input type="text" value="James Wilson" disabled>
                        </div>
                        <div class="form-group">
                            <label>Procedure Code (CPT)</label>
                            <input type="text" id="cpt-code" value="93306" placeholder="e.g. 93306">
                            <small>Echocardiography, transthoracic</small>
                        </div>
                    </div>

                    <div class="form-group" style="margin-bottom: 20px;">
                        <label>Diagnosis (ICD-10)</label>
                        <select id="icd-code" style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid var(--border);">
                            <option value="I25.10">I25.10 - ASHD of native coronary artery</option>
                            <option value="I10">I10 - Essential Hypertension</option>
                            <option value="E11.9">E11.9 - Type 2 Diabetes</option>
                        </select>
                    </div>

                    <div class="form-group" style="margin-bottom: 20px;">
                        <label>AI-Generated Clinical Justification</label>
                        <div style="background: #f8fafc; padding: 16px; border-radius: 8px; border: 1px solid var(--border);">
                            <p style="font-size: 0.9rem; font-style: italic; color: #475569;">
                                "Patient with history of Type 2 Diabetes (E11.9) and Hypertension (I10) presents with exertional dyspnea. Echocardiogram (93306) is indicated for evaluation of left ventricular function and valvular assessment as per ACC guidelines."
                            </p>
                        </div>
                    </div>

                    <button type="submit" class="btn-primary" style="width: 100%;">Submit with AI Justification</button>
                </form>
            </div>

            <div class="side-column">
                <div class="card">
                    <h3 style="margin-bottom: 16px;">Past Submissions</h3>
                    <div class="status-list">
                        <div class="status-card approved">
                            <div style="font-weight: 700; font-size: 0.85rem;">MRI Brain (70551)</div>
                            <div style="font-size: 0.75rem; color: var(--text-muted);">Anthem BCBS &bull; Mar 02</div>
                            <div class="status-tag">Approved</div>
                        </div>
                        <div class="status-card pending">
                            <div style="font-weight: 700; font-size: 0.85rem;">Lipid Panel (80061)</div>
                            <div style="font-size: 0.75rem; color: var(--text-muted);">Medicare &bull; Apr 18</div>
                            <div class="status-tag">Pending</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    renderPriorAuthStyles();

    document.getElementById('auth-form').addEventListener('submit', (e) => {
        e.preventDefault();
        alert('Prior authorization submitted successfully! Est. processing time: < 2 minutes.');
    });
}

function renderPriorAuthStyles() {
    if (document.getElementById('auth-styles')) return;
    const styleSheet = document.createElement('style');
    styleSheet.id = 'auth-styles';
    styleSheet.textContent = `
        .form-group label {
            display: block;
            font-size: 0.75rem;
            font-weight: 700;
            color: var(--text-muted);
            margin-bottom: 6px;
            text-transform: uppercase;
        }
        .form-group input {
            width: 100%;
            padding: 10px;
            border-radius: 8px;
            border: 1px solid var(--border);
            font-size: 0.9rem;
        }
        .status-card {
            padding: 12px;
            border-radius: 8px;
            border-left: 4px solid var(--border);
            background: #f8fafc;
            margin-bottom: 12px;
            position: relative;
        }
        .status-card.approved { border-left-color: var(--success); }
        .status-card.pending { border-left-color: var(--warning); }
        .status-tag {
            position: absolute;
            top: 12px;
            right: 12px;
            font-size: 0.65rem;
            font-weight: 800;
            text-transform: uppercase;
        }
        .approved .status-tag { color: var(--success); }
        .pending .status-tag { color: var(--warning); }
    `;
    document.head.appendChild(styleSheet);
}
