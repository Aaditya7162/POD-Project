export function initTimeline(container) {
    container.innerHTML = `
        <div class="view-header" style="margin-bottom: 32px;">
            <h1 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 8px;">Unified Medical Timeline</h1>
            <p style="color: var(--text-muted);">Longitudinal view of health history across all connected providers.</p>
        </div>
        <div class="card timeline-card">
            <div class="timeline">
                <div class="timeline-item">
                    <div class="timeline-date">APR 18, 2026</div>
                    <div class="timeline-content">
                        <div class="timeline-title">Laboratory: Quest Diagnostics</div>
                        <p>Lipid Panel, HbA1c, CMP. Results released.</p>
                    </div>
                </div>
                <div class="timeline-item">
                    <div class="timeline-date">APR 10, 2026</div>
                    <div class="timeline-content">
                        <div class="timeline-title">Consultation: St. Jude Cardiology</div>
                        <p>Stable CAD, continued management. ECG normal.</p>
                    </div>
                </div>
                <div class="timeline-item emergency">
                    <div class="timeline-date">JAN 12, 2026</div>
                    <div class="timeline-content">
                        <div class="timeline-title">Emergency Department: Cleveland Clinic</div>
                        <p>Presented with chest pain. Ruled out MI. Deployed <strong>Break-the-Glass</strong> protocol.</p>
                    </div>
                </div>
            </div>
        </div>
    `;
    renderTimelineStyles();
}

function renderTimelineStyles() {
    if (document.getElementById('timeline-styles')) return;
    const styleSheet = document.createElement('style');
    styleSheet.id = 'timeline-styles';
    styleSheet.textContent = `
        .timeline {
            position: relative;
            padding-left: 32px;
            border-left: 2px solid var(--border);
            margin: 20px 0;
        }
        .timeline-item {
            position: relative;
            margin-bottom: 40px;
        }
        .timeline-item::after {
            content: '';
            position: absolute;
            left: -37px;
            top: 0;
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: var(--border);
            border: 2px solid white;
        }
        .timeline-item.emergency::after {
            background: var(--danger);
        }
        .timeline-date {
            font-size: 0.75rem;
            font-weight: 700;
            color: var(--text-muted);
            margin-bottom: 4px;
        }
        .timeline-title {
            font-weight: 700;
            font-size: 1rem;
            margin-bottom: 4px;
        }
        .timeline-content p {
            font-size: 0.9rem;
            color: var(--text-muted);
        }
    `;
    document.head.appendChild(styleSheet);
}
