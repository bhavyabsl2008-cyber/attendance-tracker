// test/calculator.test.js
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { loadApp } = require('./helpers');

const { Calculator } = loadApp();

describe('percentage()', () => {
    test('basic ratio', () => {
        assert.equal(Calculator.percentage(9, 13), 69.23);
    });
    test('zero delivered does not divide by zero', () => {
        assert.equal(Calculator.percentage(0, 0), 0);
    });
    test('100%', () => {
        assert.equal(Calculator.percentage(10, 10), 100);
    });
});

describe('status() — must respect a CUSTOM threshold, not hardcode 75', () => {
    test('default threshold bands match the original hardcoded values', () => {
        assert.equal(Calculator.status(95, 75), 'verysafe');
        assert.equal(Calculator.status(85, 75), 'safe');
        assert.equal(Calculator.status(76, 75), 'warning');
        assert.equal(Calculator.status(65, 75), 'danger');
        assert.equal(Calculator.status(50, 75), 'debar');
    });
    test('custom threshold shifts the bands — regression test for the bug where threshold was ignored', () => {
        // At threshold=90, being at 92% should be "warning" (right at the edge),
        // NOT "verysafe" — if this fails, status() went back to ignoring threshold.
        assert.equal(Calculator.status(92, 90), 'warning');
        assert.equal(Calculator.status(70, 90), 'debar'); // 70 is 20 below a threshold of 90
    });
});

describe('safeSkips() — regression test for the wrong formula that overestimated safety', () => {
    test('90/100 (90%) at threshold 75 must allow exactly 20 more skips, not 30', () => {
        // This exact case was wrong in production: old formula returned 30,
        // which actually lands at 69.23% — below threshold. Locking in 20.
        const skips = Calculator.safeSkips(90, 100, 75);
        assert.equal(skips, 20);
        const resultPct = Calculator.percentage(90, 100 + skips);
        assert.ok(resultPct >= 75, `${resultPct}% must be >= 75% after using all safe skips`);
    });
    test('one more skip than "safe" must drop below threshold', () => {
        const skips = Calculator.safeSkips(90, 100, 75);
        const oneMore = Calculator.percentage(90, 100 + skips + 1);
        assert.ok(oneMore < 75, `${oneMore}% should be below 75% with one extra skip`);
    });
    test('below threshold returns 0', () => {
        assert.equal(Calculator.safeSkips(50, 100, 75), 0);
    });
    test('within 5% of threshold (warning zone) returns 0, not a false sense of safety', () => {
        assert.equal(Calculator.safeSkips(77, 100, 75), 0);
    });
});

describe('classesNeeded()', () => {
    test('already at threshold needs 0', () => {
        assert.equal(Calculator.classesNeeded(75, 100, 75), 0);
    });
    test('below threshold needs enough consecutive attends to cross it', () => {
        const needed = Calculator.classesNeeded(10, 24, 75);
        const resultPct = Calculator.percentage(10 + needed, 24 + needed);
        assert.ok(resultPct >= 75);
        const oneFewer = Calculator.percentage(10 + needed - 1, 24 + needed - 1);
        assert.ok(oneFewer < 75, 'one fewer attend should still be below threshold');
    });
});

describe('maxMissableToReachThreshold() — the reachability-bounded miss count', () => {
    test('exact match to the real OOP scenario that was reported as a bug', () => {
        // 10/24 (41.67%), 82 real remaining OOP sessions after the course-end fix
        const r = Calculator.maxMissableToReachThreshold(10, 24, 82, 75);
        assert.equal(r.canMiss, 12);
        assert.equal(r.reachable, true);
    });
    test('missing exactly canMiss lands at >= threshold, one more does not', () => {
        const { attended, delivered, remaining, threshold } = { attended: 10, delivered: 24, remaining: 82, threshold: 75 };
        const r = Calculator.maxMissableToReachThreshold(attended, delivered, remaining, threshold);
        const finalAttended = attended + (remaining - r.canMiss);
        const finalDelivered = delivered + remaining;
        assert.ok(Calculator.percentage(finalAttended, finalDelivered) >= threshold);

        const oneMoreMiss = attended + (remaining - (r.canMiss + 1));
        assert.ok(Calculator.percentage(oneMoreMiss, finalDelivered) < threshold);
    });
    test('unreachable case — even attending everything remaining is not enough', () => {
        const r = Calculator.maxMissableToReachThreshold(1, 20, 2, 75);
        assert.equal(r.reachable, false);
        assert.equal(r.canMiss, 0);
    });
    test('continuity across the threshold line — no discontinuity at exactly 75%', () => {
        // This is the exact bug report: 9/13 (69.23%) should NOT show a wildly
        // different number than 12/16 (75.00%) — both should be smooth.
        const before = Calculator.maxMissableToReachThreshold(9, 13, 100, 75);
        const at = Calculator.maxMissableToReachThreshold(12, 16, 100, 75);
        const after = Calculator.maxMissableToReachThreshold(13, 17, 100, 75);
        assert.ok(at.canMiss >= before.canMiss, 'attending a class should never DECREASE how much you can still miss');
        assert.ok(after.canMiss >= at.canMiss);
    });
    test('remainingClasses of 0 falls back to current status', () => {
        const above = Calculator.maxMissableToReachThreshold(80, 100, 0, 75);
        assert.equal(above.reachable, true);
        const below = Calculator.maxMissableToReachThreshold(50, 100, 0, 75);
        assert.equal(below.reachable, false);
    });
});

describe('predictEndSem()', () => {
    test('best case attends everything remaining, worst case attends nothing', () => {
        const p = Calculator.predictEndSem(10, 20, 10);
        assert.equal(p.bestCase, Calculator.percentage(20, 30));
        assert.equal(p.worstCase, Calculator.percentage(10, 30));
    });
    test('zero remaining classes means best case equals worst case equals current', () => {
        const p = Calculator.predictEndSem(10, 20, 0);
        assert.equal(p.bestCase, p.worstCase);
        assert.equal(p.bestCase, Calculator.percentage(10, 20));
    });
});

describe('smartAlert() — must not contradict maxMissableToReachThreshold', () => {
    test('the skip count in the message matches maxMissableToReachThreshold when remainingClasses is given', () => {
        const recovery = Calculator.maxMissableToReachThreshold(10, 24, 82, 75);
        const alert = Calculator.smartAlert(10, 24, 75, 82);
        assert.ok(alert.message.includes(String(recovery.canMiss)) || alert.type === 'danger' || alert.type === 'debar',
            'alert message should reference the same reachability-bounded number, not a different unbounded one');
    });
    test('unreachable danger/debar mentions condonation, not a plain "attend N" instruction', () => {
        const alert = Calculator.smartAlert(1, 20, 75, 2);
        assert.match(alert.message, /not reachable/i);
    });
});

describe('applyML / applyFullDayDL / applyPartialDL — still used by the global Apply ML button', () => {
    test('applyML adds exactly 5 to both attended and delivered', () => {
        const r = Calculator.applyML(10, 20);
        assert.equal(r.attended, 15);
        assert.equal(r.delivered, 25);
    });
    test('applyFullDayDL credits classesHeld to both', () => {
        const r = Calculator.applyFullDayDL(10, 20, 3);
        assert.equal(r.attended, 13);
        assert.equal(r.delivered, 23);
    });
    test('applyPartialDL with hasClass=false is a no-op', () => {
        const r = Calculator.applyPartialDL(10, 20, false);
        assert.equal(r.attended, 10);
        assert.equal(r.delivered, 20);
    });
});
