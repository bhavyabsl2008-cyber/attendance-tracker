// ui.js — All DOM rendering. No data logic here.

const UI = {

    // ─── TOAST ───
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

    // ─── CUSTOM CONFIRM MODAL ───
    // FIX: replaces all native confirm() calls — non-blocking, styleable, mobile-friendly
    confirm(title, body, onConfirm) {
        // Remove any existing modal
        document.getElementById('ui-modal')?.remove();

        const modal = document.createElement('div');
        modal.id = 'ui-modal';
        modal.className = 'ui-modal-overlay';
        modal.innerHTML = `
            <div class="ui-modal-box" role="dialog" aria-modal="true">
                <div class="ui-modal-title">${title}</div>
                <div class="ui-modal-body">${body.replace(/\n/g, '<br>')}</div>
                <div class="ui-modal-actions">
                    <button class="ui-modal-cancel" id="modal-cancel">Cancel</button>
                    <button class="ui-modal-confirm" id="modal-confirm">Confirm</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        requestAnimationFrame(() => modal.classList.add('ui-modal-show'));

        const close = () => {
            modal.classList.remove('ui-modal-show');
            setTimeout(() => modal.remove(), 200);
        };

        document.getElementById('modal-cancel').addEventListener('click', close);
        document.getElementById('modal-confirm').addEventListener('click', () => {
            close();
            onConfirm();
        });

        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) close();
        });

        // Keyboard support
        const handleKey = (e) => {
            if (e.key === 'Escape') { close(); document.removeEventListener('keydown', handleKey); }
            if (e.key === 'Enter') { close(); onConfirm(); document.removeEventListener('keydown', handleKey); }
        };
        document.addEventListener('keydown', handleKey);
    },

    // ─── TOOLBAR "MORE" MENU ───
    _moreMenuListenerBound: false,

    toggleMoreMenu(force) {
        const menu = document.getElementById('toolbar-more-menu');
        if (!menu) return;
        const show = force !== undefined ? force : menu.classList.contains('hidden');
        menu.classList.toggle('hidden', !show);
        this._bindMoreMenuGlobalListener();
    },

    // Bound exactly once, ever — checks current menu state fresh on every
    // click/keypress instead of the old pattern of adding a new listener per
    // open and only cleaning it up on an outside click, which leaked a
    // listener every time someone closed the menu by picking an item instead.
    _bindMoreMenuGlobalListener() {
        if (this._moreMenuListenerBound) return;
        this._moreMenuListenerBound = true;

        document.addEventListener('click', (e) => {
            const menu = document.getElementById('toolbar-more-menu');
            if (!menu || menu.classList.contains('hidden')) return;
            if (!menu.contains(e.target) && !e.target.closest('.toolbar-more-trigger')) {
                menu.classList.add('hidden');
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key !== 'Escape') return;
            const menu = document.getElementById('toolbar-more-menu');
            if (menu) menu.classList.add('hidden');
        });
    },

    // ─── TIME RANGE PICKER (real <input type=time>, replaces prompt()) ───
    promptTimeRange(title, onConfirm) {
        document.getElementById('ui-modal')?.remove();

        const modal = document.createElement('div');
        modal.id = 'ui-modal';
        modal.className = 'ui-modal-overlay';
        modal.innerHTML = `
            <div class="ui-modal-box" role="dialog" aria-modal="true">
                <div class="ui-modal-title">${title}</div>
                <div class="ui-modal-body">
                    <div class="time-range-row">
                        <label class="time-range-field">
                            <span>Start</span>
                            <input type="time" id="tr-start" class="time-range-input">
                        </label>
                        <label class="time-range-field">
                            <span>End</span>
                            <input type="time" id="tr-end" class="time-range-input">
                        </label>
                    </div>
                </div>
                <div class="ui-modal-actions">
                    <button class="ui-modal-cancel" id="modal-cancel">Cancel</button>
                    <button class="ui-modal-confirm" id="modal-confirm">Apply</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        requestAnimationFrame(() => modal.classList.add('ui-modal-show'));
        document.getElementById('tr-start').focus();

        const close = () => {
            modal.classList.remove('ui-modal-show');
            setTimeout(() => modal.remove(), 200);
        };

        const submit = () => {
            const start = document.getElementById('tr-start').value;
            const end = document.getElementById('tr-end').value;
            if (!start || !end) {
                UI.toast('Pick both a start and end time', 'error');
                return;
            }
            close();
            onConfirm(start, end);
        };

        document.getElementById('modal-cancel').addEventListener('click', close);
        document.getElementById('modal-confirm').addEventListener('click', submit);
        modal.addEventListener('click', (e) => { if (e.target === modal) close(); });
    },

    // ─── INLINE ERRORS ───
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

    // ─── SEMESTER PROGRESS ───
    updateSemProgress(progress, remainingDays) {
        const fill = document.getElementById('sem-fill');
        const percent = document.getElementById('sem-percent');
        const days = document.getElementById('sem-days-left');
        if (fill) fill.style.width = progress + '%';
        if (percent) percent.textContent = progress + '%';
        if (days) days.textContent = remainingDays + ' days until end of semester';
    },

    // ─── THRESHOLD DISPLAY ───
    updateThresholdDisplay(threshold) {
        const el = document.getElementById('threshold-display');
        if (el) el.textContent = threshold + '%';
        const input = document.getElementById('threshold-input');
        if (input) input.value = threshold;
    },

    // ─── SUMMARY BAR ───
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

    // ─── SUBJECT CARD ───
    buildCard(subject, threshold, remainingClasses) {
        const pct = Calculator.percentage(subject.attended, subject.delivered);
        const status = Calculator.status(pct, threshold);
        const needed = Calculator.classesNeeded(subject.attended, subject.delivered, threshold);
        // Prefer the real, per-subject weekday-aware count when a timetable is set up;
        // fall back to the flat semester-wide heuristic otherwise.
        const subjectRemaining = Timetable.getRemainingClassesForAppSubject(subject.name);
        const effectiveRemaining = subjectRemaining !== null ? subjectRemaining : remainingClasses;
        const prediction = Calculator.predictEndSem(subject.attended, subject.delivered, effectiveRemaining);
        const alert = Calculator.smartAlert(subject.attended, subject.delivered, threshold, effectiveRemaining);

        // "Can miss" always answers the same question regardless of current percentage:
        // of the classes left this semester, how many can still be missed while still
        // reaching threshold by semester end. Using one formula everywhere — above AND
        // below threshold — instead of switching models at the 75% line, which used to
        // cause a jarring discontinuity (69% showing "can miss 20", then 75% showing "0").
        const recovery = Calculator.maxMissableToReachThreshold(subject.attended, subject.delivered, effectiveRemaining, threshold);

        const statusLabels = { safe: 'Safe', warning: 'At Risk', danger: 'Danger', debar: 'Debar Risk' };
        const worstColor = parseFloat(prediction.worstCase) < threshold ? '#e53935' : '#1D9E75';
        const bestColor = parseFloat(prediction.bestCase) < threshold ? '#e53935' : '#1D9E75';

        return `
        <div class="subject-card ${status}" id="card-${subject.id}" data-id="${subject.id}">

            <div class="card-header">
                <div class="card-header-left">
                    <h3 class="subject-title"
                        id="title-${subject.id}"
                        data-original="${subject.name}"
                    >${subject.name}</h3>
                    <span class="status-badge ${status}">${statusLabels[status]}</span>
                </div>
                <div class="card-actions">
                    <button class="edit-btn" onclick="UI.toggleInlineEdit('${subject.id}')" id="edit-btn-${subject.id}">Edit</button>
                    <button class="delete-btn" onclick="App.deleteSubject('${subject.id}')">✕</button>
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
                        <button class="save-inline-btn" onclick="App.saveInlineEdit('${subject.id}')">Save</button>
                        <button class="cancel-inline-btn" onclick="UI.cancelInlineEdit('${subject.id}')">Cancel</button>
                    </div>
                </div>
            </div>

            <!-- Quick Tap — fastest mobile update path -->
            <div class="quick-tap-row">
                <button class="quick-tap-btn attended-class"
                    data-action="attend"
                    onclick="App.quickTap('${subject.id}', 'attend')"
                    title="Attended a class — +1 both">
                    ✓ Attended class
                </button>
                <button class="quick-tap-btn missed-class"
                    data-action="miss"
                    onclick="App.quickTap('${subject.id}', 'miss')"
                    title="Missed a class — +1 delivered only">
                    ✕ Missed class
                </button>
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
                    <span>${subject.attended}</span>
                    <span> / </span>
                    <span>${subject.delivered}</span>
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
                    ${recovery.reachable ? `
                        <span class="${recovery.canMiss > 5 ? 'safe' : recovery.canMiss > 0 ? 'warning' : 'danger'}-text">${recovery.canMiss}</span>
                        <label>Can still miss</label>
                    ` : `
                        <span class="debar-text">—</span>
                        <label title="Even attending every remaining class only reaches ${recovery.bestPossiblePct}%">Not reachable</label>
                    `}
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
                        oninput="UI.updateSkipSim('${subject.id}', ${subject.attended}, ${subject.delivered})"
                        placeholder="0">
                    <label>classes →</label>
                    <span class="sim-result" id="skip-result-${subject.id}">—</span>
                </div>
                <div class="sim-group">
                    <label>Attend next</label>
                    <input type="number" min="0" max="50" value="0"
                        id="attend-sim-${subject.id}"
                        oninput="UI.updateAttendSim('${subject.id}', ${subject.attended}, ${subject.delivered})"
                        placeholder="0">
                    <label>classes →</label>
                    <span class="sim-result" id="attend-result-${subject.id}">—</span>
                </div>
            </div>

        </div>`;
    },

    // ─── SKIP/ATTEND SIMULATORS ───
    updateSkipSim(id, attended, delivered) {
        const val = parseInt(document.getElementById(`skip-sim-${id}`)?.value) || 0;
        const result = Calculator.simulateSkips(attended, delivered, val);
        const status = Calculator.status(result.percentage, Settings.threshold);
        const colors = { verysafe: '#10b981', safe: '#34d399', warning: '#fbbf24', danger: '#f87171', debar: '#fca5a5' };
        const el = document.getElementById(`skip-result-${id}`);
        if (el) {
            if (val === 0) {
                el.innerHTML = `<span style="color:var(--muted)">—</span>`;
            } else {
                el.innerHTML = `<span style="color:${colors[status]}">${result.percentage}%</span>`;
            }
        }
    },

    updateAttendSim(id, attended, delivered) {
        const val = parseInt(document.getElementById(`attend-sim-${id}`)?.value) || 0;
        const result = Calculator.simulateAttends(attended, delivered, val);
        const status = Calculator.status(result.percentage, Settings.threshold);
        const colors = { verysafe: '#10b981', safe: '#34d399', warning: '#fbbf24', danger: '#f87171', debar: '#fca5a5' };
        const el = document.getElementById(`attend-result-${id}`);
        if (el) {
            if (val === 0) {
                el.innerHTML = `<span style="color:var(--muted)">—</span>`;
            } else {
                el.innerHTML = `<span style="color:${colors[status]}">${result.percentage}%</span>`;
            }
        }
    },

    // ─── INLINE EDIT TOGGLE ───
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

    // FIX: removed broken contenteditable title handler.
    // Title editing via contenteditable was calling saveInlineEdit which only saves
    // delivered/attended inputs — the name change was silently dropped.
    // Title is now static text. Rename via the Edit panel if needed (future feature).
    handleTitleKey(event, id) {
        // Reserved for future name-edit feature
    }
};
