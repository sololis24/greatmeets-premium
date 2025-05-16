import { db } from '@/firebase/firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';
import { finalizePoll } from '@/app/utils/finalizePoll';
import { PollData } from '@/app/types/PollData'; // ✅ Use the shared type

export const runtime = 'edge';

export async function GET(): Promise<Response> {
  const now = new Date();
  const pollsRef = collection(db, 'polls');
  const snapshot = await getDocs(pollsRef);

  let finalizedCount = 0;

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data() as PollData;
    const pollId = docSnap.id;

    const votes = data.votes || [];
    const invitees = data.invitees || [];
    const finalized = data.finalized;
    const deadline = data.deadline ? new Date(data.deadline) : null;

    if (finalized) continue;

    // ✅ CASE 1: Deadline exists and has passed
    if (deadline && deadline <= now) {
      await finalizePoll(pollId, data);
      finalizedCount++;
      continue;
    }

    // ✅ CASE 2: No deadline, finalize when all invitees have voted
    if (!deadline && invitees.length > 0) {
      const inviteeEmails: string[] = invitees
        .map((i) => i.email?.toLowerCase().trim())
        .filter((email): email is string => !!email);

      const voterEmails: string[] = votes
        .map((v) => v.email?.toLowerCase().trim())
        .filter((email): email is string => !!email);

      const allHaveVoted = inviteeEmails.every((email) =>
        voterEmails.includes(email)
      );

      if (allHaveVoted) {
        await finalizePoll(pollId, data);
        finalizedCount++;
      }
    }
  }

  return new Response(
    JSON.stringify({ message: `Finalized ${finalizedCount} polls` }),
    { status: 200 }
  );
}
