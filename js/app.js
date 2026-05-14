// app.js — Orchestrator. Connects all modules.

console.log('✓ App loading. TimetableUI available?', typeof TimetableUI);

const App = {
    subjects: [],

    init() {
        Storage.loadFromURL();
        Settings.load();
        Timetable.load();
        this.subjects = Storage.getSubjects();

        const sem = Calculator.semesterProgress();
        UI.updateSemProgress(sem.progress, sem.remainingDays);

        const thresholdInput = document.getElementById('threshold-input');
        if (thresholdInput) thresholdInput.value = Settings.threshold;

        this.render();
        this._updateOnboardingState();
        this.bindEvents();
    },

    bindEvents() {
        // Threshold input
        const thresholdInput = document.getElementById('threshold-input');
        if (thresholdInput) {
            thresholdInput.addEventListener('change', (e) => {
                Settings.threshold = e.target.value;
                UI.toast(`Threshold updated to ${Settings.threshold}%`, 'success');
                this.render();
            });
        }

        // Import file
        const importInput = document.getElementById('import-input');
        if (importInput) {
            importInput.addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                try {
                    await Storage.importJSON(file);
                    this.subjects = Storage.getSubjects();
                    Settings.load();
                    this.render();
                    UI.toast('Data imported successfully!', 'success');
                } catch (err) {
                    UI.toast('Import failed: ' + err, 'error');
                }
                importInput.value = '';
            });
        }

        // Chart toggle
        const chartToggle = document.getElementById('chart-toggle');
        if (chartToggle) {
            chartToggle.addEventListener('click', () => {
                const body = document.getElementById('chart-body');
                const isHidden = body.classList.toggle('hidden');
                chartToggle.textContent = isHidden ? 'Show' : 'Hide';
                if (!isHidden) Charts.render(this.subjects, Settings.threshold);
            });
        }
    },

    render() {
        const container = document.getElementById('subjects-container');
        const sem = Calculator.semesterProgress();

        UI.updateSummary(this.subjects, Settings.threshold);
        const toolbar = document.getElementById('toolbar');
        if (toolbar) toolbar.classList.toggle('hidden', this.subjects.length === 0);

        container.innerHTML = this.subjects.map(s =>
            UI.buildCard(s, Settings.threshold, sem.remainingClasses)
        ).join('');

        // Render chart if visible
        const chartBody = document.getElementById('chart-body');
        if (chartBody && !chartBody.classList.contains('hidden')) {
            Charts.render(this.subjects, Settings.threshold);
        }
    },

    addSubject() {
        UI.clearAllErrors();
        const name = document.getElementById('subject-name').value.trim();
        const delivered = parseInt(document.getElementById('delivered').value);
        const attended = parseInt(document.getElementById('attended').value);

        let hasError = false;

        if (!name) {
            UI.showError('subject-name', 'Subject name is required');
            hasError = true;
        } else if (this.subjects.find(s => s.name.toLowerCase() === name.toLowerCase())) {
            UI.showError('subject-name', 'Subject already exists');
            hasError = true;
        }

        if (isNaN(delivered) || delivered < 0) {
            UI.showError('delivered', 'Enter a valid number');
            hasError = true;
        }

        if (isNaN(attended) || attended < 0) {
            UI.showError('attended', 'Enter a valid number');
            hasError = true;
        }

        // FIX: clamp attended to delivered silently, or block — we block with a clear message
        if (!hasError && attended > delivered) {
            UI.showError('attended', 'Cannot exceed classes delivered');
            hasError = true;
        }

        if (hasError) return;

        const subject = {
            // FIX: crypto.randomUUID() instead of Date.now() — no collision on import
            id: crypto.randomUUID(),
            name,
            delivered,
            attended
        };

        this.subjects.push(subject);
        Storage.saveSubjects(this.subjects);
        this.render();
        this.clearForm();
        UI.toast(`${name} added!`, 'success');
    },

    saveInlineEdit(id) {
        const deliveredInput = document.getElementById(`edit-delivered-${id}`);
        const attendedInput = document.getElementById(`edit-attended-${id}`);

        if (!deliveredInput || !attendedInput) return;

        const delivered = parseInt(deliveredInput.value);
        const attended = parseInt(attendedInput.value);

        // FIX: full validation in inline edit (was missing attended > delivered check)
        if (isNaN(delivered) || delivered < 0) {
            UI.toast('Invalid delivered count — must be 0 or more', 'error');
            deliveredInput.focus();
            return;
        }

        if (isNaN(attended) || attended < 0) {
            UI.toast('Invalid attended count — must be 0 or more', 'error');
            attendedInput.focus();
            return;
        }

        if (attended > delivered) {
            UI.toast('Attended cannot exceed delivered', 'error');
            attendedInput.focus();
            return;
        }

        const index = this.subjects.findIndex(s => s.id === id);
        if (index === -1) return;

        this.subjects[index].delivered = delivered;
        this.subjects[index].attended = attended;

        Storage.saveSubjects(this.subjects);
        this.render();
        UI.toast('Updated!', 'success');
    },

    deleteSubject(id) {
        const subject = this.subjects.find(s => s.id === id);
        if (!subject) return;

        // FIX: replace blocking confirm() with custom modal
        UI.confirm(
            `Delete "${subject.name}"?`,
            'This will remove the subject and all its data.',
            () => {
                this.subjects = this.subjects.filter(s => s.id !== id);
                Storage.saveSubjects(this.subjects);
                this.render();
                UI.toast(`${subject.name} deleted`, 'warning');
            }
        );
    },

    clearAll() {
        // FIX: replace blocking confirm() with custom modal
        UI.confirm(
            'Clear all subjects?',
            'This cannot be undone. All attendance data will be lost.',
            () => {
                this.subjects = [];
                Storage.clearAll();
                Settings.load();
                this.render();
                UI.toast('All data cleared', 'warning');
            }
        );
    },

    // FIX: split ML into simulate (preview only) vs apply (permanent)
    // simulateML is called from the leave simulator on each card — no data mutation
    // applyMLGlobal is the only function that actually writes to storage

    applyMLGlobal() {
        if (this.subjects.length === 0) return;

        const preview = this.subjects.map(s => {
            const result = Calculator.applyML(s.attended, s.delivered);
            const before = Calculator.percentage(s.attended, s.delivered);
            return `${s.name}: ${before}% → ${result.percentage}%`;
        }).join('\n');

        // FIX: replace blocking confirm() with custom modal
        UI.confirm(
            'Apply Medical Leave to all subjects?',
            preview,
            () => {
                this.subjects = this.subjects.map(s => {
                    const result = Calculator.applyML(s.attended, s.delivered);
                    return { ...s, attended: result.attended, delivered: result.delivered };
                });
                Storage.saveSubjects(this.subjects);
                this.render();
                UI.toast('Medical Leave applied to all subjects', 'success');
            }
        );
    },

    exportData() {
        Storage.saveSubjects(this.subjects);
        Storage.exportJSON();
        UI.toast('Data exported!', 'success');
    },

    copyShareLink() {
        const link = Storage.getShareableLink();
        navigator.clipboard.writeText(link).then(() => {
            UI.toast('Share link copied to clipboard!', 'success');
        }).catch(() => {
            prompt('Copy this link:', link);
        });
    },

    // Quick-tap: fastest path to update attendance from a card face
    // attend = +1 attended, +1 delivered (was in class)
    // miss   = +1 delivered only (class happened, wasn't there)
    openTimetable() {
        if (Timetable.isSetup()) {
            TimetableUI.showWeekView();
        } else {
            TimetableUI.showSetup(() => {
                this.render();
                this._updateOnboardingState();
                UI.toast(`Timetable loaded — ${Timetable.getBatch()} · Group ${Timetable.getGroup()}`, 'success');
            });
        }
    },

    _updateOnboardingState() {
        const ttCard = document.getElementById('onboard-timetable');
        const stepBadge = document.getElementById('onboard-step-badge');
        if (!ttCard) return;

        if (Timetable.isSetup()) {
            // Mark timetable step done, make subjects step primary
            ttCard.classList.remove('onboard-primary');
            ttCard.classList.add('onboard-done');
            ttCard.innerHTML = `
                <div class="onboard-done-check">✓</div>
                <div class="onboard-title">Timetable Set</div>
                <div class="onboard-sub">${Timetable.getBatch()} · Group ${Timetable.getGroup()} · <button class="onboard-change-link" onclick="App.openTimetable()">View / Change</button></div>
            `;
            const subjectsCard = document.getElementById('onboard-subjects');
            if (subjectsCard) {
                subjectsCard.classList.add('onboard-primary');
                subjectsCard.classList.remove('onboard-secondary');
            }
            if (stepBadge) stepBadge.textContent = 'Step 2';
        }
    },

    quickTap(id, action) {
        const index = this.subjects.findIndex(s => s.id === id);
        if (index === -1) return;

        const s = this.subjects[index];
        if (action === 'attend') {
            this.subjects[index].attended = s.attended + 1;
            this.subjects[index].delivered = s.delivered + 1;
        } else {
            this.subjects[index].delivered = s.delivered + 1;
        }

        Storage.saveSubjects(this.subjects);

        // FIX: selector used CSS class name which breaks if class is renamed.
        // Use data-action attribute instead — stable regardless of styling.
        const btn = document.querySelector(`#card-${id} [data-action="${action}"]`);
        if (btn) {
            btn.classList.add('tapped');
            btn.addEventListener('animationend', () => btn.classList.remove('tapped'), { once: true });
        }

        setTimeout(() => this.render(), 200);
    },

    clearForm() {
        document.getElementById('subject-name').value = '';
        document.getElementById('delivered').value = '';
        document.getElementById('attended').value = '';
        UI.clearAllErrors();
    }
};

document.addEventListener('DOMContentLoaded', () => App.init());