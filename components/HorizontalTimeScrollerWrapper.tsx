'use client';

import dynamic from 'next/dynamic';
import type { TimeSlot } from '@/types/index';
import { RefObject } from 'react';
import DesktopTimeScroller from './DesktopTimeScroller';

const MobileTimeScroller = dynamic(() => import('./MobileTimeScroller'), { ssr: false });

interface Props {
  timeZones: string[];
  aiSuggestions: string[];
  scrollToAISuggestionsRef: RefObject<HTMLDivElement>;
  scrollToConfirmationRef: RefObject<HTMLDivElement>;
  selectedTimes: TimeSlot[];
  onSelectTime: (times: TimeSlot[]) => void;
  duration: number;
  setDuration: (val: number) => void;
}

export default function HorizontalTimeScrollerWrapper(props: Props) {
  return (
    <>
      <div className="hidden md:block">
        <DesktopTimeScroller {...props} />
      </div>
      <div className="md:hidden">
        <MobileTimeScroller {...props} />
      </div>
    </>
  );
}
