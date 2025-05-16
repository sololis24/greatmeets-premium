import { NextResponse } from 'next/server';
import { db } from '@/firebase/firebaseConfig';
import { collection, doc, getDocs, updateDoc } from 'firebase/firestore';
import { Resend } from 'resend';
import { utcToZonedTime } from 'date-fns-tz';

export const config = {
  schedule: '*/30 * * * *', // runs every 30 minutes
};

const resend = new Resend(process.env.RESEND_API_KEY);

const sendReminderEmail = async (
  inviteeEmail: string,
  pollLink: string,
  organizerName: string,
  meetTitle: string
) => {
  try {
    const html = `
      <div style="font-family: 'Poppins', sans-serif; padding: 30px; background: #fff8e1; border-radius: 12px; text-align: center;">
        <h2 style="color: #f59e0b;">⏳ Don't Miss Out!</h2>
        <p><strong>${organizerName}</strong> is waiting for your availability for <strong>${meetTitle}</strong>.</p>
        <a href="${pollLink}" style="display:inline-block; margin-top:20px; padding:12px 24px; background:#f59e0b; color:white; border-radius:8px; text-decoration:none; font-weight:bold;">
          Submit Availability
        </a>
        <p style="font-size: 14px; color: #666666; margin-top: 30px;">
          Powered by <a href="https://www.greatmeets.ai" style="color: #10b981; text-decoration: underline;"><strong>GreatMeets.ai</strong></a> 🚀 — Fast and Human Scheduling.
        </p>
      </div>
    `;

    const response = await resend.emails.send({
      from: 'GreatMeets.ai <noreply@greatmeets.ai>',
      to: inviteeEmail,
      subject: `⏳ Reminder: Respond to ${meetTitle}!`,
      html,
    });

    console.log(`✅ Reminder email sent to ${inviteeEmail}:`, response);
  } catch (error) {
    console.error('❌ Error sending reminder email:', error);
    throw error;
  }
};

function isString(email: string | null): email is string {
  return typeof email === 'string';
}

export async function POST(): Promise<Response> {
  try {
    const allPollsSnap = await getDocs(collection(db, 'polls'));
    const now = Date.now();

    const pollsToRemind = allPollsSnap.docs.filter((docSnap) => {
      const data = docSnap.data();
      if (!data.deadline || data.reminderSentAt) return false;

      const deadline = new Date(data.deadline).getTime();
      const hoursToDeadline = (deadline - now) / (1000 * 60 * 60);

      return hoursToDeadline > 11 && hoursToDeadline < 25; // 12–24hr window
    });

    for (const pollDoc of pollsToRemind) {
      const pollId = pollDoc.id;
      const pollRef = doc(db, 'polls', pollId);
      const pollData = pollDoc.data();
      const { invitees = [], votes = [], title, organizerName } = pollData;

      const votersByEmail = (votes as { email?: string }[])
        .map((v) => v.email?.toLowerCase().trim())
        .filter((email): email is string => typeof email === 'string');

      const nonVoters = (invitees as { email?: string }[]).filter((i) => {
        const cleaned = i.email?.toLowerCase().trim();
        return cleaned && !votersByEmail.includes(cleaned);
      });

      const pollLink = `${process.env.NEXT_PUBLIC_SITE_URL}/polls/${pollId}`;

      for (const invitee of nonVoters) {
        if (invitee.email) {
          await sendReminderEmail(
            invitee.email,
            pollLink,
            organizerName || 'The Organizer',
            title || 'your Great Meet'
          );
        }
      }

      await updateDoc(pollRef, {
        reminderSentAt: new Date().toISOString(),
      });
    }

    return NextResponse.json({ message: 'Reminders sent if due' }, { status: 200 });
  } catch (error) {
    console.error('❌ Error in /api/send-reminders:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}