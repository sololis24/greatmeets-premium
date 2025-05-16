import { Resend } from 'resend';
import { formatInTimeZone, zonedTimeToUtc } from 'date-fns-tz';
import { parseISO } from 'date-fns';

const resend = new Resend(process.env.RESEND_API_KEY);

const formatDate = (isoTime: string, timeZone: string) => {
  return formatInTimeZone(isoTime, timeZone, "EEEE, d MMM yyyy, HH:mm") + ` (${timeZone.replace(/_/g, ' ')})`;
};

export async function POST(req: Request) {
  try {
    const {
      to,
      name,
      time,
      organizerName,
      link,
      meetingLink,
      inviteeTimezone,
      meetingTitle,
    } = await req.json();

    const safeTimezone = inviteeTimezone || 'UTC';

    if (!to || !time || !link || !organizerName) {
      return new Response('Missing fields', { status: 400 });
    }

    const formattedName = name?.trim() || 'there';
    const formattedOrganizer = organizerName?.trim() || 'your organizer';

    let formattedTime;
    let startDate;
    try {
      const localDate = parseISO(time);
      startDate = zonedTimeToUtc(localDate, safeTimezone);
      formattedTime = formatDate(localDate.toISOString(), safeTimezone);
    } catch (err) {
      startDate = new Date(time);
      formattedTime = startDate.toLocaleString();
    }

    const endDate = new Date(startDate.getTime() + 30 * 60 * 1000);
    const startUTC = startDate.toISOString().replace(/[-:]|\.\d{3}/g, '');
    const endUTC = endDate.toISOString().replace(/[-:]|\.\d{3}/g, '');

    const title = encodeURIComponent(meetingTitle || 'GreatMeet');
    const description = encodeURIComponent('Scheduled via GreatMeets');
    const googleCalURL = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startUTC}/${endUTC}&details=${description}&location=${encodeURIComponent(
      meetingLink || ''
    )}`;

    const icsContent = `
BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
SUMMARY:${meetingTitle || 'GreatMeet'}
DESCRIPTION:Scheduled via GreatMeets
DTSTART:${startUTC}
DTEND:${endUTC}
LOCATION:${meetingLink || 'GreatMeets'}
STATUS:CONFIRMED
ORGANIZER;CN=${formattedOrganizer}:mailto:noreply@greatmeets.ai
END:VEVENT
END:VCALENDAR`.trim();

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

    return new Response('Updated final confirmation email sent.', { status: 200 });
  } catch (error) {
    return new Response('Failed to send updated final confirmation email', {
      status: 500,
    });
  }
}
