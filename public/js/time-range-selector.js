document.addEventListener('DOMContentLoaded', function () {
  // Reset to Recent every time
  function setTimeRangeToRecent() {
    document.querySelectorAll('.time-range-btn').forEach(btn => {
      btn.classList.remove('active');
      if (btn.getAttribute('data-range') === 'short_term') {
        btn.classList.add('active');
      }
    });
  }

  // Initial setup for time range selector
  if (window.initializeTimeRangeSelector) {
    window.initializeTimeRangeSelector();
    setTimeRangeToRecent();
  }

  // Listen for page navigation events
  if (window.appEvents) {
    window.appEvents.on('pageLoaded', function (pageName) {
      if (['top-artists', 'top-tracks', 'top-albums'].includes(pageName)) {
        console.log('Time range page loaded');
        window.initializeTimeRangeSelector();
        setTimeRangeToRecent();
      }
    });
  }

  // Handle browser navigation events
  window.addEventListener('popstate', function (e) {
    const path = window.location.pathname;
    if (path.includes('top-artists') || path.includes('top-tracks') || path.includes('top-albums')) {
      setTimeout(function () {
        window.initializeTimeRangeSelector();
      }, 100);
    }
  });
});

// Remove or comment out the old initTimeRangeSelector function since we're using the global one now
// function initTimeRangeSelector() { ... }

// Add a more robust content extractor helper
window.extractContentFromAjaxResponse = function (html, pageType) {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Get the original page structure
    const originalContainer = document.getElementById('content-container');
    const originalContent = originalContainer ? originalContainer.innerHTML : '';

    // Try to preserve structure based on page type
    switch (pageType) {
      case 'artists':
        // Find key elements and containers
        const artistsContainer = doc.querySelector('.artists-container, .artist-grid, .artist-list');
        const artistItems = doc.querySelectorAll('.artist-card, .artist-item');

        // Recreate the content with original structure if possible
        if (artistItems.length > 0) {
          // Get existing container structure
          const existingContainer = document.querySelector('.artists-container, .artist-grid, .artist-list');
          if (existingContainer) {
            // Create a copy of the container to preserve its structure
            const containerClone = existingContainer.cloneNode(false); ible
            containerClone.innerHTML = ''; // Clear the content0) {
            ture
            // Add all new artist items to the containert');
            artistItems.forEach(item => {r) {
              containerClone.appendChild(item.cloneNode(true)); ture
            });se);
            tent
            return containerClone.outerHTML;
          } else if (artistsContainer) {
            iner
            // If we don't have an existing container but found one in the response=> {
            return artistsContainer.outerHTML;e));
          }
        });
    }
    break; TML;
r) {
      case 'albums': onse
      // Find key elements and containersTML;
      const albumsContainer = doc.querySelector('.albums-container, .album-grid, .album-list');
    }
    const albumItems = doc.querySelectorAll('.album-card, .album-item');
  }
eak;
  // Recreate the content with original structure if possible
  if (albumItems.length > 0) {
    // Get existing container structure
    const existingContainer = document.querySelector('.albums-container, .album-grid, .album-list');
    if (existingContainer) {
      // Create a copy of the container to preserve its structure
      const containerClone = existingContainer.cloneNode(false);
      containerClone.innerHTML = ''; // Clear the content

      // Add all new album items to the container
      albumItems.forEach(item => {
        containerClone.appendChild(item.cloneNode(true));
      });

      return containerClone.outerHTML;
    } else if (albumsContainer) {
      // If we don't have an existing container but found one in the response
      return albumsContainer.outerHTML;
    }
  }
  break;

      case 'tracks':
  // Tracks already work fine, but we might need to extract the right container
  const tracksContainer = doc.querySelector('.tracks-container, .track-list');
  if (tracksContainer) {
    return tracksContainer.outerHTML;
  }
  break;
}

// Default extraction if specific handling doesn't work
const mainContent =
  doc.querySelector('#main-content') ||
  doc.querySelector('.content-section') ||
  doc.querySelector('.items-container') ||
  doc.querySelector('.tracks-container') ||
  doc.querySelector('.artists-container') ||
  doc.querySelector('.albums-container');

if (mainContent) {
  return mainContent.innerHTML;
} else {
  return html; // Return the whole response as a fallback
}
  } catch (e) {
  console.error("Error extracting content:", e);
  return html; // Fallback to original HTML
}
};

// Add a CSS injection mechanism to ensure styles are consistent
window.ensureTimeRangeStyles = function () {
  // Check if we're on a time range page
  const path = window.location.pathname;

  if (path.includes('top-artists')) {
    // Make sure artist containers have the right classes
    document.querySelectorAll('.artists-container, .artist-grid, .artist-list').forEach(container => {
      container.classList.add('artists-container');
      container.classList.add('grid-layout');
    });

    // Make sure all artist items have consistent styling
    document.querySelectorAll('.artist-card, .artist-item').forEach(item => {
      item.classList.add('artist-card');
    });
  }
  else if (path.includes('top-albums')) {
    // Make sure album containers have the right classes
    document.querySelectorAll('.albums-container, .album-grid, .album-list').forEach(container => {
      container.classList.add('albums-container');
      container.classList.add('grid-layout');
    });

    // Make sure all album items have consistent styling
    document.querySelectorAll('.album-card, .album-item').forEach(item => {
      item.classList.add('album-card');
    });
  }
};

// Initialize this when the page loads and after time range changes
document.addEventListener('DOMContentLoaded', function () {
  window.ensureTimeRangeStyles();

  // Listen for time range changes
  if (window.appEvents) {
    window.appEvents.on('timeRangeChanged', function () {
      // Apply consistent styling after time range changes
      setTimeout(window.ensureTimeRangeStyles, 100);
    });
  }
});

// Utility for formatting duration
function formatDuration(ms) {
  const minutes = Math.floor(ms / 60000);
  const seconds = ((ms % 60000) / 1000).toFixed(0);
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}
