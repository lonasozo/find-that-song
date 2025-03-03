document.addEventListener('DOMContentLoaded', function () {
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

  // Format track duration from milliseconds to MM:SS
  function formatDuration(ms) {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return minutes + ':' + (seconds < 10 ? '0' : '') + seconds;
  }
});
