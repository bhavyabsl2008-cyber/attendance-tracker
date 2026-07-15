// firebase-config.js — YOUR Firebase project's config.
//
// This is NOT a secret. Firebase's client config (apiKey included) is safe to
// expose publicly — it just identifies which project to talk to. Real security
// comes from the Firestore rules you set in the console, not from hiding this.
//
// Get this object from: Firebase Console → Project settings → Your apps → (</>) web app
// Paste it in below, replacing the placeholder values.

const firebaseConfig = {
    apiKey: "AIzaSyBMy1WWp6KkpLuSmeX7cMqOXquWyjjYfio",
    authDomain: "presynce.firebaseapp.com",
    projectId: "presynce",
    storageBucket: "presynce.firebasestorage.app",
    messagingSenderId: "21613081457",
    appId: "1:21613081457:web:679e35e6e0d97b1b093cd0",
};

firebase.initializeApp(firebaseConfig);
