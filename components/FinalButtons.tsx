'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import DeadlinePicker from '@/components/DeadlinePicker';
import MeetingLinkIntegration from '@/components/MeetingLinkIntegration';
import type { RefObject } from 'react';
import type { TimeSlot } from '@/types/index'; // or wherever your shared types live

type FinalButtonsProps = {
  selectedTimes: TimeSlot[]; // ✅ Correct type
  handleSendDirectInvite: () => void;
  handleCreatePoll: () => void;
  hasDeadline: boolean;
  setHasDeadline: (value: boolean) => void;
  deadline: string;
  setDeadline: (val: string) => void;
  openCalendarIndex: string | null;
  setOpenCalendarIndex: (val: string | null) => void;
  setToastVisible: (val: boolean) => void;
  setToastMessage: (val: string) => void;
  setToastType: (val: 'success' | 'error') => void;
  meetingLink: string;
  setMeetingLink: (val: string) => void;
  scrollToMeetingLinkRef: RefObject<HTMLDivElement>
  setJustGeneratedMeetingLink: (val: boolean) => void;
  duration: number;
  setDuration: (val: number) => void;
  multiSlotConfirmation: boolean | null;
  setMultiSlotConfirmation: (val: boolean) => void; // ✅ NEW
};

export default function FinalButtons({
  selectedTimes,
  handleSendDirectInvite,
  handleCreatePoll,
  hasDeadline,
  setHasDeadline,
  deadline,
  setDeadline,
  openCalendarIndex,
  setOpenCalendarIndex,
  setToastVisible,
  setToastMessage,
  setToastType,
  meetingLink,
  setMeetingLink,
  scrollToMeetingLinkRef,
  setJustGeneratedMeetingLink,
  multiSlotConfirmation, // ✅ NEW
  setMultiSlotConfirmation, // ✅ NEW
}: FinalButtonsProps) {
  if (typeof setMultiSlotConfirmation !== 'function') {
    throw new Error('❌ FinalButtons: setMultiSlotConfirmation is not a function. Check the parent component.');
  }

  const [showTooltip, setShowTooltip] = useState(false);
  const [userToken, setUserToken] = useState<string | null>(null);
  const [tokenKey, setTokenKey] = useState<string | null>(null);

  // ✅ Identify or create session token
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlToken = new URLSearchParams(window.location.search).get('token');
      const localToken = localStorage.getItem('userToken');

      if (urlToken && urlToken !== localToken) {
        localStorage.setItem('userToken', urlToken);
        setUserToken(urlToken);
        setMeetingLink('');
        setTokenKey(`pollState-${urlToken}`);
        return;
      }

      if (localToken) {
        setUserToken(localToken);
        setTokenKey(`pollState-${localToken}`);
      } else {
        const newToken = crypto.randomUUID();
        localStorage.setItem('userToken', newToken);
        setUserToken(newToken);
        setMeetingLink('');
        setTokenKey(`pollState-${newToken}`);
      }
    }
  }, []);

  // ✅ Restore deadline state for this session only
  useEffect(() => {
    if (!tokenKey) return;
    const sessionState = sessionStorage.getItem(tokenKey);
    if (sessionState) {
      try {
        const parsed = JSON.parse(sessionState);
        if (parsed.hasDeadline !== undefined) setHasDeadline(parsed.hasDeadline);
        if (parsed.deadline) setDeadline(parsed.deadline);
      } catch (err) {
        console.error('Failed to parse poll state:', err);
      }
    }
  }, [tokenKey]);

  // ✅ Save state per-session
  useEffect(() => {
    if (!tokenKey) return;
    const sessionState = { hasDeadline, deadline };
    sessionStorage.setItem(tokenKey, JSON.stringify(sessionState));
  }, [hasDeadline, deadline, tokenKey]);

  console.log('💡 setMultiSlotConfirmation is:', setMultiSlotConfirmation);
