// storage.js — Data layer. Handles all persistence.

const STORAGE_KEYS = {
    SUBJECTS: 'chitkara_subjects_v3',
    SETTINGS: 'chitkara_settings_v3'
};

const Storage = {

    getSubjects() {
        try {
            const data = localStorage.getItem(STORAGE_KEYS.SUBJECTS);
            if (!data) return [];
            const subjects = JSON.parse(data);
            // FIX: migrate old numeric Date.now() IDs to UUID strings
            // so delete/edit don't break for existing users
            return Storage._migrateIDs(subjects);
        } catch { return []; }
    },

    // Converts any numeric id to a stable UUID-shaped string
    // Safe to run every load — already-string IDs pass through unchanged
    _migrateIDs(subjects) {
        let changed = false;
        const migrated = subjects.map(s => {
            if (typeof s.id === 'number') {
                changed = true;
                return { ...s, id: 'migrated-' + s.id.toString() };
            }
            return s;
        });
        // Persist migrated data immediately so next load is clean
        if (changed) {
            try {
                localStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify(migrated));
            } catch { /* storage full — non-fatal */ }
        }
        return migrated;
    },

    saveSubjects(subjects) {
        try {
            localStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify(subjects));
            return true;
        } catch { return false; }
    },

    getSettings() {
        try {
            const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
            return data ? JSON.parse(data) : { threshold: 75 };
        } catch { return { threshold: 75 }; }
    },

    saveSettings(settings) {
        try {
            localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
            return true;
        } catch { return false; }
    },

    clearAll() {
        localStorage.removeItem(STORAGE_KEYS.SUBJECTS);
        localStorage.removeItem(STORAGE_KEYS.SETTINGS);
    },

    exportJSON() {
        const data = {
            subjects: this.getSubjects(),
            settings: this.getSettings(),
            exportedAt: new Date().toISOString(),
            version: 3
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `attendance_backup_${new Date().toLocaleDateString('en-IN').replace(/\//g, '-')}.json`;
        a.click();
        URL.revokeObjectURL(url);
    },

    importJSON(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    if (!data.subjects || !Array.isArray(data.subjects)) {
                        reject('Invalid file format');
                        return;
                    }
                    // Run migration on imported data too
                    const migrated = Storage._migrateIDs(data.subjects);
                    this.saveSubjects(migrated);
                    if (data.settings) this.saveSettings(data.settings);
                    resolve(data);
                } catch { reject('Could not parse file'); }
            };
            reader.readAsText(file);
        });
    },

    // FIX: btoa() crashes on non-ASCII characters (emoji, Hindi, etc. in subject names)
    // Use TextEncoder → Uint8Array → base64 instead — handles full Unicode safely
    _encode(obj) {
        const json = JSON.stringify(obj);
        const bytes = new TextEncoder().encode(json);
        let binary = '';
        bytes.forEach(b => binary += String.fromCharCode(b));
        return btoa(binary);
    },

    _decode(str) {
        const binary = atob(str);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return JSON.parse(new TextDecoder().decode(bytes));
    },

    getShareableLink() {
        const data = {
            subjects: this.getSubjects(),
            settings: this.getSettings()
        };
        const encoded = this._encode(data);
        return `${window.location.origin}${window.location.pathname}?data=${encoded}`;
    },

    loadFromURL() {
        const params = new URLSearchParams(window.location.search);
        const data = params.get('data');
        if (!data) return false;
        try {
            // Try new Unicode-safe decode first, fall back to old btoa for old links
            let parsed;
            try {
                parsed = this._decode(data);
            } catch {
                parsed = JSON.parse(atob(data));
            }
            if (parsed.subjects) this.saveSubjects(Storage._migrateIDs(parsed.subjects));
            if (parsed.settings) this.saveSettings(parsed.settings);
            window.history.replaceState({}, '', window.location.pathname);
            return true;
        } catch { return false; }
    }
};
