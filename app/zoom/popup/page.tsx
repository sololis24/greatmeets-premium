// app/zoom/popup/page.tsx

'use client';
import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

export default function ZoomPopupPage() {
  const searchParams = useSearchParams();
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  useEffect(() => {
    if (!code || !state) return;

    // Notify the opener (main app inside Squarespace iframe)
    window.opener?.postMessage(
      { source: 'zoom_oauth', code, userToken: state },
      '*'
    );

    // Call your existing backend to exchange the code
    fetch('/api/zoom/callback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, state }),
    }).finally(() => {
      window.close();
    });
  }, [code, state]);

  return <p style={{ fontFamily: 'sans-serif' }}>Authorizing Zoom…</p>;
}
