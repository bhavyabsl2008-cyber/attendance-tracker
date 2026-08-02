// test/streak.test.js — Regression tests for Storage.getLoggingStreak()'s
// weekend-aware behavior. Real Jan 2026 calendar dates are used throughout
// so the weekday/weekend claims below are actually true, not assumed:
//   Mon 2026-01-12, Tue 01-13, Wed 01-14, Thu 01-15, Fri 01-16,
//   Sat 01-17, Sun 01-18, Mon 01-19, Tue 01-20, Wed 01-21.

const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { loadStorage, freezeToday, unfreezeToday } = require('./helpers');

let app;

// Fresh Storage + fresh in-memory localStorage per test so cases can't
// contaminate each other.
beforeEach(() => {
    app = loadStorage();
});

function seedHistory(dates) {
    const entries = dates.map(date => ({ date, type: 'test' }));
    app._context.localStorage.setItem(app.STORAGE_KEYS.HISTORY, JSON.stringify(entries));
}

describe('getLoggingStreak() — weekend-aware', () => {
    test('Mon -> Tue -> Wed, today = Wed => 3', () => {
        seedHistory(['2026-01-12', '2026-01-13', '2026-01-14']);
        freezeToday(app, '2026-01-14');
        assert.equal(app.Storage.getLoggingStreak(), 3);
        unfreezeToday(app);
    });

    test('Fri -> Mon, today = Mon => 2 (weekend does not break it)', () => {
        seedHistory(['2026-01-16', '2026-01-19']);
        freezeToday(app, '2026-01-19');
        assert.equal(app.Storage.getLoggingStreak(), 2);
        unfreezeToday(app);
    });

    test('Thu -> Fri -> Mon, today = Mon => 3', () => {
        seedHistory(['2026-01-15', '2026-01-16', '2026-01-19']);
        freezeToday(app, '2026-01-19');
        assert.equal(app.Storage.getLoggingStreak(), 3);
        unfreezeToday(app);
    });

    test('opening on Saturday preserves Friday\'s streak', () => {
        // Wed, Thu, Fri logged (streak of 3 ending Friday). Nobody logs
        // Saturday because there's nothing to log. Opening the app on
        // Saturday must still show 3, not 0.
        seedHistory(['2026-01-14', '2026-01-15', '2026-01-16']);
        freezeToday(app, '2026-01-17'); // Sat
        assert.equal(app.Storage.getLoggingStreak(), 3);
        unfreezeToday(app);
    });

    test('opening on Sunday preserves Friday\'s streak', () => {
        seedHistory(['2026-01-14', '2026-01-15', '2026-01-16']);
        freezeToday(app, '2026-01-18'); // Sun
        assert.equal(app.Storage.getLoggingStreak(), 3);
        unfreezeToday(app);
    });

    test('a missing weekday (not a weekend) breaks the streak', () => {
        // Mon logged, Tue MISSING, Wed logged. Today = Wed.
        // Tue was a real weekday with nothing logged, so the streak
        // resets — only Wed counts.
        seedHistory(['2026-01-12', '2026-01-14']);
        freezeToday(app, '2026-01-14');
        assert.equal(app.Storage.getLoggingStreak(), 1);
        unfreezeToday(app);
    });

    test('a stray weekend log does not itself increment the streak count', () => {
        // Fri and Mon logged normally. Saturday also happens to have a
        // history entry (e.g. a backdated import) — it must not add to
        // the count; Sat/Sun are neutral days, never counted, even if
        // data exists for them.
        seedHistory(['2026-01-16', '2026-01-17', '2026-01-19']);
        freezeToday(app, '2026-01-19');
        assert.equal(app.Storage.getLoggingStreak(), 2);
        unfreezeToday(app);
    });

    test('Monday with no prior relevant log => streak of 1, not inflated by the preceding weekend', () => {
        seedHistory(['2026-01-19']);
        freezeToday(app, '2026-01-19');
        assert.equal(app.Storage.getLoggingStreak(), 1);
        unfreezeToday(app);
    });

    test('no history at all => 0', () => {
        seedHistory([]);
        freezeToday(app, '2026-01-19');
        assert.equal(app.Storage.getLoggingStreak(), 0);
        unfreezeToday(app);
    });
});
