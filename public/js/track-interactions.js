document.addEventListener('DOMContentLoaded', function () {
  // Handle mobile interactions with tracks
  initializeTrackInteractions();

  // Re-initialize track interactions when content is loaded via AJAX
  document.addEventListener('content-loaded', initializeTrackInteractions);
});

function initializeTrackInteractions() {
  // For mobile devices only
  if (window.innerWidth <= 480) {
    const trackItems = document.querySelectorAll('.track-item');

    trackItems.forEach(item => {
      // Get Spotify URL from data attribute
      const spotifyUrl = item.getAttribute('data-spotify-url');
      const overlay = item.querySelector('.track-play-overlay');

      // Add touch/click event
      item.addEventListener('click', function (e) {
        // If the overlay is already active, open the link
        if (overlay.classList.contains('active')) {
          window.open(spotifyUrl, '_blank');
          setTimeout(() => {
            overlay.classList.remove('active');
          }, 500);
        } else {
          // Otherwise, show the overlay
          e.preventDefault();

          // First remove all other active overlays
          document.querySelectorAll('.track-play-overlay.active').forEach(el => {
            if (el !== overlay) el.classList.remove('active');
          });

          // Activate this overlay
          overlay.classList.add('active');

          // Auto-hide after 3 seconds
          setTimeout(() => {
            overlay.classList.remove('active');
          }, 3000);
        }
      });
    });
  }
}

// When AJAX content is loaded, dispatch a content-loaded event
function dispatchContentLoadedEvent() {
  document.dispatchEvent(new CustomEvent('content-loaded'));
}
