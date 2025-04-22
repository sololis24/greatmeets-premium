// src/lib/emailService.js

import { Resend } from 'resend';

// ✅ Initialize Resend properly (no hardcoded fallback key)
const resend = new Resend(process.env.RESEND_API_KEY);

// 📨 Send Invite Emails
export const sendInvites = async (invitees, pollLink, organizerName) => {
  try {
    const emailPromises = invitees.map((invitee) => {
      return resend.emails.send({
        from: 'GreatMeets.ai <noreply@greatmeets.ai>',
        to: invitee.email, // ⚡ Make sure invitees are objects like { email: '' }
        subject: `${organizerName} invited you to a Great Meet! 🎉`,
        html: generateInviteEmailHTML(organizerName, pollLink),
      });
    });

    await Promise.all(emailPromises);

    console.log('✅ All invite emails sent successfully.');
  } catch (error) {
    console.error('❌ Error sending invite emails:', error);
    throw error;
  }
};

// 🕰️ Send Reminder Email
export const sendReminderEmail = async (inviteeEmail, pollLink, organizerName, meetTitle) => {
  try {
    const response = await resend.emails.send({
      from: 'GreatMeets.ai <noreply@greatmeets.ai>',
      to: inviteeEmail,
      subject: `⏳ Reminder: Respond to ${meetTitle}!`,
      html: generateReminderEmailHTML(organizerName, meetTitle, pollLink),
    });

    console.log(`✅ Reminder email sent to ${inviteeEmail}:`, response);
  } catch (error) {
    console.error('❌ Error sending reminder email:', error);
    throw error;
  }
};

// 🎯 Send Finalization Email (NEW!)
export const sendFinalizationEmail = async (inviteeEmail, finalTime, organizerName) => {
  try {
    const response = await resend.emails.send({
      from: 'GreatMeets.ai <noreply@greatmeets.ai>',
      to: inviteeEmail,
      subject: `🎉 Your Great Meet is finalized!`,
      html: generateFinalizationEmailHTML(finalTime, organizerName),
    });

    console.log(`✅ Finalization email sent to ${inviteeEmail}:`, response);
  } catch (error) {
    console.error('❌ Error sending finalization email:', error);
    throw error;
  }
};

// ✨ Generate Polished Invite Email
function generateInviteEmailHTML(organizerName, pollLink) {
  return `
    <div style="font-family: 'Poppins', sans-serif; padding: 30px; background: #f8fafc; border-radius: 12px; text-align: center;">
      <h2 style="color: #0ea5e9;">You're Invited!</h2>
      <p><strong>${organizerName}</strong> invited you to help pick the best time for a Great Meet.</p>
      <a href="${pollLink}" style="display:inline-block; margin-top:20px; padding:12px 24px; background:#0ea5e9; color:white; border-radius:8px; text-decoration:none; font-weight:bold;">
        Pick Your Times
      </a>
      <p style="font-size: 14px; color: #666666; margin-top: 30px;">
  Powered by <a href="https://www.greatmeets.ai" style="color: #10b981; text-decoration: underline;"><strong>GreatMeets.ai</strong></a> 🚀 — Fast and Human Scheduling.
</p>
    </div>
  `;
}

// ✨ Generate Reminder Email
function generateReminderEmailHTML(organizerName, meetTitle, pollLink) {
  return `
    <div style="font-family: 'Poppins', sans-serif; padding: 30px; background: #fff8e1; border-radius: 12px; text-align: center;">
      <h2 style="color: #f59e0b;">⏳ Don't Miss Out!</h2>
      <p><strong>${organizerName}</strong> is waiting for your availability for <strong>${meetTitle}</strong>.</p>
      <a href="${pollLink}" style="display:inline-block; margin-top:20px; padding:12px 24px; background:#f59e0b; color:white; border-radius:8px; text-decoration:none; font-weight:bold;">
        Submit Availability
      </a>
     <p style="font-size: 14px; color: #666666; margin-top: 30px;">
  Powered by <a href="https://www.greatmeets.ai" style="color: #10b981; text-decoration: underline;"><strong>GreatMeets.ai</strong></a> 🚀 — Fast and Human Scheduling.
</p>
    </div>
  `;
}

// ✨ Generate Finalization Email
function generateFinalizationEmailHTML(finalTime, organizerName) {
  return `
    <div style="font-family: 'Poppins', sans-serif; padding: 30px; background: #ecfdf5; border-radius: 12px; text-align: center;">
      <h2 style="color: #10b981;">🎉 Your Meet is Finalized!</h2>
      <p>Your meeting organized by <strong>${organizerName}</strong> is officially scheduled!</p>
      <p style="margin: 20px 0; font-size: 20px; font-weight: bold; color: #059669;">
      ${new Date(finalTime).toLocaleString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short',
    })}
      </p>
      <p style="margin-top:30px; font-size:14px; color:#6b7280;">See you there! 🎯</p>
      <p style="font-size: 14px; color: #666666; margin-top: 30px;">
  Powered by <a href="https://www.greatmeets.ai" style="color: #10b981; text-decoration: underline;"><strong>GreatMeets.ai</strong></a> 🚀 — Fast and Human Scheduling.
</p>
    </div>
  `;
}
