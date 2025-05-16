'use client';
import React from 'react';
import { motion } from 'framer-motion';

interface PollTimeSlotListProps {
  slots: string[] | undefined; // <- allow undefined
  selected: string[];
  onSelect: (slot: string) => void;
  timezone: string;
}

export default function PollTimeSlotList({ slots = [], selected, onSelect, timezone }: PollTimeSlotListProps) {
  return (
    <div className="flex flex-col gap-4">
      {slots.map((slot) => {
        const isSelected = selected.includes(slot);
        const formattedTime = new Date(slot).toLocaleString(undefined, {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          timeZone: timezone,
        });

        return (
          <motion.button
            key={slot}
            onClick={() => onSelect(slot)}
            className={`py-3 rounded-full font-bold transition-all ${
              isSelected
                ? 'bg-gradient-to-r from-teal-400 to-cyan-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {formattedTime}
          </motion.button>
        );
      })}
    </div>
  );
}
