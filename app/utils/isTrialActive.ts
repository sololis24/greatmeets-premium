// utils/isTrialActive.ts

export function isTrialActive(): boolean {
    if (typeof window === 'undefined') return false;
  
    // Check if user is already Pro
    const isPro = localStorage.getItem('isPro') === 'true';
    if (isPro) return true;
  
    // Check if trial has started
    const startedAt = localStorage.getItem('trialStartedAt');
    if (!startedAt) return false;
  
    try {
      const trialStart = new Date(startedAt);
      const now = new Date();
      const diffInMs = now.getTime() - trialStart.getTime();
      const diffInDays = diffInMs / (1000 * 60 * 60 * 24);
  
      return diffInDays < 7;
    } catch (err) {
      console.error('Failed to parse trialStartedAt', err);
      return false;
    }
  }
  