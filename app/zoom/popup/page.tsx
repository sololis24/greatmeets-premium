// app/zoom/popup/page.tsx
'use client';
import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

export default function ZoomPopupPage() {
  const params = useSearchParams();
  const code  = params.get('code');
  const state = params.get('state');

  useEffect(() => {
    if (!code || !state) return;

    // 1️⃣ Send the auth code back to the opener
    window.opener?.postMessage(
      { source: 'zoom_oauth', code, userToken: state },
      '*'
    );

    // 2️⃣ Close the popup immediately
    window.close();
  }, [code, state]);

  return <p style={{ fontFamily: 'sans-serif' }}>Authorizing Zoom…</p>;
}
