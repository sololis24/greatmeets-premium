'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { db } from '@/firebase/firebaseConfig';
import { doc, getDoc, runTransaction } from 'firebase/firestore';
import { motion } from 'framer-motion';
import PollResultHeader from '@/components/PollResultHeader';
import PollResultBar from '@/components/PollResultBar';

interface Vote {
  userToken: string;
  selectedSlots: string[];
  name?: string;
}

export default function PollResultsPage() {
  const { pollId } = useParams() as { pollId: string };
  const searchParams = useSearchParams();
  const router = useRouter();
  const [pollData, setPollData] = useState<any>(null);
  const [formattedTimeSlots, setFormattedTimeSlots] = useState<{ [key: string]: string }>({});
  const [myVotes, setMyVotes] = useState<string[]>([]);
  const [timezone, setTimezone] = useState<string>('');
  const [emailSentForSlot, setEmailSentForSlot] = useState<string | null>(null);

  useEffect(() => {
    if (!pollId) return;

    const fetchPoll = async () => {
      const pollRef = doc(db, 'polls', pollId);
      const pollSnap = await getDoc(pollRef);

      if (!pollSnap.exists()) {
        console.error('Poll not found');
        return;
      }

      const data = pollSnap.data();
      setPollData(data);

      const participantEmail = localStorage.getItem('participantEmail')?.toLowerCase().trim();
      const participantName = localStorage.getItem('participantName') || 'Someone';
      const updatedByEmail = data.updatedByEmail?.toLowerCase().trim();

      const invitee = data.invitees?.find((i: any) => i.email?.toLowerCase().trim() === participantEmail);
      const tz = invitee?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
      setTimezone(tz);

      const formatted: { [key: string]: string } = {};
      data.timeSlots.forEach((slot: string) => {
        formatted[slot] = new Date(slot).toLocaleString(undefined, {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          timeZone: tz,
        });
      });
      setFormattedTimeSlots(formatted);

      const userToken = localStorage.getItem('userToken');
      const myVote = data.votes?.find((v: Vote) => v.userToken === userToken);
      if (myVote) {
        setMyVotes(myVote.selectedSlots || []);
      }

      const deduplicatedVotes = data.votes?.reduce((acc: Record<string, Vote>, vote: Vote) => {
        acc[vote.userToken] = vote;
        return acc;
      }, {}) || {};

      const uniqueVotesArray = Object.values(deduplicatedVotes);
      const voteCounts = data.timeSlots.reduce((acc: any, slot: string) => {
        acc[slot] = uniqueVotesArray.filter((v: any) => v.selectedSlots.includes(slot)).length || 0;
        return acc;
      }, {});

      const bestSlot = Object.keys(voteCounts).reduce((best, current) => {
        if (!best || voteCounts[current] > voteCounts[best]) {
          return current;
        }
        return best;
      }, '');

      if (
        bestSlot &&
        bestSlot !== data.finalizedSlot &&
        bestSlot !== data.lastFinalizationEmailSentForSlot &&
        bestSlot !== emailSentForSlot &&
        participantEmail === updatedByEmail
      ) {
        const voterNames = uniqueVotesArray.map((v: any) => v.name || 'Someone');
        const cancellerNames = (data.cancellations || []).map((c: any) => c.name || 'Someone');

        try {
          // 🔐 Only send emails if transaction confirms this client is first
          await runTransaction(db, async (transaction) => {
            const freshSnap = await transaction.get(pollRef);
            const freshData = freshSnap.data();
            if (!freshData) throw new Error('Poll deleted.');

            if (freshData.lastFinalizationEmailSentForSlot === bestSlot) {
              throw new Error('Email already sent for this slot.');
            }

            transaction.update(pollRef, {
              finalizedSlot: bestSlot,
              lastFinalizationEmailSentForSlot: bestSlot,
            });
          });

          // ✅ Now it's safe to send emails
          await Promise.all(
            (data.invitees || []).map((invitee: any) => {
              const email = invitee.email?.trim().toLowerCase();
              const name = invitee.firstName || 'there';
          
              if (!email) return;
          
              return fetch('/api/updated-final-confirmation-invitee', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  to: email,
                  name,
                  time: formatted[bestSlot],
inviteeTimezone: invitee?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
                  organizerName: data.organizerName,
                  link: `${window.location.origin}/polls/${pollId}/results`,
                  meetingLink: data.meetingLink,
                  meetingTitle: data.title,
                }),
              });
              
            })
          );
          

          await fetch('/api/updated-finalization-organizer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: data.organizerEmail,
              time: bestSlot, // ✅ Send raw ISO string
              recipientTimezone: data.organizerTimezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
              name: data.organizerName,
              voterNames,
              cancellerNames,
              link: `${window.location.origin}/polls/${pollId}/results`,
              meetingLink: data.meetingLink,
            }),
          });
          
          setEmailSentForSlot(bestSlot);
        } catch (error: any) {
          console.warn('✅ Email not sent —', error.message);
        }
        
      }
    };

    fetchPoll();
    const interval = setInterval(fetchPoll, 10000);
    return () => clearInterval(interval);
  }, [pollId, searchParams]);

  if (!pollData) {
    return <p className="text-center mt-20 text-gray-600">Loading poll results...</p>;
  }

  const deduplicatedVotes = pollData.votes?.reduce((acc: Record<string, Vote>, vote: Vote) => {
    acc[vote.userToken] = vote;
    return acc;
  }, {}) || {};

  const uniqueVotesArray = Object.values(deduplicatedVotes);
  const totalParticipantsVoted = uniqueVotesArray.length;
  const totalInvitees = pollData.invitees?.length || 0;

  const voteCounts = pollData.timeSlots.reduce((acc: any, slot: string) => {
    acc[slot] = uniqueVotesArray.filter((v: any) => v.selectedSlots.includes(slot)).length || 0;
    return acc;
  }, {});

  const handleChangeVote = () => {
    router.push(`/polls/${pollId}?changeVote=true`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen flex flex-col items-center justify-center p-8 bg-white"
    >
      <div className="bg-white text-black p-10 rounded-3xl shadow-2xl max-w-2xl w-full text-center space-y-8">
        <PollResultHeader
          title={pollData.title || 'Poll Results'}
          timezone={timezone}
          totalVotes={totalParticipantsVoted}
          totalInvitees={totalInvitees}
        />

        <div className="space-y-5">
          {pollData.timeSlots.map((slot: string) => (
            <PollResultBar
              key={slot}
              slotLabel={formattedTimeSlots[slot] || slot}
              votes={voteCounts[slot] || 0}
              percentage={
                totalParticipantsVoted > 0 ? (voteCounts[slot] / totalParticipantsVoted) * 100 : 0
              }
              isMyVote={myVotes.includes(slot)}
            />
          ))}
        </div>

        <button
          onClick={handleChangeVote}
          className="w-full px-6 py-3 bg-white text-blue-600 font-bold rounded-full border-2 border-blue-500 hover:text-white hover:bg-gradient-to-r hover:from-emerald-400 hover:to-blue-500 hover:border-white transition-all duration-300 shadow-md"
        >
          Change My Vote
        </button>

        <p className="text-sm text-gray-400 pt-6">
          Powered by <span className="font-bold text-teal-500">GreatMeets.ai</span> – Fast and Human Scheduling © 2025
        </p>
      </div>
    </motion.div>
  );
}
