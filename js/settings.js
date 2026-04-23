// settings.js — Manages user preferences and threshold

const Settings = {
    _data: { threshold: 75 },

    load() {
        this._data = Storage.getSettings();
        return this;
    },

    save() {
        Storage.saveSettings(this._data);
        return this;
    },

    get threshold() {
        return this._data.threshold || 75;
    },

    set threshold(value) {
        const val = parseFloat(value);
        if (!isNaN(val) && val >= 50 && val <= 95) {
            this._data.threshold = val;
            this.save();
        }
    }
};