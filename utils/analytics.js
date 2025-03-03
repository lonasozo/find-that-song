import { track } from '@vercel/analytics';

// Function to track custom events
export const trackEvent = (event, data = {}) => {
  track(event, data);
};
