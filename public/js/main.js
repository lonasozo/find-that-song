// Global function to determine if page needs time range selector
function pageNeedsTimeRange(page) {
  // Make sure we handle both with and without trailing slashes
  const normalizedPage = page.replace(/\/$/, '');
  return ['top-tracks', 'top-artists', 'top-albums'].includes(normalizedPage);
}

// Global function to initialize time range selector visibility
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

// Function to initialize page-specific scripts
function initPageScripts() {
  console.log('Initializing page scripts');

  // Re-attach track interactions if available
  if (typeof attachTrackInteractions === 'function') {
    attachTrackInteractions();
  }
}

// Initialize everything on page load
document.addEventListener('DOMContentLoaded', function () {
  // First thing: ensure time range visibility is correct
  initTimeRangeVisibility();

  // Then initialize other page scripts
  initPageScripts();
});
