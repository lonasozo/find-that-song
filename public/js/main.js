// This function will be called when page content is loaded via AJAX
function initPageScripts() {
  // Re-initialize any event listeners or UI components for the newly loaded content

  // Re-attach event listeners to elements that were loaded via AJAX
  const trackElements = document.querySelectorAll('.track-item');
  if (trackElements.length > 0 && typeof attachTrackInteractions === 'function') {
    attachTrackInteractions();
  }

  // Initialize any other page-specific functionality
  // ...
}

// Initialize scripts on page load
document.addEventListener('DOMContentLoaded', function () {
  // Function to initialize page-specific scripts
  function initPageScripts() {
    console.log('Initializing page scripts');

    // Re-attach track interactions if available
    if (typeof attachTrackInteractions === 'function') {
      attachTrackInteractions();
    }

    // Initialize time range visibility
    initTimeRangeVisibility();
  }

  // Function to determine if the current page should show time range
  function pageNeedsTimeRange(pageName) {
    return ['top-tracks', 'top-artists', 'top-albums'].includes(pageName);
  }

  // Function to initialize time range selector visibility
  function initTimeRangeVisibility() {
    const currentPath = window.location.pathname.substring(1).split('?')[0];
    const timeRangeSelector = document.getElementById('time-range-selector');

    if (timeRangeSelector) {
      if (pageNeedsTimeRange(currentPath)) {
        console.log('Page needs time range:', currentPath);
        timeRangeSelector.style.display = 'flex';
        timeRangeSelector.style.visibility = 'visible';
      } else {
        console.log('Page does not need time range:', currentPath);
        timeRangeSelector.style.display = 'none';
      }
    }
  }

  // Initialize on first page load
  initPageScripts();

  // Make functions available globally
  window.initPageScripts = initPageScripts;
  window.initTimeRangeVisibility = initTimeRangeVisibility;
});
