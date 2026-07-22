// dashboard.js — personal dashboard: profile/sync status + summary stats.
// All numbers are computed from real stored data. The "streak" specifically
// only counts forward from whenever the history log started (see storage.js
// comment) — there's no way to backfill days that were logged before this
// existed, so a brand-new install correctly shows a 0/1-day streak even for
// someone who's been diligent for weeks under the old (unlogged) system.

const Dashboard = {
    show() {
        document.getElementById('ui-modal')?.remove();

        const stats = this._computeStats();
        const profile = this._profileInfo();

        const modal = document.createElement('div');
        modal.id = 'ui-modal';
        modal.className = 'ui-modal-overlay';
        modal.innerHTML = `
            <div class="ui-modal-box dashboard-box" role="dialog" aria-modal="true">
                <button class="dashboard-close" id="dashboard-close" aria-label="Close">✕</button>

                <div class="dashboard-profile">
                    ${profile.avatarHtml}
                    <div class="dashboard-profile-text">
                        <div class="dashboard-profile-name">${profile.name}</div>
                        <div class="dashboard-profile-sub">${profile.sub}</div>
                    </div>
                </div>

                <div class="dashboard-stats-grid">
                    <div class="dashboard-stat">
                        <div class="dashboard-stat-value">${stats.overallPct === null ? '—' : stats.overallPct + '%'}</div>
                        <div class="dashboard-stat-label">Overall attendance</div>
                    </div>
                    <div class="dashboard-stat">
                        <div class="dashboard-stat-value">${stats.streak}</div>
                        <div class="dashboard-stat-label">Day logging streak</div>
                    </div>
                    <div class="dashboard-stat">
                        <div class="dashboard-stat-value">${stats.best ? stats.best.pct + '%' : '—'}</div>
                        <div class="dashboard-stat-label">${stats.best ? this._escape(stats.best.name) : 'Best subject'}</div>
                    </div>
                    <div class="dashboard-stat">
                        <div class="dashboard-stat-value">${stats.worst ? stats.worst.pct + '%' : '—'}</div>
                        <div class="dashboard-stat-label">${stats.worst ? this._escape(stats.worst.name) : 'Needs attention'}</div>
                    </div>
                </div>

                <div class="dashboard-note">Streak counts consecutive days you've logged something in Presynce — it started tracking on ${stats.trackingSince}, so it won't reflect attendance from before that.</div>
            </div>
        `;

        document.body.appendChild(modal);
        requestAnimationFrame(() => modal.classList.add('ui-modal-show'));

        const close = () => {
            modal.classList.remove('ui-modal-show');
            setTimeout(() => modal.remove(), 200);
        };
        document.getElementById('dashboard-close').addEventListener('click', close);
        modal.addEventListener('click', (e) => { if (e.target === modal) close(); });
    },

    _profileInfo() {
        const signedIn = typeof Auth !== 'undefined' && Auth.isSignedIn();
        const batch = (typeof Timetable !== 'undefined' && Timetable.isSetup()) ? Timetable.getBatch() : null;

        if (signedIn) {
            const u = Auth.currentUser;
            const avatarHtml = u.photoURL
                ? `<img class="dashboard-avatar" src="${u.photoURL}" alt="">`
                : `<div class="dashboard-avatar dashboard-avatar-fallback">${this._escape((u.displayName || u.email || '?')[0].toUpperCase())}</div>`;
            return {
                avatarHtml,
                name: this._escape(u.displayName || u.email || 'Signed in'),
                sub: `${batch ? batch + ' · ' : ''}Synced to your account`,
            };
        }

        return {
            avatarHtml: `<div class="dashboard-avatar dashboard-avatar-fallback">?</div>`,
            name: 'Not signed in',
            sub: `${batch ? batch + ' · ' : ''}Local only — sign in to sync across devices`,
        };
    },

    _computeStats() {
        const subjects = (typeof App !== 'undefined') ? App.subjects : [];
        let totalAttended = 0, totalDelivered = 0;
        let best = null, worst = null;

        subjects.forEach(s => {
            totalAttended += s.attended;
            totalDelivered += s.delivered;
            if (s.delivered === 0) return;
            const pct = Calculator.percentage(s.attended, s.delivered);
            if (!best || pct > best.pct) best = { name: s.name, pct };
            if (!worst || pct < worst.pct) worst = { name: s.name, pct };
        });

        const overallPct = totalDelivered > 0 ? Calculator.percentage(totalAttended, totalDelivered) : null;

        const history = Storage.getHistory();
        const streak = this._computeStreak(history);
        const trackingSince = history.length > 0
            ? new Date(history[0].date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
            : 'today';

        return { overallPct, best, worst, streak, trackingSince };
    },

    // Consecutive days (counting back from today) with at least one history entry.
    _computeStreak(history) {
        if (history.length === 0) return 0;
        const days = new Set(history.map(h => h.date));
        let streak = 0;
        let cursor = new Date();
        while (true) {
            const dateStr = cursor.toISOString().slice(0, 10);
            if (!days.has(dateStr)) break;
            streak++;
            cursor.setDate(cursor.getDate() - 1);
        }
        return streak;
    },

    _escape(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    },
};
