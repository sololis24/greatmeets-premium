export interface PollData {
    title: string;
    selectedTimes: string[];
    votes?: Vote[];
    invitees?: Invitee[];
    cancellations?: Cancellation[];
    organizerEmail?: string;
    organizerName?: string;
    finalized?: boolean;
    deadline?: string;
    updatedByEmail?: string;
    finalizedSlot?: string;
    lastFinalizationEmailSentForSlot?: string;
  }
  
  
  
  export interface Vote {
    userToken: string;
    selectedSlots: string[];
    name?: string;
    email?: string;
  }
  
  export interface Invitee {
    email: string;
    firstName?: string;
    lastName?: string;
    name?: string;
    timezone?: string;
  }
  
  export interface Cancellation {
    email?: string;
    name?: string;
  }
  