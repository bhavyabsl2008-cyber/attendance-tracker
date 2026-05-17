// settings.js — Threshold management

const SETTINGS_KEY = 'chitkara_settings_v3';

const Settings = {
    threshold: 75,

    load() {
        try {
            const saved = localStorage.getItem(SETTINGS_KEY);
            if (saved) {
                const data = JSON.parse(saved);
                this.threshold = data.threshold || 75;
            }
        } catch { this.threshold = 75; }
        return this;
    },

    save() {
        try {
            localStorage.setItem(SETTINGS_KEY, JSON.stringify({ threshold: this.threshold }));
        } catch {}
        return this;
    },

    setThreshold(val) {
        const n = parseInt(val);
        if (!isNaN(n) && n >= 50 && n <= 95) {
            this.threshold = n;
            this.save();
        }
    },
};
