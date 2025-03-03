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
    // Get the content container
    const contentContainer = document.getElementById('content-container');

    // Extract page name from URL
    const urlObj = new URL(url, window.location.origin);
    const pagePath = urlObj.pathname.substring(1); // Remove leading slash
    const pageName = pagePath.split('?')[0]; // Remove query parameters

    console.log(`Loading content for page: ${pageName}`);

    // Clear content and show loader
    contentContainer.innerHTML = '<div class="global-loader"><div class="loader"></div></div>';

    // Handle time range selector visibility using the global function
    const timeRangeSelector = document.getElementById('time-range-selector');
    const timeRangeLoader = document.getElementById('time-range-loader');

    if (timeRangeSelector) {
      // Use the global function to check if page needs time range
      if (window.pageNeedsTimeRange && window.pageNeedsTimeRange(pageName)) {
        console.log(`Showing time range for ${pageName}`);
        timeRangeSelector.style.display = 'flex';
        timeRangeSelector.style.visibility = 'visible';
      } else {
        console.log(`Hiding time range for ${pageName}`);
        timeRangeSelector.style.display = 'none';
      }
    }

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

        // Re-handle time range selector if needed using the global function
        if (window.pageNeedsTimeRange && window.pageNeedsTimeRange(pageName)) {
          // Ensure time range selector is visible
          if (timeRangeSelector) {
            timeRangeSelector.style.display = 'flex';
            timeRangeSelector.style.visibility = 'visible';

            // Re-initialize time range selector functionality
            if (typeof initTimeRangeSelector === 'function') {
              setTimeout(initTimeRangeSelector, 100);
            }
          }

          // Make sure loader is hidden
          if (timeRangeLoader) {
            timeRangeLoader.style.display = 'none';
          }
        }

        // Re-initialize any page-specific scripts
        if (typeof initPageScripts === 'function') {
          setTimeout(initPageScripts, 100);
        }
      })
      .catch(error => {
        console.error('Error loading page content:', error);
        contentContainer.innerHTML = '<div class="error-message">Failed to load content. Please try again.</div>';
      });
  }
});
