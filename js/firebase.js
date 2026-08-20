// ============================================================
// FIREBASE CONFIGURATION
// ============================================================
// Replace the placeholder values below with your actual Firebase
// project configuration.
//
// Where to find this:
//   Firebase Console → Project Settings (gear icon) →
//   General tab → "Your apps" section → Web app → Config
//
// IMPORTANT: The databaseURL must point to your Realtime Database
// region (e.g., https://YOUR_PROJECT-default-rtdb.firebaseio.com)
// ============================================================


const firebaseConfig = {
  apiKey: "AIzaSyA-jGM_CJ9ZXxZrl1rst9A1ciunjZMYLwE",
  authDomain: "ansh-reveal.firebaseapp.com",i
  databaseURL: "https://ansh-reveal-default-rtdb.firebaseio.com",
  projectId: "ansh-reveal",
  storageBucket: "ansh-reveal.firebasestorage.app",
  messagingSenderId: "805867385172",
  appId: "1:805867385172:web:036041162724cbde9d18c1",
  measurementId: "G-Z0HHLV5L75"
};
// Validate config before initialising
if (firebaseConfig.apiKey === "YOUR_API_KEY") {
    document.addEventListener("DOMContentLoaded", () => {
        const overlay = document.getElementById("loading-overlay");
        if (overlay) {
            overlay.innerHTML = `
                <div style="max-width:480px;padding:32px;text-align:center;font-family:sans-serif;">
                    <p style="font-size:2.5rem;margin-bottom:16px;">⚠️</p>
                    <p style="color:#ffd700;font-size:1.1rem;margin-bottom:12px;font-weight:bold;">Firebase Not Configured</p>
                    <p style="color:#a89070;font-size:0.9rem;line-height:1.6;">
                        Open <code style="background:rgba(255,255,255,0.1);padding:2px 6px;border-radius:4px;">js/firebase.js</code>
                        and replace the placeholder values with your Firebase project config.
                    </p>
                    <p style="color:#a89070;font-size:0.8rem;margin-top:12px;">
                        See README.md for step-by-step instructions.
                    </p>
                </div>
            `;
        }
    });
    // Stop execution
    throw new Error("Firebase configuration not set. See js/firebase.js for instructions.");
}

// Initialise Firebase
firebase.initializeApp(firebaseConfig);

// Exported globals used by all other scripts
const db               = firebase.database();
const auth             = firebase.auth();
const SERVER_TIMESTAMP = firebase.database.ServerValue.TIMESTAMP;
