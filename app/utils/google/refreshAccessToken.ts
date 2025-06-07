import { db } from '@/firebase/firebaseConfig';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export async function refreshGoogleAccessToken(userToken: string) {
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
    console.error('Failed to refresh Google token:', data);
    throw new Error('Token refresh failed');
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
