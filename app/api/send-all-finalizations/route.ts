// /pages/api/send-all-finalizations.ts

import { Resend } from 'resend';
import { formatInTimeZone } from 'date-fns-tz';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const {
      invitees,
      organizerEmail,
      organizerName,
      organizerTimezone,
      newlySentSlots,
      meetingTitle,
      meetingLink,
      pollLink,
      nonVoterNames = [],
      multiSlotConfirmation = true,
    } = await req.json();

    if (!invitees || !organizerEmail || !newlySentSlots || newlySentSlots.length === 0) {
      return new Response('Missing required fields', { status: 400 });
    }

    const formattedOrganizer = organizerName?.trim() || 'the organizer';

    const sendEmail = async ({
      to,
      name,
      slot,
      index,
      total,
      timezone,
      type,
    }: {
      to: string;
      name: string;
      slot: { start: string; duration: number };
      index: number;
      total: number;
      timezone: string;
      type: 'invitee' | 'organizer';
    }) => {
      const start = new Date(slot.start);
      const end = new Date(start.getTime() + (slot.duration || 30) * 60000);

      const formattedDate = formatInTimeZone(start, timezone, "EEEE, d MMM yyyy");
      const startTime = formatInTimeZone(start, timezone, 'HH:mm');
      const endTime = formatInTimeZone(end, timezone, 'HH:mm');

      const gcalStart = formatInTimeZone(start, 'UTC', "yyyyMMdd'T'HHmmss'Z'");
      const gcalEnd = formatInTimeZone(end, 'UTC', "yyyyMMdd'T'HHmmss'Z'");

      const googleCalURL = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(meetingTitle)}&dates=${gcalStart}/${gcalEnd}&details=${encodeURIComponent('Scheduled via GreatMeets')}&location=${encodeURIComponent(meetingLink || '')}`;

      const subject = multiSlotConfirmation && total > 1
        ? `📅 Your Great Meet Times are Confirmed (${index}/${total})`
        : '📅 Your Great Meet Time is Confirmed';

      const icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//GreatMeets.ai//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'BEGIN:VEVENT',
        `SUMMARY:${meetingTitle}`,
        `DESCRIPTION:Scheduled via GreatMeets`,
        `DTSTART:${gcalStart}`,
        `DTEND:${gcalEnd}`,
        `LOCATION:${meetingLink || 'GreatMeets'}`,
        `STATUS:CONFIRMED`,
        `ORGANIZER;CN=${formattedOrganizer}:mailto:hello@greatmeets.ai`,
        'END:VEVENT',
        'END:VCALENDAR',
      ].join('\r\n');

      const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; text-align: center; padding: 20px; background-color: #f4f4f4;">
        <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); max-width: 600px; margin: auto;">
          <h2 style="font-size: 22px; font-weight: bold; color: #10b981;">Your Great Meet Time is Ready</h2>
          <p style="font-size: 16px; color: #333;">
            Hi ${name} 👋<br/>
            ${multiSlotConfirmation && total > 1
              ? `You're all set! <strong>Multiple confirmed times</strong> have been finalized for your Great Meet.`
              : `You're all set! The time for your Great Meet with <strong>${formattedOrganizer}</strong> has been confirmed.`
            }
          </p>
          <p style="font-size: 18px; margin: 20px 0 10px; font-weight: 500; color: #111;">
            ${formattedDate}<br />${startTime}–${endTime} (${timezone})
          </p>
          <p style="font-size: 14px; color: #444;">Use the buttons below to access your meeting or add it to your calendar.</p>
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto 32px auto; text-align: center;">
            <tr>
              ${meetingLink ? `<td style="padding: 6px;"><a href="${meetingLink}" target="_blank" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 16px; border-radius: 6px; font-size: 14px; font-weight: 500; text-decoration: none;">Go to Your Great Meet</a></td>` : ''}
              <td style="padding: 6px;"><a href="${googleCalURL}" target="_blank" style="display: inline-block; background: #6366f1; color: white; padding: 12px 16px; border-radius: 6px; font-size: 14px; font-weight: 500; text-decoration: none;">📅 Add to Google Cal</a></td>
            </tr>
          </table>
          <a href="${pollLink}" style="background-color: #0047AB; background-image: linear-gradient(90deg, #f59e0b, #6366f1); color: white; text-decoration: none; padding: 12px 24px; font-size: 16px; border-radius: 8px; display: inline-block; font-weight: 600;">View Final Poll</a>
          ${type === 'organizer' && nonVoterNames.length > 0 ? `<p style="font-size: 15px; color: #b91c1c; margin-top: 20px;"><strong>FYI:</strong> These invitees didn’t vote: ${nonVoterNames.join(', ')}</p>` : ''}
          <p style="font-size: 14px; color: #666666; margin-top: 30px;">Powered by <a href="https://www.greatmeets.ai" style="color: #10b981; text-decoration: underline;"><strong>GreatMeets.ai</strong></a> 🚀 — Fast and Human Scheduling.</p>
        </div>
      </div>`;

      const plainText = `
