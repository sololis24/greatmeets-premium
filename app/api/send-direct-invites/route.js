import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { formatInTimeZone } from 'date-fns-tz';

const resend = new Resend(process.env.RESEND_API_KEY);

// 🔧 Format as "9:00 AM – 9:30 AM (TimeZone)"
// Format as "09:00 – 09:30 (TimeZone)" in 24-hour format
const formatTimeRange = (iso, timeZone, durationMin) => {
  const start = new Date(iso);
  const end = new Date(start.getTime() + durationMin * 60 * 1000);
  const startStr = formatInTimeZone(start, timeZone, 'HH:mm');
  const endStr = formatInTimeZone(end, timeZone, 'HH:mm');
  return `${startStr} – ${endStr} (${timeZone.replace(/_/g, ' ')})`;
};


// ✅ Invitee Email Template
const directInviteTemplate = (senderName, meetingTitle, inviteeName, inviteeLocalTimes) => `
  <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px; background-color: #f4f4f4;">
    <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
      <h1 style="font-size: 24px; color: #4f46e5; font-weight: bold;">You've Got A Great Meet! 🎉</h1>
      <p style="font-size: 18px; color: #333333;">
        ${senderName || 'Someone'} has scheduled <strong>${meetingTitle || 'a meeting'}</strong> for you.
      </p>
      <p style="font-size: 16px; color: #111111; margin-top: 20px;">
        📅 <strong>Your local meeting time is at:</strong><br/>
        ${inviteeLocalTimes.map((t) => `<div>${t}</div>`).join('')}
      </p>
      <p style="font-size: 14px; color: #666666; margin-top: 30px;">
        Powered by <a href="https://www.greatmeets.ai" style="color: #10b981; text-decoration: underline;"><strong>GreatMeets.ai</strong></a> 🚀 — Fast and Human Scheduling.
      </p>
    </div>
  </div>
`;

// ✅ Organizer Email Template
const organizerConfirmationEmail = (organizerName, meetingTitle, inviteeListHTML, selectedTimes, organizerTimezone, durationMin) => {
  const formattedTimes = selectedTimes.map((iso) =>
    formatTimeRange(iso, organizerTimezone || 'UTC', durationMin)
  );

  return `
  <div style="font-family: 'Poppins', sans-serif; padding: 20px; background-color: #f4f4f4;">
    <div style="max-width: 600px; margin: auto; background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-align: center;">
      <h1 style="font-size: 24px; color: #10b981; font-weight: bold;">Your Great Meet is Confirmed 🎉</h1>
      <p style="font-size: 16px; color: #333333;">Hi ${organizerName || 'Organizer'}, your invitation for <strong>${meetingTitle || 'your meeting'}</strong> has been sent successfully!</p>
      <p style="font-size: 16px; color: #4f46e5; font-weight: 600; margin-top: 24px;">Your selected time in your timezone (${organizerTimezone}) is:</p>
      <p style="font-size: 15px; color: #222; margin-bottom: 24px;">${formattedTimes.join('<br/>')}</p>
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e5e5;" />
      <p style="font-size: 16px; color: #333; font-weight: 600;">Here's who you invited:</p>
      <div style="font-size: 14px; color: #555555; text-align: center; line-height: 1.6; margin-top: 10px;">
        ${inviteeListHTML}
      </div>
      <p style="font-size: 14px; color: #666666; margin-top: 30px;">
        Powered by <a href="https://www.greatmeets.ai" style="color: #10b981; text-decoration: underline;"><strong>GreatMeets.ai</strong></a> 🚀 — Fast and Human Scheduling.
      </p>
    </div>
  </div>
  `;
};

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      organizerName = '',
      organizerEmail,
      organizerTimezone = 'UTC',
      meetingTitle = '',
      invitees = [],
      selectedTimes = [],
      duration = 30 // 👈 default to 30 minutes
    } = body;

    if (!organizerEmail || invitees.length === 0 || selectedTimes.length === 0) {
      return NextResponse.json({ status: 'error', message: 'Missing required fields' }, { status: 400 });
    }

    // 1️⃣ Send to Invitees
    await Promise.all(
      invitees.map(async (invitee) => {
        const inviteeLocalTimes = selectedTimes.map((iso) =>
          formatTimeRange(iso, invitee.timezone || 'UTC', duration)
        );

        await resend.emails.send({
          from: 'GreatMeets <noreply@greatmeets.ai>',
          to: invitee.email,
          subject: `You're invited to: ${meetingTitle || 'a meeting'}`,
          html: directInviteTemplate(organizerName, meetingTitle, invitee.name, inviteeLocalTimes),
        });
      })
    );

    // 2️⃣ Organizer Summary
    const inviteeListHTML = invitees
      .map((invitee) => {
        const times = selectedTimes.map((iso) =>
          formatTimeRange(iso, invitee.timezone || 'UTC', duration)
        );

        return `<strong>${invitee.name || 'Unnamed'}</strong> (${invitee.email}) — ${invitee.timezone || 'no timezone provided'}<br/><em>${times.join('<br/>')}</em>`;
      })
      .join('<br/><br/>');

    await resend.emails.send({
      from: 'GreatMeets <noreply@greatmeets.ai>',
      to: organizerEmail,
      subject: `Your Great Meet has been sent successfully`,
      html: organizerConfirmationEmail(organizerName, meetingTitle, inviteeListHTML, selectedTimes, organizerTimezone, duration),
    });

    return NextResponse.json({ status: 'success' });
  } catch (error) {
    console.error('❌ Error sending direct invites:', error);
    return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
  }
}
