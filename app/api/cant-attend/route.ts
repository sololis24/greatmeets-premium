import { db } from '@/firebase/firebaseConfig';
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { sendCantAttendEmail } from '@/lib/emailService';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request): Promise<Response> {
  try {
    const { pollId, participantToken, participantName, participantEmail } = await req.json();
    console.log('📩 Raw request body:', { participantName, participantToken, participantEmail, pollId });

    if (!pollId || !participantToken) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
    }

    const pollRef = doc(db, 'polls', pollId);
    const pollSnap = await getDoc(pollRef);

    if (!pollSnap.exists()) {
      return new Response(JSON.stringify({ error: 'Poll not found' }), { status: 404 });
    }

    const pollData = pollSnap.data();
    const organizerEmail = pollData.organizerEmail;
    const organizerName = pollData.organizerName;
    const pollLink = `${process.env.NEXT_PUBLIC_SITE_URL}/polls/${pollId}`;

    if (!organizerEmail) {
      console.warn('⚠️ Missing organizerEmail in poll data:', pollData);
      return new Response(JSON.stringify({ error: 'Missing organizer email' }), { status: 400 });
    }

    const vote = pollData.votes?.find((v: any) => v.userToken === participantToken);

    const fromBody = participantName?.trim();
    const fromVote = vote?.name?.trim();
    const finalName = fromBody || fromVote || 'A participant';

    if (!fromBody && !fromVote) {
      console.warn('⚠️ No participant name found in request or votes[] for token:', participantToken);
    }

    console.log(`📧 Sending cancellation email for: ${finalName}`);

    // ✅ Save to Firestore
    const cancellation = {
      name: finalName,
      token: participantToken,
      canceledAt: new Date().toISOString(),
    };

    await updateDoc(pollRef, {
      cancellations: arrayUnion(cancellation),
      canceledParticipants: arrayUnion(cancellation),
    });

    // ✅ Email the organizer
    await sendCantAttendEmail(finalName, organizerEmail, pollLink, organizerName);

 // ✅ Email the participant
// ✅ Email the participant
if (participantEmail) {
  await resend.emails.send({
    from: 'GreatMeets <hello@greatmeets.ai>',
    to: participantEmail,
    subject: `You’ve canceled your availability`,
    html: `
      <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px; background-color: #f4f4f4;">
        <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <h2 style="font-size: 24px; color: #4f46e5; font-weight: bold; margin-bottom: 12px;">Hey, ${finalName || 'there'} 👋</h2>
          <p style="font-size: 16px; color: #333;">We've let <strong>${organizerName}</strong> know that you can’t make it to this one.</p>
          <p style="font-size: 16px; color: #444; margin-top: 16px;">
            If this was a mistake or your plans change, you can revisit the poll below:
          </p>
          <a href="${pollLink}" style="
            background: linear-gradient(90deg, #10b981, #3b82f6);
            color: white;
            text-decoration: none;
            padding: 12px 24px;
            font-size: 16px;
            font-weight: 600;
            border-radius: 8px;
            display: inline-block;
            margin-top: 24px;
          ">
            Return to Poll
          </a>
          <p style="font-size: 13px; color: #999; margin-top: 24px;">We hope to see you at the next one 💚</p>
          <p style="font-size: 14px; color: #666666; margin-top: 30px;">
            Powered by <a href="https://www.greatmeets.ai" style="color: #10b981; text-decoration: underline;"><strong>GreatMeets.ai</strong></a> 🚀 — Fast and Human Scheduling.
          </p>
        </div>
      </div>
    `,
  });
}



    return new Response(JSON.stringify({ message: 'Emails sent successfully' }), { status: 200 });
  } catch (error) {
    console.error('❌ API error in /api/cant-attend:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}
