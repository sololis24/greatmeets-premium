console.log("🕐 Checking for polls expiring tomorrow...");


import dotenv from 'dotenv';
dotenv.config({ path: '.env.production.local' });


import { Resend } from 'resend';
import { db } from '../firebase/firebaseConfig.js';
import { collection, getDocs } from 'firebase/firestore';

const pollTitle = poll.title || "Your Great Meet";

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendReminderEmails() {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);

  const querySnapshot = await getDocs(collection(db, 'polls'));

  for (const pollDoc of querySnapshot.docs) {
    const poll = pollDoc.data();
    const pollId = pollDoc.id;

    if (!poll.deadline || poll.finalized) continue;

    const deadlineDate = new Date(poll.deadline);

    const isTomorrow =
      deadlineDate.getUTCFullYear() === tomorrow.getUTCFullYear() &&
      deadlineDate.getUTCMonth() === tomorrow.getUTCMonth() &&
      deadlineDate.getUTCDate() === tomorrow.getUTCDate();

    if (!isTomorrow) continue;

    const organizerEmail = poll.organizerEmail?.toLowerCase();
    const siteURL = process.env.NEXT_PUBLIC_SITE_URL || 'https://greatmeets.ai';
    const pollLink = `${siteURL}/polls/${pollId}`;

    const invitees = (poll.invitees || []).filter((i) =>
      i.email?.toLowerCase() !== organizerEmail
    );

    console.log(`📩 Sending reminders for: "${poll.title}"`);

    for (const invitee of invitees) {
      const email = invitee.email?.toLowerCase().trim();
      const name =
        invitee.name?.trim() ||
        [invitee.firstName, invitee.lastName].filter(Boolean).join(' ').trim() ||
        email;

      const alreadyVoted = poll.votes?.some(
        (v) => v.email?.toLowerCase().trim() === email
      );

      const alreadyCancelled = poll.cancellations?.some(
        (c) => c.email?.toLowerCase().trim() === email
      );

      if (!email || alreadyVoted || alreadyCancelled) continue;

      const html = `
        <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px; background-color: #f4f4f4;">
          <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h2 style="color: #f59e0b;">⏳ One Day Left to Vote!</h2>
            <p style="font-size: 16px; color: #333;">Hey ${name}, just a quick reminder to vote in your Great Meet:</p>
            <p style="font-size: 18px;"><strong>${poll.title}</strong></p>
            <p style="font-size: 14px; color: #666;">Voting deadline is <strong>${deadlineDate.toLocaleString(undefined, {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}</strong></p>
            <a href="${pollLink}?email=${encodeURIComponent(email)}" style="background: linear-gradient(90deg, #10b981, #4f46e5); color: white; padding: 12px 24px; font-size: 16px; border-radius: 8px; text-decoration: none; display: inline-block; margin-top: 20px;">Vote Now</a>
            <p style="font-size: 12px; color: #999; margin-top: 30px;">Thanks for using <strong>GreatMeets.ai</strong> 💚</p>
          </div>
        </div>
      `;

      const response = await resend.emails.send({
        from: 'Great Meets <noreply@greatmeets.ai>',
        to: email,
        subject: `⏳ 1 Day Left to Vote in "${poll.title}"`,
        html,
      });

      console.log(`✅ Reminder sent to ${email}`, response);
    }
  }
}

export default sendReminderEmails;
