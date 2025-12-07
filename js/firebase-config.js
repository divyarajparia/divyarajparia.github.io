// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyAUMF8lnNYI0cOMNtrHgoyhnales0PSPsw",
  authDomain: "machine-learning-bootcam-956e6.firebaseapp.com",
  projectId: "machine-learning-bootcam-956e6",
  storageBucket: "machine-learning-bootcam-956e6.firebasestorage.app",
  messagingSenderId: "695520065666",
  appId: "1:695520065666:web:a3ea5916428be539955c9b",
  measurementId: "G-C8PMNNKBB4"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Get Firebase Functions instance
const functions = firebase.functions();

// For local testing, uncomment this line:
// functions.useEmulator("localhost", 5001);

console.log('Firebase initialized successfully');
