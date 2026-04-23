// storage.js — Data layer. Handles all persistence.

const STORAGE_KEYS = {
    SUBJECTS: 'chitkara_subjects_v3',
    SETTINGS: 'chitkara_settings_v3'
};

const Storage = {
    getSubjects() {
        try {
            const data = localStorage.getItem(STORAGE_KEYS.SUBJECTS);
            return data ? JSON.parse(data) : [];
        } catch { return []; }
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
                    this.saveSubjects(data.subjects);
                    if (data.settings) this.saveSettings(data.settings);
                    resolve(data);
                } catch { reject('Could not parse file'); }
            };
            reader.readAsText(file);
        });
    },

    getShareableLink() {
        const data = {
            subjects: this.getSubjects(),
            settings: this.getSettings()
        };
        const encoded = btoa(JSON.stringify(data));
        return `${window.location.origin}${window.location.pathname}?data=${encoded}`;
    },

    loadFromURL() {
        const params = new URLSearchParams(window.location.search);
        const data = params.get('data');
        if (!data) return false;
        try {
            const parsed = JSON.parse(atob(data));
            if (parsed.subjects) this.saveSubjects(parsed.subjects);
            if (parsed.settings) this.saveSettings(parsed.settings);
            window.history.replaceState({}, '', window.location.pathname);
            return true;
        } catch { return false; }
    }
};