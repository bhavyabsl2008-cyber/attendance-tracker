// cgpa.js — CGPA calculator + reappear/backlog "what-if" simulator.
//
// Deliberately a separate data domain from attendance (different subjects
// list, different storage key) — this is grades, not attendance, and
// shouldn't get tangled with the Subject objects Calculator/App use.
//
// Rules confirmed directly by Bhavya (no official written doc exists for this):
//   - E1 = failed/detained on internals (incl. low-attendance detainment), E2 = failed end-sem.
//   - Both count as grade point 0 in the original SGPA, same as the F row.
//   - Clearing a backlog REPLACES that subject's grade outright — not averaged
//     with the original attempt. Same mechanism for any number of backlogs.
//   - CGPA is assumed to be the credit-weighted average of each semester's SGPA:
//       CGPA = Σ(SGPA_i × semester_credits_i) / Σ(semester_credits_i)
//     This formula is MY assumption, not confirmed line-by-line — flagged in the UI too.

const GRADE_POINTS = {
    O: 10, 'A+': 9, A: 8, 'B+': 7, B: 6, C: 5, P: 4, F: 0, I: 0, E1: 0, E2: 0,
};

const CGPA = {
    _storageKey: 'chitkara_cgpa_v1',

    load() {
        try {
            const data = localStorage.getItem(this._storageKey);
            return data ? JSON.parse(data) : { semesters: [] };
        } catch { return { semesters: [] }; }
    },

    save(state) {
        try {
            localStorage.setItem(this._storageKey, JSON.stringify(state));
            return true;
        } catch { return false; }
    },

    sgpa(subjects) {
        const totalCredits = subjects.reduce((sum, s) => sum + (Number(s.credits) || 0), 0);
        if (totalCredits === 0) return 0;
        const weighted = subjects.reduce((sum, s) => sum + (Number(s.credits) || 0) * (GRADE_POINTS[s.grade] ?? 0), 0);
        return parseFloat((weighted / totalCredits).toFixed(2));
    },

    cgpa(semesters) {
        const totalCredits = semesters.reduce((sum, sem) => sum + sem.subjects.reduce((c, s) => c + (Number(s.credits) || 0), 0), 0);
        if (totalCredits === 0) return 0;
        const weighted = semesters.reduce((sum, sem) => {
            const semCredits = sem.subjects.reduce((c, s) => c + (Number(s.credits) || 0), 0);
            return sum + this.sgpa(sem.subjects) * semCredits;
        }, 0);
        return parseFloat((weighted / totalCredits).toFixed(2));
    },

    // ─────────────────────── UI ───────────────────────
    _state: null,

    show() {
        this._state = this.load();
        if (this._state.semesters.length === 0) {
            this._state.semesters.push({ name: 'Semester 1', subjects: [] });
        }
        this._render();
    },

    _render() {
        document.getElementById('ui-modal')?.remove();
        const modal = document.createElement('div');
        modal.id = 'ui-modal';
        modal.className = 'ui-modal-overlay';

        const cgpaVal = this.cgpa(this._state.semesters);

        modal.innerHTML = `
            <div class="ui-modal-box cgpa-box" role="dialog" aria-modal="true">
                <button class="dashboard-close" id="cgpa-close" aria-label="Close">✕</button>
                <div class="ui-modal-title">CGPA Calculator</div>
                <div class="cgpa-disclaimer">E1/E2 = 0 grade points until cleared; clearing a backlog replaces the grade outright. CGPA shown is credit-weighted across semesters — not an official university tool, double-check against your actual grade card.</div>

                <div id="cgpa-semesters"></div>

                <button class="toolbar-more-item cgpa-add-sem" id="cgpa-add-semester">+ Add Semester</button>

                <div class="cgpa-overall">
                    <span>Overall CGPA</span>
                    <span class="cgpa-overall-value">${cgpaVal || '—'}</span>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        requestAnimationFrame(() => modal.classList.add('ui-modal-show'));

        const semestersEl = modal.querySelector('#cgpa-semesters');
        this._state.semesters.forEach((sem, semIdx) => {
            semestersEl.appendChild(this._renderSemester(sem, semIdx));
        });

        const close = () => {
            modal.classList.remove('ui-modal-show');
            setTimeout(() => modal.remove(), 200);
        };
        modal.querySelector('#cgpa-close').addEventListener('click', close);
        modal.addEventListener('click', (e) => { if (e.target === modal) close(); });

        modal.querySelector('#cgpa-add-semester').addEventListener('click', () => {
            this._state.semesters.push({ name: `Semester ${this._state.semesters.length + 1}`, subjects: [] });
            this.save(this._state);
            this._render();
        });
    },

    _renderSemester(sem, semIdx) {
        const wrap = document.createElement('div');
        wrap.className = 'cgpa-semester';
        const sgpaVal = this.sgpa(sem.subjects);

        wrap.innerHTML = `
            <div class="cgpa-semester-head">
                <input class="cgpa-sem-name" value="${this._escape(sem.name)}" data-sem="${semIdx}">
                <span class="cgpa-sgpa">SGPA ${sgpaVal || '—'}</span>
            </div>
            <div class="cgpa-subjects" data-sem="${semIdx}"></div>
            <button class="toolbar-more-item cgpa-add-subject" data-sem="${semIdx}">+ Add Subject</button>
        `;

        const subjectsEl = wrap.querySelector('.cgpa-subjects');
        sem.subjects.forEach((subj, subjIdx) => {
            subjectsEl.appendChild(this._renderSubjectRow(subj, semIdx, subjIdx));
        });

        wrap.querySelector('.cgpa-sem-name').addEventListener('change', (e) => {
            this._state.semesters[semIdx].name = e.target.value;
            this.save(this._state);
        });

        wrap.querySelector('.cgpa-add-subject').addEventListener('click', () => {
            this._state.semesters[semIdx].subjects.push({ name: '', credits: 3, grade: 'A' });
            this.save(this._state);
            this._render();
        });

        return wrap;
    },

    _renderSubjectRow(subj, semIdx, subjIdx) {
        const row = document.createElement('div');
        row.className = 'cgpa-subject-row';
        const isBacklog = subj.grade === 'E1' || subj.grade === 'E2';
        const gradeOptions = Object.keys(GRADE_POINTS)
            .map(g => `<option value="${g}" ${g === subj.grade ? 'selected' : ''}>${g}</option>`)
            .join('');

        row.innerHTML = `
            <input class="cgpa-subj-name" placeholder="Subject name" value="${this._escape(subj.name)}">
            <input class="cgpa-subj-credits" type="number" min="0" step="0.5" value="${subj.credits}">
            <select class="cgpa-subj-grade">${gradeOptions}</select>
            <button class="cgpa-subj-remove" aria-label="Remove">✕</button>
            ${isBacklog ? '<span class="cgpa-backlog-tag">Backlog</span>' : ''}
        `;

        row.querySelector('.cgpa-subj-name').addEventListener('change', (e) => {
            this._state.semesters[semIdx].subjects[subjIdx].name = e.target.value;
            this.save(this._state);
        });
        row.querySelector('.cgpa-subj-credits').addEventListener('change', (e) => {
            this._state.semesters[semIdx].subjects[subjIdx].credits = parseFloat(e.target.value) || 0;
            this.save(this._state);
            this._render();
        });
        row.querySelector('.cgpa-subj-grade').addEventListener('change', (e) => {
            this._state.semesters[semIdx].subjects[subjIdx].grade = e.target.value;
            this.save(this._state);
            this._render();
        });
        row.querySelector('.cgpa-subj-remove').addEventListener('click', () => {
            this._state.semesters[semIdx].subjects.splice(subjIdx, 1);
            this.save(this._state);
            this._render();
        });

        return row;
    },

    _escape(str) {
        const div = document.createElement('div');
        div.textContent = str || '';
        return div.innerHTML;
    },
};
