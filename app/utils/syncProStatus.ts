'use client';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';

export async function syncProStatusFromFirestore() {
  const email = localStorage.getItem('participantEmail');
  if (!email) return;

  const userRef = doc(db, 'users', email.toLowerCase());
  const snap = await getDoc(userRef);

  const isPro = snap.exists() && snap.data().isPro === true;
  localStorage.setItem('isPro', isPro ? 'true' : 'false');
  window.dispatchEvent(new CustomEvent('isProUpdate', { detail: isPro }));
}
