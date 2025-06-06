import type { TimeSlot } from '@/types';


export interface PollData {
    title: string;
    selectedTimes: TimeSlot[];
    votes?: Vote[];
    invitees?: Invitee[];
    cancellations?: Cancellation[];
    organizerEmail?: string;
    organizerName?: string;
    organizerTimezone?: string; // ✅ Add this line
    finalized?: boolean;
    deadline?: string;
    updatedByEmail?: string;
    finalizedSlot?: string;
    lastFinalizationEmailSentForSlot?: string;
    multiSlotConfirmation?: boolean; 
  }
  
  export interface Vote {
    userToken: string;
    selectedSlots: string[];
    name?: string;
    email?: string;
    updatedByEmail?: string; // ✅ Add this line
  }
  
  
  export interface Invitee {
    email: string;
    firstName?: string;
    lastName?: string;
    name?: string;
    timezone?: string;
    token?: string; // ✅ Add this line
  }
  
  export interface Cancellation {
    email?: string;
    name?: string;
  }
  