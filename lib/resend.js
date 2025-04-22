// src/lib/resend.js

import { Resend } from 'resend';

// Initialize and export a reusable Resend client instance
const resend = new Resend(process.env.RESEND_API_KEY);

export { resend };

// Stubbed functions to prevent Vercel build errors
export const sendConfirmationEmail = () => {
  console.log("sendConfirmationEmail stubbed!");
};

export const sendInvites = () => {
  console.log("sendInvites stubbed!");
};

export async function sendFinalizationEmail(email, time, name) {
  console.log("\uD83D\uDC8C Inside sendFinalizationEmail()");
  console.log("\uD83D\uDCE7 Sending to:", email);
  console.log("\uD83D\uDD52 Final time:", time);
  console.log("\uD83D\uDC64 Organizer name:", name);

  const html = `
    <div style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 30px;">
      <div style="max-width: 600px; margin: auto; background: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 4px 8px rgba(0,0,0,0.05);">
        <h2 style="color: #10b981;">Hey ${name || 'organizer'} \uD83D\uDC4B</h2>
        <p style="font-size: 16px; color: #333;">Your Great Meet has been finalized!</p>
        <p style="font-size: 18px; margin: 20px 0;"><strong>\uD83D\uDCC5 Final Time:</strong> ${time}</p>
        <a href="${process.env.NEXT_PUBLIC_SITE_URL}" style="display: inline-block; margin-top: 20px; background: #4f46e5; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none;">
          View Your Poll
        </a>
        <p style="margin-top: 30px; font-size: 14px; color: #888;">Thanks for using <strong>GreatMeets.ai</strong> \uD83D\uDE80</p>
      </div>
    </div>
  `;

  try {
    const response = await resend.emails.send({
      from: 'Great Meets <noreply@greatmeets.ai>',
      to: email,
      subject: '✅ Your Great Meet is Finalized!',
      html,
    });

    console.log('\uD83D\uDCE8 Resend response:', JSON.stringify(response, null, 2));
    return response;
  } catch (error) {
    console.error('❌ Failed to send finalization email:', error);
    throw error;
  }
}
