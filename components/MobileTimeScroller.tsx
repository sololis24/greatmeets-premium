'use client';

import { useState, useEffect } from 'react';
import { formatInTimeZone } from 'date-fns-tz';
import { addDays } from 'date-fns';
import type { TimeSlot } from '@/types/index';
import { ChevronDownIcon } from '@heroicons/react/20/solid';
import { Listbox } from '@headlessui/react';

interface Props {
  timeZones: string[];
  selectedTimes: TimeSlot[];
  onSelectTime: (times: TimeSlot[]) => void;
  duration: number;
  setDuration: (val: number) => void;
}

export default function MobileTimeScroller({
  timeZones,
  selectedTimes,
  onSelectTime,
  duration,
  setDuration,
}: Props) {
  const [selectedDate, setSelectedDate] = useState(() => {
    const date = new Date();
    date.setHours(9, 0, 0, 0);
    return date;
  });

  const blocks = Array.from({ length: 96 }, (_, i) => i);
  const dateOptions = Array.from({ length: 7 }, (_, i) => addDays(new Date(), i));
  const durations = [
    { label: '15 min', value: 15 },
    { label: '25 min', value: 25 },
    { label: '30 min', value: 30 },
    { label: '45 min', value: 45 },
    { label: '1 hour', value: 60 },
    { label: '1.5 hours', value: 90 },
    { label: '2 hours', value: 120 },
  ];

  return (
    <div className="space-y-4 px-4 py-6 text-base">
      <h2 className="text-lg font-semibold text-gray-700">Pick a Date</h2>
      <div className="flex flex-wrap gap-2">
        {dateOptions.map((date) => (
          <button
            key={date.toISOString()}
            onClick={() => setSelectedDate(date)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition ${
              formatInTimeZone(date, 'UTC', 'yyyy-MM-dd') ===
              formatInTimeZone(selectedDate, 'UTC', 'yyyy-MM-dd')
                ? 'bg-indigo-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {formatInTimeZone(date, 'UTC', 'EEE dd MMM')}
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-3">
        {timeZones.map((tz) => (
          <div key={tz}>
            <h3 className="text-sm font-bold text-gray-600 mb-1">{tz}</h3>
            <div className="flex flex-wrap gap-2">
              {blocks.filter((_, i) => i % 4 === 0).map((i) => {
                const hour = Math.floor(i / 4);
                const minute = (i % 4) * 15;
                const utcDate = new Date(Date.UTC(
                  selectedDate.getFullYear(),
                  selectedDate.getMonth(),
                  selectedDate.getDate(),
                  hour,
                  minute
                ));
                const iso = utcDate.toISOString();
                const label = formatInTimeZone(utcDate, tz, 'HH:mm');
                const isSelected = selectedTimes.some((t) => t.start === iso);

                return (
                  <button
                    key={iso}
                    className={`px-3 py-2 text-sm rounded-lg border ${
                      isSelected
                        ? 'bg-indigo-100 text-indigo-700 border-indigo-400 font-semibold'
                        : 'bg-white text-gray-800 border-gray-200 hover:bg-gray-50'
                    }`}
                    onClick={() => {
                      if (isSelected) {
                        onSelectTime(selectedTimes.filter((t) => t.start !== iso));
                      } else {
                        onSelectTime([...selectedTimes, { start: iso, duration }]);
                      }
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {selectedTimes.length > 0 && (
        <div className="mt-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-700">Your Selected Times</h3>
          {selectedTimes.map((slot) => (
            <div
              key={slot.start}
              className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2"
            >
              <ul className="space-y-1 text-sm">
                {timeZones.map((tz) => {
                  const start = new Date(slot.start);
                  const end = new Date(start.getTime() + slot.duration * 60 * 1000);
                  const sameDay =
                    formatInTimeZone(start, tz, 'yyyy-MM-dd') ===
                    formatInTimeZone(end, tz, 'yyyy-MM-dd');

                  return (
                    <li key={tz}>
                      {tz}: {formatInTimeZone(start, tz, 'EEE, MMM d')} {formatInTimeZone(start, tz, 'HH:mm')}–
                      {formatInTimeZone(end, tz, sameDay ? 'HH:mm' : 'EEE, MMM d HH:mm')}
                    </li>
                  );
                })}
              </ul>
              <button
                onClick={() => onSelectTime(selectedTimes.filter((t) => t.start !== slot.start))}
                className="w-full text-sm text-indigo-600 font-semibold border border-indigo-300 rounded-full py-1.5 mt-2 hover:bg-indigo-50"
              >
                Remove
              </button>
            </div>
          ))}

          <div className="mt-4">
            <label className="text-sm font-medium text-gray-700 mb-2 block">Meeting Duration</label>
            <Listbox value={duration} onChange={(val) => setDuration(val)}>
              <div className="relative">
                <Listbox.Button className="w-full px-4 py-2 rounded-full border border-indigo-300 text-sm font-semibold text-indigo-600 shadow-sm bg-white flex justify-between items-center">
                  {durations.find((d) => d.value === duration)?.label}
                  <ChevronDownIcon className="w-4 h-4 ml-2 text-indigo-500" />
                </Listbox.Button>
                <Listbox.Options className="absolute bottom-full mb-2 w-full bg-white border border-indigo-200 rounded-xl shadow-md text-sm max-h-60 overflow-auto z-50">
                  {durations.map((option) => (
                    <Listbox.Option
                      key={option.value}
                      value={option.value}
                      className={({ active }) =>
                        `cursor-pointer px-4 py-2 ${
                          active ? 'bg-indigo-100 text-indigo-800' : 'text-gray-800'
                        }`
                      }
                    >
                      {option.label}
                    </Listbox.Option>
                  ))}
                </Listbox.Options>
              </div>
            </Listbox>
          </div>
        </div>
      )}
    </div>
  );
}