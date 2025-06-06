'use client';

import { useState, useEffect, useRef } from 'react';
import { formatInTimeZone } from 'date-fns-tz';
import { format, addDays, isSameDay } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { ClockIcon } from '@heroicons/react/24/outline';
import type { TimeSlot } from '@/types/index';
import { Listbox } from '@headlessui/react'
import { ChevronDownIcon } from '@heroicons/react/20/solid'
import dynamic from 'next/dynamic';

interface Props {
  timeZones: string[];
  aiSuggestions: string[];
  scrollToAISuggestionsRef: React.RefObject<HTMLDivElement>;
  scrollToConfirmationRef: React.RefObject<HTMLDivElement>;
  selectedTimes: TimeSlot[];
  onSelectTime: (times: TimeSlot[]) => void;
  duration: number; // ✅ add this
  setDuration: (val: number) => void; // ✅ add this
}

export default function HorizontalTimeScroller({
  timeZones,
  aiSuggestions,
  selectedTimes,
  onSelectTime,
  scrollToAISuggestionsRef,
  scrollToConfirmationRef,
  duration, // ✅ add this
  setDuration, // ✅ add this
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const dateRibbonRef = useRef<HTMLDivElement | null>(null);
  

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [selectedDate, setSelectedDate] = useState(() => {
    const date = new Date();
    date.setHours(9, 0, 0, 0); // sets time to 09:00:00.000
    return date;
  });
  const aiScrollRef = useRef<HTMLDivElement | null>(null);
  const [selectedTimeISO, setSelectedTimeISO] = useState<string | null>(null);
  const [hoveredBlock, setHoveredBlock] = useState<number | null>(null);
  const [showTimeline, setShowTimeline] = useState(false);
  const [suggestedTimes, setSuggestedTimes] = useState<string[]>([]);
  const [justSuggestedTimes, setJustSuggestedTimes] = useState<string[]>([]);
  const blocks = Array.from({ length: 96 }, (_, i) => i);
  const dateOptions = Array.from({ length: 365 }, (_, i) => addDays(new Date(), i));
  const scrollDateRibbon = (dir: number) => {
    if (dateRibbonRef.current) {
      dateRibbonRef.current.scrollBy({ left: dir * 150, behavior: 'smooth' });
    }
  };

  
  const autoScrollRef = useRef<NodeJS.Timeout | null>(null);

  const startAutoScroll = (dir: number, targetRef: React.RefObject<HTMLElement | null>) => {
    stopAutoScroll();
    autoScrollRef.current = setInterval(() => {
      targetRef.current?.scrollBy({ left: dir * 20, behavior: 'smooth' });
    }, 30); // fast but smooth
  };
  
  const stopAutoScroll = () => {
    if (autoScrollRef.current) {
      clearInterval(autoScrollRef.current);
      autoScrollRef.current = null;
    }
  };
  

useEffect(() => {
  if (typeof window !== 'undefined') {
    const cleared = sessionStorage.getItem('newSession') === 'true';

    if (cleared) {
      localStorage.removeItem('meetingDuration');
      sessionStorage.removeItem('newSession');
    }
  }
}, []);

const [globalDuration, setGlobalDuration] = useState<number>(30);

useEffect(() => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('meetingDuration');
    const defaultDuration = saved ? Number(saved) : 30;

    setGlobalDuration(defaultDuration);
    setDuration(defaultDuration); // ← keep parent in sync
  }
}, []);

