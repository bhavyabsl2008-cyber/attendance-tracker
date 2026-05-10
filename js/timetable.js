// timetable.js — CSE-1 Chitkara University timetable data and logic

const SLOTS = [
    { id: 1, time: '9:00–10:00' },
    { id: 2, time: '10:00–11:00' },
    { id: 3, time: '11:00–12:00' },
    { id: 4, time: '12:00–1:00' },
    // Break 1:00–1:30
    { id: 5, time: '1:30–2:00' },
    { id: 6, time: '2:00–3:00' },
    { id: 7, time: '3:00–4:00' },
    { id: 8, time: '4:00–5:00' },  // slot 8 reserved if needed
];

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Subject full names
const SUBJECTS = {
    CP:       'C Programming',
    DET:      'Differential Equations & Transformations',
    OSLF:     'Operating System & Linux Fundamentals',
    FEE:      'Front End Engineering-I',
    MCP:      'Modern & Computational Physics',
    DECA:     'DECA',
    EXPLORE:  'Explore Hours',
};

// Each entry: { subject, slots: [1,2,...], group: null | 'A' | 'B', isLab: bool }
// group null = everyone. group A or B = only that group attends
// isLab true = counts as 2 attendance (2 slots)
// EXPLORE slots don't count for attendance

const TIMETABLES = {
    G1: {
        Monday:    [
            { subject: 'FEE',  slots: [1,2], isLab: true,  group: null },
            { subject: 'DECA', slots: [3,4], isLab: true,  group: 'A'  },
            { subject: 'EXPLORE', slots: [5], isLab: false, group: null },
            { subject: 'CP',   slots: [7],  isLab: false, group: null },
        ],
        Tuesday:   [
            { subject: 'OSLF', slots: [1,2], isLab: true,  group: null },
            { subject: 'DECA', slots: [3],   isLab: false, group: null },
            { subject: 'DET',  slots: [6],   isLab: false, group: null },
            { subject: 'FEE',  slots: [7],   isLab: false, group: null },
        ],
        Wednesday: [
            { subject: 'DECA', slots: [1,2], isLab: true,  group: 'B'  },
            { subject: 'DET',  slots: [3],   isLab: false, group: null },
            { subject: 'EXPLORE', slots: [5], isLab: false, group: null },
            { subject: 'CP',   slots: [7],   isLab: false, group: null },
        ],
        Thursday:  [
            { subject: 'FEE',  slots: [1],   isLab: false, group: null },
            { subject: 'OSLF', slots: [3],   isLab: false, group: null },
            { subject: 'DET',  slots: [4],   isLab: false, group: null },
            { subject: 'CP',   slots: [6,7], isLab: true,  group: null },
        ],
        Friday:    [
            { subject: 'OSLF', slots: [1],   isLab: false, group: null },
            { subject: 'CP',   slots: [2,3], isLab: true,  group: null },
            { subject: 'DET',  slots: [4],   isLab: false, group: null },
            { subject: 'EXPLORE', slots: [5], isLab: false, group: null },
            { subject: 'DECA', slots: [7],   isLab: false, group: null },
        ],
    },

    G2: {
        Monday:    [
            { subject: 'CP',   slots: [1],   isLab: false, group: null },
            { subject: 'DET',  slots: [2],   isLab: false, group: null },
            { subject: 'OSLF', slots: [3,4], isLab: true,  group: null },
            { subject: 'EXPLORE', slots: [5], isLab: false, group: null },
            { subject: 'FEE',  slots: [7],   isLab: false, group: null },
        ],
        Tuesday:   [
            { subject: 'DECA', slots: [1,2], isLab: true,  group: 'B'  },
            { subject: 'DET',  slots: [3],   isLab: false, group: null },
            { subject: 'DECA', slots: [7],   isLab: false, group: null },
        ],
        Wednesday: [
            { subject: 'FEE',  slots: [1],   isLab: false, group: null },
            { subject: 'DET',  slots: [2],   isLab: false, group: null },
            { subject: 'CP',   slots: [3,4], isLab: true,  group: null },
            { subject: 'EXPLORE', slots: [5], isLab: false, group: null },
            { subject: 'OSLF', slots: [7],   isLab: false, group: null },
        ],
        Thursday:  [
            { subject: 'OSLF', slots: [1],   isLab: false, group: null },
            { subject: 'DET',  slots: [2],   isLab: false, group: null },
            { subject: 'CP',   slots: [3,4], isLab: true,  group: null },
            { subject: 'DECA', slots: [7],   isLab: false, group: null },
        ],
        Friday:    [
            { subject: 'DECA', slots: [1,2], isLab: true,  group: 'A'  },
            { subject: 'FEE',  slots: [3,4], isLab: true,  group: null },
            { subject: 'EXPLORE', slots: [5], isLab: false, group: null },
            { subject: 'CP',   slots: [7],   isLab: false, group: null },
        ],
    },

    G3: {
        Monday:    [
            { subject: 'DECA', slots: [1],   isLab: false, group: null },
            { subject: 'OSLF', slots: [2],   isLab: false, group: null },
            { subject: 'DET',  slots: [3],   isLab: false, group: null },
            { subject: 'EXPLORE', slots: [5], isLab: false, group: null },
            { subject: 'FEE',  slots: [7],   isLab: false, group: null },
        ],
        Tuesday:   [
            { subject: 'OSLF', slots: [1],   isLab: false, group: null },
            { subject: 'DET',  slots: [2],   isLab: false, group: null },
            { subject: 'FEE',  slots: [3,4], isLab: true,  group: null },
            { subject: 'CP',   slots: [6,7], isLab: true,  group: null },
        ],
        Wednesday: [
            { subject: 'OSLF', slots: [1,2], isLab: true,  group: null },
            { subject: 'DET',  slots: [3],   isLab: false, group: null },
            { subject: 'CP',   slots: [4],   isLab: false, group: null },
            { subject: 'EXPLORE', slots: [5], isLab: false, group: null },
            { subject: 'FEE',  slots: [7],   isLab: false, group: null },
        ],
        Thursday:  [
            { subject: 'DECA', slots: [1,2], isLab: true,  group: 'A'  },
            { subject: 'CP',   slots: [4],   isLab: false, group: null },
            { subject: 'DECA', slots: [6,7], isLab: true,  group: 'B'  },
        ],
        Friday:    [
            { subject: 'CP',   slots: [1,2], isLab: true,  group: null },
            { subject: 'DET',  slots: [4],   isLab: false, group: null },
            { subject: 'EXPLORE', slots: [5], isLab: false, group: null },
            { subject: 'DECA', slots: [7],   isLab: false, group: null },
        ],
    },

    G4: {
        Monday:    [
            { subject: 'CP',   slots: [1,2], isLab: true,  group: null },
            { subject: 'DET',  slots: [3],   isLab: false, group: null },
            { subject: 'EXPLORE', slots: [5], isLab: false, group: null },
            { subject: 'OSLF', slots: [7],   isLab: false, group: null },
        ],
        Tuesday:   [
            { subject: 'FEE',  slots: [1],   isLab: false, group: null },
            { subject: 'DECA', slots: [2],   isLab: false, group: null },
            { subject: 'CP',   slots: [3,4], isLab: true,  group: null },
            { subject: 'DECA', slots: [6,7], isLab: true,  group: 'B'  },
        ],
        Wednesday: [
            { subject: 'CP',   slots: [1],   isLab: false, group: null },
            { subject: 'DET',  slots: [2],   isLab: false, group: null },
            { subject: 'DECA', slots: [3,4], isLab: true,  group: 'A'  },
            { subject: 'EXPLORE', slots: [5], isLab: false, group: null },
            { subject: 'OSLF', slots: [7],   isLab: false, group: null },
        ],
        Thursday:  [
            { subject: 'FEE',  slots: [1],   isLab: false, group: null },
            { subject: 'DET',  slots: [2],   isLab: false, group: null },
            { subject: 'FEE',  slots: [3,4], isLab: true,  group: null },
            { subject: 'DECA', slots: [7],   isLab: false, group: null },
        ],
        Friday:    [
            { subject: 'DET',  slots: [1],   isLab: false, group: null },
            { subject: 'OSLF', slots: [3,4], isLab: true,  group: null },
            { subject: 'EXPLORE', slots: [5], isLab: false, group: null },
            { subject: 'CP',   slots: [7],   isLab: false, group: null },
        ],
    },

    G5: {
        Monday:    [
            { subject: 'DECA', slots: [1,2], isLab: true,  group: 'A'  },
            { subject: 'FEE',  slots: [3],   isLab: false, group: null },
            { subject: 'EXPLORE', slots: [5], isLab: false, group: null },
            { subject: 'DECA', slots: [7],   isLab: false, group: null },
        ],
        Tuesday:   [
            { subject: 'DET',  slots: [1],   isLab: false, group: null },
            { subject: 'FEE',  slots: [2],   isLab: false, group: null },
            { subject: 'DECA', slots: [3,4], isLab: true,  group: 'B'  },
            { subject: 'OSLF', slots: [6,7], isLab: true,  group: null },
        ],
        Wednesday: [
            { subject: 'CP',   slots: [1,2], isLab: true,  group: null },
            { subject: 'FEE',  slots: [3,4], isLab: true,  group: null },
            { subject: 'EXPLORE', slots: [5], isLab: false, group: null },
            { subject: 'DET',  slots: [7],   isLab: false, group: null },
        ],
        Thursday:  [
            { subject: 'OSLF', slots: [1],   isLab: false, group: null },
            { subject: 'DET',  slots: [3],   isLab: false, group: null },
            { subject: 'CP',   slots: [4],   isLab: false, group: null },
            { subject: 'CP',   slots: [6,7], isLab: true,  group: null },
        ],
        Friday:    [
            { subject: 'OSLF', slots: [1],   isLab: false, group: null },
            { subject: 'CP',   slots: [2],   isLab: false, group: null },
            { subject: 'DET',  slots: [3],   isLab: false, group: null },
            { subject: 'EXPLORE', slots: [5], isLab: false, group: null },
            { subject: 'DECA', slots: [7],   isLab: false, group: null },
        ],
    },

    G6: {
        Monday:    [
            { subject: 'MCP',  slots: [1],   isLab: false, group: null },
            { subject: 'OSLF', slots: [2],   isLab: false, group: null },
            { subject: 'FEE',  slots: [4],   isLab: false, group: null },
            { subject: 'EXPLORE', slots: [5], isLab: false, group: null },
            { subject: 'DET',  slots: [7],   isLab: false, group: null },
        ],
        Tuesday:   [
            { subject: 'CP',   slots: [1],   isLab: false, group: null },
            { subject: 'MCP',  slots: [3,4], isLab: true,  group: 'B'  },
            { subject: 'FEE',  slots: [6],   isLab: false, group: null },
            { subject: 'MCP',  slots: [7],   isLab: false, group: null },
        ],
        Wednesday: [
            { subject: 'FEE',  slots: [1,2], isLab: true,  group: null },
            { subject: 'MCP',  slots: [3,4], isLab: true,  group: 'A'  },
            { subject: 'EXPLORE', slots: [5], isLab: false, group: null },
            { subject: 'DET',  slots: [7],   isLab: false, group: null },
        ],
        Thursday:  [
            { subject: 'OSLF', slots: [1,2], isLab: true,  group: null },
            { subject: 'CP',   slots: [3,4], isLab: true,  group: null },
            { subject: 'DET',  slots: [7],   isLab: false, group: null },
        ],
        Friday:    [
            { subject: 'OSLF', slots: [1],   isLab: false, group: null },
            { subject: 'DET',  slots: [2],   isLab: false, group: null },
            { subject: 'CP',   slots: [3,4], isLab: true,  group: null },
            { subject: 'EXPLORE', slots: [5], isLab: false, group: null },
            { subject: 'CP',   slots: [7],   isLab: false, group: null },
        ],
    },

    G7: {
        Monday:    [
            { subject: 'OSLF', slots: [1],   isLab: false, group: null },
            { subject: 'DET',  slots: [2],   isLab: false, group: null },
            { subject: 'MCP',  slots: [3,4], isLab: true,  group: 'B'  },
            { subject: 'EXPLORE', slots: [5], isLab: false, group: null },
            { subject: 'FEE',  slots: [7],   isLab: false, group: null },
        ],
        Tuesday:   [
            { subject: 'CP',   slots: [1,2], isLab: true,  group: null },
            { subject: 'FEE',  slots: [3],   isLab: false, group: null },
            { subject: 'OSLF', slots: [6],   isLab: false, group: null },
            { subject: 'CP',   slots: [7],   isLab: false, group: null },
        ],
        Wednesday: [
            { subject: 'DET',  slots: [1],   isLab: false, group: null },
            { subject: 'OSLF', slots: [3,4], isLab: true,  group: null },
            { subject: 'EXPLORE', slots: [5], isLab: false, group: null },
            { subject: 'MCP',  slots: [7],   isLab: false, group: null },
        ],
        Thursday:  [
            { subject: 'CP',   slots: [1,2], isLab: true,  group: null },
            { subject: 'MCP',  slots: [3],   isLab: false, group: null },
            { subject: 'DET',  slots: [4],   isLab: false, group: null },
            { subject: 'MCP',  slots: [6,7], isLab: true,  group: 'A'  },
        ],
        Friday:    [
            { subject: 'DET',  slots: [1],   isLab: false, group: null },
            { subject: 'FEE',  slots: [3,4], isLab: true,  group: null },
            { subject: 'EXPLORE', slots: [5], isLab: false, group: null },
            { subject: 'CP',   slots: [7],   isLab: false, group: null },
        ],
    },

    G8: {
        Monday:    [
            { subject: 'CP',   slots: [1,2], isLab: true,  group: null },
            { subject: 'FEE',  slots: [3,4], isLab: true,  group: null },
            { subject: 'EXPLORE', slots: [5], isLab: false, group: null },
            { subject: 'MCP',  slots: [7],   isLab: false, group: null },
        ],
        Tuesday:   [
            { subject: 'CP',   slots: [1],   isLab: false, group: null },
            { subject: 'DET',  slots: [3],   isLab: false, group: null },
            { subject: 'OSLF', slots: [4],   isLab: false, group: null },
            { subject: 'MCP',  slots: [6,7], isLab: true,  group: 'B'  },
        ],
        Wednesday: [
            { subject: 'CP',   slots: [1],   isLab: false, group: null },
            { subject: 'OSLF', slots: [3],   isLab: false, group: null },
            { subject: 'DET',  slots: [4],   isLab: false, group: null },
            { subject: 'EXPLORE', slots: [5], isLab: false, group: null },
            { subject: 'FEE',  slots: [7],   isLab: false, group: null },
        ],
        Thursday:  [
            { subject: 'DET',  slots: [1],   isLab: false, group: null },
            { subject: 'FEE',  slots: [2],   isLab: false, group: null },
            { subject: 'MCP',  slots: [3,4], isLab: true,  group: 'A'  },
            { subject: 'OSLF', slots: [6,7], isLab: true,  group: null },
        ],
        Friday:    [
            { subject: 'MCP',  slots: [1],   isLab: false, group: null },
            { subject: 'CP',   slots: [3,4], isLab: true,  group: null },
            { subject: 'EXPLORE', slots: [5], isLab: false, group: null },
            { subject: 'DET',  slots: [7],   isLab: false, group: null },
        ],
    },

    G9: {
        Monday:    [
            { subject: 'OSLF', slots: [1,2], isLab: true,  group: null },
            { subject: 'CP',   slots: [3,4], isLab: true,  group: null },
            { subject: 'EXPLORE', slots: [5], isLab: false, group: null },
            { subject: 'FEE',  slots: [7],   isLab: false, group: null },
        ],
        Tuesday:   [
            { subject: 'OSLF', slots: [1],   isLab: false, group: null },
            { subject: 'DET',  slots: [2],   isLab: false, group: null },
            { subject: 'FEE',  slots: [3,4], isLab: true,  group: null },
            { subject: 'MCP',  slots: [7],   isLab: false, group: null },
        ],
        Wednesday: [
            { subject: 'OSLF', slots: [1],   isLab: false, group: null },
            { subject: 'FEE',  slots: [2],   isLab: false, group: null },
            { subject: 'DET',  slots: [3],   isLab: false, group: null },
            { subject: 'EXPLORE', slots: [5], isLab: false, group: null },
            { subject: 'MCP',  slots: [7],   isLab: false, group: null },
        ],
        Thursday:  [
            { subject: 'MCP',  slots: [1,2], isLab: true,  group: 'A'  },
            { subject: 'CP',   slots: [3,4], isLab: true,  group: null },
            { subject: 'DET',  slots: [6],   isLab: false, group: null },
            { subject: 'CP',   slots: [7],   isLab: false, group: null },
        ],
        Friday:    [
            { subject: 'MCP',  slots: [1,2], isLab: true,  group: 'B'  },
            { subject: 'DET',  slots: [4],   isLab: false, group: null },
            { subject: 'EXPLORE', slots: [5], isLab: false, group: null },
            { subject: 'CP',   slots: [7],   isLab: false, group: null },
        ],
    },
};

