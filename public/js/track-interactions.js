/**
 * Inizializza gli event handler per le tracce
 */
function initializeTrackEventHandlers() {
  // Mobile device handling
  if (window.innerWidth <= 480) {
    const trackItems = document.querySelectorAll('.track-item');

    trackItems.forEach(item => {
      // Get the Spotify URL and the overlay - now inside anchor tag
      const spotifyUrl = item.getAttribute('data-spotify-url');
      const coverLink = item.querySelector('.cover-link');
      const overlay = coverLink.querySelector('.track-play-overlay');

      // Mobile tap handler for non-link areas of the track item
      item.addEventListener('click', function (e) {
        // Skip if clicking on any link or its children
        if (e.target.tagName === 'A' || e.target.closest('a')) {
          return;
        }

        // Show overlay when tapping anywhere on the track
        e.preventDefault();

        // Remove other active overlays
        document.querySelectorAll('.track-play-overlay.active').forEach(el => {
          if (el !== overlay) el.classList.remove('active');
        });

        // Toggle this overlay
        overlay.classList.toggle('active');

        // Auto-hide after timeout
        setTimeout(() => {
          overlay.classList.remove('active');
        }, 3000);
      });
    });
  } else {
    // For desktop: ensure hovering works properly
    const coverLinks = document.querySelectorAll('.cover-link');
    coverLinks.forEach(link => {
      const overlay = link.querySelector('.track-play-overlay');

      // Show overlay on hover for desktop
      link.addEventListener('mouseenter', () => {
        overlay.style.opacity = '1';
      });

      link.addEventListener('mouseleave', () => {
        overlay.style.opacity = '0';
      });
    });
  }
}

// Inizializza gli event handlers quando il DOM è caricato
document.addEventListener('DOMContentLoaded', function () {
  initializeTrackEventHandlers();
});

// When AJAX content is loaded, dispatch a content-loaded event
function dispatchContentLoadedEvent() {
  document.dispatchEvent(new CustomEvent('content-loaded'));
}
