"use client";

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { nanoid } from 'nanoid';
import { motion } from 'framer-motion';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import OrganizerForm from '../components/OrganizerForm';
import InviteeForm from '../components/InviteeForm';
import HorizontalTimeScroller from '../components/HorizontalTimeScroller';
import FinalButtons from '../components/FinalButtons';
import Toast from '../components/Toast';
import DeadlinePicker from '@/components/DeadlinePicker';
import UpgradeToPro from '@/components/UpgradeToPro';
import { Crown } from 'lucide-react';
import { isTrialActive } from './utils/isTrialActive';
import type { RefObject } from 'react';


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

  const [hasDeadline, setHasDeadline] = useState(false);
const [deadline, setDeadline] = useState('');
const [openCalendarIndex, setOpenCalendarIndex] = useState<string | null>(null);

const [showToast, setShowToast] = useState(false);
const [meetingLink, setMeetingLink] = useState('');
const [trialStartedAt, setTrialStartedAt] = useState<string | undefined>(undefined);

const [isPro, setIsPro] = useState<boolean | null>(null);
const scrollToMeetingLinkRef = useRef<HTMLDivElement | null>(null);
const [justGeneratedMeetingLink, setJustGeneratedMeetingLink] = useState(false);

const [isHydrated, setIsHydrated] = useState(false);

const [userToken, setUserToken] = useState('');

useEffect(() => {
  const token = localStorage.getItem('userToken');
  if (token) {
    setUserToken(token);
  }
}, []);


useEffect(() => {
  if (justGeneratedMeetingLink) {
    console.log('🔥 Scroll triggered');

    const scroll = () => {
      if (scrollToMeetingLinkRef.current) {
        console.log('✅ Ref exists, scrolling...');
        scrollToMeetingLinkRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setJustGeneratedMeetingLink(false);
      } else {
        console.warn('❌ Ref not ready, retrying...');
        requestAnimationFrame(scroll);
      }
    };

    requestAnimationFrame(scroll);
  }
}, [justGeneratedMeetingLink]);


useEffect(() => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('isPro');
    console.log('🔍 isPro from localStorage:', stored); // helps with debugging
    if (stored === 'true') {
      setIsPro(true);
    } else if (stored === 'false') {
      setIsPro(false);
    } else {
      setIsPro(null); // or false if you want to default show the Upgrade button
    }
  }
}, []);


useEffect(() => {
  if (localStorage.getItem('justUpgraded') === 'true') {
    setShowToast(true);
    localStorage.removeItem('justUpgraded');
    setTimeout(() => setShowToast(false), 6000); // auto-dismiss after 6 seconds
  }
}, []);


  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const uniqueTimeZones = [
    timeZone,
    ...new Set(invitees.map((i) => i.timezone)),
  ].filter(Boolean);


useEffect(() => {
  if (typeof window !== 'undefined') {
    let stored = localStorage.getItem('trialStartedAt');

    if (!stored) {
      stored = new Date().toISOString();
      localStorage.setItem('trialStartedAt', stored);
    }

    setTrialStartedAt(stored);
  }
}, []);