if (typeof setMultiSlotConfirmation !== 'function') {
  console.error('❌ setMultiSlotConfirmation is not a function:', setMultiSlotConfirmation);
}

  if (selectedTimes.length === 0) return null;

  const onlyOneTimeSelected = selectedTimes.length === 1;
  const multipleTimesSelected = selectedTimes.length > 1;

  const [hasSelectedFinalization, setHasSelectedFinalization] = useState(false);
 

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col gap-6 mt-14 pb-14 relative"
    >
      {multipleTimesSelected && (
        <>
          <div className="h-px w-full bg-gradient-to-r from-transparent via-gray-300 to-transparent mt-6 mb-5" />
          {hasDeadline && deadline && (
            <div className="text-center text-base text-gray-600 font-medium">
              ⏳ Poll closes on{' '}
              <span className="text-gray-800 font-semibold">
                {new Date(deadline).toLocaleString(undefined, {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          )}

<motion.button
  type="button"
  onClick={() => setHasDeadline(!hasDeadline)}
  whileTap={{ scale: 0.98 }}
  initial={{ y: 10, opacity: 0 }}
  animate={{ y: 0, opacity: 1 }}
  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
  className={`group w-full py-4 rounded-full transition-transform duration-300 shadow-md text-center mt-1 text-lg font-semibold
    ${hasDeadline
      ? 'bg-gradient-to-r from-rose-500 via-pink-500 to-fuchsia-500 text-white hover:from-rose-600 hover:to-fuchsia-600'
      : 'bg-transparent border-2 border-pink-400 text-pink-500 hover:bg-pink-50'
    }`}
>
  <span className="group-hover:hidden transition-opacity duration-300">
    {hasDeadline ? 'Disable Poll Deadline' : 'Enable Poll Deadline?'}
  </span>
  <span className="hidden group-hover:inline transition-opacity duration-300">
    {hasDeadline ? 'Disable' : 'Enable'}
  </span>
</motion.button>


          {hasDeadline && (
            <DeadlinePicker
              hasDeadline={hasDeadline}
              setHasDeadline={setHasDeadline}
              openCalendarIndex={openCalendarIndex}
              setOpenCalendarIndex={setOpenCalendarIndex}
              deadline={deadline}
              setDeadline={setDeadline}
              setToastVisible={setToastVisible}
              setToastMessage={setToastMessage}
              setToastType={setToastType}
            />
          )}
        </>
      )}

<div className="relative my-8">
  <div className="absolute inset-0 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
</div>

      {userToken && (
        <MeetingLinkIntegration
          meetingLink={meetingLink}
          setMeetingLink={setMeetingLink}
          userToken={userToken}
          scrollToMeetingLinkRef={scrollToMeetingLinkRef}
          setJustGeneratedMeetingLink={setJustGeneratedMeetingLink}
        />
      )}

<div className="h-px w-full bg-gradient-to-r from-transparent via-gray-300 to-transparent mt-6 mb-5" />

{selectedTimes.length > 1 && (
  <div className="mt-8">
    <div className="flex items-center gap-3 mb-3">
      <h3 className="text-base font-semibold text-gray-800">
        Finalize Poll Invite Settings
      </h3>
    </div>
    <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
      {/* Single Final Invite Option */}
      <label
        className={`flex-1 flex items-start gap-4 px-4 py-4 rounded-2xl border transition-all duration-300 cursor-pointer group ${
          multiSlotConfirmation === false
            ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-transparent shadow-xl scale-[1.02]'
            : multiSlotConfirmation === null
              ? 'bg-white border-gray-300 text-gray-800'
              : 'bg-white border-gray-300 hover:border-gray-400 text-gray-800'
        }`}
      >
        <input
          type="radio"
          name="confirmationType"
          value="single"
          checked={multiSlotConfirmation === false}
          onChange={() => {
            setMultiSlotConfirmation(false);
            setHasSelectedFinalization(true);
          }}
          className="accent-indigo-500 mt-1"
        />
        <div>
          <span className="text-base font-semibold leading-tight block">
            Send 1 final invite
          </span>
          <span
            className={`text-sm block transition-all duration-300 ease-in-out ${
              !multiSlotConfirmation
                ? 'max-h-[40px] opacity-100 mt-1 text-white/80'
                : 'max-h-0 opacity-0 overflow-hidden'
            }`}
          >
            Finalize the single best time and send one calendar invite.
          </span>
        </div>
      </label>

      {/* Multiple Invites Option */}
      <label
        className={`flex-1 flex items-start gap-4 px-4 py-4 rounded-2xl border transition-all duration-300 cursor-pointer group ${
          multiSlotConfirmation === true
            ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-transparent shadow-xl scale-[1.02]'
            : multiSlotConfirmation === null
              ? 'bg-white border-gray-300 text-gray-800'
              : 'bg-white border-gray-300 hover:border-gray-400 text-gray-800'
        }`}
      >
        <input
          type="radio"
          name="confirmationType"
          value="multiple"
          checked={multiSlotConfirmation === true}
          onChange={() => {
            setMultiSlotConfirmation(true);
            setHasSelectedFinalization(true);
          }}
          className="accent-indigo-500 mt-1"
        />
        <div>
          <span className="text-base font-semibold leading-tight block">
            Send Multiple invites
          </span>
          <span
            className={`text-sm block transition-all duration-300 ease-in-out ${
              multiSlotConfirmation
                ? 'max-h-[40px] opacity-100 mt-1 text-white/80'
                : 'max-h-0 opacity-0 overflow-hidden'
            }`}
          >
            Send multiple calendar invites based on full group availability.
          </span>
        </div>
      </label>
    </div>
  </div>
)}


{onlyOneTimeSelected && (
  <motion.button
    type="button"
    onClick={handleSendDirectInvite}
    whileTap={{ scale: 0.98 }}
    initial={{ y: 10, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
    className="group w-full py-4 rounded-full transition-transform duration-300 shadow-md text-center mt-1 text-lg font-semibold bg-gradient-to-r from-purple-500 via-violet-600 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white"
  >
    <span className="group-hover:hidden transition-opacity duration-300">
      Send Your GreatMeet
    </span>
    <span className="hidden group-hover:inline transition-opacity duration-300">
      Let’s Go 🚀
    </span>
  </motion.button>
)}

      {multiSlotConfirmation !== null && (

<>

<div className="h-px w-full bg-gradient-to-r from-transparent via-gray-300 to-transparent mt-6 mb-5" />

{onlyOneTimeSelected && (
  <motion.button
    type="button"
    onClick={handleSendDirectInvite}
    whileTap={{ scale: 0.98 }}
    initial={{ y: 10, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
    className="group w-full py-4 rounded-full transition-transform duration-300 shadow-md text-center mt-1 text-lg font-semibold bg-gradient-to-r from-purple-500 via-violet-600 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white"
  >
    <span className="group-hover:hidden transition-opacity duration-300">
      Send Your GreatMeet
    </span>
    <span className="hidden group-hover:inline transition-opacity duration-300">
      Let’s Go 🚀
    </span>
  </motion.button>
)}

{multiSlotConfirmation !== null && multipleTimesSelected && (
  <motion.button
    type="button"
    onClick={handleCreatePoll}
    whileTap={{ scale: 0.98 }}
    initial={{ y: 10, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
    className="group w-full py-4 rounded-full transition-transform duration-300 shadow-md text-center mt-1 text-lg font-semibold bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-400 hover:from-indigo-600 hover:to-cyan-500 text-white"
  >
    <span className="group-hover:hidden transition-opacity duration-300">
      Send Your GreatMeet Poll
    </span>
    <span className="hidden group-hover:inline transition-opacity duration-300">
      Let’s Go 🗳️
    </span>
  </motion.button>
)}

</>

)}
    </motion.div>
  );
}
