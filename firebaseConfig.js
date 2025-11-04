import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// You can also import getFirestore for the database later

// Your web app's Firebase configuration
// From your original file
const firebaseConfig = {
  apiKey: "AIzaSyD0jAS7jatejNh9ipqbKOd4hOzHhGIaLaQ",
  authDomain: "choretracker-2c586.firebaseapp.com",
  projectId: "choretracker-2c586",
  storageBucket: "choretracker-2c586.firebasestorage.app",
  messagingSenderId: "769282762159",
  appId: "1:769282762159:web:e1d74e27f748c568a83b5a",
  measurementId: "G-CKK2GJGWZS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and export it
export const auth = getAuth(app);