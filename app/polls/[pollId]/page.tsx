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
  const now = new Date();
  const deadlineDate = pollData?.deadline ? new Date(pollData.deadline) : null;
  const isPollClosed = deadlineDate ? now > deadlineDate : false;
  
  useEffect(() => {
    const urlToken = searchParams.get('token');
    const email = localStorage.getItem('participantEmail');
    const name = localStorage.getItem('participantName');
    const token = localStorage.getItem('userToken');
  
    if (!urlToken && token && pollId) {
      const params = new URLSearchParams(searchParams.toString());
      params.set('token', token);
      if (email) params.set('email', email);
      if (name) params.set('name', name);
      router.replace(`/polls/${pollId}?${params.toString()}`);
    }
  }, [pollId, searchParams]);



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
  
      // 🧠 Utility to validate IANA timezone
      const getValidTimezone = (tz: any): string => {
        return typeof tz === 'string' && tz.includes('/')
          ? tz
          : Intl.DateTimeFormat().resolvedOptions().timeZone;
      };
  
      const validTz = getValidTimezone(invitee?.timezone);
      console.log('🌐 Using timezone:', validTz);
      setTimezone(validTz);
    };
  
    fetchPoll();
  }, [pollId, searchParams]);
  


  
  useEffect(() => {
    const email = localStorage.getItem('participantEmail');
    const isValid = pollData?.invitees?.some(i => i.email?.toLowerCase().trim() === email);
  
    if (email && !isValid) {
      localStorage.removeItem('participantEmail');
      localStorage.removeItem('participantName');
      localStorage.removeItem('userToken');
    }
  }, [pollData]);
  

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
    const pollRef = doc(db, 'polls', pollId);
    const pollSnap = await getDoc(pollRef);
    const pollDocData = pollSnap.data() as PollData & {
      confirmedSlotsByInvitee?: { [email: string]: string[] };
    };
    const confirmedMap = pollDocData.confirmedSlotsByInvitee || {};    
    const previouslyConfirmed = confirmedMap[participantEmail] || [];
   
    const selectedTimes = selectedSlots.map((start) => {
      const match = pollDocData.selectedTimes.find((s) => s.start === start);
      return {
        start,
        duration: match?.duration || 30,
      };
    });
    const newConfirmations = selectedTimes; // always send confirmations for selected slots

    const updatedVotes = [
      ...(pollData.votes || []).filter((v) => v.userToken !== userToken),
      {
        userToken,
        name: participantName,
        selectedSlots,
        updatedByEmail: participantEmail,
      },
    ];

    try {
      await updateDoc(pollRef, {
        votes: updatedVotes,
        updatedByEmail: participantEmail,
        confirmedSlotsByInvitee: {
          ...confirmedMap,
          [participantEmail]: selectedSlots, // reset to reflect only current votes
        },
        
      });

      for (let i = 0; i < newConfirmations.length; i++) {
        const slot = newConfirmations[i];

        await fetch(`${window.location.origin}/api/vote-update-confirmation-invitee`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            participantEmail,
            participantName,
            selectedTimes: [slot],
            organizerName,
            pollLink,
            deadline: pollData.deadline,
            timezone,
            slotIndex: i + 1,
            totalSlots: newConfirmations.length,
          }),
        });
      }

      await fetch(`${window.location.origin}/api/send-thank-you`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participantEmail,
          participantName,
          selectedTimes,
          organizerName,
          pollLink,
          deadline: pollData.deadline,
          timezone,
        }),
      });

      await fetch(`${window.location.origin}/api/send-vote-notification`, {
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

      let participantToken =
      localStorage.getItem('userToken') ||
      searchParams.get('token') ||
      '';
    
 
    if (!participantToken && pollData && Array.isArray(pollData.invitees)) {
      const participantEmail = localStorage.getItem('participantEmail')?.toLowerCase().trim();
      const matchingInvitee = pollData.invitees.find(i => i.email?.toLowerCase().trim() === participantEmail);
      participantToken = matchingInvitee?.token || '';
    }
    
    
    if (!pollId || !participantToken) {
      setErrorMessage('Missing poll ID or participant token.');
      return;
    }

    try {
      const res = await fetch(`${window.location.origin}/api/cant-attend`, {
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
  {isPollClosed ? (
  <div className="text-center space-y-3">
    <h2 className="text-xl font-semibold text-blue-600">⏳ This poll has closed.</h2>
    <p className="text-gray-500">
  The poll organized by <strong className="text-base sm:text-lg">{pollData.organizerName}</strong> has ended.
</p>
<button
  onClick={() => router.push('/')}
  className="mt-6 px-6 py-2 text-sm rounded-full text-blue-600 border border-blue-600 hover:bg-blue-50 transition"
>
  Return Home
</button>

  </div>
) : (

      <>
        <PollHeader title={pollData.title} timezone={timezone} />
        <PollTimeSlotList
          slots={pollData?.selectedTimes || []}
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
      </>
    )}
  </motion.div>
</main>

    </>
  );
}
