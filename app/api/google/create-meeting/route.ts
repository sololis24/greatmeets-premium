import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/firebase/firebaseConfig';
import { doc, getDoc, setDoc } from 'firebase/firestore';

// 🔁 Google token refresh helper
async function refreshGoogleAccessToken(userToken: string) {
  const tokenRef = doc(db, 'googleTokens', userToken);
  const tokenSnap = await getDoc(tokenRef);

  if (!tokenSnap.exists()) {
    throw new Error('No token found for this user.');
  }

  const tokenData = tokenSnap.data();
  const refreshToken = tokenData.refresh_token;

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    console.error('🔁 Google token refresh failed:', data);
    throw new Error('Google token refresh failed');
  }

  const updatedToken = {
    ...tokenData,
    access_token: data.access_token,
    expires_in: data.expires_in,
    token_type: data.token_type,
    expiry_date: Date.now() + data.expires_in * 1000,
  };

  await setDoc(tokenRef, updatedToken);
  return updatedToken.access_token;
}

export async function POST(req: NextRequest) {
  try {
    const { userToken } = await req.json();
    console.log('📥 Received userToken:', userToken);

    if (!userToken) {
      return NextResponse.json({ error: 'Missing userToken' }, { status: 400 });
    }

    const tokenRef = doc(db, 'googleTokens', userToken);
    const tokenDoc = await getDoc(tokenRef);
    console.log('🔍 Token doc exists:', tokenDoc.exists());

    if (!tokenDoc.exists()) {
      return NextResponse.json({ error: 'Google token not found' }, { status: 404 });
    }

    const tokenData = tokenDoc.data();
    let accessToken = tokenData.access_token;

    const eventPayload = {
      summary: 'GreatMeet',
      description: 'Generated via GreatMeets',
      start: {
        dateTime: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        timeZone: 'UTC',
      },
      end: {
        dateTime: new Date(Date.now() + 40 * 60 * 1000).toISOString(),
        timeZone: 'UTC',
      },
      conferenceData: {
        createRequest: {
          requestId: `greatmeets-${Date.now()}`,
          conferenceSolutionKey: {
            type: 'hangoutsMeet',
          },
        },
      },
    };

    const attemptCreateMeeting = async (token: string) => {
      const res = await fetch(
        'https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(eventPayload),
        }
      );
      const data = await res.json();
      return { ok: res.ok, data };
    };

    let { ok, data } = await attemptCreateMeeting(accessToken);

    if (!ok && data?.error?.code === 401) {
      console.warn('🔁 Access token expired. Refreshing...');
      accessToken = await refreshGoogleAccessToken(userToken);
      ({ ok, data } = await attemptCreateMeeting(accessToken));
    }

    if (!ok) {
      console.error('❌ Google Calendar event creation failed:', data);
      return NextResponse.json({ error: data }, { status: 500 });
    }

    const meetLink =
      data.hangoutLink || data.conferenceData?.entryPoints?.[0]?.uri || null;

    if (!meetLink) {
      console.warn('⚠️ No Meet link found in response:', data);
    }

    return NextResponse.json({ meetLink });
  } catch (error: any) {
    console.error('❌ Google meeting creation error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
