// calculator.js - All attendance calculation logic

const MINIMUM_ATTENDANCE = 75;
const DANGER_THRESHOLD = 80;
const DEBAR_THRESHOLD = 60;

function calculatePercentage(attended, delivered) {
    if (delivered === 0) return 0;
    return ((attended / delivered) * 100).toFixed(2);
}

function classesNeededToReach75(attended, delivered) {
    // how many consecutive classes needed to reach 75%
    let needed = 0;
    while (((attended + needed) / (delivered + needed)) * 100 < 75) {
        needed++;
    }
    return needed;
}

function safeSkips(attended, delivered) {
    // how many classes can be skipped while staying above 75%
    let skips = 0;
    while (((attended) / (delivered + skips + 1)) * 100 >= 75) {
        skips++;
    }
    return skips;
}

function getStatus(percentage) {
    if (percentage >= DANGER_THRESHOLD) return "safe";
    if (percentage >= MINIMUM_ATTENDANCE) return "warning";
    if (percentage >= DEBAR_THRESHOLD) return "danger";
    return "debar";
}

function simulateLeave(attended, delivered, leaveDays) {
    // DL/ML adds to both attended and delivered
    let newAttended = attended + leaveDays;
    let newDelivered = delivered + leaveDays;
    return calculatePercentage(newAttended, newDelivered);
}

function predictEndSem(attended, delivered, remainingClasses) {
    // if student attends ALL remaining classes
    let bestCase = calculatePercentage(attended + remainingClasses, delivered + remainingClasses);
    // if student attends NO remaining classes
    let worstCase = calculatePercentage(attended, delivered + remainingClasses);
    return { bestCase, worstCase };
}