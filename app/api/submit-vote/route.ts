// src/app/api/submit-vote/route.ts

import { db } from '@/firebase/firebaseConfig';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const {
      pollId,
      selectedSlots,
      participantName,
      participantEmail,
      organizerName,
      organizerEmail,
    } = await req.json();

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

    const pollLink = `${process.env.NEXT_PUBLIC_SITE_URL}/polls/${pollId}/results`;
    const selectedTimes = selectedSlots.map((start: string) => {
      const slotMatch = pollData.selectedTimes?.find((s: any) => s.start === start);
      return {
        start,
        duration: slotMatch?.duration || 30,
      };
    });

    // ✅ Notify organizer
    try {
      await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/send-vote-notification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizerEmail,
          organizerName,
          participantName,
          pollLink,
          deadline: pollData.deadline || null,
        }),
      });
    } catch (err) {
      console.error('❌ Failed to notify organizer:', err);
    }

    // ✅ Send thank-you email to participant
    try {
      console.log('📨 Sending thank-you email to:', participantEmail, selectedTimes);

      await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/send-thank-you`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participantEmail: participantEmail?.trim().toLowerCase(),
          participantName,
          selectedTimes,
          organizerName,
          pollLink,
          deadline: pollData.deadline || null,
          meetingLink: pollData.meetingLink || null,
          duration: pollData.duration || null,
          timezone: pollData.timezone || 'UTC'
        }),
      });
    } catch (err) {
      console.error('❌ Failed to send thank-you email:', err);
    }

    // ✅ Send vote update confirmation email to participant
    try {
      await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/vote-update-confirmation-invitee`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participantEmail: participantEmail?.trim().toLowerCase(),
          participantName,
          selectedTimes,
          organizerName,
          pollLink,
          deadline: pollData.deadline || null,
          meetingLink: pollData.meetingLink || null,
          timezone: pollData.timezone || 'UTC',
        }),
      });
    } catch (err) {
      console.error('❌ Failed to send vote update confirmation:', err);
    }

    console.log(`✅ Vote submitted & all emails triggered for ${participantEmail}`);

    return new NextResponse('Vote submitted.', { status: 200 });

  } catch (error) {
    console.error('❌ Error submitting vote:', error);
    return new NextResponse('Internal server error.', { status: 500 });
  }
}
