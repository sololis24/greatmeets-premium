// src/app/api/send-invites/route.js

import { NextResponse } from 'next/server';
import { sendInvites, sendConfirmationEmail } from '@/lib/resend'; // Import the new function
import { db } from '@/firebase/firebaseConfig';  // Correct path
import { doc, updateDoc } from 'firebase/firestore';

export async function POST(req) {
  try {
    const body = await req.json();
    console.log('📬 Finalizing meeting with body:', body);

    const { invitees, timeSlots, votes, organizerName, pollId, organizerEmail } = body;

    if (!invitees || !timeSlots || !votes || !organizerName || !pollId || !organizerEmail) {
      return NextResponse.json({ message: 'Missing required fields.' }, { status: 400 });
    }

    // Process and count votes
    const voteCounts = {};
    votes.forEach((vote) => {
      (vote.selectedSlots || []).forEach((slot) => {
        voteCounts[slot] = (voteCounts[slot] || 0) + 1;
      });
    });

    const sortedSlots = Object.entries(voteCounts).sort((a, b) => b[1] - a[1]);
    const topTimes = sortedSlots.slice(0, 3).map((slot) => slot[0]);
    const finalTime = topTimes[0];
    console.log('📅 Final time chosen:', finalTime);

    // Update Firestore
    const pollRef = doc(db, 'polls', pollId);
    await updateDoc(pollRef, {
      finalized: true,
      finalTime,
    });

    // Clean invitees before sending
    const safeInvitees = invitees.map((invitee) => ({
      name: invitee.name,
      email: invitee.email?.replace(',', '').trim(),
    })).filter((invitee) => invitee.email);

    const pollLink = `https://yourwebsite.com/polls/${pollId}/results`;

    // Send invites to the invitees
    await sendInvites(safeInvitees, pollLink, organizerName);

    // Send confirmation email to the organizer
    await sendConfirmationEmail(organizerEmail, organizerName, pollLink);

    return NextResponse.json({ success: true, finalTime });

  } catch (error) {
    console.error('❌ Error finalizing meeting:', error);
    return NextResponse.json({ success: false, message: 'Internal server error.' }, { status: 500 });
  }
}
