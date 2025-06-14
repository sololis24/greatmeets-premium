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
      const timeRange = `${formattedDate}<br />${startTime}–${endTime} (${timezone.replace(/_/g, ' ')})`;

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
        `ORGANIZER;CN=${formattedOrganizer}:mailto:noreply@greatmeets.ai`,
        'END:VEVENT',
        'END:VCALENDAR',
      ].join('\r\n');

      const html = `
        <div style="font-family: system-ui; text-align: center; padding: 20px;">
          <h2 style="color: #10b981;">Final Time Confirmed</h2>
          <p>Hey ${name} 👋</p>
          <p>${multiSlotConfirmation && total > 1
            ? '<strong>Multiple confirmed times</strong> have been finalized.'
            : `Your Great Meet with <strong>${formattedOrganizer}</strong> is confirmed.`}</p>
          <p><strong>${timeRange}</strong></p>
          <p><a href="${meetingLink}" target="_blank">🔗 Join Meeting</a> | <a href="${googleCalURL}" target="_blank">📅 Google Calendar</a></p>
          <p><a href="${pollLink}" target="_blank">View Final Poll</a></p>
          ${type === 'organizer' && nonVoterNames.length > 0 ? `<p style="color: red;"><strong>Non-voters:</strong> ${nonVoterNames.join(', ')}</p>` : ''}
          <p style="font-size: 12px; color: gray;">Sent by GreatMeets.ai</p>
        </div>`;

      const result = await resend.emails.send({
        from: 'Great Meets <noreply@greatmeets.ai>',
        to,
        subject,
        html,
        attachments: [
          {
            filename: 'GreatMeet.ics',
            content: Buffer.from(icsContent, 'utf-8'),
          },
        ],
      });

      console.log(`📤 Sent to ${type}: ${to}, status:`, result);
    };

    // Invitees
    for (const invitee of invitees) {
      const email = invitee.email?.trim().toLowerCase();
      const name = invitee.firstName || 'there';
      const tz = typeof invitee.timezone === 'string' && invitee.timezone.includes('/')
        ? invitee.timezone
        : 'UTC';
      for (let i = 0; i < newlySentSlots.length; i++) {
        await sendEmail({
          to: email,
          name,
          slot: newlySentSlots[i],
          index: i + 1,
          total: newlySentSlots.length,
          timezone: tz,
          type: 'invitee',
        });
        await new Promise(resolve => setTimeout(resolve, 400));
      }
    }

    // Organizer
    for (let i = 0; i < newlySentSlots.length; i++) {
      await sendEmail({
        to: organizerEmail,
        name: organizerName,
        slot: newlySentSlots[i],
        index: i + 1,
        total: newlySentSlots.length,
        timezone: organizerTimezone || 'UTC',
        type: 'organizer',
      });
      await new Promise(resolve => setTimeout(resolve, 400));
    }

    return new Response('Batch confirmation emails sent.', { status: 200 });
  } catch (err: any) {
    console.error('❌ send-all-finalizations failed:', err.message || err);
    return new Response('Internal Server Error', { status: 500 });
  }
}
