document.addEventListener('DOMContentLoaded', function () {
  // Select all sidebar links with data-ajax attribute
  const sidebarLinks = document.querySelectorAll('.sidebar-nav .nav-link[data-ajax="true"]');

  // Add click event listener to each sidebar link
  sidebarLinks.forEach(link => {
    link.addEventListener('click', function (e) {
      e.preventDefault();

      // Get the href and page identifier
      const url = this.getAttribute('href');
      const page = this.getAttribute('data-page');

      // Update URL without page reload
      history.pushState({ page: page }, '', url);

      // Update active class in sidebar
      updateActiveSidebarLink(page);

      // Load content via AJAX
      loadPageContent(url);
    });
  });

  // Handle browser back/forward navigation
  window.addEventListener('popstate', function (event) {
    if (event.state && event.state.page) {
      updateActiveSidebarLink(event.state.page);
      loadPageContent(window.location.href);
    }
  });

  // Function to update active sidebar link
  function updateActiveSidebarLink(page) {
    // Remove active class from all links
    sidebarLinks.forEach(link => {
      link.classList.remove('active');
    });

    // Add active class to the current page link
    const currentLink = document.querySelector(`.nav-link[data-page="${page}"]`);
    if (currentLink) {
      currentLink.classList.add('active');
    }
  }

  // Function to load page content via AJAX
  function loadPageContent(url) {
    // Show loading state
    const contentContainer = document.getElementById('content-container');
    contentContainer.innerHTML = '<div class="loader centered"></div>';

    // Make AJAX request
    fetch(url)
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.text();
      })
      .then(html => {
        // Parse the HTML to extract just the main content
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const mainContent = doc.querySelector('main#content-container').innerHTML;

        // Update the page content
        contentContainer.innerHTML = mainContent;

        // Handle time range selector if it exists on the new page
        if (url.includes('top-tracks') || url.includes('top-artists') || url.includes('top-albums')) {
          // Show time range selector
          const timeRangeSelector = document.getElementById('time-range-selector');
          if (timeRangeSelector) {
            timeRangeSelector.style.display = 'flex';

            // Re-initialize time range selector functionality
            if (typeof initTimeRangeSelector === 'function') {
              initTimeRangeSelector();
            }
          }
        } else {
          // Hide time range selector for other pages
          const timeRangeSelector = document.getElementById('time-range-selector');
          if (timeRangeSelector) {
            timeRangeSelector.style.display = 'none';
          }
        }

        // Re-initialize any page-specific scripts
        if (typeof initPageScripts === 'function') {
          initPageScripts();
        }
      })
      .catch(error => {
        console.error('Error loading page content:', error);
        contentContainer.innerHTML = '<div class="error-message">Failed to load content. Please try again.</div>';
      });
  }
});
