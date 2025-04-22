import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendUpdatedFinalizationEmail(
  to,
  time,
  name,
  voterNames,
  cancellerNames,
  link
) {
  const voters = voterNames.length ? voterNames.map(n => `• ${n}`).join('<br>') : 'No responses';
  const cancels = cancellerNames.length ? cancellerNames.map(n => `• ${n}`).join('<br>') : 'None';

  const html = `
  <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f4f4;">
    <div style="max-width: 600px; margin: auto; background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-align: center;">
      <h1 style="font-size: 24px; color: #f59e0b;">🆕 Final Time Updated</h1>
      <p style="font-size: 16px; color: #333;">The group’s availability changed, and the final time has been updated:</p>
      <p style="font-size: 18px; font-weight: bold; color: #111; margin: 20px 0;">${time}</p>    
      <a href="${link}" style="background: linear-gradient(90deg, #f59e0b, #6366f1); color: white; text-decoration: none; padding: 12px 24px; font-size: 16px; border-radius: 8px; display: inline-block;">View Updated Poll</a>    
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e5e5;" />
      <div style="text-align: left;">
        <h3 style="font-size: 16px; color: #10b981;">Voted:</h3>
        <p style="font-size: 14px; color: #333;">${voters}</p>     
        <h3 style="font-size: 16px; color: #ef4444; margin-top: 24px;">Can't Attend:</h3>
        <p style="font-size: 14px; color: #333;">${cancels}</p>
      </div>
      <p style="font-size: 13px; color: #999; margin-top: 30px;">Thanks for staying flexible, ${name || 'friend'} ✨</p>
      <p style="font-size: 14px; color: #666666; margin-top: 30px;">
        Powered by <a href="https://www.greatmeets.ai" style="color: #10b981;"><strong>GreatMeets.ai</strong></a> 🚀
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