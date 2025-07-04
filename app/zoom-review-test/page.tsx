'use client';

import { useRef } from 'react';
import MeetingLinkIntegration from '@/components/MeetingLinkIntegration';

export default function ZoomReviewTest() {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-semibold">Zoom Review Integration Test</h1>

      <MeetingLinkIntegration
        meetingLink=""
        setMeetingLink={() => {}}
        userToken="zoom-reviewer-test"
        scrollToMeetingLinkRef={scrollRef}
        setJustGeneratedMeetingLink={() => {}}
      />
    </div>
  );
}
