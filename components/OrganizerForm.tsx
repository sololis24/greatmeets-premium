'use client';

import React from 'react';

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
};

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
}: OrganizerFormProps) {
  const capitalizeWords = (str: string) =>
    str.replace(/\b\w/g, (char) => char.toUpperCase());

  return (
    <div className="w-full max-w-md mx-auto px-4 py-10">
      <h1
        className="text-3xl sm:text-4xl font-extrabold mb-6 text-transparent bg-clip-text tracking-tight text-center"
        style={{
          background: 'linear-gradient(45deg, #34d399, #4f46e5, #6366f1)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          animation: 'gradientMotion 3s ease-in-out infinite',
        }}
      >
        Create your GreatMeet
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

      <div className="space-y-6">
        <input
          type="text"
          placeholder="Your Great Meet Name"
          className={`w-full px-4 py-2 text-sm border border-transparent border-b border-gray-300 rounded-md bg-gray-50 transition-all duration-300 focus:border-b-4 focus:border-teal-500 ${
            title ? 'not-italic' : 'italic'
          }`}
          value={title}
          onChange={(e) => setTitle(capitalizeWords(e.target.value))}
        />

        <div className="flex flex-col md:flex-row gap-3">
          <input
            type="text"
            placeholder="First Name"
            className={`w-full px-4 py-2 text-sm border border-transparent border-b border-gray-300 rounded-md bg-gray-50 transition-all duration-300 focus:border-b-4 focus:border-teal-500 ${
              organizerFirstName ? 'not-italic' : 'italic'
            }`}
            value={organizerFirstName}
            onChange={(e) =>
              setOrganizerFirstName(capitalizeWords(e.target.value))
            }
          />
        <input
  type="text"
  placeholder="Your Great Meet Name"
  className={`w-full px-4 py-2 text-sm placeholder:text-sm placeholder:text-gray-400 border border-transparent border-b border-gray-300 rounded-md bg-gray-50 transition-all duration-300 focus:border-b-4 focus:border-teal-500 ${
    title ? 'not-italic' : 'italic'
  }`}
  value={title}
  onChange={(e) => setTitle(capitalizeWords(e.target.value))}
/>

        </div>

        <input
          type="email"
          placeholder="Your Email"
          className={`w-full px-4 py-2 text-sm border border-transparent border-b border-gray-300 rounded-md bg-gray-50 transition-all duration-300 focus:border-b-4 focus:border-teal-500 ${
            organizerEmail ? 'not-italic' : 'italic'
          }`}
          value={organizerEmail}
          onChange={(e) => setOrganizerEmail(e.target.value)}
        />
      </div>
    </div>
  );
}
