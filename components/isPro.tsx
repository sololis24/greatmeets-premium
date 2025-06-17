'use client';

import { useEffect, useState } from 'react';

export function useIsPro(): boolean | null {
  const [isPro, setIsPro] = useState<boolean | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateIsPro = () => {
      const stored = localStorage.getItem('isPro');
      if (stored === 'true') {
        setIsPro(true);
      } else if (stored === 'false') {
        setIsPro(false);
      } else {
        setIsPro(null);
      }
    };

    updateIsPro(); // ✅ Initial read

    const handleStorage = () => updateIsPro();
    const handleCustom = (e: Event) => {
      if ('detail' in e && typeof (e as CustomEvent).detail === 'boolean') {
        setIsPro((e as CustomEvent).detail);
      } else {
        updateIsPro();
      }
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('isProUpdate', handleCustom);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('isProUpdate', handleCustom);
    };
  }, []);

  return isPro;
}
//hi again