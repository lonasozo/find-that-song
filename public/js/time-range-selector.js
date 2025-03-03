document.addEventListener('DOMContentLoaded', function () {
  initTimeRangeSelector();
});

function initTimeRangeSelector() {
  const timeRangeButtons = document.querySelectorAll('.time-range-btn');
  const timeRangeLoader = document.getElementById('time-range-loader');
  const contentContainer = document.getElementById('content-container');

  // Default to medium_term (Last 6 Months) on first load
  const setDefaultTimeRange = () => {
    // Get current URL parameters
    const url = new URL(window.location.href);
    const timeRange = url.searchParams.get('time_range');

    // If time_range is not in URL, select medium_term by default
    if (!timeRange) {
      const mediumTermButton = document.querySelector('.time-range-btn[data-range="medium_term"]');
      if (mediumTermButton && !mediumTermButton.classList.contains('active')) {
        // Update active class
        timeRangeButtons.forEach(btn => btn.classList.remove('active'));
        mediumTermButton.classList.add('active');

        // Trigger click on the medium term button
        mediumTermButton.click();
      }
    }
  };

  timeRangeButtons.forEach(button => {
    button.addEventListener('click', function () {
      // Skip if already active
      if (this.classList.contains('active')) return;

      // Update active button
      timeRangeButtons.forEach(btn => btn.classList.remove('active'));
      this.classList.add('active');

      // Get the time range
      const timeRange = this.getAttribute('data-range');

      // Clear content container and show loader
      contentContainer.innerHTML = '<div class="global-loader"><div class="loader"></div></div>';

      // Show time range loader
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

          // Update URL with new time_range parameter without reloading the page
          const newUrl = new URL(window.location.href);
          newUrl.searchParams.set('time_range', timeRange);
          history.pushState({}, '', newUrl);

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

  // Call the function to set default time range after a short delay
  setTimeout(setDefaultTimeRange, 100);
}

// Utility for formatting duration
function formatDuration(ms) {
  const minutes = Math.floor(ms / 60000);
  const seconds = ((ms % 60000) / 1000).toFixed(0);
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}
