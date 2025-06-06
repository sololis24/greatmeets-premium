'use client';

import { useState, useEffect, useRef } from 'react';
import { DayPicker } from 'react-day-picker';
import { motion } from 'framer-motion';
import 'react-day-picker/dist/style.css';
import { Listbox } from '@headlessui/react';
import { ChevronDownIcon, CalendarDaysIcon } from '@heroicons/react/20/solid';

const hours = Array.from({ length: 24 }, (_, h) => h);
const minutes = [0, 15, 30, 45];
const padded = (n: number) => n.toString().padStart(2, '0');

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
    return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 9, 0, 0, 0);
  });

  const calendarRef = useRef(null);

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

  const renderTimeSelectors = (
    <div className="flex gap-2 items-center justify-center md:justify-start w-full flex-col sm:flex-row">
      <div className="relative w-full sm:w-[100px]">
        <Listbox
          value={selectedDeadlineDate.getHours()}
          onChange={(hour) => {
            const d = new Date(selectedDeadlineDate);
            d.setHours(hour);
            setSelectedDeadlineDate(d);
          }}
        >
          <div className="relative">
            <Listbox.Button className="w-full flex justify-between items-center px-3 py-2 rounded-xl border border-gray-300 text-base bg-white shadow-sm focus:ring-2 focus:ring-teal-400">
              {padded(selectedDeadlineDate.getHours())}
              <ChevronDownIcon className="w-5 h-5 text-gray-500" />
            </Listbox.Button>
            <Listbox.Options className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-md max-h-60 overflow-auto">
              {hours.map((h) => (
                <Listbox.Option
                  key={h}
                  value={h}
                  className={({ active }) =>
                    `cursor-pointer px-4 py-2 ${
                      active ? 'bg-teal-100 text-teal-800' : 'text-gray-800'
                    }`
                  }
                >
                  {padded(h)}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </div>
        </Listbox>
      </div>

      <span className="text-gray-500 hidden sm:inline">:</span>

      <div className="relative w-full sm:w-[100px]">
        <Listbox
          value={selectedDeadlineDate.getMinutes()}
          onChange={(min) => {
            const d = new Date(selectedDeadlineDate);
            d.setMinutes(min);
            setSelectedDeadlineDate(d);
          }}
        >
          <div className="relative">
            <Listbox.Button className="w-full flex justify-between items-center px-3 py-2 rounded-xl border border-gray-300 text-base bg-white shadow-sm focus:ring-2 focus:ring-teal-400">
              {padded(selectedDeadlineDate.getMinutes())}
              <ChevronDownIcon className="w-5 h-5 text-gray-500" />
            </Listbox.Button>
            <Listbox.Options className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-md max-h-60 overflow-auto">
              {minutes.map((m) => (
                <Listbox.Option
                  key={m}
                  value={m}
                  className={({ active }) =>
                    `cursor-pointer px-4 py-2 ${
                      active ? 'bg-teal-100 text-teal-800' : 'text-gray-800'
                    }`
                  }
                >
                  {padded(m)}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </div>
        </Listbox>
      </div>
    </div>
  );

  return (
    <>
      {hasDeadline && !deadline && (
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 shadow-sm w-full">
          <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center">
            <div className="flex flex-col md:flex-row md:items-center md:gap-6 items-stretch gap-3">
              <div className="relative w-full md:w-[180px]">
                <button
                  id="calendar-trigger-deadline"
                  type="button"
                  onClick={() =>
                    setOpenCalendarIndex(openCalendarIndex === 'deadline' ? null : 'deadline')
                  }
                  className="w-full h-[44px] px-4 border border-gray-300 rounded-xl shadow-sm text-base bg-white text-gray-700 flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-teal-400"
                >
                  <span>{selectedDeadlineDate.toLocaleDateString('en-GB')}</span>
                  <CalendarDaysIcon className="w-5 h-5 text-gray-500 ml-2" />
                </button>
                {openCalendarIndex === 'deadline' && (
                  <motion.div
                    ref={calendarRef}
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    className="absolute bottom-full mb-2 left-0 z-50 bg-white rounded-xl border border-gray-200 shadow-xl p-3"
                    style={{ width: 'fit-content', minWidth: '260px', overflow: 'visible' }}
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
              {renderTimeSelectors}
            </div>
            <div className="w-full md:w-auto text-center md:text-right">
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
                className="bg-emerald-500 hover:bg-emerald-600 text-white text-base font-medium py-2 px-6 rounded-full shadow-sm w-full md:w-auto"
              >
                Add Deadline
              </button>
            </div>
          </div>
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