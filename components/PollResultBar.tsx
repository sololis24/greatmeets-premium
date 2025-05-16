'use client';

import { motion } from 'framer-motion';

export default function PollResultBar({
  slotLabel,
  votes,
  percentage,
  isMyVote
}: {
  slotLabel: string;
  votes: number;
  percentage: number;
  isMyVote: boolean;
}) {
  return (
    <div className="text-left space-y-2">
      <p className={`text-md font-semibold ${isMyVote ? 'text-green-600' : 'text-gray-800'}`}>
        {slotLabel}
        {isMyVote && (
          <span className="ml-2 text-xs font-bold bg-green-100 text-green-600 px-2 py-1 rounded-full">
            You voted
          </span>
        )}
      </p>

      <div className="w-full h-6 bg-gray-200 rounded-full relative overflow-hidden shadow-inner">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.7, ease: 'easeInOut' }}
          className="h-full bg-gradient-to-r from-green-300 to-green-500 rounded-full"
        />
        <span className="absolute inset-0 flex justify-center items-center text-xs font-bold text-gray-700">
          {percentage.toFixed(0)}%
        </span>
      </div>

      <p className="text-xs text-gray-400">{votes} vote{votes !== 1 ? 's' : ''}</p>
    </div>
  );
}
