'use client';

import React, { useEffect, useState } from 'react';
import TimezoneSelect from '../components/TimezoneSelect';
import { motion } from 'framer-motion';

interface Invitee {
  firstName: string;
  lastName: string;
  email: string;
  timezone: string;
  token: string;
}

interface Props {
  inviteeFirstName: string;
  setInviteeFirstName: (val: string) => void;
  inviteeLastName: string;
  setInviteeLastName: (val: string) => void;
  newInviteeEmail: string;
  setNewInviteeEmail: (val: string) => void;
  newInviteeTimezone: string;
  setNewInviteeTimezone: (val: string) => void;
  handleAddInvitee: () => void;
  inviteeErrors: Record<string, string>;
  invitees: Invitee[];
  handleRemoveInvitee: (index: number) => void;
  shakeCount: number;
}

function isValidEmail(email: string): boolean {
  const trimmed = email.trim().toLowerCase();
  const basicRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const blacklistedDomains = ['mailinator.com', 'tempmail.com', '10minutemail.com'];
  const domain = trimmed.split('@')[1];
  return basicRegex.test(trimmed) && !blacklistedDomains.includes(domain);
}

export default function InviteeForm({
  inviteeFirstName,
  setInviteeFirstName,
  inviteeLastName,
  setInviteeLastName,
  newInviteeEmail,
  setNewInviteeEmail,
  newInviteeTimezone,
  setNewInviteeTimezone,
  handleAddInvitee,
  inviteeErrors,
  invitees,
  handleRemoveInvitee,
  shakeCount,
}: Props) {
  const capitalizeWords = (str: string) =>
    str.replace(/\b\w/g, (char) => char.toUpperCase());

  const [hasBlurred, setHasBlurred] = useState(false);
  const [hasRendered, setHasRendered] = useState(false);

  useEffect(() => {
    setHasRendered(true);
  }, []);

  const isEmailValid = isValidEmail(newInviteeEmail);
  const shouldShowEmailError = !!newInviteeEmail && !isEmailValid && hasBlurred;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6 mt-12"
    >
      <h2 className="text-xl font-semibold text-gray-700">Send an Invite</h2>

      <div className="flex flex-col md:flex-row gap-4">
        <input
          type="text"
          placeholder="Their First Name"
          className={`w-full p-4 rounded-lg transition-all duration-300 ${
            inviteeErrors.name
              ? 'border-b border-red-500 focus:border-red-500 focus:border-b-4'
              : 'border-b border-gray-300 focus:border-teal-500 focus:border-b-4'
          } ${inviteeFirstName ? 'bg-white not-italic' : 'bg-gray-50 italic'}`}
          value={inviteeFirstName}
          onChange={(e) => setInviteeFirstName(capitalizeWords(e.target.value))}
        />

        <input
          type="text"
          placeholder="Their Last Name"
          className={`w-full p-4 rounded-lg transition-all duration-300 ${
            inviteeErrors.name
              ? 'border-b border-red-500 focus:border-red-500 focus:border-b-4'
              : 'border-b border-gray-300 focus:border-teal-500 focus:border-b-4'
          } ${inviteeLastName ? 'bg-white not-italic' : 'bg-gray-50 italic'}`}
          value={inviteeLastName}
          onChange={(e) => setInviteeLastName(capitalizeWords(e.target.value))}
        />
      </div>

      {inviteeErrors.name && (
        <p className="text-red-500 text-base mt-1">{inviteeErrors.name}</p>
      )}

      <motion.div
        key={shakeCount}
        animate={
          (inviteeErrors.email || shouldShowEmailError)
            ? { x: [0, -12, 12, -12, 0] }
            : {}
        }
        transition={{ duration: 0.5 }}
      >
        <input
          type="email"
          placeholder="Enter Their Email Address"
          className={`w-full p-4 rounded-lg transition-all duration-300 ${
            inviteeErrors.email && hasBlurred
              ? 'border-b border-red-500 focus:border-red-500 focus:border-b-4'
              : 'border-b border-gray-300 focus:border-teal-500 focus:border-b-4'
          } ${newInviteeEmail ? 'bg-white not-italic' : 'bg-gray-50 italic'}`}
          value={newInviteeEmail}
          onChange={(e) => setNewInviteeEmail(e.target.value)}
          onBlur={() => setHasBlurred(true)}
        />
      </motion.div>

      {(inviteeErrors.email || shouldShowEmailError) && (
        <p className="text-red-500 text-sm mt-1">
          {inviteeErrors.email || 'Is that email valid?'}
        </p>
      )}


      <TimezoneSelect value={newInviteeTimezone} onChange={setNewInviteeTimezone} />

      <motion.button
        key={`btn-${shakeCount}`}
        type="button"
        onClick={handleAddInvitee}
        animate={hasRendered && shakeCount > 0 ? { x: [0, -10, 10, -10, 0] } : {}}
        transition={{ duration: 0.4 }}
        className="w-full bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-500 hover:to-teal-600 text-white text-lg font-semibold py-4 rounded-full transition mt-4"
      >
        Add Invitee
      </motion.button>

      {invitees.length > 0 && (
        <div className="bg-gray-50 p-4 rounded-lg shadow-inner space-y-4 mt-6">
          {invitees.map((invitee, index) => (
            <div key={index}>
              <div className="flex justify-between items-center py-2">
                <div>
                  <p className="font-bold text-lg">
                    {[invitee.firstName, invitee.lastName].filter(Boolean).join(' ')}
                  </p>
                  <p className="text-base text-gray-500">{invitee.email}</p>
                  <p className="text-xs text-gray-400">{invitee.timezone}</p>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveInvitee(index)}
                  className="text-red-600 border border-red-200 hover:bg-red-500 hover:text-white transition-all duration-200 px-3 py-1 rounded-full text-base font-medium shadow-sm"
                >
                  Delete
                </button>
              </div>

              {index < invitees.length - 1 && (
                <hr className="border-t border-gray-200 my-2" />
              )}
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
