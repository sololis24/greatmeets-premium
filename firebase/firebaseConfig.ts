import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCExgghw9tHd9qMw1D6mDLPD6m4Hipzx-8",
  authDomain: "scheduler-708e8.firebaseapp.com",
  projectId: "scheduler-708e8",
  storageBucket: "scheduler-708e8.appspot.com",
  messagingSenderId: "944682802323",
  appId: "1:944682802323:web:7d97dcd43427f25ea4c166",
};

// Initialize app only if not already initialized
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
