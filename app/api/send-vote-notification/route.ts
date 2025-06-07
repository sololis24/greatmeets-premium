import { Resend } from 'resend';
import { formatInTimeZone, zonedTimeToUtc } from 'date-fns-tz';
import { parseISO, isValid } from 'date-fns';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const {
      organizerEmail,
      organizerName,
      participantName,
      pollLink,
      deadline,
      organizerTimezone = 'UTC' // Fallback
    } = await req.json();

    if (!organizerEmail || !participantName || !pollLink) {
      console.error('❌ Missing required fields in vote notification request.');
      return new Response('Missing required fields', { status: 400 });
    }

    let formattedDeadline = '';
    if (deadline) {
      const parsed = parseISO(deadline); // parse ISO input
      if (isValid(parsed)) {
        const utc = zonedTimeToUtc(parsed, organizerTimezone); // adjust to proper TZ-aware UTC
        formattedDeadline = formatInTimeZone(utc, organizerTimezone, "EEEE, d MMM yyyy, HH:mm") +
          ` (${organizerTimezone.replace(/_/g, ' ')})`;
    
        console.log('🧭 Raw deadline:', deadline);
        console.log('🕒 Corrected UTC:', utc.toISOString());
        console.log('📝 Final formatted deadline:', formattedDeadline);
      } else {
        console.warn('⚠️ Invalid deadline provided:', deadline);
      }
    }

    const html = `
    <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px; background-color: #f4f4f4; border-radius: 10px;">
      <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <h2 style="font-size: 22px; color: #4f46e5; margin-bottom: 12px;">New Vote Received! 🗳️</h2>
        <p style="font-size: 16px; color: #333;"><strong>${participantName}</strong> just voted on your Great Meet.</p>

        ${formattedDeadline
          ? `<p style="font-size:14px; color:#666; margin-top:10px; margin-bottom: 20px;">⏳ Poll closes by <strong>${formattedDeadline}</strong></p>`
          : ''
        }
       <a href="${pollLink}" 
   style="background-color: #0047AB; 
          background-image: linear-gradient(90deg, #34d399, #4f46e5); 
          color: white; 
          text-decoration: none; 
          padding: 12px 24px; 
          font-size: 16px; 
          border-radius: 8px; 
          display: inline-block; 
          margin-top: 24px;">
  View Live Poll
</a>


        <p style="font-size: 14px; color: #666666; margin-top: 30px;">
          Powered by <a href="https://www.greatmeets.ai" style="color: #10b981; text-decoration: underline;"><strong>GreatMeets.ai</strong></a> 🚀 — Fast and Human Scheduling.
        </p>
      </div>
    </div>
    `;

    await resend.emails.send({
      from: 'Great Meets <noreply@greatmeets.ai>',
      to: organizerEmail,
      subject: '🗳️ A vote just came in!',
      html,
    });

    return new Response('Vote notification email sent.', { status: 200 });
  } catch (error) {
    console.error('❌ Error sending vote notification email:', error);
    return new Response('Failed to send vote notification email', { status: 500 });
  }
}
