// install-prompt.js — nudges first-time visitors to install Presynce to their
// home screen instead of reopening it via GitHub/README every time.
//
// Android/Chrome/Edge support a real native install prompt (beforeinstallprompt).
// iOS Safari has no such API at all — Apple deliberately doesn't expose one — so
// for iOS we show manual steps instead. Both paths are skipped entirely if the
// app is already running installed (display-mode: standalone).

const InstallPrompt = {
    _key: 'presynce_install_banner_dismissed',
    _deferredPrompt: null,

    init() {
        if (this._isStandalone()) return; // already installed, nothing to do
        if (localStorage.getItem(this._key) === 'true') return;

        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this._deferredPrompt = e;
            this._show('android');
        });

        // iOS Safari never fires beforeinstallprompt — detect and show manual steps
        if (this._isIOSSafari()) {
            this._show('ios');
        }
    },

    _isStandalone() {
        return window.matchMedia('(display-mode: standalone)').matches
            || window.navigator.standalone === true;
    },

    _isIOSSafari() {
        const ua = window.navigator.userAgent;
        const isIOS = /iPad|iPhone|iPod/.test(ua);
        const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
        return isIOS && isSafari;
    },

    _show(platform) {
        const banner = document.getElementById('install-banner');
        if (!banner) return;
        const text = document.getElementById('install-banner-text');
        const btn = document.getElementById('install-banner-action');

        if (platform === 'android') {
            text.textContent = '📲 Install Presynce for one-tap access — no browser, no GitHub.';
            btn.textContent = 'Install';
            btn.onclick = () => this._triggerAndroidInstall();
        } else {
            text.textContent = '📲 Add Presynce to your home screen: tap Share, then "Add to Home Screen."';
            btn.textContent = 'Got it';
            btn.onclick = () => this.dismiss();
        }

        banner.classList.remove('hidden');
    },

    async _triggerAndroidInstall() {
        if (!this._deferredPrompt) return;
        this._deferredPrompt.prompt();
        await this._deferredPrompt.userChoice;
        this._deferredPrompt = null;
        this.dismiss();
    },

    dismiss() {
        localStorage.setItem(this._key, 'true');
        document.getElementById('install-banner')?.classList.add('hidden');
    },
};

document.addEventListener('DOMContentLoaded', () => InstallPrompt.init());
