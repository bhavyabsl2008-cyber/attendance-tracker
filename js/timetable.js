// timetable.js — CSE-1 Chitkara University timetable data and logic

const SLOTS = [
    { id: 1, time: '9:00–10:00' },
    { id: 2, time: '10:00–11:00' },
    { id: 3, time: '11:00–12:00' },
    { id: 4, time: '12:00–1:00' },
    { id: 5, time: '1:00–2:00', isBreak: true, breakLabel: 'Lunch Break' },
    { id: 6, time: '2:00–3:00' },
    { id: 7, time: '3:00–4:00' },
];

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Sem 3 academic calendar (Ref: CUIET/CSE/ACAD/2026/227a, 13 July 2026)
// Single source of truth for semester boundaries — Calculator.semesterProgress()
// reads this instead of keeping its own copy.
const SEMESTER = {
    start: '2026-06-30',  // Commencement of 3rd Semester Classes
    end: '2026-12-22',    // Last Teaching Day (end-term exams follow)
};

// Known exceptions where classes run on what would normally be a non-teaching day.
// The notice doesn't specify which day's timetable a working Saturday follows,
// so these are NOT counted toward remaining-class totals — see getRemainingClassesForSubject.
const WORKING_SATURDAYS = ['2026-11-14'];

// Some subjects don't run the full semester — OOP ends mid-term and is replaced by
// Programming in Java in the same slot (per the notice: OOP Course End 11 Sep 2026,
// Programming in Java Course Start 23 Sep 2026). Remaining-class counts must stop at
// the subject's own end date, not run to the full semester end. Subjects not listed
// here are assumed to run the full semester (CN/DBMS/FEEII have no separate
// start/end line items in the notice — only continuous ST-1/ST-2/PBE checkpoints).
const SUBJECT_COURSE_END = {
    OOP: '2026-09-11',
};

// Sem 3 holidays (Ref: CUIET/CSE/ACAD/2026/227a, 13 July 2026)
// Each entry is a single date or an inclusive range where no classes are held.
const HOLIDAYS = [
    { start: '2026-08-15', end: '2026-08-15', name: 'Independence Day' },
    { start: '2026-09-04', end: '2026-09-04', name: 'Krishna Janmashtami' },
    { start: '2026-10-02', end: '2026-10-02', name: "Mahatma Gandhi's Birthday" },
    { start: '2026-10-19', end: '2026-10-20', name: 'Dussehra Holidays' },
    { start: '2026-11-07', end: '2026-11-11', name: 'Diwali Break' },
    { start: '2026-11-24', end: '2026-11-24', name: 'Guru Nanak Dev Ji Birthday' },
    { start: '2026-12-25', end: '2026-12-25', name: 'Christmas' },
];

// Subject full names
const SUBJECTS = {
    CP:       'C Programming',
    DET:      'Differential Equations & Transformations',
    OSLF:     'Operating System & Linux Fundamentals',
    FEE:      'Front End Engineering-I',
    MCP:      'Modern & Computational Physics',
    DECA:     'DECA',
    EXPLORE:  'Explore Hours',
    OOP:      'Object Oriented Programming',
    CN:       'Computer Networks',
    DBMS:     'Database Management Systems',
    FEEII:    'Front End Engineering-II',
    DISC:     'Discrete Structures',
};

// Each entry: { subject, slots: [1,2,...], group: null | 'A' | 'B', isLab: bool }
// group null = everyone. group A or B = only that group attends
// isLab true = counts as 2 attendance (2 slots)
// EXPLORE slots don't count for attendance

