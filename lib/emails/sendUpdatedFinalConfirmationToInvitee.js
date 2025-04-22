import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendUpdatedFinalConfirmationToInvitee(
  to,
  name,
  time,
  organizerName,
  link
) {
  const formattedName = name?.trim() || "there";
  const formattedOrganizer = organizerName?.trim() || "your organizer";

  const html = `
    <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px; background-color: #f4f4f4;">
      <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <h2 style="font-size: 22px; color: #f59e0b;">🆕 Final Time Updated</h2>
        <p style="font-size: 16px; color: #333;">
          Hey ${formattedName} 👋<br />
          The group’s availability changed, and the final time for your Great Meet with <strong>${formattedOrganizer}</strong> has been updated:
        </p>
        <p style="font-size: 20px; margin: 20px 0; font-weight: bold;">${time}</p>
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
    </div>
  `;

  return resend.emails.send({
    from: 'Great Meets <noreply@greatmeets.ai>',
    to,
    subject: '🆕 Your Great Meet Time Was Updated',
    html,
  });
}