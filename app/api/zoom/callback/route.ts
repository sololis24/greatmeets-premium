// app/api/zoom/callback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/firebase/firebaseConfig';
import { doc, setDoc } from 'firebase/firestore';

export async function POST(req: NextRequest) {
  try {
    /** ------------------------------------------------------------------
     *  1 ) Parse body coming from the popup (`{ code, state }`)
     * ------------------------------------------------------------------ */
    const { code, state: userToken } = await req.json();

    if (!code || !userToken) {
      return NextResponse.json(
        { error: 'Missing OAuth code or state' },
        { status: 400 },
      );
    }

    /** ------------------------------------------------------------------
     *  2 ) Exchange code → access / refresh token
     * ------------------------------------------------------------------ */
    const redirectUri = process.env.ZOOM_POPUP_REDIRECT_URI!;
    const credentials = Buffer.from(
      `${process.env.NEXT_PUBLIC_ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`,
    ).toString('base64');

    const zoomRes = await fetch('https://zoom.us/oauth/token', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri, // must match the popup page URL
      }),
    });

    const data = await zoomRes.json();

    if (!zoomRes.ok) {
      console.error('❌ Zoom token exchange failed:', data);
      return NextResponse.json({ error: data }, { status: 500 });
    }

    /** ------------------------------------------------------------------
     *  3 ) Persist tokens in Firestore (keyed by your userToken)
     * ------------------------------------------------------------------ */
    await setDoc(doc(db, 'zoomTokens', userToken), {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in,
      token_type: data.token_type,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('❌ Zoom callback error:', err);
    return NextResponse.json(
      { error: err?.message || 'Internal Server Error' },
      { status: 500 },
    );
  }
}


 // hello