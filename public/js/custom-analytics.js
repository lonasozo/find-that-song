/**
 * Custom analytics tracking using Vercel Analytics
 */
(function () {
  // Check if Vercel Analytics is available
  const isAnalyticsAvailable = () => {
    return typeof window !== 'undefined' && window.va;
  };

  // Track a custom event
  const trackEvent = (eventName, eventData = {}) => {
    if (isAnalyticsAvailable()) {
      window.va('event', {
        name: eventName,
        data: eventData
      });
      console.log('📊 Tracked event:', eventName, eventData);
    } else {
      console.warn('Vercel Analytics not available');
    }
  };

  // Track page navigation
  const trackPageView = (pageName, url = window.location.pathname) => {
    trackEvent('page_view', { page: pageName, url: url });
  };

  // Track user interactions
  const trackInteraction = (elementType, actionType, content = '') => {
    trackEvent('user_interaction', {
      element: elementType,
      action: actionType,
      content: content
    });
  };

  // Attach click handlers to track navigation
  const attachNavigationTracking = () => {
    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', (e) => {
        const pageName = link.getAttribute('data-page') || link.textContent.trim();
        trackEvent('navigation', {
          to: pageName,
          from: document.title
        });
      });
    });
  };

  // Initialize analytics tracking
  const init = () => {
    if (document.readyState === 'complete') {
      attachNavigationTracking();
    } else {
      window.addEventListener('load', attachNavigationTracking);
    }
  };

  // Expose to global scope
  window.customAnalytics = {
    trackEvent,
    trackPageView,
    trackInteraction,
    init
  };

  // Auto-initialize
  init();
})();
