// calculator.js — Pure math engine. No DOM, no side effects.

const Calculator = {
    percentage(attended, delivered) {
        if (!delivered || delivered === 0) return 0;
        return parseFloat(((attended / delivered) * 100).toFixed(2));
    },

    status(percentage, threshold = 75) {
        const safe = threshold + 5;
        if (percentage >= safe) return 'safe';
        if (percentage >= threshold) return 'warning';
        if (percentage >= threshold - 15) return 'danger';
        return 'debar';
    },

    safeSkips(attended, delivered, threshold = 75) {
        if (this.percentage(attended, delivered) < threshold) return 0;
        let skips = 0;
        while (((attended) / (delivered + skips + 1)) * 100 >= threshold) {
            skips++;
        }
        return skips;
    },

    classesNeeded(attended, delivered, threshold = 75) {
        if (this.percentage(attended, delivered) >= threshold) return 0;
        let needed = 0;
        while (((attended + needed) / (delivered + needed)) * 100 < threshold) {
            needed++;
        }
        return needed;
    },

    classesUntilDanger(attended, delivered, threshold = 75) {
        // how many more misses until dropping below threshold
        let misses = 0;
        let current = this.percentage(attended, delivered);
        if (current < threshold) return 0;
        while (((attended) / (delivered + misses + 1)) * 100 >= threshold) {
            misses++;
        }
        return misses;
    },

    predictEndSem(attended, delivered, remainingClasses) {
        if (remainingClasses <= 0) return {
            bestCase: this.percentage(attended, delivered),
            worstCase: this.percentage(attended, delivered)
        };
        return {
            bestCase: this.percentage(attended + remainingClasses, delivered + remainingClasses),
            worstCase: this.percentage(attended, delivered + remainingClasses)
        };
    },

    simulateSkip(attended, delivered, skipCount) {
        const newDelivered = delivered + Math.max(0, skipCount);
        return this.percentage(attended, newDelivered);
    },

    simulateAttend(attended, delivered, attendCount) {
        const n = Math.max(0, attendCount);
        return this.percentage(attended + n, delivered + n);
    },

    applyML(attended, delivered) {
        return {
            attended: attended + 5,
            delivered: delivered + 5,
            percentage: this.percentage(attended + 5, delivered + 5)
        };
    },

    applyFullDayDL(attended, delivered, classesHeld) {
        const n = Math.max(0, classesHeld);
        return {
            attended: attended + n,
            delivered: delivered + n,
            percentage: this.percentage(attended + n, delivered + n)
        };
    },

    applyPartialDL(attended, delivered, hasClass) {
        const n = hasClass ? 1 : 0;
        return {
            attended: attended + n,
            delivered: delivered + n,
            percentage: this.percentage(attended + n, delivered + n)
        };
    },

    semesterProgress() {
        const start = new Date('2026-01-20');
        const end = new Date('2026-06-15');
        const today = new Date();
        const total = end - start;
        const elapsed = today - start;
        const progress = Math.min(Math.max((elapsed / total) * 100, 0), 100);
        const remainingDays = Math.max(Math.ceil((end - today) / 86400000), 0);
        const remainingClasses = Math.round(remainingDays * 0.6);
        return {
            progress: parseFloat(progress.toFixed(1)),
            remainingDays,
            remainingClasses
        };
    },

    smartAlert(attended, delivered, threshold = 75) {
        const pct = this.percentage(attended, delivered);
        const skips = this.safeSkips(attended, delivered, threshold);
        const needed = this.classesNeeded(attended, delivered, threshold);

        if (pct >= threshold + 5) {
            return {
                type: 'safe',
                message: `You can safely miss ${skips} more class${skips !== 1 ? 'es' : ''} and stay above ${threshold}%`
            };
        }
        if (pct >= threshold) {
            return {
                type: 'warning',
                message: `Careful — only ${skips} miss${skips !== 1 ? 'es' : ''} left before dropping below ${threshold}%`
            };
        }
        if (pct >= threshold - 15) {
            return {
                type: 'danger',
                message: `Attend ${needed} consecutive class${needed !== 1 ? 'es' : ''} to get back above ${threshold}%`
            };
        }
        return {
            type: 'debar',
            message: `Critical — attend every class immediately. Need ${needed} classes to reach ${threshold}%`
        };
    }
};