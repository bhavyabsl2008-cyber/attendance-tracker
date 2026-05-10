// timetable-ui.js — All timetable UI. Setup modal, week view, day editor.

const TimetableUI = {

    // ── SETUP MODAL ──
    // First time setup — pick batch and group
    showSetup(onComplete) {
        document.getElementById('tt-modal')?.remove();

        const modal = document.createElement('div');
        modal.id = 'tt-modal';
        modal.className = 'tt-modal-overlay';
        modal.innerHTML = `
            <div class="tt-modal-box">
                <div class="tt-modal-header">
                    <div class="tt-modal-title">Set Up Your Timetable</div>
                    <div class="tt-modal-sub">CSE-1 · Chitkara University</div>
                </div>

                <div class="tt-section-label">Your Batch</div>
                <div class="tt-batch-grid" id="tt-batch-grid">
                    ${Timetable.getBatchList().map(b => `
                        <button class="tt-batch-btn" data-batch="${b}">${b}</button>
                    `).join('')}
                </div>

                <div class="tt-section-label" style="margin-top:20px">Your Lab Group</div>
                <div class="tt-group-row">
                    <button class="tt-group-btn" data-group="A">
                        <span class="tt-group-label">Group A</span>
                        <span class="tt-group-sub">Lower roll numbers</span>
                    </button>
                    <button class="tt-group-btn" data-group="B">
                        <span class="tt-group-label">Group B</span>
                        <span class="tt-group-sub">Higher roll numbers</span>
                    </button>
                </div>

                <div class="tt-selection-preview" id="tt-preview" style="display:none">
                    <span id="tt-preview-text"></span>
                </div>

                <button class="tt-confirm-btn" id="tt-confirm-btn" disabled onclick="TimetableUI._confirmSetup()">
                    Load My Timetable →
                </button>
            </div>
        `;

        document.body.appendChild(modal);
        requestAnimationFrame(() => modal.classList.add('tt-modal-show'));

        this._setupState = { batch: null, group: null, onComplete };

        // Batch selection
        modal.querySelectorAll('.tt-batch-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                modal.querySelectorAll('.tt-batch-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this._setupState.batch = btn.dataset.batch;
                this._updateSetupPreview();
            });
        });

        // Group selection
        modal.querySelectorAll('.tt-group-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                modal.querySelectorAll('.tt-group-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this._setupState.group = btn.dataset.group;
                this._updateSetupPreview();
            });
        });
    },

    _updateSetupPreview() {
        const { batch, group } = this._setupState;
        const preview = document.getElementById('tt-preview');
        const previewText = document.getElementById('tt-preview-text');
        const confirmBtn = document.getElementById('tt-confirm-btn');

        if (batch && group) {
            preview.style.display = 'block';
            previewText.textContent = `${batch} · Group ${group}`;
            confirmBtn.disabled = false;
        } else {
            preview.style.display = 'none';
            confirmBtn.disabled = true;
        }
    },

    _confirmSetup() {
        const { batch, group, onComplete } = this._setupState;
        if (!batch || !group) return;

        Timetable.setup(batch, group);
        this._closeModal('tt-modal');
        if (onComplete) onComplete();
    },

    // ── WEEK VIEW MODAL ──
    showWeekView() {
        document.getElementById('tt-week-modal')?.remove();

        const week = Timetable.getWeek();
        const batch = Timetable.getBatch();
        const group = Timetable.getGroup();

        const modal = document.createElement('div');
        modal.id = 'tt-week-modal';
        modal.className = 'tt-modal-overlay';
        modal.innerHTML = `
            <div class="tt-modal-box tt-modal-wide">
                <div class="tt-modal-header">
                    <div>
                        <div class="tt-modal-title">Your Timetable</div>
                        <div class="tt-modal-sub">${batch} · Group ${group}</div>
                    </div>
                    <div style="display:flex;gap:8px;align-items:center">
                        <button class="tt-change-btn" onclick="TimetableUI._changeBatch()">Change Batch</button>
                        <button class="tt-close-btn" onclick="TimetableUI._closeModal('tt-week-modal')">✕</button>
                    </div>
                </div>

                <div class="tt-week-grid">
                    ${Timetable.DAYS.slice(0, 5).map(day => `
                        <div class="tt-day-col">
                            <div class="tt-day-header">
                                <span class="tt-day-name">${day.substring(0,3)}</span>
                                <button class="tt-edit-day-btn" onclick="TimetableUI.showDayEditor('${day}')" title="Edit ${day}">✎</button>
                            </div>
                            <div class="tt-day-slots" id="tt-slots-${day}">
                                ${this._renderDaySlots(week[day])}
                            </div>
                        </div>
                    `).join('')}
                </div>

                <div class="tt-week-footer">
                    <span class="tt-legend-item"><span class="tt-dot tt-dot-lab"></span>Lab (2 attendance)</span>
                    <span class="tt-legend-item"><span class="tt-dot tt-dot-group"></span>Group specific</span>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        requestAnimationFrame(() => modal.classList.add('tt-modal-show'));

        // Close on backdrop
        modal.addEventListener('click', e => {
            if (e.target === modal) this._closeModal('tt-week-modal');
        });
    },

    _renderDaySlots(entries) {
        if (!entries || entries.length === 0) {
            return '<div class="tt-slot-empty">Free</div>';
        }
        return entries.map(e => `
            <div class="tt-slot ${e.isLab ? 'tt-slot-lab' : ''} ${e.group ? 'tt-slot-group' : ''}">
                <span class="tt-slot-subject">${e.subject}</span>
                ${e.isLab ? '<span class="tt-slot-tag">Lab</span>' : ''}
                ${e.group ? `<span class="tt-slot-tag tt-slot-tag-group">Grp ${e.group}</span>` : ''}
                <span class="tt-slot-count">×${e.attendanceCount}</span>
            </div>
        `).join('');
    },

    _changeBatch() {
        this._closeModal('tt-week-modal');
        this.showSetup(() => this.showWeekView());
    },

    // ── DAY EDITOR ──
    // Lets student edit a single day if timetable changes
    showDayEditor(day) {
        document.getElementById('tt-day-modal')?.remove();

        const currentEntries = Timetable.getDay(day);
        const subjectCodes = Timetable.getSubjectCodes();
        const hasOverride = Timetable._config?.customOverrides?.[day] !== undefined;

        const modal = document.createElement('div');
        modal.id = 'tt-day-modal';
        modal.className = 'tt-modal-overlay';
        modal.innerHTML = `
            <div class="tt-modal-box">
                <div class="tt-modal-header">
                    <div>
                        <div class="tt-modal-title">Edit ${day}</div>
                        <div class="tt-modal-sub">Add or remove classes for this day</div>
                    </div>
                    <button class="tt-close-btn" onclick="TimetableUI._closeModal('tt-day-modal')">✕</button>
                </div>

                ${hasOverride ? `
                    <button class="tt-reset-btn" onclick="TimetableUI._resetDay('${day}')">
                        ↺ Reset to original timetable
                    </button>
                ` : ''}

                <div id="tt-day-entries">
                    ${currentEntries.map((e, i) => this._renderEntryRow(e, i, subjectCodes)).join('')}
                    <div class="tt-no-entries" id="tt-no-entries" style="${currentEntries.length > 0 ? 'display:none' : ''}">
                        No classes yet. Add one below.
                    </div>
                </div>

                <button class="tt-add-entry-btn" onclick="TimetableUI._addEntryRow('${day}')">
                    + Add class
                </button>

                <div class="tt-day-actions">
                    <button class="tt-cancel-btn" onclick="TimetableUI._closeModal('tt-day-modal')">Cancel</button>
                    <button class="tt-save-day-btn" onclick="TimetableUI._saveDay('${day}')">Save Changes</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        requestAnimationFrame(() => modal.classList.add('tt-modal-show'));
    },

    _renderEntryRow(entry, index, subjectCodes) {
        return `
            <div class="tt-entry-row" data-index="${index}">
                <select class="tt-select tt-select-subject">
                    ${subjectCodes.map(code => `
                        <option value="${code}" ${entry.subject === code ? 'selected' : ''}>${code} — ${Timetable.SUBJECTS[code]}</option>
                    `).join('')}
                </select>
                <select class="tt-select tt-select-count">
                    <option value="1" ${entry.attendanceCount === 1 ? 'selected' : ''}>×1 class</option>
                    <option value="2" ${entry.attendanceCount === 2 ? 'selected' : ''}>×2 classes (Lab)</option>
                </select>
                <select class="tt-select tt-select-group">
                    <option value="" ${!entry.group ? 'selected' : ''}>Everyone</option>
                    <option value="A" ${entry.group === 'A' ? 'selected' : ''}>Group A only</option>
                    <option value="B" ${entry.group === 'B' ? 'selected' : ''}>Group B only</option>
                </select>
                <button class="tt-remove-entry-btn" onclick="TimetableUI._removeEntryRow(this)">✕</button>
            </div>
        `;
    },

    _addEntryRow(day) {
        const container = document.getElementById('tt-day-entries');
        const noEntries = document.getElementById('tt-no-entries');
        if (noEntries) noEntries.style.display = 'none';

        const subjectCodes = Timetable.getSubjectCodes();
        const index = container.querySelectorAll('.tt-entry-row').length;
        const defaultEntry = { subject: 'CP', attendanceCount: 1, group: null };

        const div = document.createElement('div');
        div.innerHTML = this._renderEntryRow(defaultEntry, index, subjectCodes);
        container.appendChild(div.firstElementChild);
    },

    _removeEntryRow(btn) {
        btn.closest('.tt-entry-row').remove();
        const container = document.getElementById('tt-day-entries');
        const noEntries = document.getElementById('tt-no-entries');
        if (noEntries && container.querySelectorAll('.tt-entry-row').length === 0) {
            noEntries.style.display = 'block';
        }
    },

    _saveDay(day) {
        const rows = document.querySelectorAll('#tt-day-entries .tt-entry-row');
        const entries = [];

        rows.forEach(row => {
            const subject = row.querySelector('.tt-select-subject').value;
            const count = parseInt(row.querySelector('.tt-select-count').value);
            const group = row.querySelector('.tt-select-group').value || null;
            const isLab = count === 2;
            // Build fake slots array (just length matters for logic)
            const slots = count === 2 ? [1, 2] : [1];
            entries.push({ subject, slots, isLab, group });
        });

        Timetable.overrideDay(day, entries);

        // Refresh week view if open
        const weekSlots = document.getElementById(`tt-slots-${day}`);
        if (weekSlots) {
            weekSlots.innerHTML = this._renderDaySlots(Timetable.getDay(day));
        }

        this._closeModal('tt-day-modal');
        UI.toast(`${day} timetable updated`, 'success');
    },

    _resetDay(day) {
        Timetable.resetDay(day);
        this._closeModal('tt-day-modal');
        UI.toast(`${day} reset to original`, 'info');

        // Re-open day editor to show reset state
        setTimeout(() => this.showDayEditor(day), 200);
    },

    // ── DL DAY PICKER ──
    // Called from the leave simulator on a subject card
    // Returns HTML for the Full Day DL section when timetable is set up
    buildDLDayPicker(subjectId) {
        return `
            <div class="tt-dl-picker">
                <label class="tt-dl-label">Which day?</label>
                <div class="tt-day-pills" id="tt-day-pills-${subjectId}">
                    ${Timetable.DAYS.slice(0, 5).map(day => `
                        <button class="tt-day-pill"
                            data-day="${day}"
                            onclick="TimetableUI.selectDLDay('${subjectId}', '${day}', this)">
                            ${day.substring(0,3)}
                        </button>
                    `).join('')}
                </div>
                <div class="tt-dl-breakdown" id="tt-dl-breakdown-${subjectId}">
                    <span class="tt-dl-hint">Select a day to see impact</span>
                </div>
            </div>
        `;
    },

    selectDLDay(subjectId, day, btn) {
        // Highlight selected day
        btn.closest('.tt-day-pills').querySelectorAll('.tt-day-pill').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const breakdown = document.getElementById(`tt-dl-breakdown-${subjectId}`);
        const impact = Timetable.getDLImpact(day, App.subjects);

        if (impact.length === 0) {
            breakdown.innerHTML = `<span class="tt-dl-hint">No classes on ${day}</span>`;
            // Update leave result
            const resultDiv = document.getElementById(`leave-result-${subjectId}`);
            if (resultDiv) resultDiv.innerHTML = `No classes on ${day} — no attendance impact.`;
            return;
        }

        // Show breakdown of all subjects affected
        breakdown.innerHTML = impact.map(item => `
            <div class="tt-impact-row ${item.matched ? '' : 'tt-impact-unmatched'}">
                <span class="tt-impact-subject">${item.subjectName}</span>
                <span class="tt-impact-count">+${item.attendanceCount} class${item.attendanceCount > 1 ? 'es' : ''}</span>
            </div>
        `).join('');

        // Update leave result for THIS subject card
        const subject = App.subjects.find(s => s.id === subjectId);
        if (!subject) return;

        // Find how many classes this specific subject has on that day
        const subjectCode = impact.find(i => i.subjectId === subjectId);
        const classesForThisSubject = subjectCode?.attendanceCount || 0;

        const resultDiv = document.getElementById(`leave-result-${subjectId}`);
        if (!resultDiv) return;

        if (classesForThisSubject === 0) {
            resultDiv.innerHTML = `No <strong>${subject.name}</strong> on ${day} — no impact for this subject.`;
            return;
        }

        const result = Calculator.applyFullDayDL(subject.attended, subject.delivered, classesForThisSubject);
        const status = Calculator.status(result.percentage, Settings.threshold);
        const colors = { safe: '#34d399', warning: '#fbbf24', danger: '#f87171', debar: '#fca5a5' };
        resultDiv.innerHTML = `DL on ${day}: <strong style="color:${colors[status]}">${result.percentage}%</strong> (${result.attended}/${result.delivered} classes) — ${classesForThisSubject} class${classesForThisSubject > 1 ? 'es' : ''} credited`;
    },

    _closeModal(id) {
        const modal = document.getElementById(id);
        if (!modal) return;
        modal.classList.remove('tt-modal-show');
        setTimeout(() => modal.remove(), 200);
    },
};