useEffect(() => {
  setGlobalDuration(duration); // ← optional guard if parent changes
}, [duration]);


  const handleAIButton = () => {
    onSelectTime([]);
    setSelectedTimeISO(null);

    const preferredStartHour = 8;
    const preferredEndHour = 20;
    const scoredTimes: { iso: string; score: number }[] = [];

    for (let block = 0; block < 96; block++) {
      const hour = Math.floor(block / 4);
      const minute = (block % 4) * 15;
      const utcDate = new Date(Date.UTC(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate(),
        hour,
        minute
      ));

      let awakeCount = 0;
      for (const tz of timeZones) {
        const localHour = parseInt(formatInTimeZone(utcDate, tz, 'H'), 10);
        if (localHour >= preferredStartHour && localHour < preferredEndHour) {
          awakeCount += 1;
        }
      }

      if (awakeCount === timeZones.length) {
        scoredTimes.push({ iso: utcDate.toISOString(), score: awakeCount });
      }      
    }
  
    const sorted = scoredTimes.sort((a, b) => b.score - a.score);
    const topTimes = sorted.slice(0, 3).map((t) => t.iso);

    setSuggestedTimes(topTimes);
    setJustSuggestedTimes(topTimes);
    setShowTimeline(true);

    setTimeout(() => {
      if (aiScrollRef.current) {
        aiScrollRef.current.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }, 100);
    

    setTimeout(() => setJustSuggestedTimes([]), 1500);

    if (sorted.length > 0) {
      const topSuggestion = sorted[0].iso;
      setTimeout(() => {
        const cell = document.querySelector(`[data-time='${topSuggestion}']`) as HTMLElement | null;
        if (cell) {
          cell.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }
      }, 100);
    }

    setTimeout(() => {
      scrollToAISuggestionsRef?.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  
  const isAISuggestion = (iso: string) => suggestedTimes.includes(iso);
  const durations = [
    { label: '15 min', value: 15 },
    { label: '25 min', value: 25 },
    { label: '30 min', value: 30 },
    { label: '45 min', value: 45 },
    { label: '1 hour', value: 60 },
    { label: '1.5 hours', value: 90 },
    { label: '2 hours', value: 120 },
  ]


  return (
    <div ref={scrollContainerRef} className="space-y-6 font-sans text-base md:text-xl overflow-y-auto">
      <div className="h-px w-full bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
      <h2 className="text-xl font-bold text-gray-700 mb-4">Pick a Date</h2>
    <div className="relative">


{/* ⬅️ Left Arrow */}
<div className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-30">
  <div className="bg-white rounded-full shadow-md p-1">
    <button
      className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 focus:outline-none"
      onMouseEnter={() => startAutoScroll(-1, dateRibbonRef)}
onMouseLeave={stopAutoScroll}
      onClick={() => containerRef.current?.scrollBy({ left: -300, behavior: 'smooth' })}
    >
      <ChevronDownIcon className="rotate-90 w-5 h-5 text-gray-600" />
    </button>
  </div>
</div>

{/* ➡️ Right Arrow */}
<div className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-30">
  <div className="bg-white rounded-full shadow-md p-1">
    <button
      className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 focus:outline-none pointer-events-auto"
      onMouseEnter={() => startAutoScroll(1, dateRibbonRef)}
      onMouseLeave={stopAutoScroll}      
      onClick={() => containerRef.current?.scrollBy({ left: 300, behavior: 'smooth' })}
    >
      <ChevronDownIcon className="-rotate-90 w-5 h-5 text-gray-600" />
    </button>
  </div>
</div>





  {/* Gradient Fades */}
  <div className="absolute left-0 top-0 h-full w-6 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
  <div className="absolute right-0 top-0 h-full w-6 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

  {/* Scrollable date ribbon */}
  <div
    className="flex gap-6 overflow-x-auto scrollbar-hide pb-7 px-12 mt-6"
    ref={dateRibbonRef}
  >
    {dateOptions.map((date) => (
      <button
        key={date.toISOString()}
        onClick={() => setSelectedDate(date)}
        className={`px-4 py-2 rounded-full text-base font-medium whitespace-nowrap transition ${
          isSameDay(date, selectedDate)
            ? 'bg-indigo-500 text-white'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:ring-1 hover:ring-indigo-300'
        }`}
      >
        {format(date, 'EEE dd MMM')}
      </button>
    ))}
  </div>
</div>


      <motion.button
        type="button"
        onClick={handleAIButton}
        className="w-full bg-gradient-to-r from-indigo-500 via-blue-500 to-teal-400 hover:from-indigo-600 hover:via-blue-600 hover:to-teal-500 text-white text-lg font-semibold py-4 rounded-full transition mt-4 shadow-lg"
      >
        Find The Best Time With AI ✨
      </motion.button>

      {showTimeline && (
        <>
          <div ref={scrollToAISuggestionsRef} className="scroll-mt-24">
            <AnimatePresence>
              {selectedTimes.length === 0 && (
                <motion.div
                  key="helper"
                  initial={{ opacity: 0, scaleY: 0.95 }}
                  animate={{ opacity: 1, scaleY: 1 }}
                  exit={{ opacity: 0, scaleY: 0.95 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="w-full flex justify-center items-center origin-top pt-2 pb-2"
                >
                  <p className="text-lg text-indigo-600 text-center font-semibold bg-indigo-50 border border-indigo-100 px-4 py-2 rounded-full shadow-md flex items-center gap-2 leading-normal">
                    Here's what AI found — Choose a time! ✨
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="relative mt-6 pl-12">  {/* 👈 add pl-12 */}
 


{/* ⬅️ Left Arrow */}
<div className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-30">
  <div className="bg-white rounded-full shadow-md p-1 ring-2 ring-white">
    <button
      className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 focus:outline-none"
      onClick={() => containerRef.current?.scrollBy({ left: -300, behavior: 'smooth' })}
      onMouseEnter={() => startAutoScroll(-1, containerRef)}
      onMouseLeave={stopAutoScroll}
      
    >
      <ChevronDownIcon className="rotate-90 w-5 h-5 text-gray-600" />
    </button>
  </div>
</div>

{/* ➡️ Right Arrow */}
<div className="hidden md:flex absolute right-0 top-0 h-full w-16 z-30 items-center justify-end pr-2 pointer-events-none">
  {/* Background mask to hide overlapping time cells */}
  <div className="absolute right-0 top-0 h-full w-full bg-white z-10" />

  {/* Styled arrow on top */}
  <div className="relative z-20 bg-white rounded-full shadow-md p-1 ring-2 ring-white pointer-events-auto">
    <button
      className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 focus:outline-none"
      onClick={() => containerRef.current?.scrollBy({ left: 300, behavior: 'smooth' })}
      onMouseEnter={() => startAutoScroll(1, containerRef)}
      onMouseLeave={stopAutoScroll}
      
    >
      <ChevronDownIcon className="-rotate-90 w-5 h-5 text-gray-600" />
    </button>
  </div>
</div>



  {/* Grid container with scroll */}
  <div className="overflow-x-auto pr-[72px]" ref={containerRef}>
    <div className="inline-block min-w-[1000px]">
      <table className="table-auto w-full text-base text-gray-700 border-collapse">
        <thead>
          <tr>
            <th colSpan={blocks.length + 1} className="text-center py-4 text-xl font-semibold text-gray-700 bg-white sticky top-0 z-10" />
          </tr>
        </thead>
       

   {/* Desktop layout */}
<div className="hidden md:block">
  <table className="table-auto w-full text-base text-gray-700 border-collapse">
    <tbody>
      {timeZones.map((tz) => (
        <tr key={tz}>
    <td className="sticky left-0 z-40 bg-white w-[140px] h-[60px] px-4 py-4 font-medium text-gray-600 border-r border-gray-200 whitespace-nowrap overflow-hidden">
  {tz}
</td>



          {blocks.map((i) => {
            const hour = Math.floor(i / 4);
            const minute = (i % 4) * 15;
            const utcDate = new Date(Date.UTC(
              selectedDate.getFullYear(),
              selectedDate.getMonth(),
              selectedDate.getDate(),
              hour,
              minute
            ));
            const isoTime = utcDate.toISOString();
            const timeString = formatInTimeZone(utcDate, tz, 'HH:mm');
            const isHovered = hoveredBlock === i;
            const isSelected = selectedTimes.some((t) => t.start === isoTime);
            const isSuggested = isAISuggestion(isoTime);

            return (
              <td
                key={`${tz}-${i}`}
                data-time={isoTime}
                className={`min-w-[56px] px-5 py-3 text-center border border-gray-100 cursor-pointer transition-colors duration-200
                  ${isHovered ? 'bg-indigo-50 hover:ring-2 ring-indigo-300' : ''}
                  ${isSuggested ? 'bg-gradient-to-br from-blue-100 to-indigo-100 font-medium' : ''}
                  ${isSelected ? 'bg-indigo-100 text-indigo-800 font-semibold ring-0 ring-indigo-400 shadow-sm' : ''}

                  hover:shadow-inner
                `}
                onClick={() => {
                  const exists = selectedTimes.find((t) => t.start === isoTime);
                  if (exists) {
                    onSelectTime(selectedTimes.filter((t) => t.start !== isoTime));
                  } else {
                    onSelectTime([...selectedTimes, { start: isoTime, duration: globalDuration }]);
                  }
                }}
                onMouseEnter={() => setHoveredBlock(i)}
                onMouseLeave={() => setHoveredBlock(null)}
              >
                {timeString}
              </td>
            );
          })}
        </tr>
      ))}
    </tbody>
  </table>
</div>



{/* Mobile layout */}
<div className="block md:hidden space-y-4 -mx-4">
  {timeZones.map((tz) => (
    <div key={tz} className="flex w-full relative items-start">
      
      {/* Flush Left-Aligned Label */}
      <div className="sticky left-0 z-10 bg-white w-[80px] px-2 py-2 flex flex-col justify-center text-xs font-semibold text-gray-800 shrink-0 leading-tight min-h-[50px]">
        {tz.includes('/') ? (
          <>
            <span>{tz.split('/')[0]}/</span>
            <span>{tz.split('/')[1]}</span>
          </>
        ) : (
          <span>{tz}</span>
        )}
      </div>

      {/* Scrollable Time Blocks (aligned middle) */}
      <div className="overflow-x-auto w-full">
        <div className="flex gap-2 py-2 items-center min-h-[50px]">
          {blocks.map((i) => {
            const hour = Math.floor(i / 4);
            const minute = (i % 4) * 15;
            const utcDate = new Date(Date.UTC(
              selectedDate.getFullYear(),
              selectedDate.getMonth(),
              selectedDate.getDate(),
              hour,
              minute
            ));
            const isoTime = utcDate.toISOString();
            const timeString = formatInTimeZone(utcDate, tz, 'HH:mm');
            const isHovered = hoveredBlock === i;
            const isSelected = selectedTimes.some((t) => t.start === isoTime);
            const isSuggested = isAISuggestion(isoTime);

            return (
              <div
                key={`${tz}-${i}`}
                ref={isoTime === suggestedTimes[0] ? aiScrollRef : null}
                data-time={isoTime}
                className={`min-w-[48px] px-2 py-1 text-center text-sm border border-gray-200 rounded-lg cursor-pointer
                  ${isHovered ? 'bg-indigo-50' : ''}
                  ${isSuggested ? 'bg-indigo-200 text-indigo-900 font-semibold ring-2 ring-indigo-400 shadow' : ''}
                  ${isSelected ? 'bg-indigo-100 text-indigo-800 font-semibold ring-2 ring-indigo-400 shadow-sm' : ''}
                `}
                onClick={() => {
                  const exists = selectedTimes.find((t) => t.start === isoTime);
                  if (exists) {
                    onSelectTime(selectedTimes.filter((t) => t.start !== isoTime));
                  } else {
                    onSelectTime([...selectedTimes, { start: isoTime, duration: globalDuration }]);
                  }
                }}
                onMouseEnter={() => setHoveredBlock(i)}
                onMouseLeave={() => setHoveredBlock(null)}
              >
                {timeString}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  ))}
</div>   
      </table>
    </div>
  </div>
</div>
</div>
  </>
)}
 

 {selectedTimes.length > 0 && (
  <>
    <div ref={scrollToConfirmationRef} className="mt-4 space-y-4 scroll-mt-24">
      {selectedTimes.map((slot) => {
        const { start } = slot;

        return (
          <div
            key={start}
            className="bg-gray-50 border border-gray-200 rounded-xl p-4 md:p-5 flex flex-col md:flex-row md:justify-between md:items-start gap-4 max-w-3xl mx-auto"
          >
            {/* Left: Meeting Info */}
            <div className="pt-2 space-y-2 text-gray-700 md:w-2/3">
              <h3 className="font-semibold text-base text-gray-800">📌 Your Great Meet Time:</h3>
              <ul className="space-y-1 text-base">
                {timeZones.map((tz) => {
                  const dateObj = new Date(start);
                  if (isNaN(dateObj.getTime())) return <li key={tz}>⚠️ Invalid date</li>;

                  const effectiveDuration = slot.duration || globalDuration || 30;
                  const end = new Date(dateObj.getTime() + effectiveDuration * 60 * 1000);
                  const sameDay =
                    formatInTimeZone(dateObj, tz, 'yyyy-MM-dd') ===
                    formatInTimeZone(end, tz, 'yyyy-MM-dd');
                  const datePrefix = formatInTimeZone(dateObj, tz, 'eee, MMM d');
                  const startStr = formatInTimeZone(dateObj, tz, 'HH:mm');
                  const endStr = formatInTimeZone(
                    end,
                    tz,
                    sameDay ? 'HH:mm' : 'eee, MMM d, HH:mm'
                  );

                  return (
                    <li key={tz}>
                      {tz}: {`${datePrefix}, ${startStr}–${endStr}`}
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Right: Controls */}
            <div className="flex flex-col items-center md:items-end gap-2 md:gap-3 md:mt-1 w-full md:w-[200px] flex-shrink-0">
              <div className="w-full flex flex-col items-center gap-2">
                <label className="text-sm font-bold text-gray-700 mb-1 block text-center md:text-right">
                  Meeting Length
                </label>

                <div className="relative w-full">
                  <Listbox
                    value={globalDuration}
                    onChange={(val) => {
                      setGlobalDuration(val);
                      setDuration(val);
                      localStorage.setItem('meetingDuration', val.toString());
                      const updated = selectedTimes.map((t) => ({ ...t, duration: val }));
                      onSelectTime(updated);
                    }}
                  >
                    <div className="relative w-full">
                      <Listbox.Button className="w-full px-4 py-2 rounded-full border border-indigo-300 text-base font-semibold text-indigo-600 shadow-sm bg-white text-center flex justify-center items-center relative">
                        <span className="text-center">
                          {durations.find((d) => d.value === globalDuration)?.label}
                        </span>
                        <ChevronDownIcon className="w-5 h-5 text-indigo-500 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
                      </Listbox.Button>

                      <Listbox.Options className="absolute bottom-full mb-2 w-full bg-white border border-indigo-200 rounded-xl shadow-md text-base max-h-60 overflow-auto focus:outline-none z-50">
                        {durations.map((option) => (
                          <Listbox.Option
                            key={option.value}
                            value={option.value}
                            className={({ active }) =>
                              `cursor-pointer px-4 py-2 ${
                                active
                                  ? 'bg-indigo-100 text-indigo-800'
                                  : 'text-gray-800'
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

              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setSelectedTimeISO(null);
                  onSelectTime(selectedTimes.filter((t) => t.start !== start));
                  setTimeout(() => {
                    scrollToAISuggestionsRef?.current?.scrollIntoView({
                      behavior: 'smooth',
                      block: 'start',
                    });
                  }, 300);
                }}
                className="w-full px-4 py-2 rounded-full border border-indigo-300 text-indigo-600 hover:text-white hover:bg-indigo-500 transition-all duration-200 font-semibold text-base shadow-sm text-center"
              >
                Delete Time
              </button>
            </div>
          </div>
        );
      })}
    </div>
  </>
)}


</div> 
);
}

