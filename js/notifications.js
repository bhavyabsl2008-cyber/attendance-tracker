// notifications.js — local, in-browser "class just ended, log attendance?" reminders.
// No server, no push service, no cost. Works only while this tab/PWA is open in the
// background on this device — the browser can't wake a closed tab to fire these.
// (Reliable notifications while the app is fully closed need the native app wrapper,
// tracked separately.)

const Notifications = {
    _timers: [],

    isSupported() {
        return 'Notification' in window;
    },

    permission() {
        return this.isSupported() ? Notification.permission : 'unsupported';
    },

    async requestPermission() {
        if (!this.isSupported()) {
            UI.toast('Notifications not supported on this browser', 'error');
            return false;
        }
        const result = await Notification.requestPermission();
        if (result === 'granted') {
            UI.toast('Reminders on — you\'ll get a nudge when class ends', 'success');
            this.scheduleToday();
        } else {
            UI.toast('Notifications blocked — enable in browser settings to use this', 'error');
        }
        return result === 'granted';
    },

    // Clears any timers from a previous call so re-running (e.g. after the
    // timetable changes, or on every page load) never double-fires.
    _clear() {
        this._timers.forEach(t => clearTimeout(t));
        this._timers = [];
    },

    // Schedule one reminder per remaining period today. Only schedules periods
    // whose end time is still in the future — nothing fires for classes already over.
    scheduleToday() {
        this._clear();
        if (this.permission() !== 'granted') return;
        if (!Timetable.isSetup()) return;

        const now = new Date();
        const dayName = Timetable.DAYS[now.getDay() - 1];
        if (!dayName || now.getDay() === 0) return; // Sunday / out of range

        const dateStr = now.toISOString().slice(0, 10);
        if (Timetable.isHoliday(dateStr)) return;

        const entries = Timetable.getDay(dayName);
        const nowMin = now.getHours() * 60 + now.getMinutes();

        entries.forEach(entry => {
            const lastSlot = Math.max(...entry.slots);
            const range = Timetable.getSlotRange(lastSlot);
            if (!range || range.end <= nowMin) return; // already over

            const msUntil = (range.end - nowMin) * 60 * 1000;
            const subject = App._findSubjectForCode(entry.subject);
            const label = subject ? subject.name : entry.subject;

            const timer = setTimeout(() => {
                this._fire(label, subject ? subject.id : null);
            }, msUntil);
            this._timers.push(timer);
        });
    },

    _fire(subjectLabel, subjectId) {
        if (this.permission() !== 'granted') return;
        const notif = new Notification(`${subjectLabel} just ended`, {
            body: 'Log today\'s attendance for this class',
            icon: './icons/icon-192.png',
            tag: `attendance-${subjectId}-${Date.now()}`,
        });
        notif.onclick = () => {
            window.focus();
            if (subjectId) UI.scrollToSubject?.(subjectId);
            notif.close();
        };
    },
};
