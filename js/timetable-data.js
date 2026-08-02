// timetable-data.js — pure timetable data: subject codes, per-batch weekly
// schedules, semester calendar, holidays. No logic, no methods, no state —
// that lives in timetable-core.js, which this file must load before.

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
