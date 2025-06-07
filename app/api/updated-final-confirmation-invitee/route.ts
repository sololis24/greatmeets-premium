import { Resend } from 'resend';
import { formatInTimeZone } from 'date-fns-tz';
import { parseISO, isValid } from 'date-fns';

if (!process.env.RESEND_API_KEY) {
  throw new Error('❌ RESEND_API_KEY is not defined');
}

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {


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
      slotIndex,
      totalSlots,
      nonVoterNames = [], // 🆕 optional
    } = await req.json();

    if (!to || !link) {
      console.error('❌ Missing required fields');
      return new Response('Missing fields', { status: 400 });
    }

    const isValidTimezone = typeof recipientTimezone === 'string' && recipientTimezone.includes('/');
    const safeTimezone = isValidTimezone ? recipientTimezone : 'UTC';

    const formattedName = name?.trim() || 'there';
    const formattedOrganizer = organizerName?.trim() || 'the organizer';

    const formatTimeRange = (iso: string, timeZone: string, durationMin: number) => {
      const start = parseISO(iso);
      if (!isValid(start)) {
        console.warn('❌ Invalid time value passed to formatTimeRange:', iso);
        return 'Invalid time';
      }

      const end = new Date(start.getTime() + durationMin * 60 * 1000);
      const dateStr = formatInTimeZone(start, timeZone, "EEEE, d MMM yyyy");
      const startStr = formatInTimeZone(start, timeZone, "HH:mm");
      const endStr = formatInTimeZone(end, timeZone, "HH:mm");
      return `${dateStr}<br />${startStr}–${endStr} (${timeZone.replace(/_/g, ' ')})`;
    };

    const sendEmail = async (
      isoTime: string,
      meetingDuration: number,
      index: number,
      total: number
    ) => {
      const start = new Date(isoTime);
      const end = new Date(start.getTime() + meetingDuration * 60000);

      const formattedTimeRange = formatTimeRange(isoTime, safeTimezone, meetingDuration);

      const gcalStart = formatInTimeZone(start, 'UTC', "yyyyMMdd'T'HHmmss'Z'");
      const gcalEnd = formatInTimeZone(end, 'UTC', "yyyyMMdd'T'HHmmss'Z'");
      const googleCalURL = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(meetingTitle || 'GreatMeet')}&dates=${gcalStart}/${gcalEnd}&details=${encodeURIComponent('Scheduled via GreatMeets')}&location=${encodeURIComponent(meetingLink || '')}`;

      const subject =
        multiSlotConfirmation && total > 1
          ? `📅 Your Great Meet Times are Confirmed (${index}/${total})`
          : '📅 Your Great Meet Time is Confirmed';

      const icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//GreatMeets.ai//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'BEGIN:VEVENT',
        `SUMMARY:${meetingTitle || 'GreatMeet'}`,
        'DESCRIPTION:Scheduled via GreatMeets',
        `DTSTART:${gcalStart}`,
        `DTEND:${gcalEnd}`,
        `LOCATION:${meetingLink || 'GreatMeets'}`,
        'STATUS:CONFIRMED',
        `ORGANIZER;CN=${formattedOrganizer}:mailto:noreply@greatmeets.ai`,
        'END:VEVENT',
        'END:VCALENDAR',
      ].join('\r\n');

      const html = `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; text-align: center; padding: 20px; background-color: #f4f4f4;">
  <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); max-width: 600px; margin: auto;">
    <h2 style="font-size: 22px; font-weight: bold; color: #10b981;">Final Time Confirmed</h2>
    <p style="font-size: 16px; color: #333;">
      Hey ${formattedName} 👋<br />
      ${
        multiSlotConfirmation && total > 1
          ? `You're all set! <strong>Multiple confirmed times</strong> are updated for your Great Meet.`
          : `You're all set! The time for your Great Meet with <strong>${formattedOrganizer}</strong> has been confirmed.`      
      }
    </p>
    <p style="font-size: 20px; margin: 20px 0 10px; font-weight: bold; color: #111;">
      ${formattedTimeRange}
    </p>

    ${Array.isArray(nonVoterNames) && nonVoterNames.length > 0 ? `
      <p style="font-size: 15px; color: #b91c1c; margin-top: 20px;">
        <strong>FYI:</strong> The following invitees missed the deadline and didn’t vote:<br />
        ${nonVoterNames.join(', ')}
      </p>
    ` : ''}

    <table role="presentation" style="margin: 0 auto 32px auto; text-align: center;">
      <tr>
        ${
          meetingLink
            ? `<td style="padding: 6px;">
          <a href="${meetingLink}" target="_blank"
             style="display: inline-block; background: #3b82f6; color: white; padding: 12px 16px; border-radius: 6px; font-size: 14px; font-weight: 500; text-decoration: none;">
            🔗 Join Meeting
          </a>
        </td>` : ''
        }
        <td style="padding: 6px;">
          <a href="${googleCalURL}" target="_blank"
             style="display: inline-block; background: #6366f1; color: white; padding: 12px 16px; border-radius: 6px; font-size: 14px; font-weight: 500; text-decoration: none;">
            📅 Google Cal
          </a>
        </td>
      </tr>
    </table>

 <a href="${link}" 
   style="background-color: #0047AB; background-image: linear-gradient(90deg, #f59e0b, #6366f1); color: white; text-decoration: none; padding: 12px 24px; font-size: 16px; border-radius: 8px; display: inline-block; font-weight: 600;">
  View Final Poll
</a>

    <p style="font-size: 14px; color: #666666; margin-top: 30px;">
      Powered by <a href="https://www.greatmeets.ai" style="color: #10b981; text-decoration: underline;"><strong>GreatMeets.ai</strong></a> 🚀 — Fast and Human Scheduling.
    </p>
  </div>
</div>`;

      const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;

      await resend.emails.send({
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

      console.log(`📤 Invitee email sent: ${to} for ${isoTime}`);
    };

    // MULTI-SLOT
    if (Array.isArray(slots) && slots.length > 0 && multiSlotConfirmation) {
      console.log('📩 Sending multiple invitee emails...');
      const validSlots = slots.filter(slot => slot.time && !isNaN(Date.parse(slot.time)));
      const total = validSlots.length;

      for (let i = 0; i < total; i++) {
        const slot = validSlots[i];
        await sendEmail(slot.time, slot.duration || 30, i + 1, total);
      }
    }

    // SINGLE-SLOT
    else if (time && !Array.isArray(slots)) {
      if (isNaN(Date.parse(time))) return new Response('Invalid time format', { status: 400 });

      const index = slotIndex || 1;
      const total = totalSlots || (multiSlotConfirmation ? 2 : 1);

      await sendEmail(time, duration || 30, index, total);
    }

    return new Response('Invitee confirmation email(s) sent.', { status: 200 });

  } catch (error: any) {
    console.error('❌ Error sending invitee confirmation email:', error.message || error);
    return new Response('Failed to send invitee confirmation email', { status: 500 });
  }
}
