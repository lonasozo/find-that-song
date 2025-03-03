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

// Initialize scripts on first page load
document.addEventListener('DOMContentLoaded', function () {
  if (typeof initPageScripts === 'function') {
    initPageScripts();
  }
});
