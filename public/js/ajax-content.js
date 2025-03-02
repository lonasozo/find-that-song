document.addEventListener('DOMContentLoaded', function () {
  // Initialize time range selectors
  initializeTimeRangeSelectors();
});

function initializeTimeRangeSelectors() {
  // Find all time range selector elements
  const timeRangeSelectors = document.querySelectorAll('.time-range-selector');

  // Add change event listeners to each selector
  timeRangeSelectors.forEach(selector => {
    selector.addEventListener('change', function (event) {
      const timeRange = event.target.value;
      const contentType = event.target.getAttribute('data-content-type');
      const accessToken = event.target.getAttribute('data-access-token');

      // Load the new content based on time range
      loadContentByTimeRange(contentType, timeRange, accessToken);
    });
  });
}

function loadContentByTimeRange(contentType, timeRange, accessToken) {
  // Show loading indicator
  const contentContainer = document.getElementById(`${contentType}-content`);
  if (contentContainer) {
    contentContainer.innerHTML = '<div class="loading-spinner">Loading...</div>';
  }

  // Create URL for the AJAX request
  let url = `/${contentType}?time_range=${timeRange}&access_token=${accessToken}&ajax=true`;

  // Fetch new content
  fetch(url)
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.text();
    })
    .then(html => {
      // Update the page content with the new data
      if (contentContainer) {
        contentContainer.innerHTML = html;
      }

      // Update active state in time range buttons if they exist
      updateActiveTimeRange(contentType, timeRange);

      // Update URL without reload to reflect the current state
      updateUrlWithoutReload(contentType, timeRange, accessToken);
    })
    .catch(error => {
      console.error('Error loading content:', error);
      if (contentContainer) {
        contentContainer.innerHTML = '<div class="error-message">Error loading content. Please try again.</div>';
      }
    });
}

function updateActiveTimeRange(contentType, timeRange) {
  // Update active state for button-style time range selectors
  const timeRangeButtons = document.querySelectorAll(`.time-range-button[data-content-type="${contentType}"]`);
  timeRangeButtons.forEach(button => {
    if (button.getAttribute('data-time-range') === timeRange) {
      button.classList.add('active');
    } else {
      button.classList.remove('active');
    }
  });

  // Update dropdown selection if it exists
  const timeRangeDropdown = document.querySelector(`.time-range-selector[data-content-type="${contentType}"]`);
  if (timeRangeDropdown) {
    timeRangeDropdown.value = timeRange;
  }
}

function updateUrlWithoutReload(contentType, timeRange, accessToken) {
  // Update URL without page reload to maintain state in browser history
  const url = new URL(window.location);
  url.searchParams.set('time_range', timeRange);
  window.history.pushState({}, '', url);
}

// Additional function to handle button-style time range selectors
document.addEventListener('click', function (event) {
  if (event.target.classList.contains('time-range-button')) {
    const timeRange = event.target.getAttribute('data-time-range');
    const contentType = event.target.getAttribute('data-content-type');
    const accessToken = event.target.getAttribute('data-access-token');

    // Remove active class from all buttons in the group
    const buttons = document.querySelectorAll(`.time-range-button[data-content-type="${contentType}"]`);
    buttons.forEach(button => button.classList.remove('active'));

    // Add active class to clicked button
    event.target.classList.add('active');

    // Load new content
    loadContentByTimeRange(contentType, timeRange, accessToken);
  }
});
