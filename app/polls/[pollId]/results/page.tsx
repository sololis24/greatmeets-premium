'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { db } from '@/firebase/firebaseConfig';
import { doc, getDoc, runTransaction, updateDoc } from 'firebase/firestore';
import { motion } from 'framer-motion';
import PollResultHeader from '@/components/PollResultHeader';
import PollResultBar from '@/components/PollResultBar';
import { formatInTimeZone } from 'date-fns-tz';
import { format } from 'date-fns';

interface Vote {
  userToken: string;
  selectedSlots: string[];
  name?: string;
  updatedByEmail?: string; // <-- this was missing!
}

export default function PollResultsPage() {
  const { pollId } = useParams() as { pollId: string };
  const searchParams = useSearchParams();
  const searchParamsStr = searchParams.toString();
  const router = useRouter();
  const [pollData, setPollData] = useState<any>(null);
  const [formattedTimeSlots, setFormattedTimeSlots] = useState<{ [key: string]: string }>({});
  const [myVotes, setMyVotes] = useState<string[]>([]);
  const [timezone, setTimezone] = useState<string>('');
  const [sentSlotCache, setSentSlotCache] = useState<Set<string>>(new Set());
  const [noAvailabilityEmailSent, setNoAvailabilityEmailSent] = useState(false);
  const [organizerEmailSentSlots, setOrganizerEmailSentSlots] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!pollId) return;

    const fetchPoll = async () => {
      const pollRef = doc(db, 'polls', pollId);
      const pollSnap = await getDoc(pollRef);
      if (!pollSnap.exists()) return;

      const data = pollSnap.data();
      setPollData(data);

      const participantEmail = localStorage.getItem('participantEmail')?.toLowerCase().trim();
      const invitee = data.invitees?.find((i: any) => i.email?.toLowerCase().trim() === participantEmail);
      const tz = invitee?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
      setTimezone(tz);

      const formatted: { [key: string]: string } = {};
      data.timeSlots.forEach((slot: any) => {
        const dateObj = new Date(slot.start || slot);
        const duration = slot.duration || 30;
        const end = new Date(dateObj.getTime() + duration * 60000);
        const sameDay = formatInTimeZone(dateObj, tz, 'yyyy-MM-dd') === formatInTimeZone(end, tz, 'yyyy-MM-dd');
        formatted[slot.start || slot] = `${formatInTimeZone(dateObj, tz, 'eee, MMM d')}, ${formatInTimeZone(dateObj, tz, 'HH:mm')}–${formatInTimeZone(end, tz, sameDay ? 'HH:mm' : 'eee, MMM d, HH:mm')}`;
      });
      setFormattedTimeSlots(formatted);

      const userToken = localStorage.getItem('userToken');
      const myVote = data.votes?.find((v: Vote) => v.userToken === userToken);
      if (myVote) setMyVotes(myVote.selectedSlots || []);

      const deduplicatedVotes = data.votes?.reduce((acc: Record<string, Vote>, vote: any) => {
        const key = vote.updatedByEmail?.toLowerCase().trim() || vote.name?.toLowerCase().trim() || vote.userToken;
        if (!acc[key]) acc[key] = vote;
        return acc;
      }, {}) || {};
      const uniqueVotesArray = Object.values(deduplicatedVotes);

      const voteCounts = data.timeSlots.reduce((acc: any, slot: any) => {
        const key = slot.start || slot;
        acc[key] = uniqueVotesArray.filter((v: any) => v.selectedSlots.includes(key)).length || 0;
        return acc;
      }, {});

      let bestSlot = '';
      let fullyAvailableSlots: { start: string; duration?: number }[] = [];

      if (data.multiSlotConfirmation) {
        fullyAvailableSlots = data.timeSlots.filter((slot: any) => {
          const count = uniqueVotesArray.filter((v: any) => v.selectedSlots.includes(slot.start)).length;
          return count === uniqueVotesArray.length;
        });
      } else {
        bestSlot = Object.keys(voteCounts).reduce((best, current) =>
          !best || voteCounts[current] > voteCounts[best] ? current : best, '');
      }
// For single-slot polls: avoid using an unvoted time

      const freshSnap = await getDoc(pollRef);
      const freshData = freshSnap.data();     
      const organizerName = freshData?.organizerName || 'Organizer';
      const alreadyFinalizedSlot = freshData?.lastFinalizationEmailSentForSlot;
      const alreadySentSlots = freshData?.multiFinalizedSlotsSent || [];
      const allInviteesVoted = uniqueVotesArray.length === (data.invitees?.length || 0);
      
    
      interface Invitee {
        firstName?: string;
        name?: string;
        email?: string;
        timezone?: string;
      }
      
      const deadlineHasPassed =
        typeof data.deadline === 'string' && new Date() > new Date(data.deadline);
      
      // Extract normalized voter emails
      const emailsOfVoters = (uniqueVotesArray as Vote[])
      .map((v) =>
        typeof v.updatedByEmail === 'string'
          ? v.updatedByEmail.toLowerCase().trim()
          : ''
      )
      .filter(Boolean);
          
      // Determine non-voters from invitees
      const nonVoters: Invitee[] = (data.invitees || []).filter((i: Invitee) => {
        const email = i.email?.toLowerCase().trim();
        return !!email && !emailsOfVoters.includes(email);
      });
      
      // Only run if the deadline has passed, some people haven’t voted, and we haven’t notified yet
      if (
        deadlineHasPassed &&
        nonVoters.length > 0 &&
        !freshData?.missedDeadlineNotified
      ) {
        const shouldSend = await runTransaction(db, async (transaction) => {
          const snap = await transaction.get(pollRef);
          const pollData = snap.data();
          if (pollData?.missedDeadlineNotified) return false;
          transaction.update(pollRef, { missedDeadlineNotified: true });
          return true;
        });
      
        if (shouldSend) {
          const nonVoterNames = nonVoters.map((i: Invitee) => {
            return i.firstName || i.name || i.email || 'Unnamed';
          });
      
          await fetch(`${location.origin}/api/invitees-missed-deadline-organizer`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: data.organizerEmail,
              name: data.organizerName || 'Organizer',
              pollId,
              meetingTitle: data.title,
              link: `https://www.greatmeets.ai/polls/${pollId}/results`,
              nonVoterNames,
            }),
          });
        }
      }
      
   
      const shouldSendMultiple = data.multiSlotConfirmation && fullyAvailableSlots.length > 0 && allInviteesVoted;
      const shouldSendSingle =
      !data.multiSlotConfirmation &&
      bestSlot &&
      !isNaN(new Date(bestSlot).getTime()) &&
      voteCounts[bestSlot] === uniqueVotesArray.length && // ✅ ALL invitees must have voted for this slot
      bestSlot !== alreadyFinalizedSlot &&
      !sentSlotCache.has(bestSlot);

      const voterNames = uniqueVotesArray.map((v: any) => v.name || 'Someone');
      const cancellerNames = (data.cancellations || []).map((c: any) => c.name || 'Someone');

      // 🚨 Notify organizer if no common time exists
      // 🚨 Notify organizer if no common time exists

