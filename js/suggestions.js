// suggestions.js — simple suggestion/bug-report box. Writes to a Firestore
// 'suggestions' collection so Bhavya can read them from the Firebase console —
// there's no in-app admin view (not needed for this). Works whether or not the
// student is signed in; anonymous submissions are just tagged 'anonymous'.
//
// IMPORTANT — Bhavya must add this Firestore rule herself (rules live in the
// Firebase console, not in this repo) or every submission will fail silently:
//
//   match /suggestions/{id} {
//     allow create: if true;   // anyone can submit
//     allow read, update, delete: if false;  // console-only, no in-app reads
//   }

const Suggestions = {
    async submit() {
        const textarea = document.getElementById('suggestion-text');
        const text = textarea?.value.trim();
        if (!text) {
            UI.toast('Write something first', 'error');
            return;
        }
        if (typeof firebase === 'undefined' || !firebase.firestore) {
            UI.toast("Can't send right now — try again later", 'error');
            return;
        }

        try {
            const db = firebase.firestore();
            await db.collection('suggestions').add({
                text,
                userId: (typeof Auth !== 'undefined' && Auth.currentUser) ? Auth.currentUser.uid : 'anonymous',
                userEmail: (typeof Auth !== 'undefined' && Auth.currentUser) ? Auth.currentUser.email : null,
                batch: (typeof Timetable !== 'undefined' && Timetable.isSetup()) ? Timetable.getBatch() : null,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            });
            textarea.value = '';
            UI.toast("Thanks — sent!", 'success');
        } catch (err) {
            console.error('Suggestion submit failed:', err);
            UI.toast("Couldn't send — try again", 'error');
        }
    },
};
