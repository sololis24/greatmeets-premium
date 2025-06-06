import { Resend } from 'resend';

if (!process.env.RESEND_API_KEY) {
  throw new Error('❌ RESEND_API_KEY is not set in the environment variables.');
}

const resend = new Resend(process.env.RESEND_API_KEY);

export const POST = async (req: Request): Promise<Response> => {
  console.log("📬 HIT /api/send-no-availability-organizer");

  try {
    const body = await req.json();
    console.log("📦 Raw body payload received:", body);

    const {
      to,
      name,
      pollId,
      meetingTitle,
      link,
      voterNames,
      cancellerNames,
    } = body;

    console.log("📨 Parsed payload:", {
      to,
      name,
      pollId,
      meetingTitle,
      link,
      voterNames,
      cancellerNames,
    });

    // Validate required fields
    if (!to || !pollId || !link) {
      console.warn("⚠️ Missing required fields:", { to, pollId, link });
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
    }

    // Sanitize optional arrays
    const safeVoterNames = Array.isArray(voterNames) ? voterNames : [];
    const safeCancellerNames = Array.isArray(cancellerNames) ? cancellerNames : [];

    const subject = `⚠️ No Common Time for the meeting: “${meetingTitle || 'Your GreatMeet'}”`;

    console.log("🧪 Preparing HTML email content...");

    const html = `
      <div style="font-family: Arial, sans-serif; text-align: center; padding: 24px; background-color: #f4f4f4; border-radius: 10px;">
        <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <h1 style="font-size: 24px; color: #3b82f6; font-weight: bold;">Hey, ${name || 'there'} 👋</h1>
          <p style="font-size: 16px; color: #333;">
            Everyone has voted, but unfortunately, there’s no common time where all invitees are available for the meeting: <strong>${meetingTitle || 'your meeting'}</strong>.
          </p>
          <p style="font-size: 15px; color: #666; margin-top: 16px;">
            You can review the poll results and decide whether to schedule a new poll or follow up individually.
          </p>
          <a href="${link}" style="background: linear-gradient(90deg, #10b981, #3b82f6); color: white; text-decoration: none; padding: 14px 28px; font-size: 16px; font-weight: 600; border-radius: 8px; display: inline-block; margin-top: 24px;">
            View Your Poll
          </a>
          <div style="font-size: 14px; color: #888; margin-top: 32px;">
            <p><strong>Voters:</strong> ${safeVoterNames.length ? safeVoterNames.join(', ') : 'None'}</p>
            <p><strong>Cancelled:</strong> ${safeCancellerNames.length ? safeCancellerNames.join(', ') : 'None'}</p>
          </div>
          <p style="font-size: 14px; color: #444; margin-top: 20px;">
            You can <strong>edit the poll</strong>, <strong>create a new one</strong>, or <strong>follow up manually</strong>.
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

    console.log("✅ No-availability email sent successfully.");
    console.log("📨 Resend API result:", result);

    return new Response(JSON.stringify({ success: true }), { status: 200 });

  } catch (error: any) {
    console.error("❌ Error in /api/send-no-availability-organizer:", error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: error?.message || 'Unknown error',
    }), { status: 500 });
  }
}
