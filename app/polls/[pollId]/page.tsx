'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { db } from '@/firebase/firebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { motion } from 'framer-motion';
import Toast from '@/components/Toast';
import PollHeader from '@/components/PollHeader';
import PollTimeSlotList from '@/components/PollTimeSlotList';
import PollControls from '@/components/PollControls';
import PollFooter from '@/components/PollFooter';
import { PollData } from '@/app/types/PollData';

export default function VotingPage() {
  const { pollId } = useParams() as { pollId: string };
  const router = useRouter();
  const searchParams = useSearchParams();

  const [pollData, setPollData] = useState<PollData | null>(null);
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [thankYouVisible, setThankYouVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'info'>('success');
  const [isParticipantReady, setIsParticipantReady] = useState(false);
  const [timezone, setTimezone] = useState<string>('UTC');

  useEffect(() => {
    if (!pollId) return;

    const fetchPoll = async () => {
      const pollRef = doc(db, 'polls', pollId);
      const pollSnap = await getDoc(pollRef);
      if (!pollSnap.exists()) {
        setErrorMessage('This poll no longer exists.');
        return;
      }

      const data = pollSnap.data() as PollData;
      setPollData(data);

      const participantEmail = localStorage.getItem('participantEmail')?.toLowerCase().trim();
      const invitee = data.invitees?.find((i: any) => i.email?.toLowerCase().trim() === participantEmail);
      const tz = invitee?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
      setTimezone(tz);
    };

    fetchPoll();
  }, [pollId, searchParams]);

  const handleSelect = (slot: string) => {
    setSelectedSlots((prev) =>
      prev.includes(slot) ? prev.filter((s) => s !== slot) : [...prev, slot]
    );
  };

  useEffect(() => {
    const name = searchParams.get('name');
    const email = searchParams.get('email');
    const token = searchParams.get('token');

    if (!name && pollData && token) {
      const invitee = pollData.invitees?.find((i: any) => i.userToken === token || i.token === token);
      if (invitee) {
        const fullName = [invitee.firstName, invitee.lastName].filter(Boolean).join(' ').trim();
        if (fullName) {
          localStorage.setItem('participantName', fullName);
        }
      }
    }

    if (name && name !== 'Someone') localStorage.setItem('participantName', name);
    if (email) localStorage.setItem('participantEmail', email);
    if (token) localStorage.setItem('userToken', token);

    setIsParticipantReady(true);
  }, [searchParams, pollData]);

  useEffect(() => {
    const token = localStorage.getItem('userToken') || searchParams.get('token');
    if (!localStorage.getItem('participantName') && pollData && token) {
      const invitee = pollData.invitees?.find((i: any) => i.userToken === token || i.token === token);
      if (invitee) {
        const fullName = [invitee.firstName, invitee.lastName].filter(Boolean).join(' ').trim();
        if (fullName) {
          localStorage.setItem('participantName', fullName);
        }
      }
    }
  }, [pollData]);

  const handleSubmitVote = async () => {
    if (!pollData) return;

    const participantName = localStorage.getItem('participantName');
    const participantEmail = localStorage.getItem('participantEmail') || '';
    const organizerName = pollData.organizerName || 'Organizer';
    const organizerEmail = pollData.organizerEmail || '';
    const pollLink = `${window.location.origin}/polls/${pollId}/results`;
    const userToken = localStorage.getItem('userToken');

    if (!userToken || !participantEmail) {
      console.error('❌ Missing participant information.');
      return;
    }

    const previousVote = pollData.votes?.find((v) => v.userToken === userToken);
    const updatedVotes = [
      ...(pollData.votes || []).filter((v) => v.userToken !== userToken),
      { userToken, name: participantName, selectedSlots },
    ];

    try {
      const pollRef = doc(db, 'polls', pollId);
      await updateDoc(pollRef, {
        votes: updatedVotes,
        updatedByEmail: participantEmail,
      });

      const formattedSelectedTimes = selectedSlots.map((iso) =>
        new Date(iso).toLocaleString(undefined, {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          timeZone: timezone,
        })
      );

      const endpoint = previousVote ? '/api/vote-update-confirmation-invitee' : '/api/send-thank-you';

      await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participantEmail,
          participantName,
          selectedTimes: formattedSelectedTimes,
          organizerName,
          pollLink,
          deadline: pollData.deadline,
        }),
      });

      await fetch('/api/send-vote-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizerEmail,
          organizerName,
          participantName,
          pollLink,
          deadline: pollData.deadline,
        }),
      });

      setToastMessage('Thanks for voting!');
      setToastType('success');
      setThankYouVisible(true);

      setTimeout(() => {
        setThankYouVisible(false);
        setTimeout(() => {
          router.push(`/polls/${pollId}/results`);
        }, 300);
      }, 4000);
    } catch (error) {
      console.error('❌ Failed to submit vote:', error);
      setErrorMessage('Something went wrong while submitting your vote.');
    }
  };

  const confirmCantAttend = async () => {
    const participantName =
      localStorage.getItem('participantName') ||
      searchParams.get('name') || 
      'Someone';

    const participantEmail =
      localStorage.getItem('participantEmail') ||
      searchParams.get('email') ||
      '';

    const participantToken =
      localStorage.getItem('userToken') ||
      searchParams.get('token') ||
      '';

    if (!pollId || !participantToken) {
      setErrorMessage('Missing poll ID or participant token.');
      return;
    }

    try {
      const res = await fetch('/api/cant-attend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pollId,
          participantToken,
          participantName,
          participantEmail,
        }),
      });

      if (!res.ok) {
        setErrorMessage("Could not submit your cancellation. Please try again.");
        return;
      }

      setToastMessage("The organizer has been notified!");
      setToastType('info');
      setThankYouVisible(true);

      setTimeout(() => {
        setThankYouVisible(false);
        setTimeout(() => {
          router.push(`/polls/${pollId}/results`);
        }, 300);
      }, 4000);
    } catch (error: any) {
      console.error('❌ Error in confirmCantAttend:', error.message);
      setErrorMessage("Something went wrong while submitting your 'can't attend' response.");
    }
  };

  if (!pollData) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-xl text-red-500">{errorMessage || 'Loading poll...'}</p>
      </main>
    );
  }

  return (
    <>
      {thankYouVisible && (
        <Toast
          message={toastMessage}
          visible={thankYouVisible}
          onClose={() => setThankYouVisible(false)}
          type={toastType}
          position="top"
        />
      )}
      <main className="min-h-screen flex items-center justify-center p-8">
        <motion.div className="bg-white p-10 rounded-3xl shadow-2xl max-w-2xl w-full space-y-8">
          <PollHeader title={pollData.title} timezone={timezone} />
          <PollTimeSlotList
            slots={pollData.selectedTimes}
            selected={selectedSlots}
            onSelect={handleSelect}
            timezone={timezone}
          />
          {errorMessage && <div className="text-red-500 font-medium">{errorMessage}</div>}
          <PollControls
            onSubmit={isParticipantReady ? handleSubmitVote : () => {}}
            onCantAttend={isParticipantReady ? confirmCantAttend : () => {}}
            disabled={!isParticipantReady}
          />
          <PollFooter />
        </motion.div>
      </main>
    </>
  );
}