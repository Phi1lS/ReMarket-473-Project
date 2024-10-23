// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAnalytics } from "firebase/analytics";
import { getAuth, initializeAuth, browserLocalPersistence, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage'; // Import Firebase Storage
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native'; // Import to detect platform
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDLKrsReYNHciw6xOgcujZiab8pC6XIjBg",
  authDomain: "remarket-a69bd.firebaseapp.com",
  projectId: "remarket-a69bd",
  storageBucket: "remarket-a69bd.appspot.com",
  messagingSenderId: "380799354518",
  appId: "1:380799354518:web:c9009a8eedfe50d2eae4b7",
  measurementId: "G-08NEEN3BF1"
};

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

let auth;

// Check if the platform is web or native
if (Platform.OS === 'web') {
  // For web platform, use browserLocalPersistence
  auth = getAuth(app);
  auth.setPersistence(browserLocalPersistence);
} else {
  // For native platforms (iOS/Android), use React Native persistence
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
}

// Initialize Firestore
const db = getFirestore(app);

// Initialize Firebase Storage
const storage = getStorage(app); // Initialize Firebase Storage

// Export auth, db, and storage for use in your app
export { auth, db, storage };