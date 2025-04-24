// components/create/SelectedTimes.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { toZonedTime } from 'date-fns-tz';

export default function SelectedTimes({
  selectedTimes,
  timeZone,
  uniqueTimeZones,
  openCalendarIndex,
  setOpenCalendarIndex,
  handleTimeChange,
  removeTime,
  addAnotherTime,
  setToastVisible
}) {
  function formatTimeInZone(time, timeZone) {
    const date = new Date(time);
    return new Intl.DateTimeFormat('en-GB', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone,
    }).format(date);
  }

  function getDefaultDateTime() {
    const now = new Date();
    now.setDate(now.getDate() + 1);
    now.setHours(9, 0, 0, 0);
    return now.toISOString().slice(0, 16);
  }

  return (
    <div className="space-y-6 mt-10">
      <div className="mb-2">
        <h2 className="text-xl font-bold text-gray-800">Select a Time</h2>
        <p className="text-sm text-gray-500">Your local time zone: {timeZone}</p>
        <p className="text-sm text-gray-400 italic">
          No times added yet. Use the button below to get started.
        </p>
      </div>

      {selectedTimes.map((time, index) => {
        const dateStr = time.slice(0, 10);
        const timeStr = time.slice(11, 16);
        const isLast = index === selectedTimes.length - 1;
        const isValid = time && !isNaN(new Date(time));
        const localDate = new Date(time);

        return (
          <div
            key={index}
            className="flex justify-between items-center bg-gray-50 p-4 rounded-xl border border-gray-200 shadow-sm"
          >
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative inline-block" style={{ overflow: 'visible' }}>
                <button
                  id={`calendar-trigger-${index}`}
                  type="button"
                  onClick={() =>
                    setOpenCalendarIndex(openCalendarIndex === index ? null : index)
                  }
                  className="p-3 w-[160px] border border-gray-300 rounded-xl shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 text-gray-700 bg-white"
                >
                  {new Date(dateStr).toLocaleDateString('en-GB')} 📅
                </button>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={timeStr.split(":")[0]}
                  onChange={(e) => {
                    const [_, minute] = timeStr.split(":");
                    const updated = `${dateStr}T${e.target.value}:${minute}`;
                    handleTimeChange(index, updated);
                  }}
                  className="p-2 px-3 rounded-xl border border-gray-300 text-sm bg-white shadow-sm focus:ring-2 focus:ring-teal-400"
                >
                  {Array.from({ length: 24 }, (_, h) => String(h).padStart(2, "0")).map(
                    (hour) => (
                      <option key={hour} value={hour}>
                        {hour}
                      </option>
                    )
                  )}
                </select>
                <span className="text-gray-500">:</span>
                <select
                  value={timeStr.split(":")[1]}
                  onChange={(e) => {
                    const [hour] = timeStr.split(":");
                    const updated = `${dateStr}T${hour}:${e.target.value}`;
                    handleTimeChange(index, updated);
                  }}
                  className="p-2 px-3 rounded-xl border border-gray-300 text-sm bg-white shadow-sm focus:ring-2 focus:ring-teal-400"
                >
                  {["00", "15", "30", "45"].map((minute) => (
                    <option key={minute} value={minute}>
                      {minute}
                    </option>
                  ))}
                </select>
              </div>

              {isLast && (
                <button
                  type="button"
                  onClick={() => {
                    addAnotherTime();
                    setToastVisible(true);
                  }}
                  className="bg-emerald-400 hover:bg-emerald-500 text-white text-sm font-medium py-2 px-4 rounded-xl shadow-sm"
                >
                  Add New Time
                </button>
              )}
            </div>

            <div className="w-full mt-4 text-sm text-gray-500">
              <p className="mb-1 font-medium text-gray-600">
                Check out multiple time zones:
              </p>
              <ul className="list-disc list-inside space-y-1">
                {uniqueTimeZones.map((tz) => (
                  <li key={tz}>{tz}: {formatTimeInZone(time, tz)}</li>
                ))}
              </ul>
            </div>

            {!isLast && isValid && (
              <button
                onClick={() => removeTime(index)}
                className="text-red-500 hover:text-red-700 text-sm font-bold transition"
              >
                Delete
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
// Trigger redeploy