useEffect(() => {
  if (organizerEmail) {
    localStorage.setItem('participantEmail', organizerEmail);
  }
}, [organizerEmail]);
 
  useEffect(() => {
    if (invitees.length > 0 && scrollerRef.current) {
      scrollerRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [invitees]);

  useEffect(() => {
    localStorage.setItem('organizerLastName', organizerLastName);
  }, [organizerLastName]);
  
  useEffect(() => {
    localStorage.setItem('organizerEmail', organizerEmail);
  }, [organizerEmail]);
  
  useEffect(() => {
    localStorage.setItem('meetingTitle', title);
  }, [title]);
  
  useEffect(() => {
    localStorage.setItem('selectedTimes', JSON.stringify(selectedTimes));
  }, [selectedTimes]);
  
  useEffect(() => {
    localStorage.setItem('invitees', JSON.stringify(invitees));
  }, [invitees]);
  


  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
  
    if (token) {
      const saved = localStorage.getItem(`formData-${token}`);
      if (saved) {
        const data = JSON.parse(saved);
        if (data.meetingLink) setMeetingLink(data.meetingLink);
        if (data.organizerFirstName) setOrganizerFirstName(data.organizerFirstName);
        if (data.organizerLastName) setOrganizerLastName(data.organizerLastName);
        if (data.organizerEmail) setOrganizerEmail(data.organizerEmail);
        if (data.title) setTitle(data.title);
        if (data.selectedTimes) setSelectedTimes(data.selectedTimes);
        if (data.invitees) setInvitees(data.invitees);
  
        // ✅ Trigger scroll after hydration
        if (params.get("zoom") === "connected") {
          setJustGeneratedMeetingLink(true);
        }        
      }
    }
  
    setIsHydrated(true);
  }, []);
  
  
  useEffect(() => {
    localStorage.setItem('organizerFirstName', organizerFirstName);
  }, [organizerFirstName]);
  

  useEffect(() => {
    if (!isHydrated) return; // ✅ Wait for state to be restored
    const userToken = localStorage.getItem('userToken');
    if (!userToken) return;
  
    const formData = {
      title,
      organizerFirstName,
      organizerLastName,
      organizerEmail,
      selectedTimes,
      invitees,
      meetingLink, // ✅ Add this
    };
  
    localStorage.setItem(`formData-${userToken}`, JSON.stringify(formData));

  }, [title, organizerFirstName, organizerLastName, organizerEmail, selectedTimes, invitees, meetingLink]);

  

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



    setInvitees((prev) => {
      const updatedInvitees = [
        ...prev,
        {
          firstName: inviteeFirstName.trim(),
          lastName: inviteeLastName.trim(),
          email: newInviteeEmail.trim().toLowerCase(),
          timezone: newInviteeTimezone,
          token,
        },
      ];
    
      const userToken = localStorage.getItem('userToken');
      if (userToken) {
        localStorage.setItem(`formData-${userToken}`, JSON.stringify({
          title,
          organizerFirstName,
          organizerLastName,
          organizerEmail,
          selectedTimes,
          invitees: updatedInvitees,
        }));
      }
    
      return updatedInvitees;
    });
    

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
    // 🔒 Check if user’s trial has expired
    if (!isTrialActive()) {
      router.push('/upgrade');
      return;
    }
  
    // 🟢 Start trial if it's their first time using a Pro feature
    if (!localStorage.getItem('trialStartedAt')) {
      localStorage.setItem('trialStartedAt', new Date().toISOString());
    }
  
    // ✅ Validate required fields
    if (
      !title ||
      !organizerFirstName ||
      !organizerLastName ||
      !organizerEmail ||
      selectedTimes.length === 0 ||
      invitees.length === 0
    ) {
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
        deadline, // ✅ Add this line
      };
      
  
      const response = await fetch('/api/send-direct-invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailPayload),
      });
  
      const data = await response.json();
  
      if (!response.ok) throw new Error(data?.message || 'Something went wrong.');


