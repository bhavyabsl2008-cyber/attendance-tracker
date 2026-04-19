// storage.js - Save and load data from browser

const STORAGE_KEY = "attendance_tracker_data";

function saveSubjects(subjects) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(subjects));
}

function loadSubjects() {
    let data = localStorage.getItem(STORAGE_KEY);
    if (data) {
        return JSON.parse(data);
    }
    return [];
}

function clearAllData() {
    localStorage.removeItem(STORAGE_KEY);
}