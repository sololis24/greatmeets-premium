'use client';

import { useState, useEffect, useRef } from 'react';
import { DayPicker } from 'react-day-picker';
import { motion } from 'framer-motion';
import 'react-day-picker/dist/style.css';

const roundToNearest15 = (date: Date) => {
  const ms = 1000 * 60 * 15;
  return new Date(Math.round(date.getTime() / ms) * ms);
};


type Props = {
  hasDeadline: boolean;
  setHasDeadline: (val: boolean) => void;
  openCalendarIndex: string | null;
  setOpenCalendarIndex: (val: string | null) => void;
  deadline: string;
  setDeadline: (val: string) => void;
  setToastVisible: (val: boolean) => void;
  setToastMessage: (val: string) => void;
  setToastType: (val: 'success' | 'error') => void;
};

export default function DeadlinePicker({
  hasDeadline,
  openCalendarIndex,
  setOpenCalendarIndex,
  deadline,
  setDeadline,
  setToastVisible,
  setToastMessage,
  setToastType,
}: Props) {
  const [selectedDeadlineDate, setSelectedDeadlineDate] = useState(() => {
    const now = new Date();
    const tomorrowAtNine = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 9, 0, 0, 0);
    return tomorrowAtNine;
  });
  
  
  

  const calendarRef = useRef(null);

  // Close calendar on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        openCalendarIndex === 'deadline' &&
        calendarRef.current &&
        !(calendarRef.current as HTMLElement).contains(event.target as Node)
      ) {
        setOpenCalendarIndex(null);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openCalendarIndex]);

  return (
    <>
      {hasDeadline && !deadline && (
        <div className="flex flex-wrap items-center gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200 shadow-sm">
          {/* 📅 Date Picker */}
          <div className="relative inline-block" style={{ overflow: 'visible' }}>
            <button
              id="calendar-trigger-deadline"
              type="button"
              onClick={() =>
                setOpenCalendarIndex(openCalendarIndex === 'deadline' ? null : 'deadline')
              }
              className="p-3 w-[160px] border border-gray-300 rounded-xl shadow-sm text-base focus:outline-none focus:ring-2 focus:ring-teal-400 text-gray-700 bg-white"
            >
              {selectedDeadlineDate.toLocaleDateString('en-GB')} 📅
            </button>

            {openCalendarIndex === 'deadline' && (
              <motion.div
                ref={calendarRef}
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="absolute bottom-full mb-2 left-0 z-50 bg-white rounded-xl border border-gray-200 shadow-xl p-3"
                style={{
                  width: 'fit-content',
                  minWidth: '260px',
                  overflow: 'visible',
                }}
              >
                <DayPicker
                  mode="single"
                  selected={selectedDeadlineDate}

                 onSelect={(date) => {
  if (!date) return;
  const updated = new Date(date);
  updated.setHours(selectedDeadlineDate.getHours());
  updated.setMinutes(selectedDeadlineDate.getMinutes());
  updated.setSeconds(0, 0);
  setSelectedDeadlineDate(updated);
  setOpenCalendarIndex(null);
}}

                  fromDate={new Date()}
                />
              </motion.div>
            )}
          </div>

          {/* ⏰ Time Selectors */}
          <div className="flex items-center gap-2">
            <select
              value={selectedDeadlineDate.getHours().toString().padStart(2, '0')}
              onChange={(e) => {
                const d = new Date(selectedDeadlineDate);
                d.setHours(Number(e.target.value));
                setSelectedDeadlineDate(d);
              }}
              className="p-2 px-3 rounded-xl border border-gray-300 text-base bg-white shadow-sm focus:ring-2 focus:ring-teal-400"
            >
              {Array.from({ length: 24 }, (_, h) => String(h).padStart(2, '0')).map((h) => (
                <option key={h} value={h}>{h}</option>
              ))}
            </select>
            <span className="text-gray-500">:</span>
            <select
              value={selectedDeadlineDate.getMinutes().toString().padStart(2, '0')}
              onChange={(e) => {
                const d = new Date(selectedDeadlineDate);
                d.setMinutes(Number(e.target.value));
                setSelectedDeadlineDate(d);
              }}
              className="p-2 px-3 rounded-xl border border-gray-300 text-base bg-white shadow-sm focus:ring-2 focus:ring-teal-400"
            >
              {['00', '15', '30', '45'].map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          {/* ✅ Add Button */}
          <button
            type="button"
            onClick={() => {
              const finalDate = new Date(selectedDeadlineDate);
              finalDate.setSeconds(0, 0);
              setDeadline(finalDate.toISOString());

              setToastMessage('Deadline added!');
              setToastType('success');
              setToastVisible(true);
            }}
            className="bg-emerald-500 hover:bg-emerald-600 text-white text-base font-medium py-2 px-4 rounded-xl shadow-sm"
          >
            Add Deadline
          </button>
        </div>
      )}

      {hasDeadline && deadline && (
        <div className="flex flex-wrap items-center gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200 shadow-inner justify-between">
          <div className="text-base font-medium text-gray-600">
            {new Date(deadline).toLocaleString(navigator.language || 'en-US', {
              weekday: 'short',
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
          <motion.button
            type="button"
            onClick={() => setDeadline('')}
            whileHover={{
              x: [0, -10, 10, -10, 10, -8, 8, -4, 4, 0],
              rotate: [0, -5, 5, -7, 7, -3, 3, 0],
              transition: { duration: 0.3, ease: 'easeInOut' },
            }}
            className="text-red-600 hover:text-white border border-red-300 hover:bg-red-500 transition-all duration-200 px-4 py-1.5 rounded-full font-semibold text-base shadow-sm"
          >
            Delete
          </motion.button>
        </div>
      )}
    </>
  );
}
