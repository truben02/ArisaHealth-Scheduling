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
firebase.initializeApp(firebaseConfig);
const db = firebase.database();
