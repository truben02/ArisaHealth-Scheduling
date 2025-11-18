// firebase.js
// Replace the firebaseConfig object with your project's config (from Firebase console).
// This file must be included before other scripts that use 'db'.

// Example:
// const firebaseConfig = {
//   apiKey: "ABC...",
//   authDomain: "your-app.firebaseapp.com",
//   databaseURL: "https://your-app-default-rtdb.firebaseio.com",
//   projectId: "your-app",
//   storageBucket: "your-app.appspot.com",
//   messagingSenderId: "123...",
//   appId: "1:123:web:abc..."
// };

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  databaseURL: "YOUR_DATABASE_URL",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize (v8 compat build)
firebase.initializeApp(firebaseConfig);
const db = firebase.database();
