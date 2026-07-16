// sync.js — Syncs Storage (subjects, settings) and Timetable config to Firestore
// under users/{uid}. Signed-out use is completely unaffected — everything still
// works purely from localStorage, exactly as before. Signing in adds sync on top.

const Sync = {
    _db: null,
    _unsubscribe: null,
    _applyingRemote: false, // guards against re-pushing a change we just pulled

    init() {
        this._db = firebase.firestore();
        Auth.onChange(user => {
            if (user) this._onSignIn(user);
            else this._onSignOut();
        });
        this._wrapLocalSaves();
    },

    async _onSignIn(user) {
        const docRef = this._db.collection('users').doc(user.uid);
        const snap = await docRef.get();

        const localSubjects = Storage.getSubjects();
        const localSettings = Storage.getSettings();
        const hasLocalData = localSubjects.length > 0;

        if (!snap.exists) {
            // First time signing in on any device — push whatever's local (may be empty)
            await docRef.set({
                subjects: localSubjects,
                settings: localSettings,
                timetableConfig: Timetable._config || null,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            });
        } else {
            const remote = snap.data();
            const remoteHasData = (remote.subjects || []).length > 0;

            if (hasLocalData && remoteHasData) {
                // Both sides have real data — don't silently pick one, ask.
                this._showConflictModal(docRef, remote, { localSubjects, localSettings });
            } else if (remoteHasData) {
                // Remote has data, local is empty (new device) — just pull it down.
                this._applyRemote(remote);
            } else if (hasLocalData) {
                // Local has data, remote is empty — push local up.
                await docRef.set({
                    subjects: localSubjects,
                    settings: localSettings,
                    timetableConfig: Timetable._config || null,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                });
            }
            // Both empty — nothing to do.
        }

        this._listenForRemoteChanges(docRef);
        UI.toast(`Signed in as ${user.displayName}`, 'success');
    },

    _onSignOut() {
        if (this._unsubscribe) {
            this._unsubscribe();
            this._unsubscribe = null;
        }
    },

    _showConflictModal(docRef, remote, local) {
        const modal = document.createElement('div');
        modal.className = 'tt-modal-overlay';
        modal.id = 'sync-conflict-modal';
        modal.innerHTML = `
            <div class="tt-modal-box">
                <div class="tt-modal-header">
                    <div class="tt-modal-title">Data on both devices</div>
                </div>
                <p style="font-size:13px;color:var(--muted);margin:12px 0">
                    This device has ${local.localSubjects.length} subject(s) saved locally,
                    and your account already has ${(remote.subjects || []).length} subject(s)
                    saved from another device. Which do you want to keep?
                </p>
                <div style="display:flex;flex-direction:column;gap:8px;margin-top:12px">
                    <button class="tt-toolbar-btn" id="sync-keep-remote">Use synced data (this device's local data will be replaced)</button>
                    <button class="tt-toolbar-btn" id="sync-keep-local">Use this device's data (overwrites the synced copy)</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        requestAnimationFrame(() => modal.classList.add('tt-modal-show'));

        document.getElementById('sync-keep-remote').onclick = () => {
            this._applyRemote(remote);
            modal.remove();
        };
        document.getElementById('sync-keep-local').onclick = async () => {
            await docRef.set({
                subjects: local.localSubjects,
                settings: local.localSettings,
                timetableConfig: Timetable._config || null,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            });
            modal.remove();
        };
    },

    _applyRemote(remote) {
        this._applyingRemote = true;
        Storage.saveSubjects(remote.subjects || []);
        Storage.saveSettings(remote.settings || { threshold: 75 });
        App.subjects = Storage.getSubjects();
        Settings.load();
        if (remote.timetableConfig) {
            Timetable._config = remote.timetableConfig;
            Timetable.save();
        }
        App.render();
        this._applyingRemote = false;
    },

    _listenForRemoteChanges(docRef) {
        if (this._unsubscribe) this._unsubscribe();
        this._unsubscribe = docRef.onSnapshot(snap => {
            if (!snap.exists) return;
            const data = snap.data();
            // Avoid reacting to the write we just made ourselves
            if (this._applyingRemote) return;
            this._applyRemote(data);
        });
    },

    // Wraps the existing local save functions so every local change also pushes
    // to Firestore when signed in — the rest of the app doesn't need to know sync exists.
    _wrapLocalSaves() {
        const originalSaveSubjects = Storage.saveSubjects.bind(Storage);
        Storage.saveSubjects = (subjects) => {
            const result = originalSaveSubjects(subjects);
            this._pushIfSignedIn();
            return result;
        };

        const originalSaveSettings = Storage.saveSettings.bind(Storage);
        Storage.saveSettings = (settings) => {
            const result = originalSaveSettings(settings);
            this._pushIfSignedIn();
            return result;
        };

        const originalTimetableSave = Timetable.save.bind(Timetable);
        Timetable.save = () => {
            const result = originalTimetableSave();
            this._pushIfSignedIn();
            return result;
        };
    },

    _pushIfSignedIn() {
        if (this._applyingRemote) return; // don't echo back a change we just pulled
        if (!Auth.isSignedIn()) return;
        const docRef = this._db.collection('users').doc(Auth.currentUser.uid);
        docRef.set({
            subjects: Storage.getSubjects(),
            settings: Storage.getSettings(),
            timetableConfig: Timetable._config || null,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
    },

    // Permanently deletes this user's cloud data, then signs them out.
    // Does NOT touch localStorage — that's a separate, local-only deletion
    // (Clear All Data button), since this only controls what's in Firestore.
    async deleteMyCloudData() {
        if (!Auth.isSignedIn()) return;
        const uid = Auth.currentUser.uid;
        await this._db.collection('users').doc(uid).delete();
        await Auth.signOut();
        UI.toast('Your cloud data has been deleted', 'success');
    },
};
