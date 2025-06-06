import { Resend } from 'resend';
import { parseISO, isValid } from 'date-fns';
import { formatInTimeZone, zonedTimeToUtc } from 'date-fns-tz';

const resend = new Resend(process.env.RESEND_API_KEY);

// ⏰ Format range like "Fri, 23 May, 08:00–08:30"
const formatTimeRange = (iso: string, timeZone: string, durationMin: number) => {
  const start = parseISO(iso);
  if (!isValid(start)) {
    console.warn('❌ Invalid time value passed to formatTimeRange:', iso);
    return 'Invalid time';
  }

  const end = new Date(start.getTime() + durationMin * 60 * 1000);
  const dateStr = formatInTimeZone(start, timeZone, "eee, MMM d");
  const startStr = formatInTimeZone(start, timeZone, "HH:mm");
  const endStr = formatInTimeZone(end, timeZone, "HH:mm");
  return `${dateStr}, ${startStr}–${endStr}`;
};

export async function POST(req: Request) {
  console.log('📬 Received POST to /api/send-thank-you');

  const {
    participantEmail,
    participantName,
    selectedTimes,
    organizerName,
    pollLink,
    deadline,
    meetingLink,
    timezone = 'UTC'
  } = await req.json();

  // ✅ Basic validation
  if (!participantEmail || !pollLink || !selectedTimes || selectedTimes.length === 0) {
    console.error('❌ Missing required fields in thank-you email request.');
    return new Response('Missing required fields', { status: 400 });
  }

  console.log('🧾 Payload:', {
    participantEmail,
    participantName,
    selectedTimes,
    organizerName,
    pollLink,
    deadline,
    timezone,
  });

  // ✅ Format time blocks
  const formattedTimesHtml = selectedTimes
    .map(({ start, duration }: { start: string; duration: number }) => {
      return `<div style="font-size: 18px; margin: 4px 0;">${formatTimeRange(start, timezone, duration)}</div>`;
    })
    .join('');

  // ✅ Format deadline if provided
  let formattedDeadline = '';
  if (deadline) {
    const parsed = parseISO(deadline);
    if (isValid(parsed)) {
      const utc = zonedTimeToUtc(parsed, timezone);
      formattedDeadline = formatInTimeZone(utc, timezone, "eee, d MMM yyyy, HH:mm") +
        ` (${timezone.replace(/_/g, ' ')})`;

      console.log('🧭 Raw deadline:', deadline);
      console.log('🕒 Corrected UTC:', utc.toISOString());
      console.log('📝 Final formatted deadline:', formattedDeadline);
    } else {
      console.warn('⚠️ Invalid deadline provided:', deadline);
    }
  }

  // ✅ Email HTML body
  const html = `
    <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px; background-color: #f4f4f4;">
      <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <h2 style="font-size: 22px; color: #10b981;">Hey ${participantName || 'there'} 👋</h2>
        <p style="font-size: 16px; color: #333;">The time(s) you selected for your Great Meet with <strong>${organizerName || 'the organizer'}</strong> are:</p>
        
        <div style="margin: 20px 0;">
          ${formattedTimesHtml}
        </div>

        ${
          formattedDeadline
            ? `<p style="font-size:14px; color:#666;">⏳ Poll closes by <strong>${formattedDeadline}</strong></p>`
            : `<p style="font-size:14px; color:#999;">⏳ No deadline has been set yet</p>`
        }

        ${
          meetingLink
            ? `<p style="font-size: 15px; color: #333; margin-top: 20px;">
                📎 <strong>Meeting Link:</strong> 
                <a href="${meetingLink}" target="_blank" style="color:#3b82f6;">${meetingLink}</a>
               </p>`
            : ''
        }

        <a href="${pollLink}" 
           style="background: linear-gradient(90deg, #10b981, #3b82f6); 
                  color: white; 
                  text-decoration: none; 
                  padding: 12px 24px; 
                  font-size: 16px; 
                  border-radius: 8px; 
                  display: inline-block; 
                  font-weight: 600;
                  margin-top: 24px;">
          View Poll
        </a>

        <p style="font-size: 14px; color: #666666; margin-top: 30px;">
          Powered by <a href="https://www.greatmeets.ai" style="color: #10b981; text-decoration: underline;">
          <strong>GreatMeets.ai</strong></a> 🚀 — Fast and Human Scheduling.
        </p>
      </div>
    </div>
  `;

  // ✅ Send email
  try {
    await resend.emails.send({
      from: 'Great Meets <noreply@greatmeets.ai>',
      to: participantEmail,
      subject: 'Your vote is in! 🗳️',
      html,
    });

    console.log('✅ Thank-you email sent to:', participantEmail);
    return new Response('Thank you email sent.', { status: 200 });
  } catch (err) {
    console.error('❌ Failed to send thank-you email:', err);
    return new Response('Email failed to send.', { status: 500 });
  }
}
