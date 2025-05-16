'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import DeadlinePicker from '@/components/DeadlinePicker';
import MeetingLinkIntegration from '@/components/MeetingLinkIntegration';
import type { RefObject } from 'react';

type FinalButtonsProps = {
  selectedTimes: string[];
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
  scrollToMeetingLinkRef: React.RefObject<HTMLDivElement>;
  setJustGeneratedMeetingLink: (val: boolean) => void;
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
}: FinalButtonsProps) {
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

  if (selectedTimes.length === 0) return null;

  const onlyOneTimeSelected = selectedTimes.length === 1;
  const multipleTimesSelected = selectedTimes.length > 1;

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

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="enable-deadline"
              checked={hasDeadline}
              onChange={(e) => setHasDeadline(e.target.checked)}
              className="h-4 w-4 text-teal-500 focus:ring-teal-400 border-gray-300 rounded"
            />
            <label htmlFor="enable-deadline" className="text-base text-gray-700 font-medium">
              Enable poll deadline
            </label>
          </div>

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

      <div className="h-px w-full bg-gradient-to-r from-transparent via-gray-300 to-transparent mt-6 mb-5" />

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

      <motion.button
        type="button"
        onClick={onlyOneTimeSelected ? handleSendDirectInvite : undefined}
        disabled={!onlyOneTimeSelected}
        whileTap={{ scale: 0.98 }}
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        className={`group w-full py-4 rounded-full transition-transform duration-300 shadow-md text-center mt-1 text-lg font-semibold ${
          onlyOneTimeSelected
            ? 'bg-gradient-to-r from-purple-500 via-violet-600 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white'
            : 'bg-gray-300 text-gray-400 cursor-not-allowed'
        }`}
      >
        <span className="group-hover:hidden transition-opacity duration-300">
          Send Your GreatMeet
        </span>
        <span className="hidden group-hover:inline transition-opacity duration-300">
          Let’s Go 🚀
        </span>
      </motion.button>

      <motion.button
        type="button"
        onClick={multipleTimesSelected ? handleCreatePoll : undefined}
        disabled={!multipleTimesSelected}
        whileTap={{ scale: 0.98 }}
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        className={`group w-full py-4 rounded-full transition-transform duration-300 shadow-md text-center mt-1 text-lg font-semibold ${
          multipleTimesSelected
            ? 'bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-400 hover:from-indigo-600 hover:to-cyan-500 text-white'
            : 'bg-gray-300 text-gray-400 cursor-not-allowed'
        }`}
      >
        <span className="group-hover:hidden transition-opacity duration-300">
          Send Your GreatMeet Poll
        </span>
        <span className="hidden group-hover:inline transition-opacity duration-300">
          Let’s Go 🗳️
        </span>
      </motion.button>
    </motion.div>
  );
}
