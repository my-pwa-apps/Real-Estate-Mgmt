// Firebase Configuration - Stadsgezicht Ontwikkelingen
const firebaseConfig = {
  apiKey: "AIzaSyCnO8J8zDqM0m2Ha3VEiQHFSowUNO_alNk",
  authDomain: "stadsgezicht-8af8b.firebaseapp.com",
  databaseURL:
    "https://stadsgezicht-8af8b-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "stadsgezicht-8af8b",
  storageBucket: "stadsgezicht-8af8b.firebasestorage.app",
  messagingSenderId: "976439602772",
  appId: "1:976439602772:web:77d2febec86520785c47c1",
  measurementId: "G-HP1B4BBZXQ",
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = firebase.auth();
const database = firebase.database();

// Export for use in other files
window.auth = auth;
window.database = database;
