import { NextResponse } from 'next/server';
import { resend } from '@/lib/resend';
import { formatInTimeZone } from 'date-fns-tz';

export async function POST(req: Request) {
  try {
    const {
      invitees,
      pollLink,
      organizerName,
      organizerEmail,
      organizerTimezone,
      selectedTimes = [],
      meetingLink,
      meetingTitle,
      deadline
    } = await req.json();

    if (!invitees || !pollLink || !organizerName || !organizerEmail || !selectedTimes) {
      return new NextResponse('Missing fields in request.', { status: 400 });
    }

    const normalizeEmail = (email: string) => email?.toLowerCase().trim();
    const formatDate = (time: string, timeZone: string) => {
      const formatted = formatInTimeZone(time, timeZone, "EEEE, d MMM yyyy, HH:mm");
      return `${formatted} (${timeZone.replace('_', ' ')})`;
    };
    
    
    

    const formattedTimes = selectedTimes.map((time: string) =>
      formatDate(time, organizerTimezone || 'UTC')
    );

    const formattedDeadline = deadline
      ? formatDate(deadline, organizerTimezone || 'UTC')
      : null;

    const inviteeResults: { name: string; email: string; status: string; message?: string }[] = [];

    const inviteePromises = invitees.map(async (invitee: any) => {
      const email = normalizeEmail(invitee.email);
      const timezone = invitee.timezone || 'UTC';
      const fullName = `${invitee.firstName} ${invitee.lastName}`.trim();
      const token = invitee.token;

      if (!email) {
        console.warn(`Skipping invitee with missing email:`, invitee);
        inviteeResults.push({ name: fullName, email: '', status: 'skipped', message: 'Missing email' });
        return;
      }

      const inviteLink = `${pollLink}?name=${encodeURIComponent(fullName)}&email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`;

      const participantFormattedTimes = selectedTimes.map((time: string) =>
        formatDate(time, timezone)
      );

      const participantFormattedDeadline = deadline ? formatDate(deadline, timezone) : null;

      const html = `
        <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px; background-color: #f4f4f4;">
          <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h1 style="font-size: 24px; color: #4f46e5; font-weight: bold;">You're Invited! 🎉</h1>
            <p style="font-size: 18px; color: #333333;">${organizerName} invited you to pick times for a Great Meet.</p>
            ${meetingTitle ? `<h2 style="font-size: 20px; color: #4f46e5; font-weight: bold; margin: 10px 0;">${meetingTitle}</h2>` : ''}
            <p style="font-size: 16px; color: #333;">Suggested Times:</p>
            <p style="font-size: 15px; color: #111;">${participantFormattedTimes.join('<br/>')}</p>
            ${participantFormattedDeadline ? `<p style="font-size: 14px; color: #999; margin-top: 12px;">Vote by the deadline: <strong>${participantFormattedDeadline}</strong></p>` : ''}
            <a href="${inviteLink}" style="background: linear-gradient(90deg, #34d399, #4f46e5); color: white; text-decoration: none; padding: 15px 30px; font-size: 16px; border-radius: 8px; display: inline-block; margin-top: 20px;">Vote Now</a>
            <p style="font-size: 14px; color: #666666; margin-top: 30px;">
              Powered by <a href="https://www.greatmeets.ai" style="color: #10b981; text-decoration: underline;"><strong>GreatMeets.ai</strong></a> 🚀 — Fast and Human Scheduling.
            </p>
          </div>
        </div>
      `;

      try {
        await resend.emails.send({
          from: 'Great Meets <noreply@greatmeets.ai>',
          to: email,
          subject: `${organizerName} invited you to a Great Meet${meetingTitle ? `: ${meetingTitle}` : ''}! 🎉`,
          html,
        });
        inviteeResults.push({ name: fullName, email, status: 'success' });
        console.log(`✅ Email sent to ${email}`);
      } catch (err: any) {
        inviteeResults.push({ name: fullName, email, status: 'error', message: err.message });
        console.error(`❌ Failed to send invite to ${email}:`, err);
      }
    });

    await Promise.all(inviteePromises);

    const statusListHtml = inviteeResults
      .map((result) => {
        if (result.status === 'success') {
          return `✅ ${result.name} (${result.email})`;
        } else if (result.status === 'error') {
          return `❌ ${result.name} (${result.email}) - ${result.message}`;
        } else {
          return `⚠️ ${result.name} - ${result.message}`;
        }
      })
      .join('<br/>');

    const organizerHtml = `
      <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px; background-color: #f4f4f4;">
        <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <h1 style="font-size: 24px; color: #10b981; font-weight: bold;">Your Great Meet is Live! 🎉</h1>
          <p style="font-size: 18px; color: #333333;">Hi ${organizerName}, your invites have been sent.</p>
          ${meetingTitle ? `<p style="font-size: 16px; color: #333;"><strong>Meeting:</strong> ${meetingTitle}</p>` : ''}
          <p style="font-size: 16px; color: #333;">Selected Times:</p>
          <p style="font-size: 15px; color: #111;">${formattedTimes.join('<br/>')}</p>
          ${formattedDeadline ? `<p style="font-size: 14px; color: #999; margin-top: 12px;">Deadline: <strong>${formattedDeadline}</strong></p>` : ''}
          <p style="font-size: 16px; color: #333; margin-top: 20px;">Invite Status:</p>
          <p style="font-size: 14px; color: #111;">${statusListHtml}</p>
          <a href="${pollLink}" style="background: linear-gradient(90deg, #10b981, #4f46e5); color: white; text-decoration: none; padding: 15px 30px; font-size: 16px; border-radius: 8px; display: inline-block; margin-top: 20px;">View Live Poll</a>
          <p style="font-size: 14px; color: #666666; margin-top: 30px;">
            Powered by <a href="https://www.greatmeets.ai" style="color: #10b981; text-decoration: underline;"><strong>GreatMeets.ai</strong></a> 🚀 — Fast and Human Scheduling.
          </p>
        </div>
      </div>
    `;

    await resend.emails.send({
      from: 'Great Meets <noreply@greatmeets.ai>',
      to: organizerEmail,
      subject: `✅ Your Great Meet is Live!`,
      html: organizerHtml,
    });

    return new NextResponse(JSON.stringify({ success: true, inviteeResults }), { status: 200 });
  } catch (error: any) {
    console.error('❌ Error sending poll invites:', error);
    return new NextResponse(JSON.stringify({ success: false, error: error.message }), { status: 500 });
  }
}
