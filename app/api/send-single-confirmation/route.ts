import { Resend } from 'resend';
import { formatInTimeZone } from 'date-fns-tz';

if (!process.env.RESEND_API_KEY) {
  console.error('❌ RESEND_API_KEY is not defined');
}

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const {
      to,
      name,
      organizerEmail,
      organizerName,
      organizerTimezone,
      recipientTimezone,
      time,
      duration = 30,
      meetingTitle,
      meetingLink,
      pollLink,
      multiSlotConfirmation = false,
      nonVoterNames = [],
      type, // NEW: pass from client
    } = await req.json();

    console.log('➡️ Received single-confirmation request:', {
      to,
      type,
      time,
      duration,
      meetingTitle,
    });

    // Ensure minimal required fields
    if (!to || !time || !meetingTitle || !pollLink) {
      console.warn('❌ Missing required fields:', { to, time, meetingTitle, pollLink });
      return new Response('Missing required fields', { status: 400 });
    }

    const formattedOrganizer = organizerName?.trim() || 'the organizer';
    const slot = { start: time, duration };
    const start = new Date(slot.start);
    const end = new Date(start.getTime() + slot.duration * 60000);

    const tz = type === 'organizer' ? organizerTimezone : recipientTimezone;
    const timezone = tz || 'UTC';

    const formattedDate = formatInTimeZone(start, timezone, "EEEE, d MMM yyyy");
    const startTime = formatInTimeZone(start, timezone, 'HH:mm');
    const endTime = formatInTimeZone(end, timezone, 'HH:mm');
    const timeRange = `${formattedDate}<br />${startTime}–${endTime} (${timezone.replace(/_/g, ' ')})`;

    const gcalStart = formatInTimeZone(start, 'UTC', "yyyyMMdd'T'HHmmss'Z'");
    const gcalEnd = formatInTimeZone(end, 'UTC', "yyyyMMdd'T'HHmmss'Z'");
    const googleCalURL = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
      meetingTitle
    )}&dates=${gcalStart}/${gcalEnd}&details=${encodeURIComponent(
      'Scheduled via GreatMeets'
    )}&location=${encodeURIComponent(meetingLink || '')}`;

    const subject = '📅 Your Great Meet Time is Confirmed';

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
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; text-align: center; padding: 20px; background-color: #f4f4f4;">
        <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); max-width: 600px; margin: auto;">
          <h2 style="font-size: 22px; font-weight: bold; color: #10b981;">Final Time Confirmed</h2>
          <p style="font-size: 16px; color: #333;">
            Hey ${name || 'there'} 👋<br />
            You're all set! The time for your Great Meet with <strong>${formattedOrganizer}</strong> has been confirmed.
          </p>
          <p style="font-size: 20px; margin: 20px 0 10px; font-weight: bold; color: #111;">
            ${timeRange}
          </p>
          <hr style="margin: 24px 0; border: none; border-top: 1px solid #ddd;" />
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto 32px auto; text-align: center;">
            <tr>
              ${
                meetingLink
                  ? `<td style="padding: 6px;">
                  <a href="${meetingLink}" target="_blank"
                     style="display: inline-block; background: #3b82f6; color: white; padding: 12px 16px; border-radius: 6px; font-size: 14px; font-weight: 500; text-decoration: none;">
                    🔗 Join Meeting
                  </a>
                </td>`
                  : ''
              }
              <td style="padding: 6px;">
                <a href="${googleCalURL}" target="_blank"
                   style="display: inline-block; background: #6366f1; color: white; padding: 12px 16px; border-radius: 6px; font-size: 14px; font-weight: 500; text-decoration: none;">
                  📅 Google Cal
                </a>
              </td>
            </tr>
          </table>
          <hr style="margin: 24px 0; border: none; border-top: 1px solid #ddd;" />
          <a href="${pollLink}" 
             style="background-color: #0047AB; 
                    background-image: linear-gradient(90deg, #f59e0b, #6366f1); 
                    color: white; 
                    text-decoration: none; 
                    padding: 12px 24px; 
                    font-size: 16px; 
                    border-radius: 8px; 
                    display: inline-block; 
                    font-weight: 600;">
            View Final Poll
          </a>
          ${
            type === 'organizer' && nonVoterNames.length > 0
              ? `<p style="font-size: 15px; color: #b91c1c; margin-top: 20px;">
                  <strong>FYI:</strong> These invitees didn’t vote: ${nonVoterNames.join(', ')}
                </p>`
              : ''
          }
          <p style="font-size: 14px; color: #666666; margin-top: 30px;">
            Powered by <a href="https://www.greatmeets.ai" style="color: #10b981; text-decoration: underline;"><strong>GreatMeets.ai</strong></a> 🚀 — Fast and Human Scheduling.
          </p>
        </div>
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

    console.log(`📤 Email sent to ${type}: ${to}`);
    console.log(`📨 Resend response:`, JSON.stringify(result, null, 2));

    return new Response('✅ Single confirmation email sent.', { status: 200 });
  } catch (err: any) {
    console.error('❌ send-single-confirmation failed:', err?.message || err);
    return new Response('Internal Server Error', { status: 500 });
  }
}
