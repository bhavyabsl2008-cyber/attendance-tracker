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

    // Status based on Chitkara's thresholds
    status(percentage, threshold = 75) {
        if (percentage >= 90) return 'verysafe';    // 90%+ = Very Safe
        if (percentage >= 80) return 'safe';        // 80-89% = Comfortable
        if (percentage >= 75) return 'warning';     // 75-79% = Risk Zone
        if (percentage >= 60) return 'danger';      // Below 75% = Detention Risk (but give some breathing room)
        return 'debar';                              // Critical
    },

    // Safe skips: how many MORE classes can be held while staying at/above threshold
    // ONLY meaningful if currently at or above threshold
    safeSkips(attended, delivered, threshold = 75) {
        const currentPct = this.percentage(attended, delivered);
        
        // If already below threshold, can't safely skip any more
        if (currentPct < threshold) return 0;
        
        // Formula: solve (attended) / (delivered + x) = threshold/100
        // x = attended * (100/threshold - 1)
        const t = threshold / 100;
        const maxSkips = Math.floor(attended * ((1 - t) / t));
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
        // Jan 20 to Jun 15 2026 (148 days, ~88 classes at 0.6 per day)
        const start = new Date(2026, 0, 20);  // Jan 20 local time
        const end = new Date(2026, 5, 15);   // Jun 15 local time
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
    smartAlert(attended, delivered, threshold = 75) {
        const pct = this.percentage(attended, delivered);
        const skips = this.safeSkips(attended, delivered, threshold);
        const needed = this.classesNeeded(attended, delivered, threshold);
        const status = this.status(pct, threshold);

        // Calculate actual impact of one skip and one attend from THIS position
        const skipResult = this.skipClass(attended, delivered);
        const skipImpact = pct - skipResult.percentage;

        const attendResult = this.attendClass(attended, delivered);
        const attendImpact = attendResult.percentage - pct;

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
            return {
                type: 'warning',
                message: `Risk zone — attend ${needed} consecutive class${needed !== 1 ? 'es' : ''} to recover to ${threshold}% (each attend gains ~${attendImpact.toFixed(2)}%)`,
            };
        }
        if (status === 'danger') {
            return {
                type: 'danger',
                message: `Critical — attend ${needed} classes immediately. Each skip costs ~${skipImpact.toFixed(2)}%, each attend gains ~${attendImpact.toFixed(2)}%`,
            };
        }
        return {
            type: 'debar',
            message: `Detention risk — attend every remaining class. Need ${needed} classes to reach ${threshold}%`,
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