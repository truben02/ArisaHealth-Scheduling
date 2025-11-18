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

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDT8jdl9qpUllaItXbPfV0EzLBxATOWqeI",
  authDomain: "arisahealth-scheduler.firebaseapp.com",
  databaseURL: "https://arisahealth-scheduler-default-rtdb.firebaseio.com",
  projectId: "arisahealth-scheduler",
  storageBucket: "arisahealth-scheduler.firebasestorage.app",
  messagingSenderId: "208760160482",
  appId: "1:208760160482:web:ce6a72f2cae6c29d369ebb"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
