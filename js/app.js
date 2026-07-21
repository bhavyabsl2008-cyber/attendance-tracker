// app.js — Orchestrator. Connects all modules.

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
        if (Notifications.permission() === 'granted') Notifications.scheduleToday();
        this._initAuth();
    },

    _initAuth() {
        if (typeof Auth === 'undefined' || typeof firebase === 'undefined') return;
        Auth.init();
        Sync.init();
        Auth.onChange(user => this._updateAccountUI(user));
    },

    _updateAccountUI(user) {
        const signinBtn = document.getElementById('signin-btn');
        const chip = document.getElementById('account-chip');
        if (!signinBtn || !chip) return;

        if (user) {
            signinBtn.classList.add('hidden');
            chip.classList.remove('hidden');
            const avatar = document.getElementById('account-avatar');
            const name = document.getElementById('account-name');
            if (avatar) avatar.src = user.photoURL || '';
            if (name) name.textContent = user.displayName || user.email || 'Signed in';
        } else {
            signinBtn.classList.remove('hidden');
            chip.classList.add('hidden');
        }
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

    // "Didn't go today" — marks every period on today's timetable as missed
    // (delivered +1 per period, attended unchanged). A lab counts as 2 missed
    // classes because it's 2 slots. Does nothing if timetable isn't set up,
    // today is a holiday, or today has no classes.
    markDayAbsent() {
        if (!Timetable.isSetup()) {
            UI.toast('Set up your timetable first', 'error');
            return;
        }
        const today = new Date();
        const dayName = Timetable.DAYS[today.getDay() - 1]; // getDay(): 0=Sun
        const dateStr = today.toISOString().slice(0, 10);

        if (!dayName || today.getDay() === 0) {
            UI.toast('No classes today', 'error');
            return;
        }
        if (Timetable.isHoliday(dateStr)) {
            UI.toast("Today's a holiday — nothing to mark", 'error');
            return;
        }

        const counts = Timetable.getAttendanceCountForDay(dayName);
        const codes = Object.keys(counts);
        if (codes.length === 0) {
            UI.toast('No classes scheduled today', 'error');
            return;
        }

        const affected = [];
        codes.forEach(code => {
            const subject = this._findSubjectForCode(code);
            if (subject) affected.push({ subject, count: counts[code] });
        });

        if (affected.length === 0) {
            UI.toast("Today's subjects don't match any subject you've added", 'error');
            return;
        }

        const preview = affected
            .map(a => `${a.subject.name}: +${a.count} missed`)
            .join('\n');

        UI.confirm(
            "Mark today absent?",
            preview,
            () => {
                affected.forEach(a => {
                    const idx = this.subjects.findIndex(s => s.id === a.subject.id);
                    this.subjects[idx].delivered += a.count;
                });
                Storage.saveSubjects(this.subjects);
                this.render();
                UI.toast('Marked absent for today', 'warning');
            }
        );
    },

    // DL (duty leave) simulator, simple version: given a clock-time window,
    // any period that overlaps it counts as ATTENDED (attended +1, delivered +1
    // per overlapping slot) instead of missed. Kept separate from markDayAbsent
    // so a partial-day DL doesn't touch periods outside the DL window.
    // UI wrapper for the DL button — asks start/end clock time with two simple
    // prompts (kept deliberately simple, no custom modal), then hands off to
    // applyDLForToday. 24-hour HH:MM input, e.g. 14:00.
    promptDL() {
        const start = prompt('DL start time (24hr, e.g. 14:00):');
        if (!start) return;
        const end = prompt('DL end time (24hr, e.g. 16:00):');
        if (!end) return;
        const timePattern = /^([01]?\d|2[0-3]):[0-5]\d$/;
        if (!timePattern.test(start) || !timePattern.test(end)) {
            UI.toast('Enter time as HH:MM, e.g. 14:00', 'error');
            return;
        }
        this.applyDLForToday(start, end);
    },

    applyDLForToday(startTimeStr, endTimeStr) {
        if (!Timetable.isSetup()) {
            UI.toast('Set up your timetable first', 'error');
            return;
        }
        const today = new Date();
        const dayName = Timetable.DAYS[today.getDay() - 1];
        if (!dayName || today.getDay() === 0) {
            UI.toast('No classes today', 'error');
            return;
        }

        const [sh, sm] = startTimeStr.split(':').map(Number);
        const [eh, em] = endTimeStr.split(':').map(Number);
        const startMin = sh * 60 + sm;
        const endMin = eh * 60 + em;
        if (!(endMin > startMin)) {
            UI.toast('DL end time must be after start time', 'error');
            return;
        }

        const counts = Timetable.getPeriodsInTimeRange(dayName, startMin, endMin);
        const codes = Object.keys(counts);
        if (codes.length === 0) {
            UI.toast('No class falls inside that DL window', 'error');
            return;
        }

        const affected = [];
        codes.forEach(code => {
            const subject = this._findSubjectForCode(code);
            if (subject) affected.push({ subject, count: counts[code] });
        });

        if (affected.length === 0) {
            UI.toast("That period's subject isn't in your list", 'error');
            return;
        }

        const preview = affected
            .map(a => `${a.subject.name}: +${a.count} attended (via DL)`)
            .join('\n');

        UI.confirm(
            'Apply DL for today?',
            preview,
            () => {
                affected.forEach(a => {
                    const idx = this.subjects.findIndex(s => s.id === a.subject.id);
                    this.subjects[idx].attended += a.count;
                    this.subjects[idx].delivered += a.count;
                });
                Storage.saveSubjects(this.subjects);
                this.render();
                UI.toast('DL applied for today', 'success');
            }
        );
    },

    // Shared helper: which App subject (by user-typed name) matches a
    // timetable subject code, e.g. 'OOP' -> the subject the student named
    // "Object Oriented Programming" or just "OOP".
    _findSubjectForCode(code) {
        return this.subjects.find(s => Timetable._matchSubjectCode(s.name) === code) || null;
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
                UI.toast(`Timetable loaded — ${Timetable.getBatch()}`, 'success');
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
                <div class="onboard-sub">${Timetable.getBatch()} · <button class="onboard-change-link" onclick="App.openTimetable()">View / Change</button></div>
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
