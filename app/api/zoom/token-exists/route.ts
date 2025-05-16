import { db } from '@/firebase/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const userToken = req.nextUrl.searchParams.get('userToken');
  if (!userToken) {
    return NextResponse.json({ exists: false });
  }

  const ref = doc(db, 'zoomTokens', userToken);
  const snapshot = await getDoc(ref);

  return NextResponse.json({ exists: snapshot.exists() });
}
