// /pages/api/init-user.ts
import { db } from '@/firebase/firebaseConfig';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const permanentProEmails = [
  'lis@gogreatgroup.com',
  // ➕ Add more emails here as needed
  'friend@example.com',
  'team@clientdomain.com',
];

export async function POST(req: Request) {
  const url = new URL(req.url || '', 'http://localhost');
  const shouldReset = url.searchParams.get('resetTrial') === 'true';

  const { email } = await req.json();
  if (!email) return new Response('Missing email', { status: 400 });

  const normalizedEmail = email.toLowerCase();
  const userRef = doc(db, 'users', normalizedEmail);
  const userSnap = await getDoc(userRef);

  // 🔐 Always grant Pro if email is whitelisted
  if (permanentProEmails.includes(normalizedEmail)) {
    await setDoc(userRef, {
      isPro: true,
      upgradedAt: new Date().toISOString(),
      trialUsed: true,
    }, { merge: true });

    return new Response(`✅ ${normalizedEmail} is permanently Pro`);
  }

  // 🟢 Dev-only override for trial reset
  if (process.env.NODE_ENV === 'development' && shouldReset) {
    await setDoc(userRef, {
      trialStartedAt: new Date().toISOString(),
      trialUsed: false,
    }, { merge: true });

    return new Response('✅ Trial reset for development');
  }

  // ✅ Only create trial if the user doesn't already exist
  if (!userSnap.exists()) {
    await setDoc(userRef, {
      trialStartedAt: new Date().toISOString(),
      trialUsed: false,
    });
  }

  return new Response('ok');
}
