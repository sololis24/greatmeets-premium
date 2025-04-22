import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);


export async function sendCantAttendEmail(
  inviteeName,
  inviteeEmail,
  pollLink,
  organizerName
) {
  try {
    console.log('📧 sendCantAttendEmail triggered');
    console.log('🧪 inviteeName:', JSON.stringify(inviteeName));
    console.log('🧪 inviteeEmail:', inviteeEmail);
    console.log('🧪 pollLink:', pollLink);
    console.log('🧪 organizerName:', organizerName);

    // Trim + fallback to avoid empty values
    const subjectName = (inviteeName && inviteeName.trim()) || 'A participant';

    const html = `
      <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px; background-color: #f4f4f4; border-radius: 10px;">
        <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <h1 style="font-size: 24px; color: #4f46e5; font-weight: bold;">Hey, ${organizerName} 👋</h1>
          <p style="font-size: 18px; color: #333333;">Unfortunately ${subjectName} is unable to attend your Great Meet.</p>
          <a href="${pollLink}" style="background: linear-gradient(90deg, #34d399, #4f46e5); color: white; text-decoration: none; padding: 15px 30px; font-size: 16px; border-radius: 8px; display: inline-block; margin-top: 20px;">View your live poll</a>
         <p style="font-size: 14px; color: #666666; margin-top: 30px;">
  Powered by <a href="https://www.greatmeets.ai" style="color: #10b981; text-decoration: underline;"><strong>GreatMeets.ai</strong></a> 🚀 — Fast and Human Scheduling.
</p>
        </div>
      </div>
    `;

    const response = await resend.emails.send({
      from: 'Great Meets <noreply@greatmeets.ai>',
      to: inviteeEmail,
      subject: `${subjectName} can't attend 😔`,
      html,
    });

    console.log('📬 Email sent successfully:', JSON.stringify(response, null, 2));
    return response;
  } catch (error) {
    console.error('❌ Error sending "Can’t Attend" email:', error);
    throw new Error('Failed to send "Can’t Attend" email');
  }
}




// ✅ Organizer: new vote notification
export async function sendVoteNotificationEmail(to, organizerName, participantName, link) {
  const html = `
    <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px; background-color: #f4f4f4; border-radius: 10px;">
      <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <h2 style="font-size: 22px; color: #4f46e5; margin-bottom: 12px;">New Vote Received! 🗳️</h2>
        <p style="font-size: 16px; color: #333;">${participantName} just voted on your Great Meet.</p>
        <a href="${link}" style="background: linear-gradient(90deg, #34d399, #4f46e5); color: white; text-decoration: none; padding: 12px 24px; font-size: 16px; border-radius: 8px; display: inline-block; margin-top: 24px;">View Live Poll</a>
        <p style="font-size: 14px; color: #666666; margin-top: 30px;">
  Powered by <a href="https://www.greatmeets.ai" style="color: #10b981; text-decoration: underline;"><strong>GreatMeets.ai</strong></a> 🚀 — Fast and Human Scheduling.
</p>
      </div>
    </div>
  `;

  return resend.emails.send({
    from: 'Great Meets <noreply@greatmeets.ai>',
    to,
    subject: '🗳️ A vote just came in!',
    html,
  });
}

// ✅ Invitee: thank-you after voting
export async function sendThankYouForVotingEmail(to, name, link) {
  const html = `
  <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px; background-color: #f4f4f4;">
    <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
      <h2 style="font-size: 22px; color: #10b981;">Hey ${name || 'there'} 👋</h2>
      <p style="font-size: 16px; color: #333;">The final time for your Great Meet with <strong>${organizerName}</strong> is:</p>
      <p style="font-size: 20px; margin: 20px 0;"><strong>${time}</strong></p>     
      <a href="${link}" 
         style="background: linear-gradient(90deg, #10b981, #3b82f6); 
                color: white; 
                text-decoration: none; 
                padding: 12px 24px; 
                font-size: 16px; 
                border-radius: 8px; 
                display: inline-block; 
                font-weight: 600;">
        View Final Poll
      </a>
      <p style="font-size: 14px; color: #666666; margin-top: 30px;">
        Powered by <a href="https://www.greatmeets.ai" style="color: #10b981; text-decoration: underline;">
        <strong>GreatMeets.ai</strong></a> 🚀 — Fast and Human Scheduling.
      </p>
    </div>
  </div>
`;


  return resend.emails.send({
    from: 'Great Meets <noreply@greatmeets.ai>',
    to,
    subject: '✅ Your vote is in!',
    html,
  });
}

