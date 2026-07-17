// GM Electronics — Firebase configuration
//
// Replace the values below with YOUR Firebase project's config.
// Get them from: Firebase Console → Project Settings (gear icon) →
// "General" tab → scroll to "Your apps" → click the web app (</>) icon.
// Firebase will show you an object exactly like this one — copy it here.
//
// It's safe for these values to be visible in your site's public code;
// Firebase security works through the rules you set in the console
// (see README.md), not by hiding this config.

const firebaseConfig = {
  apiKey: "AIzaSyAgXuFSXErvkTF4fDewfZ3f3cjfJFV3Zjo",
  authDomain: "gm-electronics.firebaseapp.com",
  projectId: "gm-electronics",
  storageBucket: "gm-electronics.firebasestorage.app",
  messagingSenderId: "765545614509",
  appId: "1:765545614509:web:8e09c63d3e714741168a24",
  measurementId: "G-MSVR9DKEZ3"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
// Auth is only loaded on admin.html — guard so products.html/checkout.html
// (which don't need it) don't throw an error if it's unavailable.
const auth = (typeof firebase.auth === 'function') ? firebase.auth() : undefined;
