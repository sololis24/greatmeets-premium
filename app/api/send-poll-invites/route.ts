import { NextResponse } from 'next/server';
import { resend } from '@/lib/resend';
import { formatInTimeZone, utcToZonedTime } from 'date-fns-tz';
import type { TimeSlot } from '@/types/index';
import { isValid, parseISO } from 'date-fns';

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

  return `${dateStr}, ${startStr}–${endStr} (${timeZone.replace(/_/g, ' ')})`;
};


// ✅ Rate-limited safe email sender
async function safeSendEmail(data: Parameters<typeof resend.emails.send>[0], retries = 3): Promise<void> {
  try {
    await resend.emails.send(data);
  } catch (err: any) {
    const msg = err?.message || '';
    if (retries > 0 && msg.includes('Too many requests')) {
      console.warn('⚠️ Rate limit hit. Retrying...');
      await new Promise((res) => setTimeout(res, 1000));
      return safeSendEmail(data, retries - 1);
    }
    throw err;
  }
}

export async function POST(req: Request) {
  try {
    type PollRequestBody = {
      invitees: {
        firstName: string;
        lastName: string;
        email: string;
        timezone: string;
        token: string;
      }[];
      pollLink: string;
      organizerName: string;
      organizerEmail: string;
      organizerTimezone: string;
      selectedTimes: TimeSlot[];
      meetingLink?: string;
      meetingTitle?: string;
      deadline?: string;
    };

    const body: PollRequestBody = await req.json();
    const {
      invitees,
      pollLink,
      organizerName,
      organizerEmail,
      organizerTimezone,
      selectedTimes,
      meetingLink,
      meetingTitle,
      deadline
    } = body;

    if (
      !invitees?.length ||
      !pollLink ||
      !organizerName ||
      !organizerEmail ||
      !Array.isArray(selectedTimes) ||
      selectedTimes.length === 0
    ) {
      console.warn('⚠️ Poll creation request missing critical fields or selectedTimes is empty.');
      return new NextResponse('Missing or invalid fields in request.', { status: 400 });
    }

    const normalizeEmail = (email: string) => email?.toLowerCase().trim();

    const formattedTimes = selectedTimes.map(({ start, duration }) =>
      formatTimeRange(start, organizerTimezone || 'UTC', duration)
    );

    const parsedDeadline = deadline ? parseISO(deadline) : null;
    const formattedDeadline = parsedDeadline && isValid(parsedDeadline)
      ? formatInTimeZone(parsedDeadline, organizerTimezone || 'UTC', "EEEE, d MMM yyyy, HH:mm") + ` (${(organizerTimezone || 'UTC').replace(/_/g, ' ')})`
      : null;

    const inviteeResults: { name: string; email: string; status: string; message?: string }[] = [];

    const filteredInvitees = invitees.filter(
      (i) => i.email?.toLowerCase().trim() !== organizerEmail.toLowerCase().trim()
    );

    if (filteredInvitees.length !== invitees.length) {
      console.log('⚠️ Organizer email found in invitee list and removed:', organizerEmail);
    }

    const inviteePromises = filteredInvitees.map(async (invitee: any) => {
      const email = normalizeEmail(invitee.email);
    
      const rawTimezone = invitee.timezone;
      const isLikelyGuessed = !rawTimezone || rawTimezone === Intl.DateTimeFormat().resolvedOptions().timeZone;
      const timezone = isLikelyGuessed ? 'UTC' : rawTimezone;
      
      if (isLikelyGuessed) {
        console.warn(`⚠️ Timezone for invitee ${email} was guessed or missing. Defaulting to UTC.`);
      }
      
      const fullName = `${invitee.firstName} ${invitee.lastName}`.trim();
      const token = invitee.token;

      if (!email) {
        console.warn(`Skipping invitee with missing email:`, invitee);
        inviteeResults.push({ name: fullName, email: '', status: 'skipped', message: 'Missing email' });
        return;
      }

      const inviteLink = `${pollLink}?name=${encodeURIComponent(fullName)}&email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`;

      const participantFormattedTimes = selectedTimes.map(({ start, duration }) =>
        formatTimeRange(start, timezone, duration)
      );

      const participantParsedDeadline = deadline ? parseISO(deadline) : null;
      const participantFormattedDeadline = participantParsedDeadline && isValid(participantParsedDeadline)
        ? formatInTimeZone(participantParsedDeadline, timezone, "EEEE, d MMM yyyy, HH:mm") + ` (${timezone.replace(/_/g, ' ')})`
        : null;

      const html = `
        <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px; background-color: #f4f4f4;">
          <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h1 style="font-size: 24px; color: #4f46e5; font-weight: bold;">You're Invited! 🎉</h1>
            <p style="font-size: 18px; color: #333333;">${organizerName} invited you to pick times for a Great Meet.</p>
            ${meetingTitle ? `<h2 style="font-size: 20px; color: #4f46e5; font-weight: bold; margin: 10px 0;">${meetingTitle}</h2>` : ''}
            <p style="font-size: 16px; color: #333;">Suggested Times:</p>
            <p style="font-size: 15px; color: #111;">${participantFormattedTimes.join('<br/>')}</p>
            ${participantFormattedDeadline ? `<p style="font-size: 14px; color: #999; margin-top: 12px;">Vote by the deadline (converted to your local time): <strong>${participantFormattedDeadline}</strong></p>` : ''}
            <a href="${inviteLink}" style="background: linear-gradient(90deg, #34d399, #4f46e5); color: white; text-decoration: none; padding: 15px 30px; font-size: 16px; border-radius: 8px; display: inline-block; margin-top: 20px;">Vote Now</a>
            <p style="font-size: 14px; color: #666666; margin-top: 30px;">
              Powered by <a href="https://www.greatmeets.ai" style="color: #10b981; text-decoration: underline;"><strong>GreatMeets.ai</strong></a> 🚀 — Fast and Human Scheduling.
            </p>
          </div>
        </div>
      `;

      try {
        await safeSendEmail({
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
      .map((result) => result.status === 'success'
        ? `✅ ${result.name} (${result.email})`
        : `❌ ${result.name} (${result.email}) - ${result.message}`)
      .join('<br/>');

    if (formattedTimes.length === 0) {
      console.warn('❌ Organizer email not sent: formattedTimes is empty.');
      return new NextResponse(JSON.stringify({ success: false, error: 'No valid time slots' }), { status: 400 });
    }

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

    try {
      await safeSendEmail({
        from: 'Great Meets <noreply@greatmeets.ai>',
        to: organizerEmail,
        subject: `✅ Your Great Meet is Live!`,
        html: organizerHtml,
      });
      console.log(`✅ Confirmation email sent to organizer: ${organizerEmail}`);
    } catch (err: any) {
      console.error(`❌ Failed to send confirmation email to organizer (${organizerEmail}):`, err?.message || err);
    }

    return new NextResponse(JSON.stringify({ success: true, inviteeResults }), { status: 200 });
  } catch (error: any) {
    console.error('❌ Error sending poll invites:', error);
    return new NextResponse(JSON.stringify({ success: false, error: error.message }), { status: 500 });
  }
}
