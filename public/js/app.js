// EventEmitter for app-wide events
window.appEvents = {
  callbacks: {},
  on: function (event, callback) {
    if (!this.callbacks[event]) this.callbacks[event] = [];
    this.callbacks[event].push(callback);
    return this;
  },
  emit: function (event, data) {
    const callbacks = this.callbacks[event];
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
    return this;
  }
};

// Global audio features handling functions - MUST be defined at the root level
window.toggleAudioFeature = function (checkbox, featureName) {
  const slider = document.getElementById(`target_${featureName}`);
  if (slider) {
    slider.disabled = !checkbox.checked;

    if (!checkbox.checked) {
      slider.removeAttribute('name');
    } else {
      slider.setAttribute('name', `target_${featureName}`);
    }
  }
};

window.updateAudioFeatureValue = function (slider, featureName, isPercentage) {
  const valueElement = document.getElementById(`${featureName}-value`);
  if (valueElement) {
    valueElement.textContent = isPercentage ? `${slider.value}%` : slider.value;
  }
};

window.randomizeAudioFeatures = function () {
  const features = [
    { name: 'energy', min: 0, max: 100, isPercentage: true },
    { name: 'popularity', min: 0, max: 100, isPercentage: true },
    { name: 'acousticness', min: 0, max: 100, isPercentage: true },
    { name: 'danceability', min: 0, max: 100, isPercentage: true },
    { name: 'instrumentalness', min: 0, max: 100, isPercentage: true },
    { name: 'liveness', min: 0, max: 100, isPercentage: true },
    { name: 'valence', min: 0, max: 100, isPercentage: true },
    { name: 'tempo', min: 60, max: 200, isPercentage: false }
  ];

  features.forEach(feature => {
    const checkbox = document.getElementById(`enable_${feature.name}`);
    const slider = document.getElementById(`target_${feature.name}`);

    if (checkbox && slider && checkbox.checked) {
      // Generate random value
      const min = parseInt(feature.min);
      const max = parseInt(feature.max);
      const randomValue = Math.floor(Math.random() * (max - min + 1)) + min;

      // Update slider and display
      slider.value = randomValue;
      window.updateAudioFeatureValue(slider, feature.name, feature.isPercentage);
    }
  });
};

document.addEventListener('DOMContentLoaded', function () {
  // Initialize AJAX navigation
  initAjaxNavigation();

  // Set active class for current page
  setActiveNavLink();

  // Debug current page info
  console.log("Current path:", window.location.pathname);
  console.log("Page title:", document.title);

  function initAjaxNavigation() {
    // Attach click handlers to navigation links
    document.querySelectorAll('.nav-link[data-ajax="true"]').forEach(link => {
      link.addEventListener('click', function (e) {
        e.preventDefault();

        const url = this.href;
        const ajaxUrl = url + (url.includes('?') ? '&' : '?') + 'ajax=true';

        // Only set the active class on the clicked link
        document.querySelectorAll('.nav-link').forEach(navLink => {
          navLink.classList.remove('active');
        });
        this.classList.add('active');

        // Update browser history
        history.pushState({ url: url, path: new URL(url).pathname }, '', url);

        // Load the content
        loadContent(ajaxUrl);
      });
    });

    // Handle browser back/forward navigation
    window.addEventListener('popstate', function (e) {
      if (e.state && e.state.url) {
        const ajaxUrl = e.state.url + (e.state.url.includes('?') ? '&' : '?') + 'ajax=true';
        loadContent(ajaxUrl);

        // Update active state based on the path in history state
        if (e.state.path) {
          updateActiveNavForPath(e.state.path);
        } else {
          setActiveNavLink();
        }
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
    // Get the current pathname without query parameters
    const currentPath = window.location.pathname;
    updateActiveNavForPath(currentPath);
  }

  function updateActiveNavForPath(path) {
    console.log("Updating active nav for path:", path);

    // Remove active class from all links first
    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.remove('active');
    });

    // Find and activate only the matching link
    let found = false;
    document.querySelectorAll('.nav-link').forEach(link => {
      const linkPath = new URL(link.href).pathname;

      if (linkPath === path) {
        link.classList.add('active');
        found = true;
      }
    });

    console.log("Active menu item found:", found ? "Yes" : "No");
  }

  function reinitializeContent() {
    // Reattach event listeners to any elements in the newly loaded content

    // Example: If you have pagination links in the content
    document.querySelectorAll('.pagination a[data-ajax="true"]').forEach(link => {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        const ajaxUrl = this.href + (this.href.includes('?') ? '&' : '?') + 'ajax=true';

        // Get path for active menu updating
        const path = new URL(this.href).pathname;

        history.pushState({ url: this.href, path: path }, '', this.href);
        loadContent(ajaxUrl);
        updateActiveNavForPath(path);
      });
    });

    // Add more reinitializations for other interactive elements as needed
  }

  // Set up AJAX navigation handler
  document.body.addEventListener('click', function (e) {
    // Find if we clicked on a navigation link with data-ajax="true"
    let target = e.target;
    while (target && target !== document) {
      if (target.tagName === 'A' &&
        target.getAttribute('data-ajax') === 'true' &&
        target.getAttribute('data-page')) {

        const pageName = target.getAttribute('data-page');
        console.log('AJAX navigation to page:', pageName);

        // After content is loaded via AJAX, notify listeners
        setTimeout(function () {
          window.appEvents.emit('pageLoaded', pageName);
        }, 100);

        break;
      }
      target = target.parentNode;
    }
  });
});
