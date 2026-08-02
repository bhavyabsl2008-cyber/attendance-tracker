// sync-banner.js — shows a dismissible nudge to sign in for cross-device sync.
// Sign-in stays fully optional (the app works entirely offline without it) —
// this banner exists only so people who'd want sync actually know it's there.

const SyncBanner = {
    _key: 'presynce_sync_banner_dismissed',

    init() {
        Auth.onChange(user => {
            const banner = document.getElementById('sync-banner');
            if (!banner) return;
            const dismissed = localStorage.getItem(this._key) === 'true';
            banner.classList.toggle('hidden', !!user || dismissed);
        });
    },

    dismiss() {
        localStorage.setItem(this._key, 'true');
        document.getElementById('sync-banner')?.classList.add('hidden');
    },
};
