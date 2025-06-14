import { Resend } from 'resend';
import { formatInTimeZone } from 'date-fns-tz';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      invitees = [],
      organizerEmail,
      organizerName,
      organizerTimezone,
      meetingTitle,
      meetingLink,
      link: pollLink,
      nonVoterNames = [],
      multiSlotConfirmation = true,
      time, // single slot only
      duration, // single slot only
      to,
      name,
      recipientTimezone,
      type, // 'invitee' or 'organizer'
      slotIndex = 1,
      totalSlots = 1,
      slots, // optional array for organizer mode
    } = body;

    // Construct a common slot array
    const slotsToSend = [];

    if (body.newlySentSlots && body.newlySentSlots.length) {
      slotsToSend.push(...body.newlySentSlots); // multi-slot mode
    } else if (time) {
      slotsToSend.push({ start: time, duration }); // single-slot mode
    } else if (slots && slots.length) {
      slotsToSend.push(...slots); // single-slot for organizer
    }

    if (slotsToSend.length === 0) {
      return new Response('No slots provided', { status: 400 });
    }

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

      const formattedOrganizer = organizerName?.trim() || 'the organizer';

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
              Hey ${name} 👋<br />
              ${
                multiSlotConfirmation && total > 1
                  ? `You're all set! <strong>Multiple confirmed times</strong> have been finalized for your Great Meet.`
                  : `You're all set! The time for your Great Meet with <strong>${formattedOrganizer}</strong> has been confirmed.`
              }
            </p>
            <p style="font-size: 20px; margin: 20px 0 10px; font-weight: bold; color: #111;">
              ${timeRange}
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

      console.log(`📤 Sent to ${type}: ${to}, status:`, result);
    };

    // SINGLE SLOT PATH
    if (to && time && duration) {
        const timezone = recipientTimezone || 'UTC';
        const slot = { start: time, duration };
      
        await sendEmail({
          to,
          name: name || 'there',
          slot,
          index: slotIndex,
          total: totalSlots,
          timezone,
          type: type || 'invitee',
        });
      
        // Check if this is an organizer; if not, also send organizer confirmation
        if (type !== 'organizer' && organizerEmail && organizerName) {
          await sendEmail({
            to: organizerEmail,
            name: organizerName,
            slot,
            index: slotIndex,
            total: totalSlots,
            timezone: organizerTimezone || 'UTC',
            type: 'organizer',
          });
        }
      
        return new Response('Single confirmation email(s) sent.', { status: 200 });
      }
      

    // MULTI-SLOT PATH
    for (const invitee of invitees) {
      const email = invitee.email?.trim().toLowerCase();
      const name = invitee.firstName || 'there';
      const tz = typeof invitee.timezone === 'string' && invitee.timezone.includes('/')
        ? invitee.timezone
        : 'UTC';

      for (let i = 0; i < slotsToSend.length; i++) {
        await sendEmail({
          to: email,
          name,
          slot: slotsToSend[i],
          index: i + 1,
          total: slotsToSend.length,
          timezone: tz,
          type: 'invitee',
        });
        await new Promise(resolve => setTimeout(resolve, 400));
      }
    }

    for (let i = 0; i < slotsToSend.length; i++) {
      await sendEmail({
        to: organizerEmail,
        name: organizerName,
        slot: slotsToSend[i],
        index: i + 1,
        total: slotsToSend.length,
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
