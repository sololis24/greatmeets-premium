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

    console.log('📥 create-meeting request received for token:', userToken);

    const tokenRef = doc(db, 'zoomTokens', userToken);
    const tokenDoc = await getDoc(tokenRef);

    if (!tokenDoc.exists()) {
      console.warn('⚠️ No Zoom token found for userToken:', userToken);
      return NextResponse.json({ error: 'Zoom token not found' }, { status: 401 });
    }

    const tokenData = tokenDoc.data();
    let accessToken = tokenData.access_token;

    const createZoomMeeting = async (token: string) => {
      const res = await fetch('https://api.zoom.us/v2/users/me/meetings', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: 'GreatMeet',
          type: 1,
          settings: {
            host_video: true,
            participant_video: true,
          },
        }),
      });

      const data = await res.json();
      return { ok: res.ok, data };
    };

    // Try first time
    let { ok, data } = await createZoomMeeting(accessToken);

    // Retry after refresh if needed
    if (!ok && data?.code === 124) {
      console.warn('🔁 Zoom token expired. Refreshing...');
      accessToken = await refreshZoomAccessToken(userToken);
      ({ ok, data } = await createZoomMeeting(accessToken));
    }

  if (!ok) {
  console.error('Zoom meeting creation failed:', JSON.stringify(data, null, 2));
  return NextResponse.json({ error: data }, { status: 500 });
}

    console.log('✅ Zoom meeting created:', data.join_url);
    return NextResponse.json({ join_url: data.join_url });
  } catch (error: any) {
    console.error('❌ Error creating Zoom meeting:', error.message || error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
