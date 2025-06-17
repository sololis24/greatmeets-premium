'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/firebaseConfig'; // ✅ match your export

export function useIsPro(): boolean | null {
  const [isPro, setIsPro] = useState<boolean | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setIsPro(false);
        return;
      }

      const userDoc = doc(db, 'users', user.uid);
      const snap = await getDoc(userDoc);

      setIsPro(snap.exists() ? !!snap.data().isPro : false);
    });

    return () => unsubscribe();
  }, []);

  return isPro;
}