Your Great Meet time is confirmed!

Hey ${name},

${multiSlotConfirmation && total > 1
  ? `You're all set! Multiple confirmed times have been finalized for your Great Meet.`
  : `You're all set! The time for your Great Meet with ${formattedOrganizer} has been confirmed.`}

Date: ${formattedDate}
Time: ${startTime}–${endTime} (${timezone})

${meetingLink ? `Join Meeting: ${meetingLink}` : ''}
Add to Google Calendar: ${googleCalURL}
View Final Poll: ${pollLink}

${type === 'organizer' && nonVoterNames.length > 0 ? `FYI: These invitees didn’t vote: ${nonVoterNames.join(', ')}` : ''}

If you have any questions, just reply to this email.

Powered by GreatMeets.ai — Fast and Human Scheduling.
https://www.greatmeets.ai
`.trim();

      const result = await resend.emails.send({
        from: 'Great Meets <hello@greatmeets.ai>',
        to,
        subject,
        html,
        text: plainText,
        replyTo: 'hello@greatmeets.ai',
        headers: {
          'List-Unsubscribe': '<mailto:unsubscribe@greatmeets.ai>, <https://www.greatmeets.ai/unsubscribe>'
        },
        attachments: [
          {
            filename: 'GreatMeet.ics',
            content: Buffer.from(icsContent, 'utf-8')
          }
        ]
      });

      console.log(`📤 Sent to ${type}: ${to}, status:`, result);
    };

    for (const invitee of invitees) {
      const email = invitee.email?.trim().toLowerCase();
      const name = invitee.firstName || 'there';
      const tz = typeof invitee.timezone === 'string' && invitee.timezone.includes('/') ? invitee.timezone : 'UTC';
      for (let i = 0; i < newlySentSlots.length; i++) {
        await sendEmail({ to: email, name, slot: newlySentSlots[i], index: i + 1, total: newlySentSlots.length, timezone: tz, type: 'invitee' });
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 500));
      }
    }

    const resolvedTz = typeof organizerTimezone === 'string' && organizerTimezone.includes('/')
      ? organizerTimezone
      : Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

    console.log(`Organizer TZ input: ${organizerTimezone}, resolved: ${resolvedTz}`);

    for (let i = 0; i < newlySentSlots.length; i++) {
      await sendEmail({ to: organizerEmail, name: organizerName, slot: newlySentSlots[i], index: i + 1, total: newlySentSlots.length, timezone: resolvedTz, type: 'organizer' });
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 500));
    }

    return new Response('Batch confirmation emails sent.', { status: 200 });
  } catch (err: any) {
    console.error('❌ send-all-finalizations failed:', err.message || err);
    return new Response('Internal Server Error', { status: 500 });
  }
}