// ✅ Organizer: finalization summary
export async function sendFinalizationEmail(to, time, name, voterNames, cancellerNames, link) {
  const voters = voterNames.length ? voterNames.map(n => `• ${n}`).join('<br>') : 'No responses';
  const cancels = cancellerNames.length ? cancellerNames.map(n => `• ${n}`).join('<br>') : 'None';

  const html = `
  <div style="font-family: 'Poppins', sans-serif; padding: 20px; background-color: #f4f4f4;">
    <div style="max-width: 600px; margin: auto; background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-align: center;">
      <h1 style="font-size: 24px; color: #6366f1; font-weight: bold;">🎉 Your Great Meet is Finalized!</h1>
      <p style="font-size: 16px; color: #333; margin-bottom: 4px;">Final time chosen:</p>
      <p style="font-size: 18px; font-weight: bold; color: #111; margin-top: 0; margin-bottom: 20px;">${time}</p>    
      <a href="${link}" style="background: linear-gradient(90deg, #6366f1, #8b5cf6); color: white; text-decoration: none; padding: 12px 24px; font-size: 16px; border-radius: 8px; display: inline-block; margin-bottom: 30px;">View Final Poll</a>    
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e5e5;" />
      <div style="text-align: left;">
        <h3 style="font-size: 16px; color: #10b981;">Voted:</h3>
        <p style="font-size: 14px; color: #333;">${voters}</p>     
        <h3 style="font-size: 16px; color: #ef4444; margin-top: 24px;">Can't Attend:</h3>
        <p style="font-size: 14px; color: #333;">${cancels}</p>
      </div>
      <p style="font-size: 13px; color: #999; margin-top: 30px;">Great job organizing, ${name || 'friend'} 💼</p>
      <p style="font-size: 14px; color: #666666; margin-top: 30px;">
        Powered by <a href="https://www.greatmeets.ai" style="color: #10b981; text-decoration: underline;"><strong>GreatMeets.ai</strong></a> 🚀 — Fast and Human Scheduling.
      </p>
    </div>
  </div>
`;


  return resend.emails.send({
    from: 'Great Meets <noreply@greatmeets.ai>',
    to,
    subject: '🎉 Your Great Meet is Finalized!',
    html,
  });
}

export async function sendFinalConfirmationToInvitee(to, name, time, organizerName, link) {
  const html = `
    <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px; background-color: #f4f4f4;">
      <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <span style="display: none; font-size: 1px; color: #f4f4f4; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
          Your Great Meet Is confirmed. Here’s the time!
        </span>
        <h2 style="font-size: 22px; color: #10b981;">Hey ${name || 'there'} 👋</h2>
        <p style="font-size: 16px; color: #333; font-weight: 500;">
          The final time for your Great Meet with ${organizerName} is:
        </p>
        <p style="font-size: 20px; margin: 20px 0; font-weight: bold;">${time}</p>
        <a href="${link}" 
           style="background: linear-gradient(90deg, #10b981, #3b82f6); 
                  color: white; 
                  text-decoration: none; 
                  padding: 12px 24px; 
                  font-size: 16px; 
                  border-radius: 8px; 
                  display: inline-block;
                  font-weight: 600;">
          View Final Poll
        </a>
        <p style="font-size: 14px; color: #666666; margin-top: 30px;">
          Powered by <a href="https://www.greatmeets.ai" style="color: #10b981; text-decoration: underline;"><strong>GreatMeets.ai</strong></a> 🚀 — Fast and Human Scheduling.
        </p>
      </div>
    </div>
  `;

  return resend.emails.send({
    from: 'Great Meets <noreply@greatmeets.ai>',
    to,
    subject: '🗓️ Your Great Meet is Set!',
    html,
  });
}


