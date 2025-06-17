'use client';

import React, { useState } from 'react';
import { Crown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';

type OrganizerFormProps = {
  title: string;
  setTitle: (val: string) => void;
  organizerFirstName: string;
  setOrganizerFirstName: (val: string) => void;
  organizerLastName: string;
  setOrganizerLastName: (val: string) => void;
  organizerEmail: string;
  setOrganizerEmail: (val: string) => void;
  organizerErrors: Record<string, string>;
  isPro: boolean;
  trialStartedAt?: string;
  shakeCount: number;
};

function isValidEmail(email: string): boolean {
  const trimmed = email.trim().toLowerCase();
  const basicRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const blacklistedDomains = ['mailinator.com', 'tempmail.com', '10minutemail.com'];
  const domain = trimmed.split('@')[1];
  return basicRegex.test(trimmed) && !blacklistedDomains.includes(domain);
}

export default function OrganizerForm({
  title,
  setTitle,
  organizerFirstName,
  setOrganizerFirstName,
  organizerLastName,
  setOrganizerLastName,
  organizerEmail,
  setOrganizerEmail,
  organizerErrors,
  isPro,
  trialStartedAt,
  shakeCount,
}: OrganizerFormProps) {
  const router = useRouter();
  const [hasBlurred, setHasBlurred] = useState(false);

  const capitalizeWords = (str: string) =>
    str.replace(/\b\w/g, (char) => char.toUpperCase());

  const isEmailValid = isValidEmail(organizerEmail);
  const shouldShowEmailError = !!organizerEmail && !isEmailValid && hasBlurred;

  const trialDaysLeft = (() => {
    if (!trialStartedAt || isPro) return null;
    const start = new Date(trialStartedAt);
    const now = new Date();
    const daysUsed = Math.floor(
      (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    );
    return Math.max(0, 7 - daysUsed);
  })();

  return (
    <div className="space-y-6 text-base">
      <div className="flex justify-between items-start mb-6">
        <div />
        <div className="flex flex-col items-center sm:items-end gap-2 w-full sm:w-auto">
          {isPro ? (
            <div className="inline-flex items-center gap-2 text-sm bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium py-2 px-4 rounded-full shadow-md">
              <Crown className="w-4 h-4 text-yellow-300" />
              Pro
            </div>
          ) : (
            <>
              <Link
                href="/upgrade"
                aria-label="Upgrade to Pro"
                className="inline-flex items-center justify-center gap-2 text-sm bg-gradient-to-r from-purple-500 via-violet-600 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-medium py-2 px-4 rounded-full shadow-md transition-all duration-300 w-full sm:w-auto"
              >
                <Crown className="h-4 w-4 text-yellow-300" />
                Upgrade to Pro
              </Link>

              {trialDaysLeft !== null && (
                <div className="text-xs font-medium text-indigo-700 bg-indigo-100 rounded-full px-3 py-1 shadow-sm w-fit mx-auto sm:ml-auto text-center">
                  ⏳ {trialDaysLeft} day{trialDaysLeft !== 1 ? 's' : ''} left in your trial
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <h1
        className="text-5xl lg:text-6xl font-extrabold mt-4 mb-10 pb-4 text-transparent bg-clip-text tracking-wide leading-tight hover:text-teal-500 transition-all duration-300 ease-in-out text-center"
        style={{
          background: 'linear-gradient(45deg, #34d399, #4f46e5, #6366f1)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          animation: 'gradientMotion 3s ease-in-out infinite',
        }}
      >
        Create your Great Meet
      </h1>

      <style jsx>{`
        @keyframes gradientMotion {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
      `}</style>

      <input
        type="text"
        autoComplete="off"
        placeholder="Your Great Meet Name"
        className={`w-full p-4 rounded-lg text-base transition-all duration-300
          ${title ? 'bg-white not-italic' : 'bg-gray-50 italic'}
          border-b border-gray-300 focus:border-b-4 focus:border-teal-500`}
        value={title}
        onChange={(e) => setTitle(capitalizeWords(e.target.value))}
      />

      <div className="flex flex-col md:flex-row gap-4">
        <input
          type="text"
          autoComplete="given-name"
          placeholder="First Name"
          className={`w-full p-4 rounded-lg text-base transition-all duration-300
            ${organizerFirstName ? 'bg-white not-italic' : 'bg-gray-50 italic'}
            border-b border-gray-300 focus:border-teal-500 focus:border-b-[3px]`}
          value={organizerFirstName}
          onChange={(e) => setOrganizerFirstName(capitalizeWords(e.target.value))}
        />

        <input
          type="text"
          autoComplete="family-name"
          placeholder="Last Name"
          className={`w-full p-4 rounded-lg text-base transition-all duration-300
            ${organizerLastName ? 'bg-white not-italic' : 'bg-gray-50 italic'}
            border-b border-gray-300 focus:border-teal-500 focus:border-b-[3px]`}
          value={organizerLastName}
          onChange={(e) => setOrganizerLastName(capitalizeWords(e.target.value))}
        />
      </div>

      <motion.div
        key={shakeCount}
        animate={
          hasBlurred && (organizerErrors.email || shouldShowEmailError)
            ? { x: [0, -12, 12, -12, 0] }
            : {}
        }
        transition={{ duration: 0.5 }}
      >
        <input
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="Your Email"
          className={`w-full p-4 rounded-lg text-base transition-all duration-300
            ${
              hasBlurred && (organizerErrors.email || shouldShowEmailError)
                ? 'border-b border-red-500 focus:border-red-500 focus:border-b-4 focus:ring-2 focus:ring-red-300'
                : 'border-b border-gray-300 focus:border-teal-500 focus:border-b-4 focus:ring-2 focus:ring-teal-300'
            }
            ${organizerEmail ? 'bg-white not-italic' : 'bg-gray-50 italic'}`}
          value={organizerEmail}
          onChange={(e) => setOrganizerEmail(e.target.value)}
          onBlur={() => setHasBlurred(true)}
        />
        {hasBlurred && (organizerErrors.email || shouldShowEmailError) && (
          <p className="text-red-500 text-sm mt-2">Is that email valid?</p>
        )}
      </motion.div>
    </div>
  );
}
