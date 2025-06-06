import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/firebase/firebaseConfig';
import { doc, setDoc } from 'firebase/firestore';

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  const userToken = req.nextUrl.searchParams.get('state'); // passed via &state=

  console.log('🔍 CALLBACK ENV:', {
    client_id: process.env.GOOGLE_CLIENT_ID,
    client_secret: process.env.GOOGLE_CLIENT_SECRET,
    redirect_uri: process.env.GOOGLE_REDIRECT_URI,
  });
  

  if (!code || !userToken) {
    return NextResponse.json({ error: 'Missing code or userToken' }, { status: 400 });
  }

  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
        grant_type: 'authorization_code',
      }),      
    });

    console.log('🔐 Server-side client ID:', process.env.GOOGLE_CLIENT_ID);

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Google token exchange failed:', data);
      return NextResponse.json({ error: data }, { status: 500 });
    }

    console.log('✅ Google token for user:', userToken, data);

    await setDoc(doc(db, 'googleTokens', userToken), {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      scope: data.scope,
      expires_in: data.expires_in,
      token_type: data.token_type,
      createdAt: new Date().toISOString(),
    });

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

return NextResponse.redirect(`${baseUrl}/?google=connected&token=${userToken}`);

  } catch (err) {
    console.error('❌ Google callback error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
