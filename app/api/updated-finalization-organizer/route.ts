import { Resend } from 'resend';
import { formatInTimeZone } from 'date-fns-tz';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const {
      to,
      time,
      name,
      link,
      meetingLink,
      recipientTimezone,
      meetingTitle,
      organizerName,
    } = await req.json();

    if (!to || !time || !link) {
      console.error('❌ Missing fields for organizer confirmation email.');
      return new Response('Missing fields', { status: 400 });
    }

    const safeTimezone = recipientTimezone || 'UTC';
    const formattedName = name?.trim() || 'there';
    const formattedOrganizer = organizerName?.trim() || 'the organizer';

    let formattedTime;
    let startDate;
    try {
      startDate = new Date(time);
      const base = formatInTimeZone(startDate, safeTimezone, "EEEE, d MMM yyyy, HH:mm");
      formattedTime = `${base} (${safeTimezone.replace(/_/g, ' ')})`;
    } catch (err) {
      console.warn('⚠️ Invalid timezone. Falling back to local time.', err);
      startDate = new Date(time);
      formattedTime = startDate.toLocaleString();
    }

    const endDate = new Date(startDate.getTime() + 30 * 60 * 1000);

    const gcalStart = formatInTimeZone(startDate, 'UTC', "yyyyMMdd'T'HHmmss'Z'");
    const gcalEnd = formatInTimeZone(endDate, 'UTC', "yyyyMMdd'T'HHmmss'Z'");
    const googleCalURL = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(meetingTitle || 'GreatMeet')}&dates=${gcalStart}/${gcalEnd}&details=${encodeURIComponent('Scheduled via GreatMeets')}&location=${encodeURIComponent(meetingLink || '')}`;

    const formattedStartUTC = formatInTimeZone(startDate, 'UTC', "yyyyMMdd'T'HHmmss'Z'");
    const formattedEndUTC = formatInTimeZone(endDate, 'UTC', "yyyyMMdd'T'HHmmss'Z'");

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//GreatMeets.ai//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `SUMMARY:${meetingTitle || 'GreatMeet'}`,
      `DESCRIPTION:Scheduled via GreatMeets`,
      `DTSTART:${formattedStartUTC}`,
      `DTEND:${formattedEndUTC}`,
      `LOCATION:${meetingLink || 'GreatMeets'}`,
      `STATUS:CONFIRMED`,
      `ORGANIZER;CN=${formattedOrganizer}:mailto:noreply@greatmeets.ai`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const html = `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; text-align: center; padding: 20px; background-color: #f4f4f4;">
  <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); max-width: 600px; margin: auto;">
    <h2 style="font-size: 22px; color: #f59e0b;">Final Time Updated</h2>
    <p style="font-size: 16px; color: #333;">
      Hey ${formattedName} 👋<br />
      The group’s availability changed, and the final time for your Great Meet with <strong>${formattedOrganizer}</strong> has been updated:
    </p>
    <p style="font-size: 20px; margin: 20px 0 10px; font-weight: bold; color: #111;">${formattedTime}</p>

    <hr style="margin: 24px 0; border: none; border-top: 1px solid #ddd;" />

    <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto 32px auto; text-align: center;">
      <tr>
        ${meetingLink ? `
        <td style="padding: 6px;">
          <a href="${meetingLink}" target="_blank"
             style="display: inline-block; background: #3b82f6; color: white; padding: 12px 16px; border-radius: 6px; font-size: 14px; font-weight: 500; text-decoration: none;">
            🔗 Join Meeting
          </a>
        </td>` : ''}
        <td style="padding: 6px;">
          <a href="${googleCalURL}" target="_blank"
             style="display: inline-block; background: #6366f1; color: white; padding: 12px 16px; border-radius: 6px; font-size: 14px; font-weight: 500; text-decoration: none;">
            📅 Google Cal
          </a>
        </td>
      </tr>
    </table>

    <hr style="margin: 24px 0; border: none; border-top: 1px solid #ddd;" />

    <a href="${link}" 
       style="background: linear-gradient(90deg, #f59e0b, #6366f1); 
              color: white; 
              text-decoration: none; 
              padding: 12px 24px; 
              font-size: 16px; 
              border-radius: 8px; 
              display: inline-block; 
              font-weight: 600;">
      View Updated Final Poll
    </a>

    <p style="font-size: 14px; color: #666666; margin-top: 30px;">
      Powered by <a href="https://www.greatmeets.ai" style="color: #10b981; text-decoration: underline;"><strong>GreatMeets.ai</strong></a> 🚀 — Fast and Human Scheduling.
    </p>
  </div>
</div>`;

    await resend.emails.send({
      from: 'Great Meets <noreply@greatmeets.ai>',
      to,
      subject: '🆕 Your Great Meet Time Was Updated',
      html,
      attachments: [
        {
          filename: 'GreatMeet.ics',
          content: Buffer.from(icsContent, 'utf-8'),
        },
      ],
    });

    return new Response('Updated invitee confirmation email sent.', { status: 200 });
  } catch (error) {
    console.error('❌ Error sending organizer confirmation email:', error);
    return new Response('Failed to send organizer confirmation email', { status: 500 });
  }
}