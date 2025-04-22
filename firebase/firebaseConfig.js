// src/firebase/firebaseConfig.js

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCExgghw9tHd9qMw1D6mDLPD6m4Hipzx-8",
  authDomain: "scheduler-708e8.firebaseapp.com",
  projectId: "scheduler-708e8",
  storageBucket: "scheduler-708e8.appspot.com",
  messagingSenderId: "944682802323",
  appId: "1:944682802323:web:7d97dcd43427f25ea4c166"
};

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

// Get Firestore and Auth instances
const db = getFirestore(app);
const auth = getAuth(app);

// Export db and auth to use in other parts of the app
export { db, auth };
