'use client';
import React from 'react';
import { motion } from 'framer-motion';

interface PollHeaderProps {
  title: string;
  timezone: string;
}

export default function PollHeader({ title, timezone }: PollHeaderProps) {
  const formattedTimezone = timezone?.replace('_', ' ') || 'your timezone';

  return (
    <div className="text-center mb-8">
      <motion.div
        initial={{ rotate: 0, scale: 0.8 }}
        animate={{ rotate: [0, 15, -15, 10, -10, 5, -5, 0], scale: 0.6 }}
        transition={{ duration: 1.2, ease: 'easeInOut' }}
        className="text-7xl mb-2"
      >
        🗓️
      </motion.div>

      <h1
        className="text-4xl font-extrabold text-transparent bg-clip-text tracking-wide leading-tight mb-1"
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
        All Times Shown In <span className="font-semibold">{formattedTimezone}</span> Timezone
      </p>

      <p className="text-gray-600 font-medium text-lg mt-2">
        Select Your Available Times:
      </p>
    </div>
  );
}
