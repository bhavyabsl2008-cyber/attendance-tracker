// tabs.js — switches between the three top-level views (Home/Analytics/Profile).
// Deliberately NOT a router: no URL changes, no history entries, no separate
// HTML files — just three panels in the same index.html, shown/hidden. This
// project has no build step, so a real client-side router (with back-button
// support, deep links, etc.) is a bigger separate piece of work if ever wanted.

const Tabs = {
    current: 'home',

    switchTo(name) {
        this.current = name;

        document.querySelectorAll('.tab-panel').forEach(panel => {
            panel.classList.toggle('hidden', panel.id !== `tab-${name}`);
        });
        document.querySelectorAll('.bottom-tab').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === name);
        });

        if (name === 'analytics') this._renderAnalytics();
        if (name === 'home') this._renderHomeWidgets();
    },

    // Chart.js sizes itself off the canvas's rendered dimensions, so it has to
    // be (re)drawn AFTER the panel is actually visible, not before — building
    // it while display:none would give it a zero-size canvas to measure.
    _renderAnalytics() {
        if (typeof App === 'undefined') return;
        const chartBody = document.getElementById('chart-body');
        if (chartBody && !chartBody.classList.contains('hidden')) {
            Charts.render(App.subjects, Settings.threshold);
        }
        this._renderSubjectProgressList();
    },

    _renderSubjectProgressList() {
        const container = document.getElementById('subject-progress-list');
        if (!container) return;

        if (App.subjects.length === 0) {
            container.innerHTML = '<div class="subject-progress-empty">Add a subject to see your breakdown here.</div>';
            return;
        }

        container.innerHTML = App.subjects.map(s => {
            const pct = Calculator.percentage(s.attended, s.delivered);
            const status = Calculator.status(pct, Settings.threshold);
            return `
                <div class="subject-progress-row">
                    <div class="subject-progress-row-head">
                        <span>${this._escape(s.name)}</span>
                        <span class="${status}-text">${pct}%</span>
                    </div>
                    <div class="subject-progress-bar-track">
                        <div class="subject-progress-bar-fill ${status}" style="width:${Math.min(pct, 100)}%"></div>
                    </div>
                </div>`;
        }).join('');
    },

    _renderHomeWidgets() {
        const streakEl = document.getElementById('streak-count');
        if (streakEl && typeof Storage !== 'undefined') {
            streakEl.textContent = Storage.getLoggingStreak();
        }
        this._renderQuote();
    },

    _quotes: [
        { text: "Discipline is choosing between what you want now and what you want most.", author: "Unknown" },
        { text: "Small daily improvements are the key to staggering long-term results.", author: "Unknown" },
        { text: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" },
        { text: "Consistency is what transforms average into excellence.", author: "Unknown" },
        { text: "Show up. Every day. That's the secret.", author: "Unknown" },
    ],

    // Same quote all day (deterministic on today's date), not a fresh random
    // pick on every tab switch — otherwise it'd feel glitchy re-rendering.
    _renderQuote() {
        const textEl = document.getElementById('quote-text');
        const authorEl = document.getElementById('quote-author');
        if (!textEl || !authorEl) return;
        const dayIndex = Math.floor(Date.now() / 86400000);
        const quote = this._quotes[dayIndex % this._quotes.length];
        textEl.textContent = quote.text;
        authorEl.textContent = `— ${quote.author}`;
    },

    _escape(str) {
        const div = document.createElement('div');
        div.textContent = str || '';
        return div.innerHTML;
    },
};

document.addEventListener('DOMContentLoaded', () => Tabs._renderHomeWidgets());