const userToken = localStorage.getItem('userToken');
if (userToken) {
  localStorage.removeItem(`formData-${userToken}`);
}

  
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
 
  const handleCreatePoll = async () => {
    // 🔒 Check if user’s trial has expired
    if (!isTrialActive()) {
      router.push('/upgrade');
      return;
    }
  
    // 🟢 Start trial if it's their first time using a Pro feature
    if (!localStorage.getItem('trialStartedAt')) {
      localStorage.setItem('trialStartedAt', new Date().toISOString());
    }
  
    // ✅ Validate required fields
    if (
      !title ||
      !organizerFirstName ||
      !organizerLastName ||
      !organizerEmail ||
      selectedTimes.length === 0 ||
      invitees.length === 0
    ) {
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
  
      const pollDoc = await addDoc(collection(db, 'polls'), {
        title,
        organizerName: `${organizerFirstName.trim()} ${organizerLastName.trim()}`,
        organizerEmail,
        invitees: inviteesWithTokens,
        selectedTimes,
        timeSlots: selectedTimes,
        timeZone,
        deadline: hasDeadline && deadline ? deadline : null,
        meetingLink: meetingLink || null,
        createdAt: new Date().toISOString(),
      });
  
      console.log('✅ Meeting link saved:', meetingLink);
      console.log('📌 New poll created with ID:', pollDoc.id);
  
      const pollLink = `${window.location.origin}/polls/${pollDoc.id}`;
  
      const emailPayload = {
        invitees: inviteesWithTokens,
        pollLink,
        organizerName: `${organizerFirstName.trim()} ${organizerLastName.trim()}`,
        organizerEmail,
        organizerTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        selectedTimes,
        deadline, // ✅ Add this line
      };
      
  
      const response = await fetch('/api/send-poll-invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailPayload),
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        console.error('❌ Email error:', data?.error || 'Unknown error');
        throw new Error(data?.error || 'Failed to send poll invites.');
      }

const userToken = localStorage.getItem('userToken');
if (userToken) {
  localStorage.removeItem(`formData-${userToken}`);
}

      router.push('/success');
    } catch (error: any) {
      console.error('❌ Failed to create poll or send invites:', error);
      setToastMessage(error.message || 'Failed to create poll.');
      setToastType('error');
      setToastVisible(true);
    } finally {
      setLoading(false);
    }
  };
  
  if (!isHydrated) return null; // or a loading spinner


  return (
    <main
      ref={scrollToTopRef}
      className="min-h-screen bg-white text-black py-10">

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

{/* ✅ Upgrade toast triggered from localStorage */}
{showToast && (
  <Toast
    message="✅ You’re now a Pro user! Premium features unlocked."
    visible={showToast}
    onClose={() => setShowToast(false)}
    type="success"
    position="top"
  />
)}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative bg-white px-8 py-12 rounded-2xl shadow-2xl w-full flex flex-col gap-8 min-h-[470px] text-[14px]"
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
  isPro={isPro === true}
  trialStartedAt={trialStartedAt}
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

{(invitees.length > 0 || meetingLink) && (
  <div ref={scrollerRef} className="scroll-mt-20">
    <HorizontalTimeScroller
      timeZones={uniqueTimeZones}
      aiSuggestions={[]}
      selectedTimes={selectedTimes}
      onSelectTime={(times) => {
        setSelectedTimes(times);
        if (times.length > 0) {
          setToastMessage('Time Selected');
          setToastType('success');
          setToastVisible(true);
        }
      }}
      scrollToAISuggestionsRef={scrollToAISuggestionsRef}
      scrollToConfirmationRef={scrollToConfirmationRef}
    />
  </div>
)}

{(meetingLink || selectedTimes.length > 0) && (
  <div ref={scrollDownRef} className="scroll-mt-24">
    <FinalButtons
      selectedTimes={selectedTimes}
      handleSendDirectInvite={handleSendDirectInvite}
      handleCreatePoll={handleCreatePoll}
      hasDeadline={hasDeadline}
      setHasDeadline={setHasDeadline}
      deadline={deadline}
      setDeadline={setDeadline}
      openCalendarIndex={openCalendarIndex}
      setOpenCalendarIndex={setOpenCalendarIndex}
      setToastVisible={setToastVisible}
      setToastMessage={setToastMessage}
      setToastType={setToastType}
      meetingLink={meetingLink}
      setMeetingLink={setMeetingLink}
      scrollToMeetingLinkRef={scrollToMeetingLinkRef}
      setJustGeneratedMeetingLink={setJustGeneratedMeetingLink}
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
