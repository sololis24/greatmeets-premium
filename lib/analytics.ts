// src/lib/analytics.ts

export const logEvent = async (eventName: string, payload: any = {}) => {
    console.log(`📊 Analytics event: ${eventName}`, payload);
  
    // Optional: Send to a real analytics service
    // await fetch('https://your-analytics-api.com/log', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ eventName, ...payload }),
    // });
  };
  