const STORAGE_KEY_TIMETABLE = 'att_tracker_timetable_v1';

const Timetable = {
    _config: null, // { batch, group, customOverrides }

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

    setup(batch, group) {
        // group: 'A' or 'B'
        // start with hardcoded data, no overrides
        this._config = {
            batch,
            group,
            customOverrides: {} // { 'Monday': [...entries] } — replaces that day
        };
        this.save();
    },

    clear() {
        this._config = null;
        localStorage.removeItem(STORAGE_KEY_TIMETABLE);
    },

    getBatch() { return this._config?.batch || null; },
    getGroup() { return this._config?.group || null; },

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

        const group = this._config.group; // 'A' or 'B'

        return entries
            .filter(e => {
                // Skip explore hours
                if (e.subject === 'EXPLORE') return false;
                // Skip if this entry is for the OTHER group only
                if (e.group !== null && e.group !== group) return false;
                return true;
            })
            .map(e => ({
                subject: e.subject,
                subjectFull: SUBJECTS[e.subject] || e.subject,
                slots: e.slots,
                isLab: e.isLab,
                // attendanceCount = number of slots (lab = 2 attendance)
                attendanceCount: e.slots.length,
                group: e.group,
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
                s.name.toLowerCase().includes(code.toLowerCase())
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

    DAYS,
    SLOTS,
    SUBJECTS,
    TIMETABLES,
};