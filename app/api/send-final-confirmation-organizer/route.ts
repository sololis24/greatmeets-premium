import { Resend } from 'resend';
import { formatInTimeZone } from 'date-fns-tz';

if (!process.env.RESEND_API_KEY) {
  throw new Error('❌ RESEND_API_KEY is not defined');
}
const resend = new Resend(process.env.RESEND_API_KEY);
export async function POST(req: Request) {
  console.log('📬 Received POST to /api/send-final-confirmation-organizer');

  try {
    const {
      to,
      slots,
      time,
      name,
      link,
      meetingLink,
      recipientTimezone,
      meetingTitle,
      multiSlotConfirmation,
      organizerName,
      duration,
      previouslySentCount = 0 
    } = await req.json();

    console.log('🟡 Payload received:', {
      to,
      slots,
      time,
      name,
      link,
      meetingLink,
      recipientTimezone,
      meetingTitle,
      organizerName,
      duration
    });

    if (!to || !link) {
      console.error('❌ Missing fields (excluding organizerName) for organizer confirmation email');
      return new Response('Missing fields', { status: 400 });
    }

    const safeTimezone = recipientTimezone || 'UTC';
    const formattedName = name?.trim() || 'there';
    const formattedOrganizer = organizerName?.trim() || 'the organizer';

    const sendEmail = async (
  startDate: Date,
  meetingDuration: number,
  index: number,
  total: number,
) => {
  const endDate = new Date(startDate.getTime() + meetingDuration * 60000);

  const formattedDate = formatInTimeZone(startDate, safeTimezone, "EEEE, d MMM yyyy");
  const startTimeStr = formatInTimeZone(startDate, safeTimezone, "HH:mm");
  const endTimeStr = formatInTimeZone(endDate, safeTimezone, "HH:mm");
  const formattedTimeRange = `${formattedDate}<br />${startTimeStr}–${endTimeStr} (${safeTimezone.replace(/_/g, ' ')})`;

  const gcalStart = formatInTimeZone(startDate, 'UTC', "yyyyMMdd'T'HHmmss'Z'");
  const gcalEnd = formatInTimeZone(endDate, 'UTC', "yyyyMMdd'T'HHmmss'Z'");
  const googleCalURL = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(meetingTitle || 'GreatMeet')}&dates=${gcalStart}/${gcalEnd}&details=${encodeURIComponent('Scheduled via GreatMeets')}&location=${encodeURIComponent(meetingLink || '')}`;

  const subject =
    multiSlotConfirmation && total > 1
      ? `📅 Your GreatMeet Times are Confirmed (${index}/${total})`
      : multiSlotConfirmation
      ? '📅 Your GreatMeet Times are Confirmed'
      : '📅 Your GreatMeet Time is Confirmed';
    

      const icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//GreatMeets.ai//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'BEGIN:VEVENT',
        `SUMMARY:${meetingTitle || 'GreatMeet'}`,
        `DESCRIPTION:Scheduled via GreatMeets`,
        `DTSTART:${gcalStart}`,
        `DTEND:${gcalEnd}`,
        `LOCATION:${meetingLink || 'GreatMeets'}`,
        `STATUS:CONFIRMED`,
        `ORGANIZER;CN=${formattedOrganizer}:mailto:noreply@greatmeets.ai`,
        'END:VEVENT',
        'END:VCALENDAR'
      ].join('\r\n');

      const html = `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; text-align: center; padding: 20px; background-color: #f4f4f4;">
  <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); max-width: 600px; margin: auto;">
    <h2 style="font-size: 22px; font-weight: bold; color: #10b981;">Final Time Confirmed</h2>
    <p style="font-size: 16px; color: #333;">
      Hey ${formattedName} 👋<br />
      ${
        multiSlotConfirmation
          ? `You're all set! <strong>Multiple confirmed times</strong> have been finalized for your Great Meet.`
          : `You're all set! The time for your Great Meet with <strong>${formattedOrganizer}</strong> has been finalized.`
      }
    </p>
    <p style="font-size: 20px; margin: 20px 0 10px; font-weight: bold; color: #111;">
      ${formattedTimeRange}
    </p>
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
      View Final Poll
    </a>
    <p style="font-size: 14px; color: #666666; margin-top: 30px;">
      Powered by <a href="https://www.greatmeets.ai" style="color: #10b981; text-decoration: underline;"><strong>GreatMeets.ai</strong></a> 🚀 — Fast and Human Scheduling.
    </p>
  </div>
</div>`;

      const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;

      console.log('📨 Sending to organizer:', to, 'at', startDate.toISOString(), 'Subject:', subject);

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
        headers: {
          'Message-ID': `<${uniqueId}@greatmeets.ai>`,
          'X-Entity-Ref-ID': uniqueId,
        },
      });

      console.log('📤 Resend response:', result);
    };

    // MULTI-SLOT
    if (Array.isArray(slots) && slots.length >= 1 && multiSlotConfirmation) {
      console.log('🧮 Sending', slots.length, 'emails...');
      const total = slots.length;

      for (let i = 0; i < total; i++) {
        const s = slots[i];
        if (!s.time || isNaN(Date.parse(s.time))) {
          console.warn('⚠️ Skipping slot with no valid time');
          continue;
        }
        const startDate = new Date(s.time);
        console.log(`✉️ Email index: ${i + 1}/${total}`);
        await sendEmail(startDate, s.duration || 30, i + 1, total);
      }

      console.log('✅ Finished sending all', total, 'organizer emails');
    }

    // SINGLE-SLOT fallback
    else if (time && !Array.isArray(slots)) {
      if (isNaN(Date.parse(time))) {
        console.error('❌ Invalid time provided.');
        return new Response('Invalid time format', { status: 400 });
      }

      const fallbackDuration = duration || 30;
      await sendEmail(new Date(time), fallbackDuration, 1, 1);
    } else {
      console.error('❌ No valid time or slots provided for organizer confirmation email.');
      return new Response('Missing valid slot(s)', { status: 400 });
    }

    return new Response('Organizer confirmation email(s) sent.', { status: 200 });
  } catch (error: any) {
    console.error('❌ Error sending organizer confirmation email:', error.message || error);
    return new Response('Failed to send organizer confirmation email', { status: 500 });
  }
}
