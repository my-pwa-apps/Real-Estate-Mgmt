// Firebase Configuration
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

// Cloudflare Worker (objctmgmt-api) base URL.
// Override per deployment by setting `window.OBJCTMGMT_API_BASE` before this
// script runs, e.g. via a small per-tenant config.local.js.
window.OBJCTMGMT_API_BASE =
	window.OBJCTMGMT_API_BASE ||
	"https://objctmgmt-api.garfieldapp.workers.dev";
window.OBJCTMGMT_TENANT_ID = window.OBJCTMGMT_TENANT_ID || "default";

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = firebase.auth();
const database = firebase.database();

// Export for use in other files
window.auth = auth;
window.database = database;
