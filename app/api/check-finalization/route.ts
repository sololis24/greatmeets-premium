import { db } from '@/firebase/firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';
import { finalizePoll } from '@/app/utils/finalizePoll';
import { PollData } from '@/app/types/PollData';
import { formatInTimeZone } from 'date-fns-tz';

function formatSlotTime(slot: { start: string; duration?: number }, tz: string): string {
  const dateObj = new Date(slot.start);
  const duration = slot.duration || 30;
  const end = new Date(dateObj.getTime() + duration * 60000);

  const sameDay =
    formatInTimeZone(dateObj, tz, 'yyyy-MM-dd') === formatInTimeZone(end, tz, 'yyyy-MM-dd');

  const prefix = formatInTimeZone(dateObj, tz, 'eee, MMM d');
  const startStr = formatInTimeZone(dateObj, tz, 'HH:mm');
  const endStr = formatInTimeZone(end, tz, sameDay ? 'HH:mm' : 'eee, MMM d, HH:mm');

  return `${prefix}, ${startStr}–${endStr}`;
}

export const runtime = 'edge';

export async function GET(): Promise<Response> {
  const now = new Date();
  const pollsRef = collection(db, 'polls');
  const snapshot = await getDocs(pollsRef);

  let finalizedCount = 0;

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data() as PollData;
    const pollId = docSnap.id;

    if (data.finalized) continue;

    const votes = data.votes || [];
    const invitees = data.invitees || [];
    const deadline = data.deadline ? new Date(data.deadline) : null;
    const tz = data.organizerTimezone || Intl.DateTimeFormat().resolvedOptions().timeZone;

    // ✅ Define the logger inside the loop so it can access pollId + data
    const shouldLog = () => {
      console.log(`🧠 Finalizing poll ${pollId} | Multi-slot: ${data.multiSlotConfirmation ?? false}`);
    };
    

    // ✅ CASE 1: Deadline exists and has passed
    if (deadline && deadline <= now) {
      shouldLog();
      await finalizePoll(pollId, data, (slot) => formatSlotTime(slot, tz));
      finalizedCount++;
      continue;
    }

    // ✅ CASE 2: All invitees have voted
    if (!deadline && invitees.length > 0) {
      const inviteeEmails = invitees
        .map(i => i.email?.toLowerCase().trim())
        .filter((e): e is string => Boolean(e));

      const voterEmails = votes
        .map(v => v.updatedByEmail?.toLowerCase().trim())
        .filter((e): e is string => Boolean(e));

      const allHaveVoted = inviteeEmails.every(email => voterEmails.includes(email));

      if (allHaveVoted) {
        shouldLog();
        await finalizePoll(pollId, data, (slot) => formatSlotTime(slot, tz));
        finalizedCount++;
      }
    }
  }

  return new Response(
    JSON.stringify({ message: `Finalized ${finalizedCount} polls` }),
    { status: 200 }
  );
}
