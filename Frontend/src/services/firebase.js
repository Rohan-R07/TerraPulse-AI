// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDXLC-VuQZuFXowORsslcSNb79UhncYy7k",
  authDomain: "terrapulse-ai.firebaseapp.com",
  projectId: "terrapulse-ai",
  storageBucket: "terrapulse-ai.firebasestorage.app",
  messagingSenderId: "1007707193797",
  appId: "1:1007707193797:web:01af356f081aab81e18bac",
  measurementId: "G-97N3W37TFF"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = typeof window !== "undefined" ? getAnalytics(app) : null;

export { app, analytics };
