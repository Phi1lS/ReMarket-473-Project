// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);