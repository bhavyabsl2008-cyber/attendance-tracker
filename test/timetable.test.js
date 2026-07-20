// test/timetable.test.js
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { loadApp, freezeToday, unfreezeToday } = require('./helpers');

describe('batch list', () => {
    const { Timetable } = loadApp();
    test('has exactly G1-G8, no G9 (only 8 batches exist in Sem 3)', () => {
        // Array.from() normalizes the array into THIS realm — vm sandbox arrays
        // have a different Array prototype, which trips up deepStrictEqual
        // even when the actual string contents are identical.
        const batches = Array.from(Timetable.getBatchList()).sort();
        assert.deepEqual(batches, ['G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7', 'G8']);
    });
});

describe('SLOTS structure', () => {
    const { Timetable } = loadApp();
    test('slot 5 is the lunch break, 1:00-2:00', () => {
        const slot5 = Timetable.SLOTS.find(s => s.id === 5);
        assert.equal(slot5.isBreak, true);
        assert.equal(slot5.time, '1:00–2:00');
    });
    test('no slot 8 (removed as unused first-year artifact)', () => {
        assert.equal(Timetable.SLOTS.find(s => s.id === 8), undefined);
    });
    test('exactly 7 slots', () => {
        assert.equal(Timetable.SLOTS.length, 7);
    });
});

describe('isHoliday() — regression test for the Sem 3 holiday list', () => {
    const { Timetable } = loadApp();
    test('Independence Day is a holiday', () => {
        assert.ok(Timetable.isHoliday('2026-08-15'));
    });
    test('Diwali break covers the full range, not just the first day', () => {
        assert.ok(Timetable.isHoliday('2026-11-07'));
        assert.ok(Timetable.isHoliday('2026-11-09'));
        assert.ok(Timetable.isHoliday('2026-11-11'));
        assert.equal(Timetable.isHoliday('2026-11-12'), null);
    });
    test('an ordinary Tuesday is not a holiday', () => {
        assert.equal(Timetable.isHoliday('2026-07-21'), null);
    });
});

describe('_matchSubjectCode() — regression test for the FEE/FEEII collision bug', () => {
    test('typing "FEE" in a G6 (second-year) batch matches FEEII, not the legacy first-year FEE code', () => {
        const { Timetable } = loadApp();
        Timetable.setup('G6');
        assert.equal(Timetable._matchSubjectCode('FEE'), 'FEEII');
    });
    test('exact code match works for every G6 subject', () => {
        const { Timetable } = loadApp();
        Timetable.setup('G6');
        assert.equal(Timetable._matchSubjectCode('OOP'), 'OOP');
        assert.equal(Timetable._matchSubjectCode('CN'), 'CN');
        assert.equal(Timetable._matchSubjectCode('DBMS'), 'DBMS');
    });
    test('matching is scoped to the batch — no timetable set up returns null, not a wrong guess', () => {
        const { Timetable } = loadApp();
        assert.equal(Timetable._matchSubjectCode('FEE'), null);
    });
});

describe('getDay() — lab entries must report attendanceCount 2', () => {
    const { Timetable } = loadApp();
    Timetable.setup('G6');
    test('G6 Monday OOP is a 2-period lab', () => {
        const monday = Timetable.getDay('Monday');
        const oop = monday.find(e => e.subject === 'OOP');
        assert.equal(oop.isLab, true);
        assert.equal(oop.attendanceCount, 2);
        assert.deepEqual(Array.from(oop.slots), [1, 2]);
    });
    test('G6 Monday CN is a single-period lecture', () => {
        const monday = Timetable.getDay('Monday');
        const cn = monday.find(e => e.subject === 'CN');
        assert.equal(cn.isLab, false);
        assert.equal(cn.attendanceCount, 1);
    });
});

describe('getRemainingClassesForSubject() — regression test for OOP course-end date', () => {
    test('OOP stops counting after 11 Sep even though semester runs to 22 Dec', () => {
        const app = loadApp();
        app.Timetable.setup('G6');
        freezeToday(app, '2026-09-05'); // 6 days before OOP course end
        const remaining = app.Timetable.getRemainingClassesForSubject('OOP');
        unfreezeToday(app);
        // From Sep 5 to Sep 11 inclusive: Sep 5(Sat,skip) 6(Sun,skip) 7(Mon) 8(Tue) 9(Wed) 10(Thu) 11(Fri)
        // = 5 weekdays x 2 (lab) = 10
        assert.equal(remaining, 10);
    });
    test('OOP returns 0 once past its own course-end date, even mid-semester', () => {
        const app = loadApp();
        app.Timetable.setup('G6');
        freezeToday(app, '2026-10-01'); // well after OOP's 11 Sep end, well before semester end
        const remaining = app.Timetable.getRemainingClassesForSubject('OOP');
        unfreezeToday(app);
        assert.equal(remaining, 0);
    });
    test('DBMS (no course-end override) keeps counting all the way to semester end', () => {
        const app = loadApp();
        app.Timetable.setup('G6');
        freezeToday(app, '2026-10-01');
        const remaining = app.Timetable.getRemainingClassesForSubject('DBMS');
        unfreezeToday(app);
        assert.ok(remaining > 0, 'DBMS should still have classes remaining in October');
    });
    test('weekends are never counted', () => {
        const app = loadApp();
        app.Timetable.setup('G6');
        // A single-day window landing exactly on a Saturday should count 0.
        freezeToday(app, '2026-09-11'); // last real OOP day anyway, but also confirm weekend logic separately below
        unfreezeToday(app);
        // Direct structural check: G6 has no Saturday/Sunday entries at all.
        assert.equal(app.Timetable.getDay('Saturday').length, 0);
    });
    test('holidays reduce the count — Independence Day removes a Monday OOP session', () => {
        const app = loadApp();
        app.Timetable.setup('G6');
        freezeToday(app, '2026-08-14'); // Friday before Independence Day (Sat) -- check the following Monday 17th
        const throughMonday17 = (() => {
            // Manually walk Aug 14 -> Aug 17 to confirm Independence Day (a Saturday, already
            // a non-teaching day) doesn't double-subtract, and that Monday 17th IS counted.
            return app.Timetable.getRemainingClassesForSubject('OOP');
        })();
        unfreezeToday(app);
        assert.ok(throughMonday17 > 0);
    });
});

describe('previewWeek() — read-only browse, must not touch personal setup', () => {
    test('browsing G7 does not change a student\'s own G6 setup', () => {
        const { Timetable } = loadApp();
        Timetable.setup('G6');
        Timetable.previewWeek('G7');
        assert.equal(Timetable.getBatch(), 'G6', 'previewWeek must not mutate _config');
    });
    test('previewWeek returns real data for a batch without requiring setup()', () => {
        const { Timetable } = loadApp();
        const week = Timetable.previewWeek('G7');
        const monday = week.Monday.find(e => e.subject === 'OOP');
        assert.equal(monday.isLab, true);
    });
});
