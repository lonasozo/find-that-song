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

// Global time range selector initialization function
window.initializeTimeRangeSelector = function () {
  const timeRangeSelector = document.getElementById('time-range-selector');
  const contentContainer = document.getElementById('content-container');

  // Make sure it's visible for the right pages
  if (timeRangeSelector) {
    const currentPath = window.location.pathname;
    if (currentPath.includes('top-artists') ||
      currentPath.includes('top-tracks') ||
      currentPath.includes('top-albums')) {
      timeRangeSelector.style.display = 'flex';
      timeRangeSelector.style.visibility = 'visible';

      // Always set the "Recent" option as active regardless of URL parameters
      document.querySelectorAll('.time-range-btn').forEach(btn => {
        btn.classList.remove('active');

        // Short term (Recent) should always be the default
        if (btn.getAttribute('data-range') === 'short_term') {
          btn.classList.add('active');
        }
      });

      // Update URL to reflect short_term as well
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.set('time_range', 'short_term');
      history.replaceState({ url: currentUrl.toString(), path: currentUrl.pathname }, '', currentUrl.toString());
    }

    // Attach click handlers to time range buttons
    document.querySelectorAll('.time-range-btn').forEach(btn => {
      // Remove existing event listeners by cloning
      const newBtn = btn.cloneNode(true);
      btn.parentNode.replaceChild(newBtn, btn);

      // Add fresh click handler
      newBtn.addEventListener('click', function () {
        // Skip if already active
        if (this.classList.contains('active')) return;

        // Save current HTML to capture the original styling
        const originalHTML = contentContainer.innerHTML;

        // Show loading spinner
        contentContainer.innerHTML = '<div class="loading"><div class="spinner"></div><p>Loading content...</p></div>';

        // Remove active class from all buttons
        document.querySelectorAll('.time-range-btn').forEach(b => {
          b.classList.remove('active');
        });

        // Add active class to clicked button
        this.classList.add('active');

        // Get the time range from the data attribute
        const range = this.getAttribute('data-range');

        // Build new URL and update history
        const currentUrl = new URL(window.location.href);
        currentUrl.searchParams.set('time_range', range);
        const newUrl = currentUrl.toString();

        history.pushState({ url: newUrl, path: currentUrl.pathname }, '', newUrl);

        // Fetch content using AJAX
        const ajaxUrl = newUrl + (newUrl.includes('?') ? '&' : '?') + 'ajax=true';

        fetch(ajaxUrl)
          .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.text();
          })
          .then(html => {
            try {
              // Simply replace the entire content with the server response
              // This ensures we get the EXACT styling from the server
              contentContainer.innerHTML = html;

              // Emit event for other components
              window.appEvents.emit('timeRangeChanged', range);
              console.log('Time range updated to:', range);
            } catch (e) {
              console.error('Error updating time range content:', e);
              // Restore original content if there's an error
              contentContainer.innerHTML = originalHTML;
            }
          })
          .catch(error => {
            console.error('Network error loading time range content:', error);
            // Restore original content on network error
            contentContainer.innerHTML = originalHTML;
          });
      });
    });

    console.log('Time range selector initialized - defaulted to Recent');
  }
};