const singleSlotNoVotes = !data.multiSlotConfirmation &&
  (
    !bestSlot || isNaN(new Date(bestSlot).getTime()) ||
    (voteCounts[bestSlot] ?? 0) < uniqueVotesArray.length
  );
const multiSlotNoneAvailable =
  data.multiSlotConfirmation &&
  Array.isArray(fullyAvailableSlots) &&
  fullyAvailableSlots.length === 0;

// 🧠 Prevent double-send via transaction guard only
if (
  allInviteesVoted &&
  (singleSlotNoVotes || multiSlotNoneAvailable) &&
  !freshData?.noAvailabilityNotified
) {
  console.log('✅ Checking if no-availability email should be sent...');

  const emailShouldSend = await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(pollRef);
    const pollData = snap.data();
    if (pollData?.noAvailabilityNotified) return false; // someone else sent it
    transaction.update(pollRef, { noAvailabilityNotified: true });
    return true; // allow sending
  });

  if (!emailShouldSend) {
    console.log('⛔ Email already sent by another client.');
    return;
  }

  try {
    const res = await fetch(`${location.origin}/api/send-no-availability-organizer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: data.organizerEmail,
        name: data.organizerName || 'Organizer',
        pollId,
        meetingTitle: data.title,
        link: `https://www.greatmeets.ai/polls/${pollId}/results`,
        voterNames,
        cancellerNames,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('❗ Failed to send no-availability email:', errText);
    } else {
      console.log('✅ No-availability email sent.');
    }
  } catch (error) {
    console.error('❌ Error sending no-availability email:', error);
  }
  return;
}

