import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { to, name, time, organizerName, link, meetingLink } = await req.json();

    if (!to || !time || !link || !organizerName) {
      console.error('❌ Missing fields for final confirmation email to invitee.');
      return new Response('Missing fields', { status: 400 });
    }

    const formattedName = name?.trim() || 'there';
    const formattedOrganizer = organizerName?.trim() || 'your organizer';

    // Google Calendar + ICS setup
    const title = encodeURIComponent('GreatMeet');
    const description = encodeURIComponent('Scheduled via GreatMeets');
    const startUTC = new Date(time).toISOString().replace(/[-:]|\.\d{3}/g, '');
    const endUTC = new Date(new Date(time).getTime() + 30 * 60 * 1000)
      .toISOString()
      .replace(/[-:]|\.\d{3}/g, '');
    const googleCalURL = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startUTC}/${endUTC}&details=${description}&location=${encodeURIComponent(meetingLink || '')}`;

    const icsContent = `
BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
SUMMARY:GreatMeet
DESCRIPTION:Scheduled via GreatMeets
DTSTART:${startUTC}
DTEND:${endUTC}
LOCATION:${meetingLink || 'GreatMeets'}
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR
    `.trim();

    const icsDataUrl = `data:text/calendar;charset=utf-8,${encodeURIComponent(icsContent)}`;

    const html = `
      <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px; background-color: #f4f4f4;">
        <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <h2 style="font-size: 22px; color: #10b981;">Your Great Meet is Confirmed ✅</h2>
          <p style="font-size: 16px; color: #333;">
            Hey ${formattedName} 👋<br />
            You're confirmed to meet with <strong>${formattedOrganizer}</strong> at the time below:
          </p>
          <p style="font-size: 20px; margin: 20px 20px 10px; font-weight: bold;">${time}</p>

          ${
            meetingLink
              ? `
              <p style="font-size: 15px; color: #333;">
                📎 <strong>Meeting Link:</strong> 
                <a href="${meetingLink}" target="_blank" style="color:#3b82f6;">${meetingLink}</a>
              </p>
              <div style="margin-top: 20px;">
                <a href="${googleCalURL}" target="_blank" style="display: inline-block; background: #3b82f6; color: white; padding: 10px 16px; border-radius: 6px; font-size: 14px; margin-bottom: 10px;">Add to Google Calendar</a>
                <a href="${icsDataUrl}" download="GreatMeet.ics" style="display: inline-block; background: #10b981; color: white; padding: 10px 16px; border-radius: 6px; font-size: 14px; margin-top: 10px;">Download .ics</a>
              </div>
              `
              : ''
          }

          <a href="${link}" 
             style="background: linear-gradient(90deg, #10b981, #6366f1); 
                    color: white; 
                    text-decoration: none; 
                    padding: 12px 24px; 
                    font-size: 16px; 
                    border-radius: 8px; 
                    display: inline-block; 
                    font-weight: 600; 
                    margin-top: 30px;">
            View Meeting Details
          </a>
          <p style="font-size: 14px; color: #666666; margin-top: 30px;">
            Powered by <a href="https://www.greatmeets.ai" style="color: #10b981; text-decoration: underline;"><strong>GreatMeets.ai</strong></a> 🚀 — Fast and Human Scheduling.
          </p>
        </div>
      </div>
    `;

    await resend.emails.send({
      from: 'Great Meets <noreply@greatmeets.ai>',
      to,
      subject: '✅ You’re Confirmed for Your Great Meet',
      html,
    });

    return new Response('Final confirmation email to invitee sent.', { status: 200 });

  } catch (error) {
    console.error('❌ Error sending final confirmation email to invitee:', error);
    return new Response('Failed to send final confirmation email', { status: 500 });
  }
}
