'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { formatInTimeZone } from 'date-fns-tz';



import type { TimeSlot } from '@/types'; // Or wherever your TimeSlot type is

interface PollTimeSlotListProps {
  slots: TimeSlot[]; // ✅ NOT string[]
  selected: string[];
  onSelect: (slot: string) => void;
  timezone: string;
}


export default function PollTimeSlotList({
  slots = [],
  selected,
  onSelect,
  timezone,
}: PollTimeSlotListProps) {
  // ✅ Filter out slots with invalid or missing start time
  const validSlots = slots.filter(
    (slot) => slot?.start && !isNaN(new Date(slot.start).getTime())
  );

  return (
    <div className="flex flex-col gap-4">
      {validSlots.map(({ start, duration }) => {
        const isSelected = selected.includes(start);
        const startDate = new Date(start);
        const endDate = new Date(startDate.getTime() + duration * 60 * 1000);

        const formattedStart = formatInTimeZone(startDate, timezone, 'eee, MMM d, HH:mm');
        const formattedEnd = formatInTimeZone(endDate, timezone, 'HH:mm');

        return (
          <motion.button
            key={start}
            onClick={() => onSelect(start)}
            className={`py-3 rounded-full font-bold transition-all ${
              isSelected
                ? 'bg-gradient-to-r from-teal-400 to-cyan-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {`${formattedStart}–${formattedEnd}`}
          </motion.button>
        );
      })}
    </div>
  );
}