// ✅ Canceller: final time FYI
export async function sendFinalEmailToCanceler(to, name, time, organizerName, link) {
  const html = `
    <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px; background-color: #f4f4f4;">
      <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <h2 style="font-size: 22px; color: #ef4444;">Hey ${name || 'there'} 👋</h2>
        <p style="font-size: 16px; color: #333;">The Great Meet you were invited to has been finalized — and we know you can’t make it this time.</p>
        <p style="font-size: 18px; margin: 16px 0;"><strong>Final Time:</strong><br>${time}</p>
        <a href="${link}" style="background: #9ca3af; color: white; text-decoration: none; padding: 12px 24px; font-size: 16px; border-radius: 8px; display: inline-block;">View Final Poll</a>
        <p style="font-size: 14px; color: #666666; margin-top: 30px;">
  Powered by <a href="https://www.greatmeets.ai" style="color: #10b981; text-decoration: underline;"><strong>GreatMeets.ai</strong></a> 🚀 — Fast and Human Scheduling.
</p>
      </div>
    </div>
  `;

  return resend.emails.send({
    from: 'Great Meets <noreply@greatmeets.ai>',
    to,
    subject: '🗓️ The Great Meet is Finalized',
    html,
  });
}

export async function sendVoteUpdateNotificationEmail(to, organizerName, participantName, link) {
  console.log('📨 Sending vote update notification to organizer:', to);

  const html = `
    <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px; background-color: #f4f4f4;">
      <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <h2 style="font-size: 22px; color: #6366f1;">Vote Updated</h2>
        <p style="font-size: 16px; color: #333;">
          <strong>${participantName || 'Someone'}</strong> just changed their availability for your Great Meet.
        </p>
        <a href="${link}" style="background: linear-gradient(90deg, #6366f1, #4f46e5); color: white; text-decoration: none; padding: 12px 24px; font-size: 16px; border-radius: 8px; display: inline-block; margin-top: 24px;">View Updated Poll</a>
        <p style="font-size: 14px; color: #666666; margin-top: 30px;">
          Powered by <a href="https://www.greatmeets.ai" style="color: #10b981; text-decoration: underline;"><strong>GreatMeets.ai</strong></a> 🚀 — Fast and Human Scheduling.
        </p>
      </div>
    </div>
  `;

  return resend.emails.send({
    from: 'Great Meets <noreply@greatmeets.ai>',
    to,
    subject: '🔄 A vote was updated!',
    html,
  });
}

export async function sendVoteUpdateConfirmationToInvitee(to, name, organizerName, link) {
  try {
    console.log("📨 Sending vote update confirmation to invitee:", to);

    const formattedName = name?.trim() || "there";
    const formattedOrganizer = organizerName?.trim() || "your organizer";

    const html = `
      <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px; background-color: #f4f4f4;">
        <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <h2 style="font-size: 22px; color: #10b981;">Your Vote Was Updated ✅</h2>
          <p style="font-size: 16px; color: #333;">
            Hey ${formattedName} 👋<br />
            You just updated your availability for the Great Meet with <strong>${formattedOrganizer}</strong>.
          </p>
          <a href="${link}" 
             style="background: linear-gradient(90deg, #10b981, #3b82f6); 
                    color: white; 
                    text-decoration: none; 
                    padding: 12px 24px; 
                    font-size: 16px; 
                    border-radius: 8px; 
                    display: inline-block; 
                    margin-top: 20px;">
            View Poll Again
          </a>
          <p style="font-size: 14px; color: #666666; margin-top: 30px;">
            You can update your vote again any time before the deadline.<br />
            Powered by <a href="https://www.greatmeets.ai" style="color: #10b981;"><strong>GreatMeets.ai</strong></a> 🚀
          </p>
        </div>
      </div>
    `;

    const response = await resend.emails.send({
      from: 'Great Meets <noreply@greatmeets.ai>',
      to,
      subject: '✅ Your Great Meet vote was updated',
      html,
    });

    return response; // ✅ You were missing this line!
  } catch (error) {
    console.error("❌ Error sending vote confirmation to invitee:", error);
    throw new Error("Failed to send vote update confirmation to invitee");
  }
}


