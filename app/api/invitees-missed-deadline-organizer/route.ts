import { Resend } from 'resend';

if (!process.env.RESEND_API_KEY) {
  throw new Error('❌ RESEND_API_KEY is not set in the environment variables.');
}

import { resend } from '@/lib/emailClient';


export const POST = async (req: Request): Promise<Response> => {
  console.log("📬 HIT /api/invitees-missed-deadline-organizer");

  try {
    const body = await req.json();
    console.log("📦 Raw body payload received:", body);

    const {
      to,
      name,
      pollId,
      meetingTitle,
      link,
      nonVoterNames,
    } = body;

    console.log("📨 Parsed payload:", {
      to,
      name,
      pollId,
      meetingTitle,
      link,
      nonVoterNames,
    });

    // Validate required fields
    if (!to || !pollId || !link) {
      console.warn("⚠️ Missing required fields:", { to, pollId, link });
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
    }

    // Sanitize name list
    const safeNonVoterNames = Array.isArray(nonVoterNames) ? nonVoterNames : [];

    const subject = `⏳ Invitees Missed the Deadline – “${meetingTitle || 'Your GreatMeet'}”`;

    console.log("🧪 Preparing HTML email content...");

    const html = `
      <div style="font-family: Arial, sans-serif; text-align: center; padding: 24px; background-color: #f4f4f4; border-radius: 10px;">
        <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <h1 style="font-size: 24px; color: #3b82f6; font-weight: bold;">Hey, ${name || 'there'} 👋</h1>
          <p style="font-size: 16px; color: #333;">
            The poll deadline has passed, and the following invitee(s) did not submit their availability for <strong>${meetingTitle || 'your meeting'}</strong>.
          </p>
          ${
            safeNonVoterNames.length
              ? `<p style="font-size: 15px; color: #666; margin-top: 16px;">
                  <strong>Non-responders:</strong><br/>${safeNonVoterNames.join(', ')}
                </p>`
              : `<p style="font-size: 15px; color: #666; margin-top: 16px;">No non-voters detected.</p>`
          }
          <a href="${link}" style="background: linear-gradient(90deg, #10b981, #3b82f6); color: white; text-decoration: none; padding: 14px 28px; font-size: 16px; font-weight: 600; border-radius: 8px; display: inline-block; margin-top: 24px;">
            View Your Poll
          </a>
          <p style="font-size: 14px; color: #444; margin-top: 20px;">
            You can follow up with invitees, extend the deadline, or create a new poll if needed.
          </p>
          <p style="font-size: 14px; color: #666666; margin-top: 30px;">
            Powered by <a href="https://www.greatmeets.ai" style="color: #10b981; text-decoration: underline;"><strong>GreatMeets.ai</strong></a> 🚀 — Fast and Human Scheduling.
          </p>
        </div>
      </div>
    `;

    console.log("📧 Sending email with subject:", subject);
    console.log("🧾 Final email recipient:", to);

    const result = await resend.emails.send({
      from: 'Great Meets <noreply@greatmeets.ai>',
      to,
      subject,
      html,
    });

    console.log("✅ Invitees missed deadline email sent successfully.");
    console.log("📨 Resend API result:", result);

    return new Response(JSON.stringify({ success: true }), { status: 200 });

  } catch (error: any) {
    console.error("❌ Error in /api/invitees-missed-deadline-organizer:", error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: error?.message || 'Unknown error',
    }), { status: 500 });
  }
};
