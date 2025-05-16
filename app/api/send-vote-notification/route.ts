import { Resend } from 'resend';
import { formatInTimeZone } from 'date-fns-tz';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const {
      organizerEmail,
      organizerName,
      participantName,
      pollLink,
      deadline,
    } = await req.json();

    if (!organizerEmail || !participantName || !pollLink) {
      console.error('❌ Missing required fields in vote notification request.');
      return new Response('Missing required fields', { status: 400 });
    }

    let formattedDeadline = '';
    if (deadline) {
      const deadlineDate = new Date(deadline);
      const utcString = formatInTimeZone(deadlineDate, 'UTC', "EEEE, d MMM yyyy, HH:mm 'UTC'");
      const localString = deadlineDate.toLocaleString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
      formattedDeadline = `${utcString} / ${localString}`;
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
        <a href="${pollLink}" style="background: linear-gradient(90deg, #34d399, #4f46e5); color: white; text-decoration: none; padding: 12px 24px; font-size: 16px; border-radius: 8px; display: inline-block; margin-top: 24px;">
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