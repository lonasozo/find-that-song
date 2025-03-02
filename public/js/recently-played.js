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

  // Convert timestamp to relative time (e.g., "2 hours ago")
  function getRelativeTime(timestamp) {
    const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
    const now = new Date();
    const playedDate = new Date(timestamp);
    const diffInSeconds = Math.floor((playedDate - now) / 1000);

    if (Math.abs(diffInSeconds) < 60) {
      return rtf.format(diffInSeconds, 'second');
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (Math.abs(diffInMinutes) < 60) {
      return rtf.format(diffInMinutes, 'minute');
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (Math.abs(diffInHours) < 24) {
      return rtf.format(diffInHours, 'hour');
    }

    const diffInDays = Math.floor(diffInHours / 24);
    return rtf.format(diffInDays, 'day');
  }

  // Enhance the track items with additional information
  function enhanceTrackItems() {
    const trackItems = document.querySelectorAll('.track-item');

    trackItems.forEach(item => {
      const metaDiv = item.querySelector('.track-meta');
      if (!metaDiv) return;

      // Add track duration if available in the dataset
      const trackDuration = item.getAttribute('data-duration');
      if (trackDuration) {
        const durationSpan = document.createElement('span');
        durationSpan.className = 'track-duration';
        durationSpan.textContent = formatDuration(trackDuration);
        metaDiv.appendChild(durationSpan);
      }

      // Add explicit tag if track is explicit
      const isExplicit = item.getAttribute('data-explicit') === 'true';
      if (isExplicit) {
        // Create explicit tag with consistent styling
        const explicitTag = document.createElement('span');
        explicitTag.className = 'meta-tag explicit-tag';
        explicitTag.textContent = 'E';

        // Insert after track duration if it exists, or at the end of metaDiv
        if (metaDiv.querySelector('.track-duration')) {
          metaDiv.querySelector('.track-duration').after(explicitTag);
        } else {
          metaDiv.appendChild(explicitTag);
        }
      }

      // Add relative time to the played_at timestamp
      const playedAt = item.getAttribute('data-played-at');
      if (playedAt) {
        const timeSpan = item.querySelector('.track-played-at');
        if (timeSpan) {
          const relativeTime = document.createElement('span');
          relativeTime.className = 'relative-time';
          relativeTime.textContent = ' (' + getRelativeTime(playedAt) + ')';
          timeSpan.appendChild(relativeTime);
        }
      }
    });
  }

  // Call the enhancement function
  enhanceTrackItems();
});
