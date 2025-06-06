import { db } from '@/firebase/firebaseConfig';
import { doc, updateDoc } from 'firebase/firestore';
import { Resend } from 'resend';
import { formatInTimeZone } from 'date-fns-tz';

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
  timezone?: string;
}

interface TimeSlot {
  start: string;
  duration?: number;
}

interface PollData {
  title?: string;
  organizerName?: string;
  organizerEmail?: string;
  organizerTimezone?: string;
  selectedTimes: TimeSlot[];
  votes?: Vote[];
  invitees?: Invitee[];
  multiSlotConfirmation?: boolean;
}

export async function finalizePoll(
  pollId: string,
  pollData: PollData,
  formatTimeFn?: (slot: TimeSlot) => string
) {
  const {
    votes = [],
    selectedTimes = [],
    title,
    organizerName,
    organizerEmail,
    invitees = [],
    multiSlotConfirmation = false
  } = pollData;

  const voteCounts: Record<string, number> = {};
  for (const slot of selectedTimes) {
    voteCounts[slot.start] = 0;
  }

  for (const vote of votes) {
    for (const slot of vote.selectedSlots) {
      if (voteCounts[slot] !== undefined) {
        voteCounts[slot]++;
      }
    }
  }

  let finalizedTimes: string[] = [];

  if (multiSlotConfirmation && invitees.length > 0) {
    const allEmails = invitees.map(i => i.email?.toLowerCase().trim()).filter(Boolean);
    const uniqueVoters = votes.reduce((acc, v) => {
      const key = v.email?.toLowerCase().trim();
      if (key && !acc.has(key)) acc.set(key, v.selectedSlots);
      return acc;
    }, new Map<string, string[]>());

    finalizedTimes = selectedTimes
      .filter(slot => Array.from(uniqueVoters.values()).every(sel => sel.includes(slot.start)))
      .map(slot => slot.start);
  } else {
    const sorted = Object.entries(voteCounts).sort((a, b) => b[1] - a[1]);
    if (sorted.length > 0) {
      finalizedTimes = [sorted[0][0]];
    }
  }

  if (finalizedTimes.length === 0) {
    console.warn(`❌ Could not finalize poll ${pollId} — no confirmed slots`);
    return;
  }

  const pollRef = doc(db, 'polls', pollId);
  await updateDoc(pollRef, {
    finalized: true,
    finalizedSlot: finalizedTimes[0],
    lastFinalizationEmailSentForSlot: finalizedTimes[0],
  });

  const pollLink = `${process.env.NEXT_PUBLIC_SITE_URL}/polls/${pollId}/results`;
  const tz = pollData.organizerTimezone || Intl.DateTimeFormat().resolvedOptions().timeZone;

  for (const time of finalizedTimes) {
    const selectedSlot = selectedTimes.find(slot => slot.start === time);
   
    const fallbackTime = selectedSlot
    ? formatInTimeZone(new Date(time), tz, 'eeee, d MMM yyyy, HH:mm (zzz)')
    : 'Invalid time';

    const readableTime = formatTimeFn && selectedSlot ? formatTimeFn(selectedSlot) : fallbackTime;

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

    console.log('📬 Organizer email payload:', {
      to: organizerEmail,
      organizerName,
      title,
      readableTime,
      link: pollLink,
    });
    

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
  }

  console.log(`✅ Poll ${pollId} finalized at ${finalizedTimes.join(', ')}`);
}