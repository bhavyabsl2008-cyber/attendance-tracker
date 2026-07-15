// firebase-config.js — YOUR Firebase project's config.
//
// This is NOT a secret. Firebase's client config (apiKey included) is safe to
// expose publicly — it just identifies which project to talk to. Real security
// comes from the Firestore rules you set in the console, not from hiding this.
//
// Get this object from: Firebase Console → Project settings → Your apps → (</>) web app
// Paste it in below, replacing the placeholder values.

const firebaseConfig = {
    apiKey: "PASTE_YOUR_API_KEY_HERE",
    authDomain: "PASTE_YOUR_PROJECT.firebaseapp.com",
    projectId: "PASTE_YOUR_PROJECT_ID",
    storageBucket: "PASTE_YOUR_PROJECT.appspot.com",
    messagingSenderId: "PASTE_YOUR_SENDER_ID",
    appId: "PASTE_YOUR_APP_ID",
};

firebase.initializeApp(firebaseConfig);
