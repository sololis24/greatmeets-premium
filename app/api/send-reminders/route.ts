import { NextResponse } from 'next/server';
import { db } from '@/firebase/firebaseConfig';
import { collection, doc, getDocs, updateDoc } from 'firebase/firestore';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const sendReminderEmail = async (
  inviteeEmail: string,
  inviteeName: string,
  inviteeToken: string,
  pollLink: string,
  organizerName: string,
  meetTitle: string,
  deadline?: string
) => {
  try {
    const personalizedLink = `${pollLink}?name=${encodeURIComponent(inviteeName)}&email=${encodeURIComponent(inviteeEmail)}&token=${encodeURIComponent(inviteeToken)}`;

    const formattedDeadline = deadline
      ? new Date(deadline).toLocaleString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          timeZoneName: 'short',
        })
      : null;

    const html = `
      <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px; background-color: #f4f4f4;">
        <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
         <h1 style="font-size: 24px; color:rgb(82, 23, 243); font-weight: bold;">⏳ Reminder: Your Vote is Needed</h1>
          <p style="font-size: 18px; color: #333333;">${organizerName} is waiting for your availability for a Great Meet.</p>
          ${meetTitle ? `<h2 style="font-size: 20px; color:rgb(9, 171, 66); font-weight: bold; margin: 10px 0;">${meetTitle}</h2>` : ''}
          <a href="${personalizedLink}" style="background: linear-gradient(90deg, #34d399, #4f46e5); color: white; text-decoration: none; padding: 15px 30px; font-size: 16px; border-radius: 8px; display: inline-block; margin-top: 20px;">Submit Your Time(s)</a>
          ${
            formattedDeadline
              ? `<p style="font-size: 14px; color: #999999; margin-top: 20px;">Voting closes on <strong>${formattedDeadline}</strong></p>`
              : ''
          }
          <p style="font-size: 14px; color: #666666; margin-top: 30px;">
            Powered by <a href="https://www.greatmeets.ai" style="color: #10b981; text-decoration: underline;"><strong>GreatMeets.ai</strong></a> 🚀 — Fast and Human Scheduling.
          </p>
        </div>
      </div>
    `;

    const response = await resend.emails.send({
      from: 'GreatMeets.ai <noreply@greatmeets.ai>',
      to: inviteeEmail,
      subject: `⏳ Reminder: Respond to ${organizerName || 'the organizer'}!`,
      html,
    });

    console.log(`✅ Reminder email sent to ${inviteeEmail}`);
    console.log(`📨 Resend response for ${inviteeEmail}:`, JSON.stringify(response, null, 2));
  } catch (error) {
    console.error(`❌ Error sending reminder to ${inviteeEmail}:`, error);
    throw error;
  }
};

export async function POST() {
  try {
    const allPollsSnap = await getDocs(collection(db, 'polls'));
    const now = Date.now();

    const pollsToRemind = allPollsSnap.docs.filter((docSnap) => {
      const data = docSnap.data();
      const pollId = docSnap.id;

      if (!data.deadline) {
        console.log(`⏭️ [${pollId}] Skipping — no deadline set`);
        return false;
      }

      const deadline = new Date(data.deadline).getTime();
      const hoursToDeadline = (deadline - now) / (1000 * 60 * 60);

      console.log(`⏱️ [${pollId}] Deadline in ${hoursToDeadline.toFixed(2)} hours`);
      console.log(`📌 [${pollId}] reminderSentAt: ${data.reminderSentAt} | deadline: ${data.deadline}`);

      if (data.reminderSentAt) {
        const reminderSentTime = new Date(data.reminderSentAt).getTime();
        const hoursSinceReminder = (now - reminderSentTime) / (1000 * 60 * 60);

        if (hoursSinceReminder < 48) {
          console.log(`⏭️ [${pollId}] Skipping — reminder sent in last ${hoursSinceReminder.toFixed(2)} hours`);
          return false;
        }
      }

      if (hoursToDeadline > 4 && hoursToDeadline < 25) {
        console.log(`✅ [${pollId}] Eligible for reminder`);
        return true;
      } else {
        console.log(`⏭️ [${pollId}] Outside reminder window (4–25h)`);
        return false;
      }
    });

    console.log(`📋 Found ${pollsToRemind.length} poll(s) eligible for reminders`);

    for (const pollDoc of pollsToRemind) {
      const pollId = pollDoc.id;
      const pollRef = doc(db, 'polls', pollId);
      const pollData = pollDoc.data();
      const { invitees = [], votes = [], title, organizerName, deadline } = pollData;

      const votersByEmail = (votes as { email?: string }[])
        .map((v) => v.email?.toLowerCase().trim())
        .filter((email): email is string => typeof email === 'string');

      const nonVoters = (invitees as { email?: string; firstName?: string; lastName?: string; token?: string }[]).filter((i) => {
        const cleaned = i.email?.toLowerCase().trim();
        return cleaned && !votersByEmail.includes(cleaned);
      });

      console.log(`👥 [${pollId}] ${nonVoters.length} non-voter(s)`);

      const pollLink = `${process.env.NEXT_PUBLIC_SITE_URL}/polls/${pollId}`;

      for (const invitee of nonVoters) {
        if (invitee.email) {
          const name = `${invitee.firstName || ''} ${invitee.lastName || ''}`.trim();
          const token = invitee.token || '';

          console.log(`📧 [${pollId}] Sending reminder to ${invitee.email}`);

          await sendReminderEmail(
            invitee.email,
            name,
            token,
            pollLink,
            organizerName || 'The Organizer',
            title || 'your Great Meet',
            deadline
          );
        } else {
          console.log(`⚠️ [${pollId}] Skipped invitee with no email`);
        }
      }

      await updateDoc(pollRef, {
        reminderSentAt: new Date().toISOString(),
      });

      console.log(`📝 [${pollId}] Updated reminderSentAt`);
    }

    return NextResponse.json({ message: 'Reminders sent if due' }, { status: 200 });
  } catch (error) {
    console.error('❌ Error in /api/send-reminders:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
