// ui.js — All DOM rendering. No data logic here.

const UI = {
    // Toast notifications
    toast(message, type = 'info', duration = 3000) {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <span class="toast-icon">${type === 'success' ? '✓' : type === 'error' ? '✕' : type === 'warning' ? '⚠' : 'ℹ'}</span>
            <span class="toast-msg">${message}</span>
        `;
        container.appendChild(toast);
        requestAnimationFrame(() => toast.classList.add('toast-show'));
        setTimeout(() => {
            toast.classList.remove('toast-show');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    },

    // Inline error messages
    showError(fieldId, message) {
        this.clearError(fieldId);
        const field = document.getElementById(fieldId);
        if (!field) return;
        field.classList.add('input-error');
        const err = document.createElement('span');
        err.className = 'field-error';
        err.id = `${fieldId}-error`;
        err.textContent = message;
        field.parentNode.insertBefore(err, field.nextSibling);
    },

    clearError(fieldId) {
        const field = document.getElementById(fieldId);
        if (field) field.classList.remove('input-error');
        const err = document.getElementById(`${fieldId}-error`);
        if (err) err.remove();
    },

    clearAllErrors() {
        ['subject-name', 'delivered', 'attended'].forEach(id => this.clearError(id));
    },

    // Semester progress bar
    updateSemProgress(progress, remainingDays) {
        const fill = document.getElementById('sem-fill');
        const percent = document.getElementById('sem-percent');
        const days = document.getElementById('sem-days-left');
        if (fill) fill.style.width = progress + '%';
        if (percent) percent.textContent = progress + '%';
        if (days) days.textContent = remainingDays + ' days until end of semester';
    },

    // Summary bar
    updateSummary(subjects, threshold) {
    const counts = subjects.reduce((acc, s) => {
        const status = Calculator.status(
            Calculator.percentage(s.attended, s.delivered), threshold
        );
        acc[status] = (acc[status] || 0) + 1;
        return acc;
    }, {});

    const totalEl = document.getElementById('total-subjects');
    const safeEl = document.getElementById('safe-count');
    const warningEl = document.getElementById('warning-count');
    const dangerEl = document.getElementById('danger-count');

    if (totalEl) totalEl.textContent = subjects.length;
    if (safeEl) safeEl.textContent = counts.safe || 0;
    if (warningEl) warningEl.textContent = counts.warning || 0;
    if (dangerEl) dangerEl.textContent = (counts.danger || 0) + (counts.debar || 0);

    const els = {
        bar: document.getElementById('summary-bar'),
        mlCard: document.getElementById('ml-global-card'),
        clearBtn: document.getElementById('clear-btn'),
        chartSection: document.getElementById('chart-section'),
        empty: document.getElementById('empty-state'),
        toolbar: document.getElementById('toolbar')
    };

    const isEmpty = subjects.length === 0;
    if (els.bar) els.bar.classList.toggle('hidden', isEmpty);
    if (els.mlCard) els.mlCard.classList.toggle('hidden', isEmpty);
    if (els.clearBtn) els.clearBtn.classList.toggle('hidden', isEmpty);
    if (els.chartSection) els.chartSection.classList.toggle('hidden', isEmpty);
    if (els.empty) els.empty.classList.toggle('hidden', !isEmpty);
    if (els.toolbar) els.toolbar.classList.toggle('hidden', isEmpty);
},

        
        

    // Single subject card
    buildCard(subject, threshold, remainingClasses) {
        const pct = Calculator.percentage(subject.attended, subject.delivered);
        const status = Calculator.status(pct, threshold);
        const skips = Calculator.safeSkips(subject.attended, subject.delivered, threshold);
        const needed = Calculator.classesNeeded(subject.attended, subject.delivered, threshold);
        const prediction = Calculator.predictEndSem(subject.attended, subject.delivered, remainingClasses);
        const alert = Calculator.smartAlert(subject.attended, subject.delivered, threshold);

        const statusLabels = { safe: 'Safe', warning: 'At Risk', danger: 'Danger', debar: 'Debar Risk' };
        const worstColor = parseFloat(prediction.worstCase) < threshold ? '#e53935' : '#1D9E75';
        const bestColor = parseFloat(prediction.bestCase) < threshold ? '#e53935' : '#1D9E75';

        return `
        <div class="subject-card ${status}" id="card-${subject.id}" data-id="${subject.id}">

            <div class="card-header">
                <div class="card-header-left">
                    <h3 class="subject-title" 
                        contenteditable="false"
                        data-original="${subject.name}"
                        id="title-${subject.id}"
                        onblur="App.saveInlineEdit(${subject.id})"
                        onkeydown="UI.handleTitleKey(event, ${subject.id})"
                    >${subject.name}</h3>
                    <span class="status-badge ${status}">${statusLabels[status]}</span>
                </div>
                <div class="card-actions">
                    <button class="edit-btn" onclick="UI.toggleInlineEdit(${subject.id})" id="edit-btn-${subject.id}">Edit</button>
                    <button class="delete-btn" onclick="App.deleteSubject(${subject.id})">✕</button>
                </div>
            </div>

            <!-- Inline edit panel -->
            <div class="inline-edit hidden" id="inline-edit-${subject.id}">
                <div class="inline-edit-row">
                    <div class="inline-field">
                        <label>Classes Delivered</label>
                        <input type="number" id="edit-delivered-${subject.id}" value="${subject.delivered}" min="0">
                    </div>
                    <div class="inline-field">
                        <label>Classes Attended</label>
                        <input type="number" id="edit-attended-${subject.id}" value="${subject.attended}" min="0">
                    </div>
                    <div class="inline-actions">
                        <button class="save-inline-btn" onclick="App.saveInlineEdit(${subject.id})">Save</button>
                        <button class="cancel-inline-btn" onclick="UI.cancelInlineEdit(${subject.id})">Cancel</button>
                    </div>
                </div>
            </div>

            <!-- Smart alert -->
            <div class="smart-alert alert-${alert.type}">
                <span class="alert-dot"></span>
                ${alert.message}
            </div>

            <!-- Percentage display -->
            <div class="percentage-row">
                <div class="percentage ${status}-text">${pct}%</div>
                <div class="attended-label">
                    <span class="inline-stat" 
                        contenteditable="false"
                        id="attended-display-${subject.id}"
                    >${subject.attended}</span>
                    <span> / </span>
                    <span class="inline-stat"
                        contenteditable="false"  
                        id="delivered-display-${subject.id}"
                    >${subject.delivered}</span>
                    <span> classes</span>
                </div>
            </div>

            <!-- Progress bar -->
            <div class="attendance-bar">
                <div class="bar-fill ${status}" style="width: ${Math.min(pct, 100)}%"></div>
                <div class="bar-marker" style="left: ${threshold}%">
                    <div class="bar-marker-line"></div>
                    <div class="bar-marker-label">${threshold}%</div>
                </div>
            </div>

            <!-- Stats -->
            <div class="card-stats">
                <div class="stat">
                    <span class="${skips > 5 ? 'safe' : skips > 0 ? 'warning' : 'danger'}-text">${skips}</span>
                    <label>Can miss</label>
                </div>
                <div class="stat">
                    <span class="${needed === 0 ? 'safe' : 'danger'}-text">${needed === 0 ? '✓' : needed}</span>
                    <label>${needed === 0 ? 'On track' : 'Need to attend'}</label>
                </div>
                <div class="stat">
                    <span style="color:${bestColor}">${prediction.bestCase}%</span>
                    <label>Best case</label>
                </div>
                <div class="stat">
                    <span style="color:${worstColor}">${prediction.worstCase}%</span>
                    <label>Worst case</label>
                </div>
            </div>

            <!-- Skip/Attend simulator -->
            <div class="sim-row">
                <div class="sim-group">
                    <label>Skip next</label>
                    <input type="number" min="0" max="50" value="0"
                        id="skip-sim-${subject.id}"
                        oninput="UI.updateSkipSim(${subject.id}, ${subject.attended}, ${subject.delivered})"
                        placeholder="0">
                    <label>classes →</label>
                    <span class="sim-result" id="skip-result-${subject.id}">—</span>
                </div>
                <div class="sim-group">
                    <label>Attend next</label>
                    <input type="number" min="0" max="50" value="0"
                        id="attend-sim-${subject.id}"
                        oninput="UI.updateAttendSim(${subject.id}, ${subject.attended}, ${subject.delivered})"
                        placeholder="0">
                    <label>classes →</label>
                    <span class="sim-result" id="attend-result-${subject.id}">—</span>
                </div>
            </div>

            <!-- Leave simulator -->
            <div class="leave-simulator">
                <div class="leave-header">
                    <span class="leave-title">Leave Simulator</span>
                    <div class="pill-toggle">
                        <button class="pill active" id="pill-fullday-${subject.id}"
                            onclick="UI.switchLeaveType(${subject.id}, 'fullday')">Full Day DL</button>
                        <button class="pill" id="pill-partial-${subject.id}"
                            onclick="UI.switchLeaveType(${subject.id}, 'partial')">Partial DL</button>
                        <button class="pill" id="pill-ml-${subject.id}"
                            onclick="UI.switchLeaveType(${subject.id}, 'ml')">ML</button>
                    </div>
                </div>

                <div id="leave-fullday-${subject.id}" class="leave-panel">
                    <label>Classes held that day</label>
                    <input type="number" min="0" max="10" value="0"
                        id="dl-classes-${subject.id}"
                        oninput="UI.updateLeave(${subject.id})">
                </div>

                <div id="leave-partial-${subject.id}" class="leave-panel hidden">
                    <label class="checkbox-label">
                        <input type="checkbox" id="dl-partial-check-${subject.id}"
                            onchange="UI.updateLeave(${subject.id})">
                        <span>I have a class during the event time</span>
                    </label>
                </div>

                <div id="leave-ml-${subject.id}" class="leave-panel hidden">
                    <p class="ml-note">Medical Leave adds 5 classes to both attended and delivered for this subject</p>
                </div>

                <div class="leave-result" id="leave-result-${subject.id}">
                    Select leave type and enter details
                </div>
            </div>

        </div>`;
    },

    // Pill toggle for leave type
    switchLeaveType(id, type) {
        ['fullday', 'partial', 'ml'].forEach(t => {
            const pill = document.getElementById(`pill-${t}-${id}`);
            const panel = document.getElementById(`leave-${t}-${id}`);
            if (pill) pill.classList.toggle('active', t === type);
            if (panel) panel.classList.toggle('hidden', t !== type);
        });
        this.updateLeave(id);
    },

    updateLeave(id) {
        const subject = App.subjects.find(s => s.id === id);
        if (!subject) return;

        const activePill = document.querySelector(`#pill-fullday-${id}.active, #pill-partial-${id}.active, #pill-ml-${id}.active`);
        if (!activePill) return;
        const type = activePill.id.includes('fullday') ? 'fullday' : activePill.id.includes('partial') ? 'partial' : 'ml';

        let result;
        if (type === 'fullday') {
            const classes = parseInt(document.getElementById(`dl-classes-${id}`)?.value) || 0;
            result = Calculator.applyFullDayDL(subject.attended, subject.delivered, classes);
        } else if (type === 'partial') {
            const hasClass = document.getElementById(`dl-partial-check-${id}`)?.checked || false;
            result = Calculator.applyPartialDL(subject.attended, subject.delivered, hasClass);
        } else {
            result = Calculator.applyML(subject.attended, subject.delivered);
        }

        const status = Calculator.status(result.percentage, Settings.threshold);
        const colors = { safe: '#1D9E75', warning: '#BA7517', danger: '#e53935', debar: '#7f0000' };
        const color = colors[status];
        const resultDiv = document.getElementById(`leave-result-${id}`);
        if (resultDiv) {
            resultDiv.innerHTML = `After leave: <strong style="color:${color}">${result.percentage}%</strong> (${result.attended}/${result.delivered} classes)`;
        }
    },

    updateSkipSim(id, attended, delivered) {
        const val = parseInt(document.getElementById(`skip-sim-${id}`)?.value) || 0;
        const newPct = Calculator.simulateSkip(attended, delivered, val);
        const status = Calculator.status(newPct, Settings.threshold);
        const colors = { safe: '#1D9E75', warning: '#BA7517', danger: '#e53935', debar: '#7f0000' };
        const el = document.getElementById(`skip-result-${id}`);
        if (el) el.innerHTML = `<span style="color:${colors[status]}">${newPct}%</span>`;
    },

    updateAttendSim(id, attended, delivered) {
        const val = parseInt(document.getElementById(`attend-sim-${id}`)?.value) || 0;
        const newPct = Calculator.simulateAttend(attended, delivered, val);
        const status = Calculator.status(newPct, Settings.threshold);
        const colors = { safe: '#1D9E75', warning: '#BA7517', danger: '#e53935', debar: '#7f0000' };
        const el = document.getElementById(`attend-result-${id}`);
        if (el) el.innerHTML = `<span style="color:${colors[status]}">${newPct}%</span>`;
    },

    toggleInlineEdit(id) {
        const panel = document.getElementById(`inline-edit-${id}`);
        const btn = document.getElementById(`edit-btn-${id}`);
        const isOpen = !panel.classList.contains('hidden');
        if (isOpen) {
            panel.classList.add('hidden');
            btn.textContent = 'Edit';
        } else {
            panel.classList.remove('hidden');
            btn.textContent = 'Cancel';
            document.getElementById(`edit-delivered-${id}`)?.focus();
        }
    },

    cancelInlineEdit(id) {
        const panel = document.getElementById(`inline-edit-${id}`);
        const btn = document.getElementById(`edit-btn-${id}`);
        if (panel) panel.classList.add('hidden');
        if (btn) btn.textContent = 'Edit';
    },

    handleTitleKey(event, id) {
        if (event.key === 'Enter') {
            event.preventDefault();
            document.getElementById(`title-${id}`)?.blur();
        }
        if (event.key === 'Escape') {
            const el = document.getElementById(`title-${id}`);
            if (el) el.textContent = el.dataset.original;
            el?.blur();
        }
    }
};