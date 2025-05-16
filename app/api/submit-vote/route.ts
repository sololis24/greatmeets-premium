// src/app/api/submit-vote/route.ts

import { db } from '@/firebase/firebaseConfig';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { pollId, selectedSlots, participantName, participantEmail, organizerName, organizerEmail } = await req.json();

    const pollRef = doc(db, 'polls', pollId);
    const pollSnap = await getDoc(pollRef);

    if (!pollSnap.exists()) {
      return new NextResponse('Poll not found.', { status: 404 });
    }

    const pollData = pollSnap.data();
    const userToken = participantEmail.toLowerCase().trim(); // use email as a token

    const updatedVotes = [
      ...(pollData.votes || []).filter((v: any) => v.userToken !== userToken),
      { userToken, name: participantName, selectedSlots },
    ];

    await updateDoc(pollRef, { votes: updatedVotes });

    // Send the two emails 🚀
    await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/send-vote-notification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        organizerEmail,
        organizerName,
        participantName,
        pollLink: `${process.env.NEXT_PUBLIC_SITE_URL}/polls/${pollId}/results`
      }),
    });

    await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/send-thank-you`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        participantEmail,
        participantName,
        selectedTimes: selectedSlots.map((iso: string) => new Date(iso).toLocaleString()).join('<br/>'),
        organizerName,
        pollLink: `${process.env.NEXT_PUBLIC_SITE_URL}/polls/${pollId}/results`
      }),
    });

    return new NextResponse('Vote submitted.', { status: 200 });

  } catch (error) {
    console.error('Error submitting vote:', error);
    return new NextResponse('Internal server error.', { status: 500 });
  }
}
