// auth.js — Google Sign-In via Firebase Auth. No passwords, nothing stored here
// beyond the current session's user object.

const Auth = {
    currentUser: null,
    _listeners: [],
    _authInstance: null,

    init() {
        this._authInstance = firebase.auth();
        this._authInstance.onAuthStateChanged(user => {
            this.currentUser = user;
            this._listeners.forEach(cb => cb(user));
        });
        return this;
    },

    // Register a callback fired immediately on sign-in/sign-out changes
    onChange(callback) {
        this._listeners.push(callback);
        // Fire immediately with current state if already known
        if (this._authInstance) callback(this.currentUser);
    },

    async signIn() {
        const provider = new firebase.auth.GoogleAuthProvider();
        try {
            const result = await this._authInstance.signInWithPopup(provider);
            return result.user;
        } catch (err) {
            // Popup blocked or closed — not a real error, just abandon silently
            if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
                return null;
            }
            console.error('Sign-in failed:', err);
            UI.toast('Sign-in failed — try again', 'error');
            return null;
        }
    },

    async signOut() {
        await this._authInstance.signOut();
    },

    isSignedIn() {
        return this.currentUser !== null;
    },
};
