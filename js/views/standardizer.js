export function initStandardizer(container) {
    container.innerHTML = `
        <div class="view-header" style="margin-bottom: 32px;">
            <h1 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 8px;">Interoperable Data Standardizer</h1>
            <p style="color: var(--text-muted);">AI-powered ingestion and transformation of fragmented health data into FHIR-compliant structures.</p>
        </div>

        <div class="standardizer-layout" style="display: grid; grid-template-columns: 1fr 1fr; gap: 32px;">
            <!-- Left: Document Ingestion -->
            <div class="card">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                    <h3 style="font-size: 1rem;">Document Ingestion</h3>
                    <span class="badge" style="background: #e0f2fe; color: #0369a1;">OCR & NLP ACTIVE</span>
                </div>
                
                <div id="drop-zone" class="drop-zone" style="border: 2px dashed var(--border); border-radius: 12px; padding: 40px; text-align: center; cursor: pointer; transition: all 0.2s; margin-bottom: 24px;">
                    <div style="margin-bottom: 16px;">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="1.5" style="opacity: 0.5;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                    </div>
                    <p style="font-weight: 600; margin-bottom: 4px;">Upload Clinical Document</p>
                    <p style="font-size: 0.8rem; color: var(--text-muted);">PDF, DICOM, or Scanned Images</p>
                </div>

                <div class="file-list">
                    <div class="file-item" id="sample-file">
                        <div class="file-icon">PDF</div>
                        <div style="flex-grow: 1;">
                            <div style="font-weight: 600; font-size: 0.9rem;">lab_report_0421.pdf</div>
                            <div style="font-size: 0.75rem; color: var(--text-muted);">2.4 MB &bull; Radiology Report</div>
                        </div>
                        <button class="btn-process" id="process-btn">Transform</button>
                    </div>
                </div>
            </div>

            <!-- Right: Structured Output -->
            <div class="card" id="output-card" style="position: relative; opacity: 0.5;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                    <h3 style="font-size: 1rem;">Standardized FHIR Output</h3>
                    <div id="processing-indicator" class="hidden" style="display: flex; align-items: center; gap: 8px; font-size: 0.75rem; color: var(--primary); font-weight: 600;">
                        <div class="spinner"></div>
                        AI ANALYZING...
                    </div>
                </div>

                <div id="standardized-content">
                    <div class="empty-state" style="padding: 60px 0; text-align: center; color: var(--text-muted);">
                        <p>Standardized data will appear here after transformation.</p>
                    </div>
                </div>
            </div>
        </div>

        <div id="transformation-viz" class="card hidden" style="margin-top: 32px; border: 1px solid var(--primary);">
            <h3 style="margin-bottom: 16px;">AI Extraction Logic</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
                <div style="background: #f8fafc; padding: 16px; border-radius: 8px;">
                    <div style="font-size: 0.7rem; font-weight: 800; color: var(--text-muted); margin-bottom: 8px;">UNSTRUCTURED TEXT SNIPPET</div>
                    <code style="font-size: 0.8rem; line-height: 1.6; color: #475569;">
                        "Patient James Wilson presented with stable BP. Order for LIPID PANEL was sent to Quest.
                        Medication Refill: Metformin 500mg, BID."
                    </code>
                </div>
                <div style="background: #eff6ff; padding: 16px; border-radius: 8px;">
                    <div style="font-size: 0.7rem; font-weight: 800; color: var(--primary); margin-bottom: 8px;">FHIR RESOURCE (MedicationRequest)</div>
                    <pre style="font-size: 0.75rem; color: #1e40af;">{
  "resourceType": "MedicationRequest",
  "status": "active",
  "medicationCodeableConcept": {
    "coding": [{"system": "RxNorm", "code": "860975"}]
  },
  "dosageInstruction": [{"text": "500 mg twice daily"}]
}</pre>
                </div>
            </div>
        </div>
    `;

    renderStandardizerStyles();
    attachEvents();
}

function attachEvents() {
    const processBtn = document.getElementById('process-btn');
    const processingIndicator = document.getElementById('processing-indicator');
    const outputCard = document.getElementById('output-card');
    const standardizedContent = document.getElementById('standardized-content');
    const transformationViz = document.getElementById('transformation-viz');

    processBtn.addEventListener('click', () => {
        processBtn.disabled = true;
        processingIndicator.classList.remove('hidden');
        outputCard.style.opacity = '1';
        
        // Simulate processing
        setTimeout(() => {
            processingIndicator.classList.add('hidden');
            standardizedContent.innerHTML = `
                <div class="result-group">
                    <div class="result-header">Problems Extracted</div>
                    <div class="result-item"><span class="code">E11.9</span> Type 2 Diabetes</div>
                    <div class="result-item"><span class="code">I10</span> Essential Hypertension</div>
                </div>
                <div class="result-group">
                    <div class="result-header">Procedures Ordered</div>
                    <div class="result-item"><span class="code">80061</span> Lipid Panel</div>
                    <div class="result-item"><span class="code">83036</span> Hemoglobin A1c</div>
                </div>
                <div style="margin-top: 24px; padding: 12px; background: #ecfdf5; border-radius: 8px; font-size: 0.8rem; color: #065f46;">
                    <strong>AI Note:</strong> 2 medications successfully mapped to local formulary. Duplicate lab alert suppressed for 30 days.
                </div>
            `;
            transformationViz.classList.remove('hidden');
            processBtn.textContent = 'Standardized';
            processBtn.style.background = 'var(--success)';
        }, 1500);
    });
}

function renderStandardizerStyles() {
    if (document.getElementById('standardizer-styles')) return;
    const styleSheet = document.createElement('style');
    styleSheet.id = 'standardizer-styles';
    styleSheet.textContent = `
        .drop-zone:hover {
            border-color: var(--primary) !important;
            background: #eff6ff;
        }
        .file-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px;
            background: #f8fafc;
            border-radius: 8px;
            border: 1px solid var(--border);
        }
        .file-icon {
            width: 36px;
            height: 36px;
            background: #fee2e2;
            color: #b91c1c;
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.65rem;
            font-weight: 800;
        }
        .btn-process {
            background: var(--primary);
            color: white;
            border: none;
            padding: 6px 12px;
            border-radius: 6px;
            font-size: 0.8rem;
            font-weight: 600;
            cursor: pointer;
        }
        .spinner {
            width: 14px;
            height: 14px;
            border: 2px solid var(--primary);
            border-top-color: transparent;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        .result-group {
            margin-bottom: 20px;
        }
        .result-header {
            font-size: 0.7rem;
            font-weight: 800;
            color: var(--text-muted);
            text-transform: uppercase;
            margin-bottom: 8px;
            letter-spacing: 0.05em;
        }
        .result-item {
            padding: 8px 12px;
            background: #f1f5f9;
            border-radius: 6px;
            margin-bottom: 6px;
            font-size: 0.85rem;
            display: flex;
            gap: 12px;
        }
        .result-item .code {
            font-weight: 700;
            color: var(--primary);
            width: 50px;
        }
    `;
    document.head.appendChild(styleSheet);
}