const TIMETABLES = {
    // Second-year timetable, from aSc-generated CSE 3 G1 sheet (generated 29-06-2026)
    // Replaces legacy first-year G1 data — no first-year students left using this app.
    G1: {
        Monday:    [
            { subject: 'FEEII', slots: [1,2], isLab: true  },
            { subject: 'OOP',   slots: [3,4], isLab: true  },
            { subject: 'DBMS',  slots: [6,7], isLab: true  },
        ],
        Tuesday:   [
            { subject: 'OOP',  slots: [1,2], isLab: true  },
            { subject: 'DISC', slots: [4],   isLab: false },
            { subject: 'DBMS', slots: [6,7], isLab: true  },
        ],
        Wednesday: [
            { subject: 'OOP',   slots: [1,2], isLab: true  },
            { subject: 'DISC',  slots: [4],   isLab: false },
            { subject: 'FEEII', slots: [6,7], isLab: true  },
        ],
        Thursday:  [
            { subject: 'OOP',  slots: [1,2], isLab: true  },
            { subject: 'DISC', slots: [7],   isLab: false },
        ],
        Friday:    [
            { subject: 'OOP',   slots: [1,2], isLab: true },
            { subject: 'FEEII', slots: [6,7], isLab: true },
        ],
    },

    // Second-year timetable, w.e.f. per clean CSE 3 G2 sheet (generated 17-07-2026).
    // Printed period 1/2 times read 9:00-9:45 / 9:45-11:00 on the source sheet, but
    // Bhavya confirmed (21 Jul 2026) actual periods run flat one hour like every
    // other batch — mapped onto the standard SLOTS grid, not the printed times.
    G2: {
        Monday:    [
            { subject: 'OOP',      slots: [1],   isLab: false },
            { subject: 'DISC',     slots: [2],   isLab: false },
            { subject: 'FEEII',    slots: [6,7], isLab: true  },
        ],
        Tuesday:   [
            { subject: 'DBMS',  slots: [1],   isLab: false },
            { subject: 'DISC',  slots: [2],   isLab: false },
            { subject: 'OOP',   slots: [3,4], isLab: true  },
            { subject: 'FEEII', slots: [6,7], isLab: true  },
        ],
        Wednesday: [
            { subject: 'DISC', slots: [2],   isLab: false },
            { subject: 'OOP',  slots: [3,4], isLab: true  },
        ],
        Thursday:  [
            { subject: 'DISC',  slots: [2],   isLab: false },
            { subject: 'OOP',   slots: [3,4], isLab: true  },
            { subject: 'FEEII', slots: [6,7], isLab: true  },
        ],
        Friday:    [
            { subject: 'DISC', slots: [2],   isLab: false },
            { subject: 'OOP',  slots: [3,4], isLab: true  },
            { subject: 'DBMS', slots: [6,7], isLab: true  },
        ],
    },

    // Second-year timetable, from aSc-generated CSE 3 G3 sheet (generated 29-06-2026)
    G3: {
        Monday:    [
            { subject: 'DBMS',  slots: [1,2], isLab: true },
            { subject: 'FEEII', slots: [3,4], isLab: true },
            { subject: 'OOP',   slots: [6,7], isLab: true },
        ],
        Tuesday:   [
            { subject: 'FEEII', slots: [1,2], isLab: true },
            { subject: 'DBMS',  slots: [3,4], isLab: true },
            { subject: 'OOP',   slots: [6,7], isLab: true },
        ],
        Wednesday: [
            { subject: 'DISC', slots: [1],   isLab: false },
            { subject: 'OOP',  slots: [6,7], isLab: true  },
        ],
        Thursday:  [
            { subject: 'FEEII', slots: [1,2], isLab: true  },
            { subject: 'DISC',  slots: [4],   isLab: false },
            { subject: 'OOP',   slots: [6,7], isLab: true  },
        ],
        Friday:    [
            { subject: 'DISC', slots: [2],   isLab: false },
            { subject: 'OOP',  slots: [6,7], isLab: true  },
        ],
    },

    // Second-year timetable, from aSc-generated CSE 3 G4 sheet (generated 29-06-2026)
    G4: {
        Monday:    [
            { subject: 'OOP',   slots: [1,2], isLab: true  },
            { subject: 'DISC',  slots: [4],   isLab: false },
            { subject: 'FEEII', slots: [6,7], isLab: true  },
        ],
        Tuesday:   [
            { subject: 'OOP',   slots: [1,2], isLab: true  },
            { subject: 'DISC',  slots: [3],   isLab: false },
            { subject: 'FEEII', slots: [6,7], isLab: true  },
        ],
        Wednesday: [
            { subject: 'OOP',  slots: [1,2], isLab: true },
            { subject: 'DBMS', slots: [6,7], isLab: true },
        ],
        Thursday:  [
            { subject: 'OOP',   slots: [1,2], isLab: true },
            { subject: 'FEEII', slots: [6,7], isLab: true },
        ],
        Friday:    [
            { subject: 'DBMS', slots: [1,2], isLab: true  },
            { subject: 'OOP',  slots: [3,4], isLab: true  },
            { subject: 'DISC', slots: [6],   isLab: false },
        ],
    },

    // Second-year timetable, w.e.f. 30 June 2026, from Dean CSE-2nd Year email to
    // CSE Beta 3 G5 (Mentor: Dr. Mankirat Kaur). Replaces stale first-year data.
    G5: {
        Monday:    [
            { subject: 'FEEII', slots: [1,2], isLab: true  },
            { subject: 'CN',    slots: [4],   isLab: false },
            { subject: 'OOP',   slots: [6,7], isLab: true  },
        ],
        Tuesday:   [
            { subject: 'FEEII', slots: [1,2], isLab: true  },
            { subject: 'CN',    slots: [3],   isLab: false },
            { subject: 'OOP',   slots: [6,7], isLab: true  },
        ],
        Wednesday: [
            { subject: 'DBMS', slots: [1,2], isLab: true },
            { subject: 'OOP',  slots: [6,7], isLab: true },
        ],
        Thursday:  [
            { subject: 'FEEII', slots: [1,2], isLab: true },
            { subject: 'OOP',   slots: [6,7], isLab: true },
        ],
        Friday:    [
            { subject: 'CN',   slots: [1],   isLab: false },
            { subject: 'DBMS', slots: [3,4], isLab: true  },
            { subject: 'OOP',  slots: [6,7], isLab: true  },
        ],
    },

    // Second-year timetable, w.e.f. 30 June 2026 (per official Chitkara mentor email,
    // clean full-resolution copy verified 21 Jul 2026). CN is single-period on
    // Mo/Th but a 2-period LAB on Tuesday (merged cell across periods 3-4) —
    // do not collapse this back to single-period, it was wrong before.
    G6: {
        Monday:    [
            { subject: 'OOP',  slots: [1,2], isLab: true  },
            { subject: 'CN',   slots: [4],   isLab: false },
            { subject: 'DBMS', slots: [6,7], isLab: true  },
        ],
        Tuesday:   [
            { subject: 'OOP',   slots: [1,2], isLab: true  },
            { subject: 'CN',    slots: [3,4], isLab: true  },
            { subject: 'FEEII', slots: [6,7], isLab: true  },
        ],
        Wednesday: [
            { subject: 'OOP',   slots: [1,2], isLab: true },
            { subject: 'FEEII', slots: [6,7], isLab: true },
        ],
        Thursday:  [
            { subject: 'OOP',  slots: [1,2], isLab: true  },
            { subject: 'CN',   slots: [4],   isLab: false },
            { subject: 'DBMS', slots: [6,7], isLab: true  },
        ],
        Friday:    [
            { subject: 'OOP',   slots: [1,2], isLab: true },
            { subject: 'FEEII', slots: [6,7], isLab: true },
        ],
    },

    // Second-year timetable, from aSc-generated CSE 3 G7 sheet (generated 29-06-2026)
    // isLab is inferred from 2-hour contiguous blocks — the source sheet doesn't
    // explicitly mark labs, so this is a best guess, not confirmed.
    G7: {
        Monday:    [
            { subject: 'FEEII', slots: [1,2], isLab: true },
            { subject: 'DBMS',  slots: [3,4], isLab: true },
            { subject: 'OOP',   slots: [6,7], isLab: true },
        ],
        Tuesday:   [
            { subject: 'FEEII', slots: [1,2], isLab: true },
            { subject: 'DBMS',  slots: [3,4], isLab: true },
            { subject: 'OOP',   slots: [6,7], isLab: true },
        ],
        Wednesday: [
            { subject: 'CN',   slots: [3,4], isLab: true },
            { subject: 'OOP',  slots: [6,7], isLab: true },
        ],
        Thursday:  [
            { subject: 'FEEII', slots: [1,2], isLab: true },
            { subject: 'CN',    slots: [4],   isLab: false },
            { subject: 'OOP',   slots: [6,7], isLab: true },
        ],
        Friday:    [
            { subject: 'CN',   slots: [3],   isLab: false },
            { subject: 'OOP',  slots: [6,7], isLab: true },
        ],
    },

    // Second-year timetable, from Dean CSE-2nd yr email, w.e.f. 6 July 2026
    // Wednesday CN's exact slot (2-3 vs 3-4) inferred by structural analogy to
    // G7's identical CN-lab placement — doesn't affect attendance math either way,
    // only cosmetic if someone browses G8's timetable specifically.
    G8: {
        Monday:    [
            { subject: 'FEEII', slots: [1,2], isLab: true  },
            { subject: 'CN',    slots: [4],   isLab: false },
            { subject: 'OOP',   slots: [6,7], isLab: true  },
        ],
        Tuesday:   [
            { subject: 'DBMS',  slots: [1,2], isLab: true },
            { subject: 'FEEII', slots: [3,4], isLab: true },
            { subject: 'OOP',   slots: [6,7], isLab: true },
        ],
        Wednesday: [
            { subject: 'CN',  slots: [3,4], isLab: true },
            { subject: 'OOP', slots: [6,7], isLab: true },
        ],
        Thursday:  [
            { subject: 'DBMS', slots: [1,2], isLab: true },
            { subject: 'OOP',  slots: [6,7], isLab: true },
        ],
        Friday:    [
            { subject: 'OOP',   slots: [1,2], isLab: true },
            { subject: 'FEEII', slots: [3,4], isLab: true },
            { subject: 'CN',    slots: [6],   isLab: false },
        ],
    },
};

