document.addEventListener('DOMContentLoaded', function () {
  // Initialize AJAX navigation
  initAjaxNavigation();

  // Set active class for current page
  setActiveNavLink();

  function initAjaxNavigation() {
    // Attach click handlers to navigation links
    document.querySelectorAll('.nav-link[data-ajax="true"]').forEach(link => {
      link.addEventListener('click', function (e) {
        e.preventDefault();

        const url = this.href;
        const ajaxUrl = url + (url.includes('?') ? '&' : '?') + 'ajax=true';

        // Update active nav link
        document.querySelectorAll('.nav-link').forEach(el => el.classList.remove('active'));
        this.classList.add('active');

        // Update browser history
        history.pushState({ url: url }, '', url);

        // Load the content
        loadContent(ajaxUrl);
      });
    });

    // Handle browser back/forward navigation
    window.addEventListener('popstate', function (e) {
      if (e.state && e.state.url) {
        const ajaxUrl = e.state.url + (e.state.url.includes('?') ? '&' : '?') + 'ajax=true';
        loadContent(ajaxUrl);
        setActiveNavLink();
      }
    });
  }

  function loadContent(url) {
    // Show loading indicator
    document.getElementById('content-container').innerHTML = '<div class="loading">Loading...</div>';

    // Fetch content
    fetch(url)
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.text();
      })
      .then(html => {
        // Replace content
        document.getElementById('content-container').innerHTML = html;

        // Re-initialize any dynamic elements in the new content
        reinitializeContent();
      })
      .catch(error => {
        document.getElementById('content-container').innerHTML =
          `<div class="error">Error loading content: ${error.message}</div>`;
      });
  }

  function setActiveNavLink() {
    const currentPath = window.location.pathname;
    document.querySelectorAll('.nav-link').forEach(link => {
      const linkPath = new URL(link.href).pathname;
      if (linkPath === currentPath) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  function reinitializeContent() {
    // Reattach event listeners to any elements in the newly loaded content

    // Example: If you have pagination links in the content
    document.querySelectorAll('.pagination a[data-ajax="true"]').forEach(link => {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        const ajaxUrl = this.href + (this.href.includes('?') ? '&' : '?') + 'ajax=true';
        history.pushState({ url: this.href }, '', this.href);
        loadContent(ajaxUrl);
      });
    });

    // Add more reinitializations for other interactive elements as needed
  }
});
