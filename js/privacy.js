// privacy.js — Privacy note modal. Kept as plain text data here so it's easy
// to update without touching layout code, and easy to verify it stays accurate
// as the app changes (i.e. don't let this drift from what the code actually does).

const Privacy = {
    show() {
        document.getElementById('privacy-modal')?.remove();

        const signedIn = typeof Auth !== 'undefined' && Auth.isSignedIn();

        const modal = document.createElement('div');
        modal.id = 'privacy-modal';
        modal.className = 'tt-modal-overlay';
        modal.innerHTML = `
            <div class="tt-modal-box tt-modal-wide">
                <div class="tt-modal-header">
                    <div class="tt-modal-title">Privacy</div>
                    <button class="tt-close-btn" onclick="Privacy._close()">✕</button>
                </div>
                <div class="ml-guide-body">
                    <div class="ml-guide-section">
                        <div class="ml-guide-step-title">What's stored</div>
                        <ul class="ml-guide-list">
                            <li>Your subject names, attendance counts, and threshold setting.</li>
                            <li>Your timetable batch selection and any manual day edits you make.</li>
                            <li>If you sign in: your Google account's name, email, and profile photo (from Google Sign-In), used only to identify your data — nothing else about your Google account is accessed.</li>
                        </ul>
                    </div>
                    <div class="ml-guide-section">
                        <div class="ml-guide-step-title">Where it lives</div>
                        <p>Signed out: only in your own browser (localStorage) — nothing leaves your device.
                        Signed in: also synced to Firestore (Google Cloud) under your account, restricted so
                        only you can read or write it — enforced by the database's own access rules, not just
                        app-level checks.</p>
                    </div>
                    <div class="ml-guide-section">
                        <div class="ml-guide-step-title">What this app does NOT do</div>
                        <ul class="ml-guide-list">
                            <li>No ads, no selling data, no third-party analytics or trackers.</li>
                            <li>No one else can see your attendance data — not other students, not your batch.</li>
                        </ul>
                    </div>
                    <div class="ml-guide-section">
                        <div class="ml-guide-step-title">Delete your data</div>
                        <p>Clearing local data (Clear All Data button) removes everything from this device.
                        ${signedIn
                            ? `To also permanently delete your synced cloud copy:`
                            : `Sign in first if you want to delete a synced cloud copy — otherwise there's nothing in the cloud to delete.`}
                        </p>
                        ${signedIn ? `<button class="tt-toolbar-btn" style="margin-top:8px" onclick="Privacy._confirmDelete()">Delete my cloud data permanently</button>` : ''}
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        requestAnimationFrame(() => modal.classList.add('tt-modal-show'));
        modal.addEventListener('click', e => { if (e.target === modal) this._close(); });
    },

    _close() {
        document.getElementById('privacy-modal')?.remove();
    },

    _confirmDelete() {
        if (!confirm('Permanently delete your cloud data? This cannot be undone, and you\'ll be signed out.')) return;
        Sync.deleteMyCloudData();
        this._close();
    },
};
