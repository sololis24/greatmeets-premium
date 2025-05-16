import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  const {
    participantEmail,
    participantName,
    selectedTimes,
    organizerName,
    pollLink,
    deadline,
    meetingLink, // ✅ now handled
  } = await req.json();

  // ✨ Format selected times
  const formattedTimesHtml = (selectedTimes || [])
    .map((time: string) => `<div style="font-size: 18px; margin: 4px 0;">${time}</div>`)
    .join('');

  // ✨ Format deadline if available
  let formattedDeadline = '';
  if (deadline) {
    formattedDeadline = new Date(deadline).toLocaleString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  const html = `
    <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px; background-color: #f4f4f4;">
      <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <h2 style="font-size: 22px; color: #10b981;">Hey ${participantName || 'there'} 👋</h2>
        <p style="font-size: 16px; color: #333;">The time(s) you selected for your Great Meet with <strong>${organizerName}</strong> are:</p>
        
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

  await resend.emails.send({
    from: 'Great Meets <noreply@greatmeets.ai>',
    to: participantEmail,
    subject: '✅ Your availability was updated',
    html,
  });

  return new Response('Vote update confirmation email sent.', { status: 200 });
}