// Helper function to replace items while preserving the original styling
function replaceItemsPreservingStyle(doc, contentContainer, originalContainer, pageType) {
  try {
    // Keep a complete copy of the original HTML structure
    const originalHTML = originalContainer.innerHTML;

    // Find the container in the original content
    let containerSelector = '';
    let itemsSelector = '';

    switch (pageType) {
      case 'artists':
        containerSelector = '.artists-container, .artist-grid, .artist-list';
        itemsSelector = '.artist-card, .artist-item';
        break;
      case 'albums':
        containerSelector = '.albums-container, .album-grid, .album-list';
        itemsSelector = '.album-card, .album-item';
        break;
      case 'tracks':
        containerSelector = '.tracks-container, .track-list';
        itemsSelector = '.track-item, .track-row';
        break;
    }

    // First, restore the original HTML structure exactly as it was
    contentContainer.innerHTML = originalHTML;

    // Now find the relevant containers in both original content and the new content
    const originalContentContainer = contentContainer.querySelector(containerSelector);
    const responseContainer = doc.querySelector(containerSelector);

    if (originalContentContainer && responseContainer) {
      // Get all new items from the response
      const newItems = responseContainer.querySelectorAll(itemsSelector);

      if (newItems.length > 0) {
        // Clear the original container but keep its structure and styling
        while (originalContentContainer.firstChild) {
          originalContentContainer.removeChild(originalContentContainer.firstChild);
        }

        // For artists and albums, we need to preserve exact layout properties
        if (pageType === 'artists' || pageType === 'albums') {
          // Explicitly ensure grid layout is preserved
          if (!originalContentContainer.style.display ||
            originalContentContainer.style.display !== 'grid') {
            originalContentContainer.style.display = 'grid';
          }

          // Ensure grid template columns are preserved - extremely important for layout
          if (!originalContentContainer.style.gridTemplateColumns) {
            originalContentContainer.style.gridTemplateColumns =
              'repeat(auto-fill, minmax(180px, 1fr))';
          }

          // Ensure gap is preserved
          if (!originalContentContainer.style.gap) {
            originalContentContainer.style.gap = '20px';
          }
        }

        // Get a template item from the original if it exists
        const templateItems = originalContainer.querySelectorAll(itemsSelector);
        const hasTemplate = templateItems && templateItems.length > 0;
        const templateItem = hasTemplate ? templateItems[0] : null;

        // Add each new item, but with preserved styling where possible
        newItems.forEach((newItem, index) => {
          // Create a styled version of the item
          let styledItem;

          if (templateItem && index < templateItems.length) {
            // Use the corresponding template item's exact styling
            styledItem = templateItems[index].cloneNode(false);
            // Preserve all original classes
            styledItem.className = templateItems[index].className;
            // Copy the inner HTML from the new item
            styledItem.innerHTML = newItem.innerHTML;
          } else if (templateItem) {
            // Use the first template item as a model
            styledItem = templateItem.cloneNode(false);
            styledItem.className = templateItem.className;
            styledItem.innerHTML = newItem.innerHTML;
          } else {
            // No template available, just use the new item directly
            styledItem = newItem.cloneNode(true);
          }

          // Add specific styling fixes based on page type
          if (pageType === 'artists') {
            // Fix artist card styling
            const img = styledItem.querySelector('img');
            if (img) {
              img.style.borderRadius = '50%';
              img.style.width = '100%';
              img.style.aspectRatio = '1';
            }

            // Fix artist name styling
            const name = styledItem.querySelector('.artist-name, h3');
            if (name) {
              name.style.textAlign = 'center';
              name.style.marginTop = '10px';
            }
          }
          else if (pageType === 'albums') {
            // Fix album card styling
            const img = styledItem.querySelector('img');
            if (img) {
              img.style.borderRadius = '4px';
              img.style.width = '100%';
              img.style.aspectRatio = '1';
            }
          }

          // Add the item to the container
          originalContentContainer.appendChild(styledItem);
        });

        console.log(`Successfully replaced ${newItems.length} items while preserving styling`);
        return true;
      } else {
        console.warn('No new items found in the response');
      }
    } else {
      console.warn('Could not find container in original or response content');
    }

    // If we reach here, something went wrong with the custom replacement
    // Fall back to a complete replacement
    contentContainer.innerHTML = doc.body.innerHTML;
    return false;
  } catch (e) {
    console.error("Error preserving style while updating content:", e);
    // Fallback to full replacement
    contentContainer.innerHTML = doc.body.innerHTML;
    return false;
  }
}

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

        // Check if we need to initialize time range selectors
        const path = window.location.pathname;
        if (path.includes('top-artists') || path.includes('top-tracks') || path.includes('top-albums')) {
          window.initializeTimeRangeSelector();
        }
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

    // Check if we're on a page that needs time range selector
    const currentPath = window.location.pathname;
    if (currentPath.includes('top-artists') ||
      currentPath.includes('top-tracks') ||
      currentPath.includes('top-albums')) {
      window.initializeTimeRangeSelector();
    }
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

          // Initialize time range selector if needed
          if (pageName === 'top-artists' || pageName === 'top-tracks' || pageName === 'top-albums') {
            window.initializeTimeRangeSelector();
          }
        }, 100);

        break;
      }
      target = target.parentNode;
    }
  });

  // Initialize time range selector on page load if needed
  const currentPath = window.location.pathname;
  if (currentPath.includes('top-artists') ||
    currentPath.includes('top-tracks') ||
    currentPath.includes('top-albums')) {
    window.initializeTimeRangeSelector();
  }
});
