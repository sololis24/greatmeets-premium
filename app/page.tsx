"use client";

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { nanoid } from 'nanoid';
import { motion } from 'framer-motion';

import OrganizerForm from '../components/OrganizerForm';
import InviteeForm from '../components/InviteeForm';
import HorizontalTimeScroller from '../components/HorizontalTimeScroller';
import FinalButtons from '../components/FinalButtons';
import Toast from '../components/Toast';

interface Invitee {
  firstName: string;
  lastName: string;
  email: string;
  timezone: string;
  token: string;
}

export default function HomePage() {
  const router = useRouter();
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const scrollToTopRef = useRef<HTMLDivElement | null>(null);
  const scrollDownRef = useRef<HTMLDivElement | null>(null);
  const scrollToAISuggestionsRef = useRef<HTMLDivElement>(null!);
  const scrollToConfirmationRef = useRef<HTMLDivElement>(null!);

  const [title, setTitle] = useState('');
  const [organizerFirstName, setOrganizerFirstName] = useState('');
  const [organizerLastName, setOrganizerLastName] = useState('');
  const [organizerEmail, setOrganizerEmail] = useState('');
  const [organizerErrors, setOrganizerErrors] = useState<Record<string, string>>({});

  const [invitees, setInvitees] = useState<Invitee[]>([]);
  const [inviteeFirstName, setInviteeFirstName] = useState('');
  const [inviteeLastName, setInviteeLastName] = useState('');
  const [newInviteeEmail, setNewInviteeEmail] = useState('');
  const [newInviteeTimezone, setNewInviteeTimezone] = useState('');
  const [inviteeErrors, setInviteeErrors] = useState<Record<string, string>>({});

  const [selectedTimes, setSelectedTimes] = useState<string[]>([]);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [loading, setLoading] = useState(false);

  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const uniqueTimeZones = [
    timeZone,
    ...new Set(invitees.map((i) => i.timezone)),
  ].filter(Boolean);

  useEffect(() => {
    if (invitees.length > 0 && scrollerRef.current) {
      scrollerRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [invitees]);

  const validateOrganizer = () => {
    const errors: Record<string, string> = {};
    if (!title.trim()) errors.title = 'Meeting name is required';
    if (!organizerFirstName.trim()) errors.firstName = 'First name is required';
    if (!organizerLastName.trim()) errors.lastName = 'Last name is required';
    if (!organizerEmail.trim()) errors.email = 'Email is required';
    setOrganizerErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddInvitee = () => {
    if (!validateOrganizer()) {
      scrollToTopRef.current?.scrollIntoView({ behavior: 'smooth' });
      setToastMessage('Please fix the required fields above.');
      setToastType('error');
      setToastVisible(true);
      return;
    }

    const errors: Record<string, string> = {};
    if (!inviteeFirstName.trim() || !inviteeLastName.trim())
      errors.name = 'First and last name are required';
    if (!newInviteeEmail.trim()) errors.email = 'Email is required';
    if (!newInviteeTimezone) errors.timezone = 'Timezone is required';

    setInviteeErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const token = nanoid();
    if (typeof window !== 'undefined' && invitees.length === 0) {
      localStorage.setItem('userToken', token);
    }

    setInvitees((prev) => [
      ...prev,
      {
        firstName: inviteeFirstName.trim(),
        lastName: inviteeLastName.trim(),
        email: newInviteeEmail.trim().toLowerCase(),
        timezone: newInviteeTimezone,
        token,
      },
    ]);

    setInviteeFirstName('');
    setInviteeLastName('');
    setNewInviteeEmail('');
    setNewInviteeTimezone('');
    setInviteeErrors({});
  };

  const handleRemoveInvitee = (index: number) => {
    setInvitees((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSendDirectInvite = async () => {
    if (!title || !organizerFirstName || !organizerLastName || !organizerEmail || selectedTimes.length === 0 || invitees.length === 0) {
      setToastMessage('Please fill out all fields and invite at least one person.');
      setToastType('error');
      setToastVisible(true);
      return;
    }

    try {
      setLoading(true);

      const inviteesWithTokens = invitees.map((invitee) => ({
        ...invitee,
        token: invitee.token || nanoid(),
      }));

      const emailPayload = {
        invitees: inviteesWithTokens.map((i) => ({
          name: [i.firstName, i.lastName].filter(Boolean).join(' ').trim(),
          email: i.email,
          token: i.token,
          timezone: i.timezone,
        })),
        organizerName: `${organizerFirstName.trim()} ${organizerLastName.trim()}`,
        organizerEmail,
        meetingTitle: title,
        selectedTimes,
        timeZone,
        type: 'direct',
      };

      const response = await fetch('/api/send-direct-invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailPayload),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data?.message || 'Something went wrong.');

      router.push('/success');
    } catch (error: any) {
      console.error('❌ Failed to send direct invites:', error);
      setToastMessage(error.message || 'Failed to send invites.');
      setToastType('error');
      setToastVisible(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      ref={scrollToTopRef}
      className="min-h-screen flex items-center justify-center bg-gray-100 text-black">
  <div className="w-full max-w-4xl mx-auto px-4 relative"> {/* this is key! */}
      {/* ✅ Toast anchors to this card-specific relative wrapper */}
      <div className="relative">
        <Toast
          message={toastMessage}
          visible={toastVisible}
          onClose={() => setToastVisible(false)}
          type={toastType}
          position="top"
        />

<motion.div
  initial={{ opacity: 0, y: 30 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5 }}
  className="bg-white px-6 py-10 rounded-2xl shadow-2xl w-full max-w-2xl mx-auto flex flex-col gap-8 min-h-[470px] text-[14px]"
>

            <form className="flex-1 space-y-6">
              <OrganizerForm
                title={title}
                setTitle={setTitle}
                organizerFirstName={organizerFirstName}
                setOrganizerFirstName={setOrganizerFirstName}
                organizerLastName={organizerLastName}
                setOrganizerLastName={setOrganizerLastName}
                organizerEmail={organizerEmail}
                setOrganizerEmail={setOrganizerEmail}
                organizerErrors={organizerErrors}
              />

              {title && organizerFirstName && organizerLastName && organizerEmail && (
                <InviteeForm
                  inviteeFirstName={inviteeFirstName}
                  setInviteeFirstName={setInviteeFirstName}
                  inviteeLastName={inviteeLastName}
                  setInviteeLastName={setInviteeLastName}
                  newInviteeEmail={newInviteeEmail}
                  setNewInviteeEmail={setNewInviteeEmail}
                  newInviteeTimezone={newInviteeTimezone}
                  setNewInviteeTimezone={setNewInviteeTimezone}
                  handleAddInvitee={handleAddInvitee}
                  inviteeErrors={inviteeErrors}
                  invitees={invitees}
                  handleRemoveInvitee={handleRemoveInvitee}
                />
              )}

              {invitees.length > 0 && (
                <div ref={scrollerRef} className="scroll-mt-20">
                  <HorizontalTimeScroller
                    timeZones={uniqueTimeZones}
                    aiSuggestions={[]}
                    selectedTimes={selectedTimes}
                    
                    onSelectTime={(iso) => {
                      if (iso) {
                        setSelectedTimes([iso]);
                        setToastMessage('Time Selected');
                        setToastType('success');
                        setToastVisible(true);
                      } else {
                        setSelectedTimes([]);
                      }
                    }}
                    scrollToAISuggestionsRef={scrollToAISuggestionsRef}
                    scrollToConfirmationRef={scrollToConfirmationRef}
                  />
                </div>
              )}

              {selectedTimes.length > 0 && (
                <div ref={scrollDownRef} className="scroll-mt-24">
                  <FinalButtons
                    selectedTimes={selectedTimes}
                    handleSendDirectInvite={handleSendDirectInvite}
                  />
                </div>
              )}
            </form>
          </motion.div>
        </div>
      </div>
    </main>
  );
}
