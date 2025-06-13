// /app/api/get-user-access/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/firebase/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: 'Missing email' }, { status: 400 });

    const userSnap = await getDoc(doc(db, 'users', email.toLowerCase()));
    const user = userSnap.exists() ? userSnap.data() : null;

    if (!user) return NextResponse.json({ isPro: false, inTrial: false });

    const isPro = user.isPro === true;
    const isDev = process.env.NODE_ENV === 'development';

    let inTrial = false;

    if (isDev) {
      inTrial = true;
    } else if (user.trialStartedAt) {
      const diff = Date.now() - new Date(user.trialStartedAt).getTime();
      inTrial = diff < 7 * 24 * 60 * 60 * 1000;
    }
    return NextResponse.json({ isPro, inTrial });
  } catch (error) {
    console.error('❌ get-user-access error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
