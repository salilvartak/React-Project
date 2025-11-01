// Import the functions you need from the SDKs you need
import { getAnalytics } from "firebase/analytics";
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optionals
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
const analytics = getAnalytics(app);