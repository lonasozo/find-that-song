document.addEventListener('DOMContentLoaded', function () {
  initTimeRangeSelector();
});

function initTimeRangeSelector() {
  const timeRangeButtons = document.querySelectorAll('.time-range-btn');
  const timeRangeLoader = document.getElementById('time-range-loader');
  const contentContainer = document.getElementById('content-container');

  timeRangeButtons.forEach(button => {
    button.addEventListener('click', function () {
      // Skip if already active
      if (this.classList.contains('active')) return;

      // Update active button
      timeRangeButtons.forEach(btn => btn.classList.remove('active'));
      this.classList.add('active');

      // Get the time range
      const timeRange = this.getAttribute('data-range');

      // Show loader
      if (timeRangeLoader) timeRangeLoader.style.display = 'flex';

      // Get the current page and access token from URL
      const url = new URL(window.location.href);
      const accessToken = url.searchParams.get('access_token');
      const currentPage = url.pathname.substring(1); // Remove leading slash

      // Construct the API endpoint
      const apiUrl = `/${currentPage}?time_range=${timeRange}&access_token=${accessToken}`;

      // Fetch the HTML content for the selected time range
      fetch(apiUrl)
        .then(response => {
          if (!response.ok) {
            throw new Error('Network response was not ok');
          }
          return response.text(); // Get HTML as text instead of JSON
        })
        .then(html => {
          // Hide loader
          if (timeRangeLoader) timeRangeLoader.style.display = 'none';

          // Parse the HTML to extract just the main content
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, 'text/html');
          const mainContent = doc.querySelector('#content-container').innerHTML;

          // Update the content with the extracted HTML
          contentContainer.innerHTML = mainContent;

          // Re-initialize any event listeners on the new content
          if (typeof initPageScripts === 'function') {
            initPageScripts();
          }
        })
        .catch(error => {
          console.error('Error fetching time range data:', error);
          if (timeRangeLoader) timeRangeLoader.style.display = 'none';
          contentContainer.innerHTML = '<div class="error-message">Failed to load content. Please try again.</div>';
        });
    });
  });
}

// Utility for formatting duration
function formatDuration(ms) {
  const minutes = Math.floor(ms / 60000);
  const seconds = ((ms % 60000) / 1000).toFixed(0);
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}
