import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/firebase/firebaseConfig';
import { doc, getDoc, setDoc } from 'firebase/firestore';

async function refreshZoomAccessToken(userToken: string) {
  const tokenRef = doc(db, 'zoomTokens', userToken);
  const tokenSnap = await getDoc(tokenRef);

  if (!tokenSnap.exists()) {
    throw new Error('No Zoom token found for this user.');
  }

  const tokenData = tokenSnap.data();
  const refreshToken = tokenData.refresh_token;

  const basicAuth = Buffer.from(
    `${process.env.NEXT_PUBLIC_ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`
  ).toString('base64');

  const res = await fetch('https://zoom.us/oauth/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basicAuth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    console.error('🔁 Zoom token refresh failed:', data);
    throw new Error('Zoom token refresh failed');
  }

  const updatedToken = {
    ...tokenData,
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_in: data.expires_in,
    createdAt: new Date().toISOString(),
  };

  await setDoc(tokenRef, updatedToken);
  return updatedToken.access_token;
}

export async function POST(req: NextRequest) {
  try {
    const { userToken } = await req.json();

    if (!userToken) {
      return NextResponse.json({ error: 'Missing userToken' }, { status: 400 });
    }

    console.log('📥 [API] create-meeting called with userToken:', userToken);

    const tokenRef = doc(db, 'zoomTokens', userToken);
    const tokenDoc = await getDoc(tokenRef);

    if (!tokenDoc.exists()) {
      console.warn('⚠️ [API] No Zoom token found for token:', userToken);
      return NextResponse.json({ error: 'Zoom token not found' }, { status: 401 });
    }

    const tokenData = tokenDoc.data();
    let accessToken = tokenData.access_token;

    console.log('🔑 [API] Access token fetched (partial):', accessToken?.slice(0, 8) + '...');

    const createZoomMeeting = async (token: string) => {
      const res = await fetch('https://api.zoom.us/v2/users/me/meetings', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: 'GreatMeet',
          type: 1, // Instant meeting
          settings: {
            host_video: true,
            participant_video: true,
          },
        }),
      });

      const data = await res.json();
      return { ok: res.ok, data };
    };

    // 1st attempt
    let { ok, data } = await createZoomMeeting(accessToken);

    // If unauthorized, refresh token and retry
    if (!ok && data?.code === 124) {
      console.warn('🔁 [API] Zoom access token expired. Refreshing...');
      accessToken = await refreshZoomAccessToken(userToken);
      ({ ok, data } = await createZoomMeeting(accessToken));
    }

    if (!ok) {
      console.error('❌ [API] Zoom Meeting Creation Failed:', JSON.stringify(data, null, 2));
      return NextResponse.json(
        {
          error: data?.message || 'Zoom meeting creation failed',
          zoomCode: data?.code || 'unknown',
          fullZoomResponse: data,
        },
        { status: 500 }
      );
    }

    if (!data?.join_url) {
      console.error('⚠️ [API] Zoom response missing join_url:', data);
      return NextResponse.json({ error: 'Zoom did not return a join_url' }, { status: 502 });
    }

    console.log('✅ [API] Zoom meeting created:', data.join_url);
    return NextResponse.json({ join_url: data.join_url });

  } catch (error: any) {
    console.error('❌ [API] Fatal error in create-meeting:', error?.message || error);
    return NextResponse.json(
      { error: error?.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
