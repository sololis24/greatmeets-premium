import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/firebase/firebaseConfig';
import { doc, setDoc } from 'firebase/firestore';

export async function GET(req: NextRequest) {
  console.log('📥 Zoom callback hit. Full URL:', req.url);

  const code = req.nextUrl.searchParams.get('code');
  const userToken = req.nextUrl.searchParams.get('state');

  if (!code || !userToken) {
    console.error('❌ Missing code or userToken in callback');
    return NextResponse.json({ error: 'Missing code or userToken' }, { status: 400 });
  }

  const redirectUri = process.env.ZOOM_REDIRECT_URI!;


  try {
    const credentials = Buffer.from(
      `${process.env.NEXT_PUBLIC_ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`
    ).toString('base64');

    const response = await fetch('https://zoom.us/oauth/token', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri, // 👈 must exactly match the frontend OAuth request
      }),
    });

    const text = await response.text();
    let data: any;

    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error('❌ Failed to parse Zoom token response:', text);
      return NextResponse.json({ error: 'Malformed token response' }, { status: 500 });
    }

    if (!response.ok) {
      console.error('❌ Zoom token exchange failed:', data);
      return NextResponse.json({ error: data }, { status: 500 });
    }

    console.log('✅ Zoom token exchange success for user:', userToken);

    await setDoc(doc(db, 'zoomTokens', userToken), {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in,
      createdAt: new Date().toISOString(),
    });

    console.log('✅ Zoom token stored in Firestore for:', userToken);

    return NextResponse.redirect(`https://greatmeets.ai/?zoom=connected&token=${userToken}`);
  } catch (err: any) {
    console.error('❌ Zoom callback error:', err);
    return NextResponse.json(
      { error: err?.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
