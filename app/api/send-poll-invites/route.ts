import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { formatInTimeZone, utcToZonedTime } from 'date-fns-tz';
import type { TimeSlot } from '@/types/index';
import { isValid, parseISO } from 'date-fns';

// ✅ Fix: instantiate Resend client at runtime, not top-level
function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error('Missing RESEND_API_KEY');
  return new Resend(key);
}

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

// ✅ Safe, retrying email sender with runtime client
async function safeSendEmail(
  data: Parameters<ReturnType<typeof getResend>['emails']['send']>[0],
  retries = 3
): Promise<void> {
  const resend = getResend();
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
      invitees: { firstName: string; lastName: string; email: string; timezone: string; token: string }[];
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
      meetingTitle,
      deadline
    } = body;

    if (!invitees?.length || !pollLink || !organizerName || !organizerEmail || selectedTimes?.length === 0) {
      console.warn('⚠️ Missing required poll fields.');
      return new NextResponse('Missing or invalid fields in request.', { status: 400 });
    }

    const normalizeEmail = (email: string) => email?.toLowerCase().trim();
    const formattedTimes = selectedTimes.map(({ start, duration }) =>
      formatTimeRange(start, organizerTimezone || 'UTC', duration)
    );
    const parsedDeadline = deadline ? parseISO(deadline) : null;
    const formattedDeadline =
      parsedDeadline && isValid(parsedDeadline)
        ? formatInTimeZone(parsedDeadline, organizerTimezone || 'UTC', "EEEE, d MMM yyyy, HH:mm") + ` (${(organizerTimezone || 'UTC').replace(/_/g, ' ')})`
        : null;

    const inviteeResults: { name: string; email: string; status: string; message?: string }[] = [];
    const filteredInvitees = invitees.filter((i) => normalizeEmail(i.email) !== normalizeEmail(organizerEmail));

    if (filteredInvitees.length !== invitees.length) {
      console.log('⚠️ Organizer email removed from invitees:', organizerEmail);
    }

    await Promise.all(filteredInvitees.map(async (invitee) => {
      const email = normalizeEmail(invitee.email);
      const timezone = invitee.timezone && invitee.timezone !== Intl.DateTimeFormat().resolvedOptions().timeZone
        ? invitee.timezone
        : 'UTC';

      if (!email) {
        inviteeResults.push({ name: `${invitee.firstName} ${invitee.lastName}`.trim(), email: '', status: 'skipped', message: 'Missing email' });
        return;
      }

      const inviteLink = `${pollLink}?name=${encodeURIComponent(invitee.firstName + ' ' + invitee.lastName)}&email=${encodeURIComponent(email)}&token=${encodeURIComponent(invitee.token)}`;
      const participantFormattedTimes = selectedTimes.map(({ start, duration }) => formatTimeRange(start, timezone, duration));
      const participantFormattedDeadline = parsedDeadline && isValid(parsedDeadline)
        ? formatInTimeZone(parsedDeadline, timezone, "EEEE, d MMM yyyy, HH:mm") + ` (${timezone.replace(/_/g, ' ')})`
        : null;

      const html = `
        <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px; background-color: #f4f4f4;">
          <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h1 style="font-size: 24px; color: #4f46e5;">You're Invited! 🎉</h1>
            <p style="font-size: 18px;">${organizerName} invited you to pick times for a Great Meet.</p>
            ${meetingTitle ? `<h2 style="font-size: 20px; color: #4f46e5;">${meetingTitle}</h2>` : ''}
            <p style="font-size: 15px;">${participantFormattedTimes.join('<br/>')}</p>
            ${participantFormattedDeadline ? `<p style="font-size: 14px; color: #999;">Vote by: <strong>${participantFormattedDeadline}</strong></p>` : ''}
            <a href="${inviteLink}" style="background-image: linear-gradient(90deg, #34d399, #4f46e5); color: white; padding: 12px 24px; border-radius: 6px; display: inline-block; margin-top: 20px; text-decoration: none;">
              Vote Now
            </a>
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
        inviteeResults.push({ name: `${invitee.firstName} ${invitee.lastName}`.trim(), email, status: 'success' });
        console.log(`✅ Sent to ${email}`);
      } catch (err: any) {
        inviteeResults.push({ name: `${invitee.firstName} ${invitee.lastName}`.trim(), email, status: 'error', message: err.message });
        console.error(`❌ Error sending to ${email}:`, err);
      }
    }));

    if (formattedTimes.length === 0) {
      return new NextResponse(JSON.stringify({ success: false, error: 'No valid time slots' }), { status: 400 });
    }

    const statusListHtml = inviteeResults.map(r =>
      r.status === 'success'
        ? `✅ ${r.name} (${r.email})`
        : `❌ ${r.name} (${r.email}) - ${r.message}`
    ).join('<br/>');

    const organizerHtml = `
    <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 24px; text-align: center;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); text-align: center;">
        <h1 style="font-size: 24px; color: #10b981; margin-bottom: 20px;">
          Your Great Meet is Live! 🎉
        </h1>
        <p style="font-size: 16px; color: #333;">
          Hi ${organizerName}, your invites have been sent.
        </p>
        ${meetingTitle ? `<p style="margin-top: 12px;"><strong>Meeting:</strong> ${meetingTitle}</p>` : ''}
        <div style="margin: 24px 0;">
          <p style="font-size: 16px; font-weight: bold;">Selected Times:</p>
          <p style="font-size: 15px; color: #333; line-height: 1.6;">${formattedTimes.join('<br/>')}</p>
          ${formattedDeadline ? `
            <p style="margin-top: 16px; font-size: 14px; color: #888;">
              Deadline: <strong>${formattedDeadline}</strong>
            </p>` : ''
          }
        </div>
        <div style="margin-top: 12px;">
          <p style="font-size: 16px; font-weight: bold;">Invite Status:</p>
          <p style="font-size: 15px; color: #333; line-height: 1.6;">
            ${statusListHtml}
          </p>
        </div>
        <a href="${pollLink}" style="display: inline-block; margin-top: 28px; background: linear-gradient(90deg, #10b981, #4f46e5); color: white; padding: 14px 30px; border-radius: 8px; text-decoration: none; font-size: 16px;">
          View Live Poll
        </a>
        <p style="font-size: 13px; color: #777; margin-top: 32px;">
          Powered by <a href="https://www.greatmeets.ai" style="color: #10b981; text-decoration: none;"><strong>GreatMeets.ai</strong></a> 🚀 — Fast and Human Scheduling.
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
      console.log(`✅ Confirmation sent to organizer: ${organizerEmail}`);
    } catch (err: any) {
      console.error(`❌ Error sending to organizer (${organizerEmail}):`, err?.message || err);
    }

    return new NextResponse(JSON.stringify({ success: true, inviteeResults }), { status: 200 });
  } catch (error: any) {
    console.error('❌ Server error:', error);
    return new NextResponse(JSON.stringify({ success: false, error: error.message }), { status: 500 });
  }
}
