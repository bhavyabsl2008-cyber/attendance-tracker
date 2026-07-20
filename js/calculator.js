// calculator.js — Pure math engine. Chitkara University attendance calculations.
// CRITICAL: Every action recalculates percentage from attended/delivered ratio.
// Impact of actions scales with total classes held (50 classes = ~2% per skip, 100 classes = ~1% per skip)

const Calculator = {
    // Core percentage calculation — this is ground truth
    // Chitkara formula: (attended ÷ delivered) × 100
    percentage(attended, delivered) {
        if (!delivered || delivered === 0) return 0;
        return parseFloat(((attended / delivered) * 100).toFixed(2));
    },

    // Status based on the student's actual configured threshold, not a hardcoded 75%.
    // Bands are relative to threshold — identical to the old hardcoded values when threshold=75.
    status(percentage, threshold = 75) {
        if (percentage >= threshold + 15) return 'verysafe';
        if (percentage >= threshold + 5) return 'safe';
        if (percentage >= threshold) return 'warning';
        if (percentage >= threshold - 15) return 'danger';
        return 'debar';
    },

    // Safe skips: how many MORE classes can be held while staying at/above threshold
    // ONLY meaningful if currently at or above threshold+5 (verysafe/safe bands)
    safeSkips(attended, delivered, threshold = 75) {
        const currentPct = this.percentage(attended, delivered);

        // If at or below threshold, can't safely skip any more
        if (currentPct <= threshold) return 0;

        // If in warning zone (within 5% of threshold), show 0 — too risky
        if (currentPct < threshold + 5) return 0;

        // Solve for max x such that attended / (delivered + x) >= threshold/100:
        // x <= attended/t - delivered
        const t = threshold / 100;
        const maxSkips = Math.floor(attended / t - delivered);
        return Math.max(0, maxSkips);
    },

    // Classes needed to reach threshold from current position
    classesNeeded(attended, delivered, threshold = 75) {
        const currentPct = this.percentage(attended, delivered);
        if (currentPct >= threshold) return 0;

        // Formula: solve (attended + x) / (delivered + x) >= threshold/100
        // Rearranged: x >= (threshold/100 * delivered - attended) / (1 - threshold/100)
        const t = threshold / 100;
        const needed = Math.ceil((t * delivered - attended) / (1 - t));
        return Math.max(0, needed);
    },

    // When BELOW threshold: of the classes actually remaining this semester,
    // how many can they afford to miss and still reach `threshold` by the end
    // (attending the rest)? Bounded by real remaining classes, not infinite future.
    // Returns { canMiss, reachable, bestPossiblePct } — reachable=false means
    // even attending every single remaining class won't hit threshold this term.
    maxMissableToReachThreshold(attended, delivered, remainingClasses, threshold = 75) {
        const t = threshold / 100;
        const bestPossiblePct = this.percentage(attended + remainingClasses, delivered + remainingClasses);
        const reachable = bestPossiblePct >= threshold;

        if (remainingClasses <= 0) {
            return { canMiss: 0, reachable: this.percentage(attended, delivered) >= threshold, bestPossiblePct: this.percentage(attended, delivered) };
        }

        // Solve for max m (missed) such that (attended + remainingClasses - m) / (delivered + remainingClasses) >= t
        const maxMiss = Math.floor((attended + remainingClasses) - t * (delivered + remainingClasses));
        const canMiss = Math.max(0, Math.min(maxMiss, remainingClasses));

        return { canMiss, reachable, bestPossiblePct };
    },

    // ── ACTIONS ──

    // Skip 1 class: attended stays same, delivered increases
    skipClass(attended, delivered) {
        const newDelivered = delivered + 1;
        return {
            attended,
            delivered: newDelivered,
            percentage: this.percentage(attended, newDelivered),
            change: this.percentage(attended, newDelivered) - this.percentage(attended, delivered),
        };
    },

    // Attend 1 class: both increase
    attendClass(attended, delivered) {
        const newAttended = attended + 1;
        const newDelivered = delivered + 1;
        return {
            attended: newAttended,
            delivered: newDelivered,
            percentage: this.percentage(newAttended, newDelivered),
            change: this.percentage(newAttended, newDelivered) - this.percentage(attended, delivered),
        };
    },

    // Simulate skipping N classes
    simulateSkips(attended, delivered, skipCount) {
        const n = Math.max(0, skipCount);
        const newDelivered = delivered + n;
        return {
            attended,
            delivered: newDelivered,
            percentage: this.percentage(attended, newDelivered),
        };
    },

    // Simulate attending N classes
    simulateAttends(attended, delivered, attendCount) {
        const n = Math.max(0, attendCount);
        const newAttended = attended + n;
        const newDelivered = delivered + n;
        return {
            attended: newAttended,
            delivered: newDelivered,
            percentage: this.percentage(newAttended, newDelivered),
        };
    },

    // Full Day DL: attended increases by classesHeld, delivered increases by classesHeld
    // (student gets credited for classes on that day)
    applyFullDayDL(attended, delivered, classesHeld) {
        const n = Math.max(0, classesHeld);
        const newAttended = attended + n;
        const newDelivered = delivered + n;
        return {
            attended: newAttended,
            delivered: newDelivered,
            percentage: this.percentage(newAttended, newDelivered),
        };
    },

    // Partial DL (single subject): attended and delivered both increase by 1
    applyPartialDL(attended, delivered, hasClass) {
        if (!hasClass) return { attended, delivered, percentage: this.percentage(attended, delivered) };
        return this.attendClass(attended, delivered);
    },

    // ML (Medical Leave): +5 to both attended and delivered (blanket 5 classes)
    applyML(attended, delivered) {
        const newAttended = attended + 5;
        const newDelivered = delivered + 5;
        return {
            attended: newAttended,
            delivered: newDelivered,
            percentage: this.percentage(newAttended, newDelivered),
        };
    },

    // Semester progress
    semesterProgress() {
        // Dates sourced from Timetable.SEMESTER — single source of truth,
        // see js/timetable.js (Ref: CUIET/CSE/ACAD/2026/227a, 13 July 2026)
        const start = new Date(Timetable.SEMESTER.start + 'T00:00:00');
        const end = new Date(Timetable.SEMESTER.end + 'T00:00:00');
        const today = new Date();

        const total = end - start;
        const elapsed = today - start;
        const progress = Math.min(Math.max((elapsed / total) * 100, 0), 100);
        const remainingDays = Math.max(Math.ceil((end - today) / 86400000), 0);
        const remainingClasses = Math.round(remainingDays * 0.6);

        return {
            progress: parseFloat(progress.toFixed(1)),
            remainingDays,
            remainingClasses,
        };
    },

    // Smart alert message based on current state
    // remainingClasses is optional — when provided (student has a timetable set up),
    // ALL messages (not just danger/debar) use the reachability-bounded "can still miss"
    // count instead of the old unbounded safeSkips formula, which caused a jarring
    // discontinuity right at the threshold line (e.g. "can miss 20" at 69%, then
    // suddenly "can miss 0" at exactly 75% — two different models colliding).
    smartAlert(attended, delivered, threshold = 75, remainingClasses = null) {
        const pct = this.percentage(attended, delivered);
        const needed = this.classesNeeded(attended, delivered, threshold);
        const status = this.status(pct, threshold);

        // Calculate actual impact of one skip and one attend from THIS position
        const skipResult = this.skipClass(attended, delivered);
        const skipImpact = pct - skipResult.percentage;

        const attendResult = this.attendClass(attended, delivered);
        const attendImpact = attendResult.percentage - pct;

        // Reachability-bounded miss count — the SAME formula used regardless of
        // current status, so the number is continuous across the threshold line.
        // Falls back to the old unbounded safeSkips only when we don't know how
        // many classes are actually left (no timetable set up).
        let skips, reachable = true, bestPossiblePct = null;
        if (remainingClasses !== null) {
            const recovery = this.maxMissableToReachThreshold(attended, delivered, remainingClasses, threshold);
            skips = recovery.canMiss;
            reachable = recovery.reachable;
            bestPossiblePct = recovery.bestPossiblePct;
        } else {
            skips = this.safeSkips(attended, delivered, threshold);
        }

        if (status === 'verysafe') {
            return {
                type: 'verysafe',
                message: `Very safe — you can afford to miss ${skips} more class${skips !== 1 ? 'es' : ''} (each skip costs ~${skipImpact.toFixed(2)}%)`,
            };
        }
        if (status === 'safe') {
            return {
                type: 'safe',
                message: `Safe — you can miss ${skips} more class${skips !== 1 ? 'es' : ''} before entering risk zone (each skip costs ~${skipImpact.toFixed(2)}%)`,
            };
        }
        if (status === 'warning') {
            // This band is >= threshold by definition, so "attend N to recover" never
            // made sense here — there's nothing to recover from. Reframe as a margin warning.
            return {
                type: 'warning',
                message: skips > 0
                    ? `Right at the edge — you can still miss ${skips} more this semester, but any miss right now cuts it close (each skip costs ~${skipImpact.toFixed(2)}%)`
                    : `Right at the edge — one more miss could drop you below ${threshold}% (each skip costs ~${skipImpact.toFixed(2)}%)`,
            };
        }
        if (status === 'danger') {
            if (remainingClasses !== null && !reachable) {
                return {
                    type: 'danger',
                    message: `Not reachable this semester — even attending every remaining class only gets you to ${bestPossiblePct}%. Talk to your mentor about condonation.`,
                };
            }
            return {
                type: 'danger',
                message: `Attend ${needed} consecutive class${needed !== 1 ? 'es' : ''} to recover to ${threshold}% (each attend gains ~${attendImpact.toFixed(2)}%)`,
            };
        }

        // status === 'debar'
        if (remainingClasses !== null && !reachable) {
            return {
                type: 'debar',
                message: `Critical & not reachable this semester — even attending every remaining class only gets you to ${bestPossiblePct}%. Talk to your mentor immediately.`,
            };
        }
        return {
            type: 'debar',
            message: `Critical — attend every remaining class immediately. Need ${needed} classes to reach ${threshold}% (each skip costs ~${skipImpact.toFixed(2)}%)`,
        };
    },

    // Predict end-of-semester attendance (best case = attend all remaining, worst case = skip all)
    predictEndSem(attended, delivered, remainingClasses) {
        if (remainingClasses <= 0) {
            return {
                bestCase: this.percentage(attended, delivered),
                worstCase: this.percentage(attended, delivered),
            };
        }
        return {
            bestCase: this.percentage(attended + remainingClasses, delivered + remainingClasses),
            worstCase: this.percentage(attended, delivered + remainingClasses),
        };
    },
};