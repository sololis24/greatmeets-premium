'use client';
import React from 'react';

export default function PollResultHeader({
  title,
  timezone,
  totalVotes,
  totalInvitees
}: {
  title: string;
  timezone: string;
  totalVotes: number;
  totalInvitees: number;
}) {
  return (
    <div className="text-center mb-8">
      <div className="text-7xl mb-2">🗓️</div>
      <h1 className="text-4xl font-extrabold text-transparent bg-clip-text tracking-wide leading-tight mb-1"
        style={{
          backgroundImage: 'linear-gradient(45deg, #34d399, #4f46e5, #6366f1)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          animation: 'gradientMotion 3s ease-in-out infinite',
        }}
      >
        {title}
      </h1>
      <p className="text-sm text-gray-500 text-center">
        All Times Shown In <span className="font-semibold">{timezone}</span> Timezone
      </p>
      <p className="text-gray-600 font-medium text-lg">
        {totalVotes} / {totalInvitees} voted
      </p>
    </div>
  );
}
