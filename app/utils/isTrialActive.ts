// utils/isTrialActive.ts

/**
 * Checks if the user is still in their 7-day trial period.
 * Returns true if Pro or trial is active.
 */
export function isTrialActive(): boolean {
  if (typeof window === 'undefined') return false;

  const isPro = localStorage.getItem('isPro') === 'true';
  if (isPro) return true;

  const startedAt = localStorage.getItem('trialStartedAt');
  if (!startedAt) return false;

  try {
    const trialStart = new Date(startedAt);
    const now = new Date();
    const diffInMs = now.getTime() - trialStart.getTime();
    const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

    return diffInDays < 7;
  } catch (err) {
    console.error('❌ Failed to parse trialStartedAt:', err);
    return false;
  }
}

/**
 * Returns the number of days left in the trial (0–7), or null if not in trial.
 * Returns null if no trial found or already Pro.
 */
export function getTrialDaysRemaining(): number | null {
  if (typeof window === 'undefined') return null;

  const isPro = localStorage.getItem('isPro') === 'true';
  if (isPro) return null;

  const startedAt = localStorage.getItem('trialStartedAt');
  if (!startedAt) return null;

  try {
    const trialStart = new Date(startedAt);
    const now = new Date();
    const diffInMs = now.getTime() - trialStart.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    return Math.max(0, 7 - diffInDays);
  } catch (err) {
    console.error('❌ Failed to calculate trial days remaining:', err);
    return null;
  }
}
