import { db } from '@/firebase/firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';

export const runtime = 'edge';

export async function GET(): Promise<Response> {
  const now = new Date();
  const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const pollsRef = collection(db, 'polls');
  const snapshot = await getDocs(pollsRef);

  const eligiblePolls: string[] = [];

  snapshot.forEach((doc) => {
    const data = doc.data();
    const deadline = data.deadline ? new Date(data.deadline) : null;

    if (
      deadline &&
      !data.reminderSentAt &&
      deadline > now &&
      deadline < in24Hours
    ) {
      eligiblePolls.push(doc.id);
    }
  });

  for (const pollId of eligiblePolls) {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/send-reminders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pollId }),
      });

      if (!res.ok) {
        console.error(`❌ Failed to send reminder for poll ${pollId}:`, await res.text());
      }
    } catch (err) {
      console.error(`❌ Error triggering reminder for poll ${pollId}:`, err);
    }
  }

  return new Response(
    JSON.stringify({ message: `Triggered ${eligiblePolls.length} reminders` }),
    { status: 200 }
  );
}
