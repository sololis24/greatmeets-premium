import { db } from '@/firebase/firebaseConfig';
import { doc, updateDoc } from 'firebase/firestore';
import { Resend } from 'resend';


const resend = new Resend(process.env.RESEND_API_KEY);

interface Vote {
  email?: string;
  selectedSlots: string[];
  name?: string;
}

interface Invitee {
  email: string;
  firstName?: string;
  lastName?: string;
  name?: string;
}

interface PollData {
  title?: string;
  organizerName?: string;
  organizerEmail?: string;
  selectedTimes: string[];
  votes?: Vote[];
  invitees?: Invitee[];
}

export async function finalizePoll(pollId: string, pollData: PollData) {
  const { votes = [], selectedTimes = [], title, organizerName, organizerEmail, invitees = [] } = pollData;

  // 🧠 Step 1: Tally votes
  const voteCounts: Record<string, number> = {};

  for (const time of selectedTimes) {
    voteCounts[time] = 0;
  }

  for (const vote of votes) {
    for (const slot of vote.selectedSlots) {
      if (voteCounts[slot] !== undefined) {
        voteCounts[slot]++;
      }
    }
  }

  // 🏆 Step 2: Pick the time with most votes
  const sorted = Object.entries(voteCounts).sort((a, b) => b[1] - a[1]);
  const finalizedTime = sorted[0]?.[0];

  if (!finalizedTime) {
    console.warn(`❌ Could not finalize poll ${pollId} — no valid votes`);
    return;
  }

  // ✅ Step 3: Update Firestore
  const pollRef = doc(db, 'polls', pollId);
  await updateDoc(pollRef, {
    finalized: true,
    finalizedTime,
  });

  // 💌 Step 4: Send emails to all invitees
  const pollLink = `${process.env.NEXT_PUBLIC_SITE_URL}/polls/${pollId}/results`;
  const readableTime = new Date(finalizedTime).toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const html = `
    <div style="font-family: sans-serif; padding: 24px;">
      <h2 style="color:#10b981;">🎉 It's Official!</h2>
      <p><strong>${organizerName || 'The organizer'}</strong> has finalized the time for <strong>${title || 'your meeting'}</strong>.</p>
      <p>The chosen time is:</p>
      <h3 style="color: #2563eb;">${readableTime}</h3>
      <a href="${pollLink}" style="margin-top: 20px; display: inline-block; padding: 12px 20px; background: #10b981; color: white; border-radius: 8px; text-decoration: none;">View Final Time</a>
      <p style="font-size: 14px; color: #666666; margin-top: 30px;">
        Powered by <a href="https://www.greatmeets.ai" style="color: #10b981;">GreatMeets.ai</a>
      </p>
    </div>
  `;

  const recipients = invitees
    .map(i => i.email)
    .filter((email): email is string => !!email);

  for (const email of recipients) {
    try {
      await resend.emails.send({
        from: 'GreatMeets.ai <noreply@greatmeets.ai>',
        to: email,
        subject: `🎉 Final Time Confirmed for ${title || 'Your Meeting'}`,
        html,
      });
    } catch (err) {
      console.error(`❌ Failed to send final email to ${email}:`, err);
    }
  }

  // ✅ Optional: Notify organizer
  if (organizerEmail) {
    try {
      await resend.emails.send({
        from: 'GreatMeets.ai <noreply@greatmeets.ai>',
        to: organizerEmail,
        subject: `✅ Poll Finalized: ${title || 'Your Meeting'}`,
        html,
      });
    } catch (err) {
      console.error(`❌ Failed to send finalization email to organizer:`, err);
    }
  }

  console.log(`✅ Poll ${pollId} finalized at ${finalizedTime}`);
}