try {
  if (!allInviteesVoted) {
    console.log(`⏳ Waiting for all invitees to vote. Votes received: ${uniqueVotesArray.length}/${data.invitees?.length}`);
  }



  if (allInviteesVoted && shouldSendMultiple) {
    const newlySent: { start: string; duration: number }[] = [];
  
    // Step 1: Record newly finalized slots
    for (const slot of fullyAvailableSlots) {
      const shouldSend = await runTransaction(db, async (transaction) => {
        const snap = await transaction.get(pollRef);
        const pollData = snap.data();
        const alreadySent = pollData?.multiFinalizedSlotsSent || [];
        if (alreadySent.includes(slot.start)) return false;
        transaction.update(pollRef, {
          multiFinalizedSlotsSent: [...alreadySent, slot.start],
        });
        return true;
      }).catch((err) => {
        console.error(`🚨 Transaction failed for slot ${slot.start}:`, err);
        return false;
      });
  
      if (shouldSend) {
        console.log("✅ Slot confirmed and queued for email:", slot.start);
        newlySent.push({ start: slot.start, duration: slot.duration || 30 });
      } else {
        console.log(`⏩ Slot ${slot.start} already finalized or failed to write`);
      }
    }
  
    if (newlySent.length > 0) {
      console.log("📤 Finalized slots to email:", newlySent);
  
      const pollLink = `${window.location.origin}/polls/${pollId}/results`;
      const nonVoterNames = nonVoters.map(
        (i: Invitee) => i.firstName || i.name || i.email || 'Unnamed'
      );
  
      try {
        const res = await fetch(`${location.origin}/api/send-all-finalizations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            invitees: data.invitees || [],
            organizerEmail: data.organizerEmail,
            organizerName,
            organizerTimezone: data.organizerTimezone,
            newlySentSlots: newlySent,
            meetingTitle: data.title,
            meetingLink: data.meetingLink,
            pollLink,
            nonVoterNames,
            multiSlotConfirmation: true,
          }),
        });
  
        if (!res.ok) {
          console.error('❌ Failed to send finalization emails:', await res.text());
        } else {
          console.log('✅ Finalization emails sent successfully');
        }
      } catch (err) {
        console.error('🚨 Error calling send-all-finalizations API:', err);
      }
    } else {
      console.log("🚫 No new slots were finalized. No emails sent.");
    }
  }
  
  

  if (allInviteesVoted && shouldSendSingle) {
    const finalized = await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(pollRef);
      const pollData = snap.data();
      if (pollData?.lastFinalizationEmailSentForSlot === bestSlot) return false;
      transaction.update(pollRef, {
        lastFinalizationEmailSentForSlot: bestSlot,
        finalizedSlot: bestSlot,
      });
      return true;
    });
  
    if (finalized) {
      console.log('✅ Finalizing single slot:', bestSlot);
  
      const slot = data.timeSlots.find((s: any) => s.start === bestSlot);
      const duration = slot?.duration || 30;
      const pollLink = `${window.location.origin}/polls/${pollId}/results`;
  
      const organizerEmail = data.organizerEmail?.trim().toLowerCase();
      const organizerTimezone = data.organizerTimezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
  
      // ✅ Organizer email
      if (organizerEmail) {
        try {
          await fetch(`${location.origin}/api/send-all-finalizations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: organizerEmail,
              name: organizerName,
              time: bestSlot,
              duration,
              recipientTimezone: organizerTimezone,
              organizerTimezone,
              meetingTitle: data.title,
              meetingLink: data.meetingLink,
              link: pollLink,
              multiSlotConfirmation: false,
              voterNames,
              cancellerNames,
              pollId,
            }),
          });
          console.log(`📨 Organizer email sent for single slot ${bestSlot}`);
        } catch (err) {
          console.error(`🚨 Failed to send organizer email:`, err);
        }
      } else {
        console.warn('⚠️ No organizer email provided. Skipping.');
      }
  
      // ✅ Invitee emails
      for (const invitee of data.invitees || []) {
        const email = invitee.email?.trim().toLowerCase();
        if (!email) {
          console.warn('❌ Invitee email missing or invalid. Skipping:', invitee);
          continue;
        }
  
        const name = invitee.firstName || 'there';
        const inviteeTimezone =
          typeof invitee.timezone === 'string' && invitee.timezone.includes('/')
            ? invitee.timezone
            : Intl.DateTimeFormat().resolvedOptions().timeZone;
  
        try {
          await fetch(`${location.origin}/api/send-all-finalizations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: email,
              name,
              time: bestSlot,
              duration,
              recipientTimezone: inviteeTimezone,
              organizerName,
              meetingTitle: data.title,
              meetingLink: data.meetingLink,
              link: pollLink,
              slotIndex: 1,
              totalSlots: 1,
              multiSlotConfirmation: false,
            }),
          });
          console.log(`📩 Invitee email sent to ${email} for single slot`);
        } catch (err) {
          console.error(`🚨 Error sending invitee email to ${email}:`, err);
        }
  
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
  
      setSentSlotCache(new Set([...sentSlotCache, bestSlot]));
    } else {
      console.log('⏩ Single slot was already finalized. Skipping emails.');
    }
  }


  
      } catch (err) {
        console.warn('❌ Error sending emails:', err);
      }
    };
    
    fetchPoll();
    const interval = setInterval(fetchPoll, 10000);
    return () => clearInterval(interval);
  }, [pollId, searchParamsStr]);

  if (!pollData) {
    return <p className="text-center mt-20 text-gray-600">Loading poll results...</p>;
  }

  const deduplicatedVotes = pollData.votes?.reduce((acc: Record<string, Vote>, vote: any) => {
    const key = vote.updatedByEmail?.toLowerCase().trim() || vote.name?.toLowerCase().trim() || vote.userToken;
    if (!acc[key]) acc[key] = vote;
    return acc;
  }, {}) || {};
  const uniqueVotesArray = Object.values(deduplicatedVotes);
  const totalParticipantsVoted = uniqueVotesArray.length;
  const totalInvitees = pollData.invitees?.length || 0;

  const voteCounts = pollData.timeSlots.reduce((acc: any, slot: { start: string }) => {
    const start = slot.start;
    acc[start] = uniqueVotesArray.filter((v: any) => v.selectedSlots.includes(start)).length || 0;
    return acc;
  }, {});

  const handleChangeVote = () => {
    router.push(`/polls/${pollId}?changeVote=true`);
  };

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }} className="min-h-screen flex flex-col items-center justify-center p-8 bg-white">
      <div className="bg-white text-black p-10 rounded-3xl shadow-2xl max-w-2xl w-full text-center space-y-8">
        <PollResultHeader title={pollData.title || 'Poll Results'} timezone={timezone} totalVotes={totalParticipantsVoted} totalInvitees={totalInvitees} />
        <div className="space-y-5">
          {pollData.timeSlots.map((slot: { start: string; duration?: number }) => (
            <PollResultBar key={slot.start} slotLabel={formattedTimeSlots[slot.start] || 'Invalid Date'} votes={voteCounts[slot.start] || 0} percentage={totalParticipantsVoted > 0 ? (voteCounts[slot.start] / totalParticipantsVoted) * 100 : 0} isMyVote={myVotes.includes(slot.start)} />
          ))}
        </div>
        <button onClick={handleChangeVote} className="w-full px-6 py-3 bg-white text-blue-600 font-bold rounded-full border-2 border-blue-500 hover:text-white hover:bg-gradient-to-r hover:from-emerald-400 hover:to-blue-500 hover:border-white transition-all duration-300 shadow-md">
          Change My Vote
        </button>
        <p className="text-sm text-gray-400 pt-6">Powered by <span className="font-bold text-teal-500">GreatMeets.ai</span> – Fast and Human Scheduling © 2025</p>
      </div>
    </motion.div>
  );
}
