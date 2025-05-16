import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// 🔧 Helpers
const normalizeEmail = (email) => email?.toLowerCase().trim();

const formatTime = (iso, tz = 'UTC') => {
  try {
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: tz,
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));
  } catch (error) {
    console.warn(`⚠️ Invalid timezone (${tz}) — falling back to UTC`);
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: 'UTC',
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));
  }
};

// ✉️ Invitee Template
const emailTemplate = (senderName, pollLink, inviteeEmail, inviteeTimezone, selectedTimes) => {
  const formattedTimes = selectedTimes.map((t) => formatTime(t, inviteeTimezone));

  return `
    <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px; background-color: #f4f4f4;">
      <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <h1 style="font-size: 24px; color: #4f46e5; font-weight: bold;">You're Invited! 🎉</h1>
        <p style="font-size: 18px; color: #333333;">${senderName} invited you to pick the best time for your Great Meet.</p>
        <p style="font-size: 16px; color: #333;">🕓 Suggested Times (In Your Timezone):</p>
        <p style="font-size: 15px; color: #111;">${formattedTimes.join('<br/>')}</p>
       <a href="${pollLink}?email=${encodeURIComponent(inviteeEmail)}"
   style="background: linear-gradient(90deg, #34d399, #4f46e5); color: white; text-decoration: none; padding: 15px 30px; font-size: 16px; border-radius: 8px; display: inline-block; margin-top: 8px;">Choose Your Times</a>
         <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e5e5;" />
           <p style="font-size: 14px; color: #666666; margin-top: 30px;">
          Powered by <a href="https://www.greatmeets.ai" style="color: #10b981; text-decoration: underline;"><strong>GreatMeets.ai</strong></a> 🚀 — Fast and Human Scheduling.
        </p>
      </div>
    </div>
  `;
};

// 📩 Organizer Template
const organizerConfirmationTemplate = (organizerName, pollLink, invitees, organizerEmail, selectedTimes, organizerTimezone = 'UTC') => {
  const inviteeListHTML = invitees.map((i, index) => {
    const name = i.name || i.email?.split('@')[0] || 'Unnamed';
    const email = i.email || 'N/A';
    return `<div>${index + 1}. <strong>${name}</strong> (${email})</div>`;
  }).join('');

  const organizerTimes = selectedTimes.map((t) => formatTime(t, organizerTimezone));

  return `
  <div style="font-family: 'Poppins', sans-serif; padding: 20px; background-color: #f4f4f4;">
    <div style="max-width: 600px; margin: auto; background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-align: center;">
      <h1 style="font-size: 24px; color: #10b981; font-weight: bold;">Your Great Meet is Live 🎉</h1>
      <p style="font-size: 16px; color: #333; margin-bottom: 4px;">Hi ${organizerName}, your invitations have been sent successfully!</p>
      <p style="font-size: 16px; color: #333; margin-top: 0;">Your selected time(s) (${organizerTimezone}):</p>
      <p style="font-size: 15px; color: #111; margin-bottom: 16px;">${organizerTimes.join('<br/>')}</p>
      <a href="${pollLink}" style="background: linear-gradient(90deg, #10b981, #6366f1); color: white; text-decoration: none; padding: 12px 24px; font-size: 16px; border-radius: 8px; display: inline-block;">Your Meeting Poll</a>
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e5e5;" />
      <p style="font-size: 16px; color: #333; font-weight: 600;">Here's who you invited:</p>
      <div style="font-size: 14px; color: #555; margin-top: 10px; line-height: 1.6;">${inviteeListHTML}</div>
      <p style="font-size: 14px; color: #666666; margin-top: 30px;">
        Powered by <a href="https://www.greatmeets.ai" style="color: #10b981; text-decoration: underline;"><strong>GreatMeets.ai</strong></a> 🚀 — Fast and Human Scheduling.
      </p>
    </div>
  </div>
`;

};

// 🧠 Email Handler
export async function POST(req) {
  try {
    const {
      invitees,
      pollLink,
      organizerName,
      organizerEmail,
      organizerTimezone,
      selectedTimes = []
    } = await req.json();

    const responses = [];
    const sentEmails = new Set();
    const normalizedOrganizerEmail = normalizeEmail(organizerEmail);

    const uniqueInvitees = invitees.filter((invitee) => {
      const email = normalizeEmail(invitee?.email);
      return email && email !== normalizedOrganizerEmail && !sentEmails.has(email);
    });

    for (const invitee of uniqueInvitees) {
      const email = normalizeEmail(invitee.email);
      const timezone = invitee.timezone || 'UTC';

      console.log(`📧 Sending to ${email} in timezone ${timezone}`);

      const html = emailTemplate(
        organizerName,
        pollLink,
        email,
        timezone,
        selectedTimes
      );

      const response = await resend.emails.send({
        from: 'Great Meets <noreply@greatmeets.ai>',
        to: email,
        subject: `${organizerName} invited you to a Great Meet! 🎉`,
        html,
      });

      sentEmails.add(email);
      responses.push(response);
    }

    if (!sentEmails.has(normalizedOrganizerEmail)) {
      const organizerHTML = organizerConfirmationTemplate(
        organizerName,
        pollLink,
        uniqueInvitees,
        organizerEmail,
        selectedTimes,
        organizerTimezone
      );

      const confirmationResponse = await resend.emails.send({
        from: 'Great Meets <noreply@greatmeets.ai>',
        to: organizerEmail,
        subject: `Your Great Meet invitations have been sent! 🎉`,
        html: organizerHTML,
      });

      responses.push(confirmationResponse);
    }

    return new Response(JSON.stringify({ success: true, responses }), { status: 200 });
  } catch (error) {
    console.error('❌ Error sending poll invites:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500 });
  }
}