const STORAGE_KEY_TIMETABLE = 'att_tracker_timetable_v1';

const Timetable = {
    _config: null, // { batch, customOverrides }

    load() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY_TIMETABLE);
            this._config = saved ? JSON.parse(saved) : null;
        } catch { this._config = null; }
        return this;
    },

    save() {
        try {
            localStorage.setItem(STORAGE_KEY_TIMETABLE, JSON.stringify(this._config));
        } catch {}
        return this;
    },

    isSetup() {
        return this._config !== null && this._config.batch !== null;
    },

    setup(batch) {
        // start with hardcoded data, no overrides
        this._config = {
            batch,
            customOverrides: {} // { 'Monday': [...entries] } — replaces that day
        };
        this.save();
    },

    clear() {
        this._config = null;
        localStorage.removeItem(STORAGE_KEY_TIMETABLE);
    },

    getBatch() { return this._config?.batch || null; },

    // Get schedule for a specific day, filtered by group
    // Returns array of { subject, slots, isLab, attendanceCount }
    // attendanceCount = number of slots that count as attendance
    getDay(day) {
        if (!this._config) return [];

        // Check custom override first
        const overrides = this._config.customOverrides || {};
        let entries = overrides[day] !== undefined
            ? overrides[day]
            : (TIMETABLES[this._config.batch]?.[day] || []);

        return entries
            .filter(e => e.subject !== 'EXPLORE') // Skip explore hours
            .map(e => ({
                subject: e.subject,
                subjectFull: SUBJECTS[e.subject] || e.subject,
                slots: e.slots,
                isLab: e.isLab,
                // attendanceCount = number of slots (lab = 2 attendance)
                attendanceCount: e.slots.length,
            }));
    },

    // Get classes per subject for a given day
    // Returns { 'CP': 2, 'DET': 1, ... }
    getAttendanceCountForDay(day) {
        const entries = this.getDay(day);
        const counts = {};
        entries.forEach(e => {
            const key = e.subject;
            counts[key] = (counts[key] || 0) + e.attendanceCount;
        });
        return counts;
    },

    // Override a single day's timetable (for timetable changes)
    overrideDay(day, entries) {
        if (!this._config) return;
        this._config.customOverrides = this._config.customOverrides || {};
        this._config.customOverrides[day] = entries;
        this.save();
    },

    // Reset a day's override back to hardcoded
    resetDay(day) {
        if (!this._config?.customOverrides) return;
        delete this._config.customOverrides[day];
        this.save();
    },

    // Get full week schedule (for display)
    getWeek() {
        const week = {};
        DAYS.slice(0, 5).forEach(day => {
            week[day] = this.getDay(day);
        });
        return week;
    },

    // Read-only preview of ANY batch's week — does not touch personal _config,
    // so students can look up another batch (e.g. G7) without it affecting their own setup.
    previewWeek(batchCode) {
        const week = {};
        DAYS.slice(0, 5).forEach(day => {
            const entries = TIMETABLES[batchCode]?.[day] || [];
            week[day] = entries
                .filter(e => e.subject !== 'EXPLORE')
                .map(e => ({
                    subject: e.subject,
                    subjectFull: SUBJECTS[e.subject] || e.subject,
                    slots: e.slots,
                    isLab: e.isLab,
                    attendanceCount: e.slots.length,
                }));
        });
        return week;
    },

    getBatchList() {
        return Object.keys(TIMETABLES); // G1-G9
    },

    getSubjectFullName(code) {
        return SUBJECTS[code] || code;
    },

    getSubjectCodes() {
        return Object.keys(SUBJECTS).filter(k => k !== 'EXPLORE');
    },

    // For the leave simulator — given a day, return what the app subject names map to
    // Takes the user's stored subjects array and matches by subject code
    // Returns array of { subjectId, subjectName, attendanceCount }
    getDLImpact(day, appSubjects) {
        const dayCounts = this.getAttendanceCountForDay(day);
        const result = [];

        Object.entries(dayCounts).forEach(([code, count]) => {
            const fullName = SUBJECTS[code] || code;
            // Try to find matching subject in app — match by full name or partial
            const matched = appSubjects.find(s =>
                s.name.toLowerCase().includes(fullName.toLowerCase()) ||
                fullName.toLowerCase().includes(s.name.toLowerCase()) ||
                s.name.toLowerCase().includes(code.toLowerCase()) ||
                code.toLowerCase().includes(s.name.toLowerCase())
            );
            result.push({
                code,
                fullName,
                attendanceCount: count,
                subjectId: matched?.id || null,
                subjectName: matched?.name || fullName,
                matched: !!matched,
            });
        });

        return result;
    },

    // Given a 'YYYY-MM-DD' date string, returns the matching holiday { name } or null
    isHoliday(dateStr) {
        const d = new Date(dateStr + 'T00:00:00');
        for (const h of HOLIDAYS) {
            const start = new Date(h.start + 'T00:00:00');
            const end = new Date(h.end + 'T00:00:00');
            if (d >= start && d <= end) return { name: h.name };
        }
        return null;
    },

    // Real calendar walk from today to semester end, counting how many times
    // THIS specific subject actually meets — excludes weekends and holidays.
    // Returns null if no timetable is set up (caller should fall back to a heuristic).
    // Note: WORKING_SATURDAYS are deliberately NOT counted (see comment above) — this
    // makes the result a slight undercount on rare compensatory teaching days.
    getRemainingClassesForSubject(subjectCode) {
        if (!this._config) return null;

        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const semesterEnd = new Date(SEMESTER.end + 'T00:00:00');
        // Some subjects (e.g. OOP) finish mid-semester — don't count classes past
        // their own course-end date even though the semester itself runs longer.
        const courseEndStr = SUBJECT_COURSE_END[subjectCode];
        const end = courseEndStr ? new Date(courseEndStr + 'T00:00:00') : semesterEnd;
        const cursor = new Date();
        cursor.setHours(0, 0, 0, 0);

        if (cursor > end) return 0;

        let count = 0;
        while (cursor <= end) {
            const yyyy = cursor.getFullYear();
            const mm = String(cursor.getMonth() + 1).padStart(2, '0');
            const dd = String(cursor.getDate()).padStart(2, '0');
            const dateStr = `${yyyy}-${mm}-${dd}`;
            const dayName = dayNames[cursor.getDay()];

            const isWeekend = dayName === 'Sunday' || dayName === 'Saturday';
            if (!isWeekend && !this.isHoliday(dateStr)) {
                const entries = this.getDay(dayName);
                entries.forEach(e => {
                    if (e.subject === subjectCode) count += e.attendanceCount;
                });
            }

            cursor.setDate(cursor.getDate() + 1);
        }

        return count;
    },

    // Parse a SLOTS time label like "1:00" into minutes since midnight.
    // Periods 1–4 are AM (9,10,11,12); periods 5–7 read as "1,2,3" but are PM,
    // so any hour below 9 is treated as afternoon.
    _parseClock(str) {
        let [h, m] = str.split(':').map(Number);
        if (h < 9) h += 12;
        return h * 60 + m;
    },

    getSlotRange(slotId) {
        const slot = SLOTS.find(s => s.id === slotId);
        if (!slot) return null;
        const [startStr, endStr] = slot.time.split('–');
        return { start: this._parseClock(startStr), end: this._parseClock(endStr) };
    },

    // Which of today's scheduled periods overlap a DL clock-time window.
    // startMin/endMin are minutes since midnight (e.g. 2:00pm = 840).
    // Returns { subjectCode: overlappingPeriodCount }, same shape as
    // getAttendanceCountForDay, so callers can reuse it the same way.
    getPeriodsInTimeRange(day, startMin, endMin) {
        const entries = this.getDay(day);
        const counts = {};
        entries.forEach(e => {
            e.slots.forEach(slotId => {
                const range = this.getSlotRange(slotId);
                if (!range) return;
                const overlaps = range.start < endMin && range.end > startMin;
                if (overlaps) counts[e.subject] = (counts[e.subject] || 0) + 1;
            });
        });
        return counts;
    },

    // Match an App subject's free-text name to a timetable subject code
    // (same matching rule already used by getDLImpact, factored out for reuse)
    _matchSubjectCode(appSubjectName) {
        if (!this._config) return null;
        const batchData = TIMETABLES[this._config.batch];
        if (!batchData) return null;

        // Only match against codes that actually appear in THIS student's own batch —
        // matching against the entire global SUBJECTS dict let "FEE" collide with the
        // unrelated legacy first-year code 'FEE' instead of this batch's real 'FEEII'.
        const codesInBatch = new Set();
        Object.values(batchData).forEach(dayEntries => {
            dayEntries.forEach(e => codesInBatch.add(e.subject));
        });

        const lowerName = appSubjectName.toLowerCase();

        // Exact code match first (e.g. typed "OOP" === code OOP)
        for (const code of codesInBatch) {
            if (lowerName === code.toLowerCase()) return code;
        }
        // Exact full-name match next
        for (const code of codesInBatch) {
            if (lowerName === (SUBJECTS[code] || '').toLowerCase()) return code;
        }
        // Fuzzy substring match last, still scoped to this batch's own codes only.
        // Includes the reverse direction too (code contains typed name) — needed for
        // cases like typed "FEE" matching the real code "FEEII".
        for (const code of codesInBatch) {
            const fullName = (SUBJECTS[code] || '').toLowerCase();
            if (
                lowerName.includes(fullName) ||
                fullName.includes(lowerName) ||
                lowerName.includes(code.toLowerCase()) ||
                code.toLowerCase().includes(lowerName)
            ) {
                return code;
            }
        }
        return null;
    },

    // Convenience wrapper for the UI layer — takes an App subject's display name
    // directly instead of requiring the caller to know the timetable subject code.
    // Returns null if no timetable is set up OR the subject can't be matched,
    // so the caller can fall back to the flat semesterProgress() heuristic.
    getRemainingClassesForAppSubject(appSubjectName) {
        if (!this._config) return null;
        const code = this._matchSubjectCode(appSubjectName);
        if (!code) return null;
        return this.getRemainingClassesForSubject(code);
    },

    DAYS,
    SLOTS,
    SUBJECTS,
    TIMETABLES,
    HOLIDAYS,
    SEMESTER,
    WORKING_SATURDAYS,
    SUBJECT_COURSE_END,
};
